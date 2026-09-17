import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ParsedRow, ParsedWorkbook } from '../parsing/rulebook-parser.service';
import {
  ZunoRulebookRule,
  RuleCondition,
} from '../entities/zuno-rulebook-rule.entity';
import {
  ZunoRulebookInterpretation,
  ZunoRulebookTimingRule,
  ZunoRulebookRemedy,
  ZunoRulebookDomainConfig,
  ZunoRulebookConflictRule,
  ZunoRulebookGoldenCase,
} from '../entities/zuno-rulebook-knowledge.entity';
import {
  MkaDimension,
  RemedyFrequency,
  RemedyType,
  RuleConditionOperator,
  RuleConditionType,
  RuleFactorRole,
  RuleSafetyClass,
  RuleStatus,
  RuleTheme,
  RulebookSheet,
  SmeConfidence,
  ThemeDirection,
  ThemeStrength,
  TimingWindowType,
  ZunoDomain,
} from '../../common/enums';

export const RULEBOOK_COMPILER_VERSION = 'rulebook-compiler-1.0.0';

export interface CompilationCounts {
  rules: number;
  interpretations: number;
  timingRules: number;
  remedies: number;
  domainConfigs: number;
  conflictRules: number;
  goldenCases: number;
  domainsCovered: string[];
}

/**
 * Turns a validated workbook into normalized database rows.
 * Step 10 section 18 ("Rulebook Compilation").
 *
 * Only runs after validation passes, so this code can assume well-formed input
 * and does not re-report errors - anything malformed was already rejected.
 *
 * The one thing it must never do is *interpret*. It maps cells to columns and
 * preserves the SME's wording verbatim. Where the SME wrote a condition in
 * prose ("Mercury retrograde in the 10th"), that prose is kept in
 * `raw_expression` alongside whatever structure could be inferred, because
 * Step 08 section 52 requires a theme to stay traceable to the evidence that
 * produced it - and the SME's own words are the most faithful evidence there is.
 */
