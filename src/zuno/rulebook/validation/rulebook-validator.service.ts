import { Injectable, Logger } from '@nestjs/common';
import { ParsedRow, ParsedWorkbook } from '../parsing/rulebook-parser.service';
import { ValidationFinding } from '../entities/zuno-rulebook-governance.entity';
import {
  MkaDimension,
  REQUIRED_RULEBOOK_SHEETS,
  RemedyFrequency,
  RemedyType,
  RuleSafetyClass,
  RuleStatus,
  RuleTheme,
  RulebookSheet,
  SensitiveSubject,
  SmeConfidence,
  ThemeDirection,
  ThemeStrength,
  TimingWindowType,
  ValidationSeverity,
  ZunoDomain,
  isZunoDomain,
} from '../../common/enums';

export const RULEBOOK_VALIDATOR_VERSION = 'rulebook-validator-1.0.0';

/** Keeps a pathological workbook from producing a million findings. */
const MAX_FINDINGS = 2000;

export interface ValidationResult {
  findings: ValidationFinding[];
  errorCount: number;
  warningCount: number;
  totalRules: number;
  validRules: number;
  invalidRules: number;
  /** Rule keys flagged as possible duplicates, for the SME to adjudicate. */
  duplicateCandidates: { key: string; duplicateOf: string }[];
  passed: boolean;
}

/**
 * Validates a parsed SME Rulebook workbook.
 * Step 10 Knowledge & Rulebook Management sections 11-17.
 *
 * Implements, in order:
 *   section 11  schema validation - are the mandatory sheets present
 *   section 12  column-level validation - enums, required values, duplicates
 *   section 13  rule ID governance - IDs are permanent and unique
 *   section 14  referential integrity - every reference must resolve
 *   section 15  duplicate detection - flagged, never auto-deleted
 *   section 16  conflict detection - reported, never auto-resolved
 *   section 17  safety validation - sensitive subjects need explicit handling
 *
 * Two principles shape every decision below.
 *
 * First, this validator checks *structure*, never astrology. It cannot know
 * whether "Saturn in the 8th indicates career volatility" is correct - that is
 * the SME's expertise and Build Rule 50 says Claude is not an astrology SME.
 * It only checks that the row is well-formed, its references resolve, and its
 * enums are in the approved vocabulary.
 *
 * Second, the system never silently resolves an ambiguity. Step 10 section 15
 * says duplicates are flagged and "the system must not automatically delete
 * them. SME decides." Section 16 says the same of conflicts, ending with
 * "Claude must never invent the conflict-resolution hierarchy."
 */
@Injectable()
export class RulebookValidatorService {
  private readonly logger = new Logger(RulebookValidatorService.name);