@Injectable()
export class RulebookCompilerService {
  async compile(
    manager: EntityManager,
    rulebookVersionId: string,
    workbook: ParsedWorkbook,
  ): Promise<CompilationCounts> {
    const domainsCovered = new Set<string>();

    // --- Domain configuration ---
    const domainRows = workbook.sheets.get(RulebookSheet.DOMAINS) ?? [];
    const domainConfigs = domainRows.map((row) =>
      manager.create(ZunoRulebookDomainConfig, {
        rulebook_version_id: rulebookVersionId,
        domain: upper(row.domain) as ZunoDomain,
        primary_houses: numbers(row.primary_houses),
        secondary_houses: numbers(row.secondary_houses),
        primary_planets: list(row.primary_planets).map(upperStr),
        supporting_planets: list(row.supporting_planets).map(upperStr),
        relevant_divisional_charts: list(row.relevant_divisional_charts).map(upperStr),
        timing_factors: list(row.timing_factors).map(upperStr),
        methodology_notes: nullable(row.methodology_notes),
        source_row: row.__row,
      }),
    );
    if (domainConfigs.length) {
      await manager.save(ZunoRulebookDomainConfig, domainConfigs);
    }

    // --- Interpretations ---
    const interpretationRows =
      workbook.sheets.get(RulebookSheet.INTERPRETATIONS) ?? [];
    const interpretations = interpretationRows.map((row) =>
      manager.create(ZunoRulebookInterpretation, {
        rulebook_version_id: rulebookVersionId,
        external_interpretation_key: str(row.interpretation_id),
        theme: (upper(row.theme) as RuleTheme) || null,
        // Preserved exactly. Step 08 section 27: the AI may change tone and
        // length downstream, never the meaning stored here.
        meaning: str(row.meaning),
        allowed_domains: list(row.allowed_domains).map(upperStr) as ZunoDomain[],
        user_safe_summary: nullable(row.user_safe_summary),
        status: (upper(row.status) as RuleStatus) || RuleStatus.DRAFT,
        source_row: row.__row,
      }),
    );
    if (interpretations.length) {
      await manager.save(ZunoRulebookInterpretation, interpretations);
    }

    // --- Timing rules ---
    const timingRows = workbook.sheets.get(RulebookSheet.TIMING_RULES) ?? [];
    const timingRules = timingRows.map((row) =>
      manager.create(ZunoRulebookTimingRule, {
        rulebook_version_id: rulebookVersionId,
        external_timing_key: str(row.timing_rule_id),
        domain: (upper(row.domain) as ZunoDomain) || null,
        window_type: upper(row.window_type) as TimingWindowType,
        strength: upper(row.strength) as ThemeStrength,
        conditions: [{ raw_expression: str(row.conditions) }],
        timing_language: nullable(row.timing_language),
        status: (upper(row.status) as RuleStatus) || RuleStatus.DRAFT,
        source_row: row.__row,
      }),
    );
    if (timingRules.length) {
      await manager.save(ZunoRulebookTimingRule, timingRules);
    }

    // --- Remedies ---
    const remedyRows = workbook.sheets.get(RulebookSheet.REMEDIES) ?? [];
    const remedies = remedyRows.map((row) =>
      manager.create(ZunoRulebookRemedy, {
        rulebook_version_id: rulebookVersionId,
        external_remedy_key: str(row.remedy_id),
        name: str(row.name),
        remedy_type: upper(row.remedy_type) as RemedyType,
        mka_dimension: upper(row.mka_dimension) as MkaDimension,
        purpose: str(row.purpose),
        astrological_basis: nullable(row.astrological_basis),
        // Step 08 section 48: exact preservation. A paraphrased mantra is a
        // different mantra and not one the SME approved.
        instructions: str(row.instructions),
        frequency: upper(row.frequency) as RemedyFrequency,
        duration: nullable(row.duration),
        preferred_time: nullable(row.preferred_time),
        restrictions: nullable(row.restrictions),
        conflicts_with: list(row.conflicts_with),
        safety_class:
          (upper(row.safety_class) as RuleSafetyClass) || RuleSafetyClass.LOW_RISK,
        has_financial_cost: bool(row.has_financial_cost),
        is_devotional: bool(row.is_devotional),
        alternative_keys: list(row.alternative_keys),
        user_explanation: nullable(row.user_explanation),
        status: (upper(row.status) as RuleStatus) || RuleStatus.DRAFT,
        source_row: row.__row,
      }),
    );
    if (remedies.length) {
      await manager.save(ZunoRulebookRemedy, remedies);
    }

    // --- Rules ---
    const ruleRows = workbook.sheets.get(RulebookSheet.RULES) ?? [];
    const rules = ruleRows.map((row) => {
      const domain = upper(row.domain) as ZunoDomain;
      domainsCovered.add(domain);
      return manager.create(ZunoRulebookRule, {
        rulebook_version_id: rulebookVersionId,
        external_rule_key: str(row.rule_id),
        rule_name: str(row.rule_name),
        domain,
        subcategory: nullable(row.subcategory),
        conditions: this.buildConditions(row),
        theme: upper(row.theme) as RuleTheme,
        direction: upper(row.direction) as ThemeDirection,
        strength: upper(row.strength) as ThemeStrength,
        interpretation_key: nullable(row.interpretation_id),
        timing_rule_keys: list(row.timing_rule_ids),
        remedy_keys: list(row.remedy_ids),
        conflict_rule_keys: list(row.conflict_rule_ids),
        status: (upper(row.status) as RuleStatus) || RuleStatus.DRAFT,
        safety_class: upper(row.safety_class) as RuleSafetyClass,
        sensitive_subjects: list(row.sensitive_subjects).map(upperStr),
        sme_confidence:
          (upper(row.sme_confidence) as SmeConfidence) ||
          SmeConfidence.CONTEXT_DEPENDENT,
        sme_comment: nullable(row.sme_comment),
        effective_from: nullable(row.effective_from),
        effective_until: nullable(row.effective_until),
        rule_version: str(row.version) || '1.0',
        change_reason: nullable(row.change_reason),
        source_row: row.__row,
      });
    });
    if (rules.length) {
      // Chunked: a 1600-rule workbook in one INSERT exceeds the parameter limit.
      await manager.save(ZunoRulebookRule, rules, { chunk: 200 });
    }

    // --- Conflict rules ---
    const conflictRows = workbook.sheets.get(RulebookSheet.CONFLICT_RULES) ?? [];
    const conflictRules = conflictRows.map((row) =>
      manager.create(ZunoRulebookConflictRule, {
        rulebook_version_id: rulebookVersionId,
        external_conflict_key: str(row.conflict_id),
        rule_keys: list(row.rule_ids),
        resolution_strategy: upper(row.resolution_strategy),
        winning_rule_key: nullable(row.winning_rule_id),
        rationale: nullable(row.rationale),
        source_row: row.__row,
      }),
    );
    if (conflictRules.length) {
      await manager.save(ZunoRulebookConflictRule, conflictRules);
    }

    // --- Golden cases ---
    const goldenRows = workbook.sheets.get(RulebookSheet.GOLDEN_CASES) ?? [];
    const goldenCases = goldenRows.map((row) =>
      manager.create(ZunoRulebookGoldenCase, {
        rulebook_version_id: rulebookVersionId,
        external_case_key: str(row.case_id),
        case_name: str(row.case_name),
        domain: (upper(row.domain) as ZunoDomain) || null,
        birth_data: {
          date_of_birth: str(row.date_of_birth),
          time_of_birth: str(row.time_of_birth) || null,
          place_of_birth: str(row.place_of_birth) || null,
        },
        challenge_statement: str(row.challenge_statement),
        expected_rule_keys: list(row.expected_rule_ids),
        expected_themes: list(row.expected_themes).map(upperStr),
        expected_outcome_notes: nullable(row.expected_outcome_notes),
        source_row: row.__row,
      }),
    );
    if (goldenCases.length) {
      await manager.save(ZunoRulebookGoldenCase, goldenCases);
    }

    return {
      rules: rules.length,
      interpretations: interpretations.length,
      timingRules: timingRules.length,
      remedies: remedies.length,
      domainConfigs: domainConfigs.length,
      conflictRules: conflictRules.length,
      goldenCases: goldenCases.length,
      domainsCovered: Array.from(domainsCovered),
    };
  }