  validate(workbook: ParsedWorkbook): ValidationResult {
    // Parser findings (file integrity, injection warnings) carry forward.
    const findings: ValidationFinding[] = [...workbook.findings];

    const rules = workbook.sheets.get(RulebookSheet.RULES) ?? [];
    const interpretations =
      workbook.sheets.get(RulebookSheet.INTERPRETATIONS) ?? [];
    const timingRules = workbook.sheets.get(RulebookSheet.TIMING_RULES) ?? [];
    const remedies = workbook.sheets.get(RulebookSheet.REMEDIES) ?? [];
    const domains = workbook.sheets.get(RulebookSheet.DOMAINS) ?? [];
    const conflicts = workbook.sheets.get(RulebookSheet.CONFLICT_RULES) ?? [];
    const goldenCases = workbook.sheets.get(RulebookSheet.GOLDEN_CASES) ?? [];

    // --- Section 11: mandatory structures ---
    for (const required of REQUIRED_RULEBOOK_SHEETS) {
      if (!workbook.sheets.has(required)) {
        findings.push(
          err('MISSING_SHEET', `Required worksheet "${required}" is missing.`, {
            sheet: required,
          }),
        );
      }
    }
    if (rules.length === 0 && workbook.sheets.has(RulebookSheet.RULES)) {
      findings.push(
        err('NO_RULES', 'The RULES sheet contains no rows.', {
          sheet: RulebookSheet.RULES,
        }),
      );
    }

    // --- Reference indexes, built before validation so lookups are cheap ---
    const interpretationKeys = keySet(interpretations, 'interpretation_id');
    const timingKeys = keySet(timingRules, 'timing_rule_id');
    const remedyKeys = keySet(remedies, 'remedy_id');
    const conflictKeys = keySet(conflicts, 'conflict_id');
    const declaredDomains = new Set(
      domains.map((d) => str(d.domain).toUpperCase()).filter(Boolean),
    );

    // --- DOMAINS sheet ---
    domains.forEach((row) => {
      const domain = str(row.domain).toUpperCase();
      if (!domain) {
        findings.push(
          err('MISSING_VALUE', 'Domain is required.', {
            sheet: RulebookSheet.DOMAINS,
            row: row.__row,
            column: 'Domain',
          }),
        );
        return;
      }
      if (!isZunoDomain(domain)) {
        findings.push(
          err(
            'INVALID_ENUM',
            `"${domain}" is not a recognised ZUNO domain. Allowed: ${Object.values(ZunoDomain).join(', ')}.`,
            { sheet: RulebookSheet.DOMAINS, row: row.__row, column: 'Domain', entity_key: domain },
          ),
        );
      }
      // A domain config with no houses and no planets carries no methodology.
      // Step 08 section 13 warns against leaving these as SME_DEFINED.
      const hasMethodology =
        list(row.primary_houses).length > 0 ||
        list(row.primary_planets).length > 0;
      if (!hasMethodology) {
        findings.push(
          warn(
            'EMPTY_DOMAIN_METHODOLOGY',
            `Domain "${domain}" has no primary houses or planets defined. Rules in this domain cannot be scoped to relevant chart factors.`,
            { sheet: RulebookSheet.DOMAINS, row: row.__row, entity_key: domain },
          ),
        );
      }
      list(row.primary_houses)
        .concat(list(row.secondary_houses))
        .forEach((h) => {
          const n = Number(h);
          if (!Number.isInteger(n) || n < 1 || n > 12) {
            findings.push(
              err('INVALID_HOUSE', `"${h}" is not a house number between 1 and 12.`, {
                sheet: RulebookSheet.DOMAINS,
                row: row.__row,
                entity_key: domain,
              }),
            );
          }
        });
    });

    // --- RULES sheet ---
    const seenRuleKeys = new Map<string, number>();
    const ruleFingerprints = new Map<string, string>();
    const duplicateCandidates: { key: string; duplicateOf: string }[] = [];
    const invalidRuleKeys = new Set<string>();

    rules.forEach((row) => {
      const ruleKey = str(row.rule_id);
      const at = {
        sheet: RulebookSheet.RULES,
        row: row.__row,
        entity_key: ruleKey || undefined,
      };
      const fail = (code: string, message: string, column?: string) => {
        findings.push(err(code, message, { ...at, column }));
        if (ruleKey) invalidRuleKeys.add(ruleKey);
      };

      // Section 13: rule ID governance.
      if (!ruleKey) {
        fail('MISSING_RULE_ID', 'Rule ID is required and must be permanent.', 'Rule ID');
        return;
      }
      if (seenRuleKeys.has(ruleKey)) {
        fail(
          'DUPLICATE_RULE_ID',
          `Rule ID "${ruleKey}" is already used on row ${seenRuleKeys.get(ruleKey)}. IDs must be unique and are never reused.`,
          'Rule ID',
        );
        return;
      }
      seenRuleKeys.set(ruleKey, row.__row);

      if (!str(row.rule_name)) {
        fail('MISSING_VALUE', 'Rule Name is required.', 'Rule Name');
      }
      if (!str(row.primary_factor)) {
        fail(
          'MISSING_VALUE',
          'Primary Factor is required - a rule needs at least one astrological condition.',
          'Primary Factor',
        );
      }

      // Domain.
      const domain = str(row.domain).toUpperCase();
      if (!isZunoDomain(domain)) {
        fail('INVALID_ENUM', `Domain "${domain}" is not a recognised ZUNO domain.`, 'Domain');
      } else if (declaredDomains.size > 0 && !declaredDomains.has(domain)) {
        findings.push(
          warn(
            'DOMAIN_NOT_CONFIGURED',
            `Domain "${domain}" is used by this rule but has no row in the DOMAINS sheet, so its methodology is undefined.`,
            at,
          ),
        );
      }

      // Controlled vocabularies. Step 08 section 20: a theme outside the
      // approved list is rejected, which is what stops a fatalistic label such
      // as JOB_LOSS entering the system through a spreadsheet.
      checkEnum(row.theme, RuleTheme, 'Theme', fail);
      checkEnum(row.direction, ThemeDirection, 'Direction', fail);
      checkEnum(row.strength, ThemeStrength, 'Strength', fail);
      checkEnum(row.safety_class, RuleSafetyClass, 'Safety Class', fail);
      checkEnum(row.status, RuleStatus, 'Status', fail);
      if (str(row.sme_confidence)) {
        checkEnum(row.sme_confidence, SmeConfidence, 'SME Confidence', fail);
      }

      // Section 14: referential integrity.
      const interpretationKey = str(row.interpretation_id);
      if (interpretationKey && !interpretationKeys.has(interpretationKey)) {
        fail(
          'BROKEN_REFERENCE',
          `Interpretation "${interpretationKey}" does not exist in the INTERPRETATIONS sheet.`,
          'Interpretation ID',
        );
      }
      if (!interpretationKey && str(row.status).toUpperCase() === RuleStatus.APPROVED) {
        // An approved rule with no meaning attached can fire but says nothing.
        findings.push(
          warn(
            'APPROVED_RULE_WITHOUT_INTERPRETATION',
            `Rule "${ruleKey}" is APPROVED but has no Interpretation ID, so it can match a chart without producing any meaning.`,
            at,
          ),
        );
      }
      list(row.timing_rule_ids).forEach((key) => {
        if (!timingKeys.has(key)) {
          fail('BROKEN_REFERENCE', `Timing rule "${key}" does not exist.`, 'Timing Rule IDs');
        }
      });
      list(row.remedy_ids).forEach((key) => {
        if (!remedyKeys.has(key)) {
          fail('BROKEN_REFERENCE', `Remedy "${key}" does not exist.`, 'Remedy IDs');
        }
      });
      list(row.conflict_rule_ids).forEach((key) => {
        if (!conflictKeys.has(key)) {
          fail('BROKEN_REFERENCE', `Conflict rule "${key}" does not exist.`, 'Conflict Rule IDs');
        }
      });

      // Section 17: safety validation.
      const sensitive = list(row.sensitive_subjects).map((s) => s.toUpperCase());
      sensitive.forEach((subject) => {
        if (!Object.values(SensitiveSubject).includes(subject as SensitiveSubject)) {
          findings.push(
            warn('UNKNOWN_SENSITIVE_SUBJECT', `"${subject}" is not a recognised sensitive subject.`, at),
          );
        }
      });
      const safetyClass = str(row.safety_class).toUpperCase();
      if (sensitive.length > 0 && safetyClass === RuleSafetyClass.STANDARD) {
        // Step 10 section 17: these categories require enhanced governance, so
        // STANDARD is not an acceptable classification for them.
        findings.push(
          err(
            'SENSITIVE_RULE_NEEDS_SAFETY_CLASS',
            `Rule "${ruleKey}" touches ${sensitive.join(', ')} but is classified STANDARD. Sensitive subjects require REQUIRES_CAUTION, SME_SUPERVISION or EXCLUDE_PENDING_SPECIAL_REVIEW.`,
            at,
          ),
        );
        invalidRuleKeys.add(ruleKey);
      }

      // Step 08 section 69: experimental astrology must not silently reach
      // users. An APPROVED + EXPERIMENTAL combination is contradictory.
      if (
        str(row.status).toUpperCase() === RuleStatus.APPROVED &&
        str(row.sme_confidence).toUpperCase() === SmeConfidence.EXPERIMENTAL
      ) {
        findings.push(
          err(
            'EXPERIMENTAL_RULE_APPROVED',
            `Rule "${ruleKey}" is marked APPROVED with EXPERIMENTAL confidence. Experimental rules must not influence user guidance.`,
            at,
          ),
        );
        invalidRuleKeys.add(ruleKey);
      }

      // Section 15: duplicate detection by condition fingerprint. Reported as
      // a candidate for the SME - never removed automatically.
      const fingerprint = [
        domain,
        str(row.primary_factor).toLowerCase().replace(/\s+/g, ' '),
        str(row.theme).toUpperCase(),
      ].join('|');
      const existing = ruleFingerprints.get(fingerprint);
      if (existing) {
        duplicateCandidates.push({ key: ruleKey, duplicateOf: existing });
        findings.push(
          warn(
            'POSSIBLE_DUPLICATE',
            `Rule "${ruleKey}" has the same domain, primary factor and theme as "${existing}". Please confirm this is intentional.`,
            at,
          ),
        );
      } else {
        ruleFingerprints.set(fingerprint, ruleKey);
      }

      // Dates.
      ['effective_from', 'effective_until'].forEach((field) => {
        const value = str(row[field]);
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          fail('INVALID_DATE', `"${value}" is not a valid date. Use YYYY-MM-DD.`, field);
        }
      });
    });

    // --- INTERPRETATIONS sheet ---
    const seenInterpretations = new Set<string>();
    interpretations.forEach((row) => {
      const key = str(row.interpretation_id);
      const at = {
        sheet: RulebookSheet.INTERPRETATIONS,
        row: row.__row,
        entity_key: key || undefined,
      };
      if (!key) {
        findings.push(err('MISSING_VALUE', 'Interpretation ID is required.', at));
        return;
      }
      if (seenInterpretations.has(key)) {
        findings.push(err('DUPLICATE_ID', `Interpretation ID "${key}" is duplicated.`, at));
      }
      seenInterpretations.add(key);

      if (!str(row.meaning)) {
        findings.push(
          err('MISSING_VALUE', 'Meaning is required - this is the approved astrological meaning.', at),
        );
      }
      if (str(row.theme)) {
        const theme = str(row.theme).toUpperCase();
        if (!Object.values(RuleTheme).includes(theme as RuleTheme)) {
          findings.push(err('INVALID_ENUM', `Theme "${theme}" is not in the approved vocabulary.`, at));
        }
      }
      // Step 08 section 28: meaning must not assert certainty.
      const meaning = str(row.meaning).toLowerCase();
      if (/\b(will (definitely|certainly)|guaranteed|is certain to)\b/.test(meaning)) {
        findings.push(
          err(
            'DETERMINISTIC_LANGUAGE',
            'This interpretation states an outcome as certain. ZUNO must not communicate deterministic certainty (Step 19 section 7).',
            at,
          ),
        );
      }
      list(row.allowed_domains).forEach((d) => {
        if (!isZunoDomain(d.toUpperCase())) {
          findings.push(warn('INVALID_ENUM', `Allowed domain "${d}" is not recognised.`, at));
        }
      });
    });