  /**
   * Builds the condition list from the SME's primary, supporting and counter
   * factor columns. Step 08 sections 14-18.
   *
   * The SME writes conditions in prose. We attempt a light structural
   * inference (planet names, house numbers, retrograde, dasha/bhukti) so the
   * rule engine has something to match on, but the prose is always retained
   * verbatim in `raw_expression`. Where inference is uncertain the structure is
   * simply absent - a wrong guess about what a condition means would be worse
   * than no guess, and Build Rule 50 puts astrological judgement with the SME.
   */
  private buildConditions(row: ParsedRow): RuleCondition[] {
    const conditions: RuleCondition[] = [];

    const primary = str(row.primary_factor);
    if (primary) {
      conditions.push(this.inferCondition(primary, RuleFactorRole.PRIMARY));
    }
    // Supporting factors strengthen the rule (section 17).
    splitFactors(row.supporting_factors).forEach((text) =>
      conditions.push(this.inferCondition(text, RuleFactorRole.SUPPORTING)),
    );
    // Counter factors are protective and must be preserved, not cancelled
    // out (section 18).
    splitFactors(row.counter_factors).forEach((text) =>
      conditions.push(this.inferCondition(text, RuleFactorRole.COUNTER)),
    );

    return conditions;
  }

  private inferCondition(text: string, role: RuleFactorRole): RuleCondition {
    const condition: RuleCondition = {
      type: RuleConditionType.MULTIPLE_CONDITION,
      role,
      operator: RuleConditionOperator.AND,
      raw_expression: text,
    };

    const upperText = text.toUpperCase();

    const planet = PLANETS.find((p) => new RegExp(`\\b${p}\\b`).test(upperText));
    if (planet) condition.planet = planet;

    const houseMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+house\b/i);
    if (houseMatch) {
      const house = Number(houseMatch[1]);
      if (house >= 1 && house <= 12) condition.house = house;
    }

    // Order matters: the most specific pattern wins.
    if (/\bretrograde\b/i.test(text)) {
      condition.type = RuleConditionType.PLANET_RETROGRADE;
    } else if (/\bcombust\b/i.test(text)) {
      condition.type = RuleConditionType.PLANET_COMBUST;
    } else if (/\bantara\b/i.test(text)) {
      condition.type = RuleConditionType.ANTARA_LORD;
    } else if (/\bbhukti\b|\bantardasha\b/i.test(text)) {
      condition.type = RuleConditionType.BHUKTI_LORD;
    } else if (/\bmahadasha\b|\bdasha\s+lord\b/i.test(text)) {
      condition.type = RuleConditionType.DASHA_LORD;
    } else if (/\btransit\b/i.test(text)) {
      condition.type = condition.house
        ? RuleConditionType.TRANSIT_IN_HOUSE
        : RuleConditionType.TRANSIT_ASPECT;
    } else if (/\bconjunct/i.test(text)) {
      condition.type = RuleConditionType.PLANET_CONJUNCTION;
    } else if (/\baspect/i.test(text)) {
      condition.type = RuleConditionType.PLANET_ASPECT;
    } else if (/\bnakshatra\b/i.test(text)) {
      condition.type = RuleConditionType.NAKSHATRA;
    } else if (/\blord\s+(of|in)\b/i.test(text)) {
      condition.type = RuleConditionType.HOUSE_LORD_IN_HOUSE;
    } else if (condition.house && condition.planet) {
      condition.type = RuleConditionType.PLANET_IN_HOUSE;
    }

    return condition;
  }
}

/**
 * Planet vocabulary used only for structural inference from prose.
 *
 * This is not astrological knowledge - it is a list of proper nouns, the same
 * way a parser might recognise month names. It asserts nothing about what any
 * planet means.
 */
const PLANETS = [
  'SUN',
  'MOON',
  'MERCURY',
  'VENUS',
  'MARS',
  'JUPITER',
  'SATURN',
  'RAHU',
  'KETU',
] as const;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function upper(value: unknown): string {
  return str(value).toUpperCase();
}

function upperStr(value: string): string {
  return value.toUpperCase();
}

function nullable(value: unknown): string | null {
  const s = str(value);
  return s.length > 0 ? s : null;
}

function list(value: unknown): string[] {
  const raw = str(value);
  if (!raw) return [];
  return raw
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Supporting and counter factors are separated by | so commas can be used. */
function splitFactors(value: unknown): string[] {
  const raw = str(value);
  if (!raw) return [];
  return raw
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean);
}

function numbers(value: unknown): number[] {
  return list(value)
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));
}

function bool(value: unknown): boolean {
  return /^(yes|true|y|1)$/i.test(str(value));
}