    // --- TIMING_RULES sheet ---
    timingRules.forEach((row) => {
      const key = str(row.timing_rule_id);
      const at = {
        sheet: RulebookSheet.TIMING_RULES,
        row: row.__row,
        entity_key: key || undefined,
      };
      if (!key) {
        findings.push(err('MISSING_VALUE', 'Timing Rule ID is required.', at));
        return;
      }
      const failT = (code: string, message: string, column?: string) =>
        findings.push(err(code, message, { ...at, column }));
      checkEnum(row.window_type, TimingWindowType, 'Window Type', failT);
      checkEnum(row.strength, ThemeStrength, 'Strength', failT);
      if (!str(row.conditions)) {
        failT('MISSING_VALUE', 'Conditions are required.', 'Conditions');
      }
      // Step 08 section 33 / Step 07 section 61: timing is not event prediction.
      const language = str(row.timing_language).toLowerCase();
      if (/\byou will\b|\bwill get\b|\bwill happen\b/.test(language)) {
        findings.push(
          err(
            'TIMING_AS_EVENT_PREDICTION',
            'Timing language predicts an event. A timing window describes a period, not a guaranteed occurrence.',
            at,
          ),
        );
      }
    });

    // --- REMEDIES sheet ---
    const seenRemedies = new Set<string>();
    remedies.forEach((row) => {
      const key = str(row.remedy_id);
      const at = {
        sheet: RulebookSheet.REMEDIES,
        row: row.__row,
        entity_key: key || undefined,
      };
      if (!key) {
        findings.push(err('MISSING_VALUE', 'Remedy ID is required.', at));
        return;
      }
      if (seenRemedies.has(key)) {
        findings.push(err('DUPLICATE_ID', `Remedy ID "${key}" is duplicated.`, at));
      }
      seenRemedies.add(key);

      const failR = (code: string, message: string, column?: string) =>
        findings.push(err(code, message, { ...at, column }));
      if (!str(row.name)) failR('MISSING_VALUE', 'Name is required.', 'Name');
      if (!str(row.purpose)) failR('MISSING_VALUE', 'Purpose is required.', 'Purpose');
      if (!str(row.instructions)) {
        failR(
          'MISSING_VALUE',
          'Instructions are required. ZUNO never improvises how a remedy is performed.',
          'Instructions',
        );
      }
      checkEnum(row.remedy_type, RemedyType, 'Type', failR);
      checkEnum(row.mka_dimension, MkaDimension, 'MKA Dimension', failR);
      checkEnum(row.frequency, RemedyFrequency, 'Frequency', failR);
      if (str(row.safety_class)) {
        checkEnum(row.safety_class, RuleSafetyClass, 'Safety Class', failR);
      }
      // Step 08 sections 52-53.
      if (bool(row.has_financial_cost)) {
        findings.push(
          warn(
            'REMEDY_HAS_FINANCIAL_COST',
            `Remedy "${key}" has a financial cost. ZUNO favours remedies that create no financial burden, and must never imply a purchase is necessary for an outcome.`,
            at,
          ),
        );
      }
      if (/\b(gemstone|ratna|stone)\b/i.test(str(row.name) + ' ' + str(row.instructions))) {
        findings.push(
          warn(
            'GEMSTONE_REMEDY',
            `Remedy "${key}" appears to involve a gemstone. Step 08 section 53 requires a dedicated SME and safety framework before gemstones are introduced.`,
            at,
          ),
        );
      }
      list(row.conflicts_with).forEach((other) => {
        if (!remedyKeys.has(other)) {
          failR('BROKEN_REFERENCE', `Conflicting remedy "${other}" does not exist.`, 'Conflicts With');
        }
      });
      list(row.alternative_keys).forEach((other) => {
        if (!remedyKeys.has(other)) {
          failR('BROKEN_REFERENCE', `Alternative remedy "${other}" does not exist.`, 'Alternatives');
        }
      });
    });

    // --- CONFLICT_RULES sheet (section 16) ---
    conflicts.forEach((row) => {
      const key = str(row.conflict_id);
      const at = {
        sheet: RulebookSheet.CONFLICT_RULES,
        row: row.__row,
        entity_key: key || undefined,
      };
      const referenced = list(row.rule_ids);
      if (referenced.length < 2) {
        findings.push(
          err('INVALID_CONFLICT', 'A conflict rule must reference at least two rules.', at),
        );
      }
      referenced.forEach((ruleKey) => {
        if (!seenRuleKeys.has(ruleKey)) {
          findings.push(err('BROKEN_REFERENCE', `Rule "${ruleKey}" does not exist.`, at));
        }
      });
      const winner = str(row.winning_rule_id);
      if (winner && !referenced.includes(winner)) {
        findings.push(
          err('INVALID_CONFLICT', `Winning rule "${winner}" is not among the conflicting rules.`, at),
        );
      }
    });

    // --- GOLDEN_CASES sheet ---
    goldenCases.forEach((row) => {
      const key = str(row.case_id);
      const at = {
        sheet: RulebookSheet.GOLDEN_CASES,
        row: row.__row,
        entity_key: key || undefined,
      };
      if (!key) {
        findings.push(err('MISSING_VALUE', 'Case ID is required.', at));
        return;
      }
      if (!str(row.challenge_statement)) {
        findings.push(err('MISSING_VALUE', 'Challenge is required.', at));
      }
      const dob = str(row.date_of_birth);
      if (!dob) {
        findings.push(err('MISSING_VALUE', 'Date Of Birth is required.', at));
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        findings.push(err('INVALID_DATE', `"${dob}" is not a valid date. Use YYYY-MM-DD.`, at));
      }
      list(row.expected_rule_ids).forEach((ruleKey) => {
        if (!seenRuleKeys.has(ruleKey)) {
          findings.push(
            warn('BROKEN_REFERENCE', `Expected rule "${ruleKey}" does not exist in this rulebook.`, at),
          );
        }
      });
    });

    // --- Tally ---
    const capped = findings.slice(0, MAX_FINDINGS);
    if (findings.length > MAX_FINDINGS) {
      capped.push(
        warn(
          'FINDINGS_TRUNCATED',
          `${findings.length - MAX_FINDINGS} further findings were omitted. Fix the reported issues and re-validate.`,
          {},
        ),
      );
    }

    const errorCount = capped.filter((f) => f.severity === ValidationSeverity.ERROR).length;
    const warningCount = capped.filter((f) => f.severity === ValidationSeverity.WARNING).length;

    const result: ValidationResult = {
      findings: capped,
      errorCount,
      warningCount,
      totalRules: rules.length,
      validRules: rules.length - invalidRuleKeys.size,
      invalidRules: invalidRuleKeys.size,
      duplicateCandidates,
      passed: errorCount === 0,
    };

    this.logger.log(
      `Validation complete: ${result.totalRules} rules, ${errorCount} errors, ${warningCount} warnings`,
    );
    return result;
  }
}

// --- helpers -----------------------------------------------------------

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

/** Splits a comma- or pipe-separated cell into trimmed values. */
function list(value: unknown): string[] {
  const raw = str(value);
  if (!raw) return [];
  return raw
    .split(/[,|;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function bool(value: unknown): boolean {
  return /^(yes|true|y|1)$/i.test(str(value));
}

function keySet(rows: ParsedRow[], field: string): Set<string> {
  return new Set(rows.map((r) => str(r[field])).filter(Boolean));
}

function checkEnum(
  value: unknown,
  enumObject: Record<string, string>,
  column: string,
  fail: (code: string, message: string, column?: string) => void,
): void {
  const raw = str(value).toUpperCase();
  if (!raw) {
    fail('MISSING_VALUE', `${column} is required.`, column);
    return;
  }
  if (!Object.values(enumObject).includes(raw)) {
    fail(
      'INVALID_ENUM',
      `${column} "${raw}" is not allowed. Valid values: ${Object.values(enumObject).join(', ')}.`,
      column,
    );
  }
}

function err(
  code: string,
  message: string,
  extra: Partial<ValidationFinding> = {},
): ValidationFinding {
  return { severity: ValidationSeverity.ERROR, code, message, ...extra };
}

function warn(
  code: string,
  message: string,
  extra: Partial<ValidationFinding> = {},
): ValidationFinding {
  return { severity: ValidationSeverity.WARNING, code, message, ...extra };
}
