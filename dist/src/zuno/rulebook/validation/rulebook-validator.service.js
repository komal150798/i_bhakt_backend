"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RulebookValidatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulebookValidatorService = exports.RULEBOOK_VALIDATOR_VERSION = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../common/enums");
exports.RULEBOOK_VALIDATOR_VERSION = 'rulebook-validator-1.0.0';
const MAX_FINDINGS = 2000;
let RulebookValidatorService = RulebookValidatorService_1 = class RulebookValidatorService {
    constructor() {
        this.logger = new common_1.Logger(RulebookValidatorService_1.name);
    }
    validate(workbook) {
        const findings = [...workbook.findings];
        const rules = workbook.sheets.get(enums_1.RulebookSheet.RULES) ?? [];
        const interpretations = workbook.sheets.get(enums_1.RulebookSheet.INTERPRETATIONS) ?? [];
        const timingRules = workbook.sheets.get(enums_1.RulebookSheet.TIMING_RULES) ?? [];
        const remedies = workbook.sheets.get(enums_1.RulebookSheet.REMEDIES) ?? [];
        const domains = workbook.sheets.get(enums_1.RulebookSheet.DOMAINS) ?? [];
        const conflicts = workbook.sheets.get(enums_1.RulebookSheet.CONFLICT_RULES) ?? [];
        const goldenCases = workbook.sheets.get(enums_1.RulebookSheet.GOLDEN_CASES) ?? [];
        for (const required of enums_1.REQUIRED_RULEBOOK_SHEETS) {
            if (!workbook.sheets.has(required)) {
                findings.push(err('MISSING_SHEET', `Required worksheet "${required}" is missing.`, {
                    sheet: required,
                }));
            }
        }
        if (rules.length === 0 && workbook.sheets.has(enums_1.RulebookSheet.RULES)) {
            findings.push(err('NO_RULES', 'The RULES sheet contains no rows.', {
                sheet: enums_1.RulebookSheet.RULES,
            }));
        }
        const interpretationKeys = keySet(interpretations, 'interpretation_id');
        const timingKeys = keySet(timingRules, 'timing_rule_id');
        const remedyKeys = keySet(remedies, 'remedy_id');
        const conflictKeys = keySet(conflicts, 'conflict_id');
        const declaredDomains = new Set(domains.map((d) => str(d.domain).toUpperCase()).filter(Boolean));
        domains.forEach((row) => {
            const domain = str(row.domain).toUpperCase();
            if (!domain) {
                findings.push(err('MISSING_VALUE', 'Domain is required.', {
                    sheet: enums_1.RulebookSheet.DOMAINS,
                    row: row.__row,
                    column: 'Domain',
                }));
                return;
            }
            if (!(0, enums_1.isZunoDomain)(domain)) {
                findings.push(err('INVALID_ENUM', `"${domain}" is not a recognised ZUNO domain. Allowed: ${Object.values(enums_1.ZunoDomain).join(', ')}.`, { sheet: enums_1.RulebookSheet.DOMAINS, row: row.__row, column: 'Domain', entity_key: domain }));
            }
            const hasMethodology = list(row.primary_houses).length > 0 ||
                list(row.primary_planets).length > 0;
            if (!hasMethodology) {
                findings.push(warn('EMPTY_DOMAIN_METHODOLOGY', `Domain "${domain}" has no primary houses or planets defined. Rules in this domain cannot be scoped to relevant chart factors.`, { sheet: enums_1.RulebookSheet.DOMAINS, row: row.__row, entity_key: domain }));
            }
            list(row.primary_houses)
                .concat(list(row.secondary_houses))
                .forEach((h) => {
                const n = Number(h);
                if (!Number.isInteger(n) || n < 1 || n > 12) {
                    findings.push(err('INVALID_HOUSE', `"${h}" is not a house number between 1 and 12.`, {
                        sheet: enums_1.RulebookSheet.DOMAINS,
                        row: row.__row,
                        entity_key: domain,
                    }));
                }
            });
        });
        const seenRuleKeys = new Map();
        const ruleFingerprints = new Map();
        const duplicateCandidates = [];
        const invalidRuleKeys = new Set();
        rules.forEach((row) => {
            const ruleKey = str(row.rule_id);
            const at = {
                sheet: enums_1.RulebookSheet.RULES,
                row: row.__row,
                entity_key: ruleKey || undefined,
            };
            const fail = (code, message, column) => {
                findings.push(err(code, message, { ...at, column }));
                if (ruleKey)
                    invalidRuleKeys.add(ruleKey);
            };
            if (!ruleKey) {
                fail('MISSING_RULE_ID', 'Rule ID is required and must be permanent.', 'Rule ID');
                return;
            }
            if (seenRuleKeys.has(ruleKey)) {
                fail('DUPLICATE_RULE_ID', `Rule ID "${ruleKey}" is already used on row ${seenRuleKeys.get(ruleKey)}. IDs must be unique and are never reused.`, 'Rule ID');
                return;
            }
            seenRuleKeys.set(ruleKey, row.__row);
            if (!str(row.rule_name)) {
                fail('MISSING_VALUE', 'Rule Name is required.', 'Rule Name');
            }
            if (!str(row.primary_factor)) {
                fail('MISSING_VALUE', 'Primary Factor is required - a rule needs at least one astrological condition.', 'Primary Factor');
            }
            const domain = str(row.domain).toUpperCase();
            if (!(0, enums_1.isZunoDomain)(domain)) {
                fail('INVALID_ENUM', `Domain "${domain}" is not a recognised ZUNO domain.`, 'Domain');
            }
            else if (declaredDomains.size > 0 && !declaredDomains.has(domain)) {
                findings.push(warn('DOMAIN_NOT_CONFIGURED', `Domain "${domain}" is used by this rule but has no row in the DOMAINS sheet, so its methodology is undefined.`, at));
            }
            checkEnum(row.theme, enums_1.RuleTheme, 'Theme', fail);
            checkEnum(row.direction, enums_1.ThemeDirection, 'Direction', fail);
            checkEnum(row.strength, enums_1.ThemeStrength, 'Strength', fail);
            checkEnum(row.safety_class, enums_1.RuleSafetyClass, 'Safety Class', fail);
            checkEnum(row.status, enums_1.RuleStatus, 'Status', fail);
            if (str(row.sme_confidence)) {
                checkEnum(row.sme_confidence, enums_1.SmeConfidence, 'SME Confidence', fail);
            }
            const interpretationKey = str(row.interpretation_id);
            if (interpretationKey && !interpretationKeys.has(interpretationKey)) {
                fail('BROKEN_REFERENCE', `Interpretation "${interpretationKey}" does not exist in the INTERPRETATIONS sheet.`, 'Interpretation ID');
            }
            if (!interpretationKey && str(row.status).toUpperCase() === enums_1.RuleStatus.APPROVED) {
                findings.push(warn('APPROVED_RULE_WITHOUT_INTERPRETATION', `Rule "${ruleKey}" is APPROVED but has no Interpretation ID, so it can match a chart without producing any meaning.`, at));
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
            const sensitive = list(row.sensitive_subjects).map((s) => s.toUpperCase());
            sensitive.forEach((subject) => {
                if (!Object.values(enums_1.SensitiveSubject).includes(subject)) {
                    findings.push(warn('UNKNOWN_SENSITIVE_SUBJECT', `"${subject}" is not a recognised sensitive subject.`, at));
                }
            });
            const safetyClass = str(row.safety_class).toUpperCase();
            if (sensitive.length > 0 && safetyClass === enums_1.RuleSafetyClass.STANDARD) {
                findings.push(err('SENSITIVE_RULE_NEEDS_SAFETY_CLASS', `Rule "${ruleKey}" touches ${sensitive.join(', ')} but is classified STANDARD. Sensitive subjects require REQUIRES_CAUTION, SME_SUPERVISION or EXCLUDE_PENDING_SPECIAL_REVIEW.`, at));
                invalidRuleKeys.add(ruleKey);
            }
            if (str(row.status).toUpperCase() === enums_1.RuleStatus.APPROVED &&
                str(row.sme_confidence).toUpperCase() === enums_1.SmeConfidence.EXPERIMENTAL) {
                findings.push(err('EXPERIMENTAL_RULE_APPROVED', `Rule "${ruleKey}" is marked APPROVED with EXPERIMENTAL confidence. Experimental rules must not influence user guidance.`, at));
                invalidRuleKeys.add(ruleKey);
            }
            const fingerprint = [
                domain,
                str(row.primary_factor).toLowerCase().replace(/\s+/g, ' '),
                str(row.theme).toUpperCase(),
            ].join('|');
            const existing = ruleFingerprints.get(fingerprint);
            if (existing) {
                duplicateCandidates.push({ key: ruleKey, duplicateOf: existing });
                findings.push(warn('POSSIBLE_DUPLICATE', `Rule "${ruleKey}" has the same domain, primary factor and theme as "${existing}". Please confirm this is intentional.`, at));
            }
            else {
                ruleFingerprints.set(fingerprint, ruleKey);
            }
            ['effective_from', 'effective_until'].forEach((field) => {
                const value = str(row[field]);
                if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    fail('INVALID_DATE', `"${value}" is not a valid date. Use YYYY-MM-DD.`, field);
                }
            });
        });
        const seenInterpretations = new Set();
        interpretations.forEach((row) => {
            const key = str(row.interpretation_id);
            const at = {
                sheet: enums_1.RulebookSheet.INTERPRETATIONS,
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
                findings.push(err('MISSING_VALUE', 'Meaning is required - this is the approved astrological meaning.', at));
            }
            if (str(row.theme)) {
                const theme = str(row.theme).toUpperCase();
                if (!Object.values(enums_1.RuleTheme).includes(theme)) {
                    findings.push(err('INVALID_ENUM', `Theme "${theme}" is not in the approved vocabulary.`, at));
                }
            }
            const meaning = str(row.meaning).toLowerCase();
            if (/\b(will (definitely|certainly)|guaranteed|is certain to)\b/.test(meaning)) {
                findings.push(err('DETERMINISTIC_LANGUAGE', 'This interpretation states an outcome as certain. ZUNO must not communicate deterministic certainty (Step 19 section 7).', at));
            }
            list(row.allowed_domains).forEach((d) => {
                if (!(0, enums_1.isZunoDomain)(d.toUpperCase())) {
                    findings.push(warn('INVALID_ENUM', `Allowed domain "${d}" is not recognised.`, at));
                }
            });
        });
        timingRules.forEach((row) => {
            const key = str(row.timing_rule_id);
            const at = {
                sheet: enums_1.RulebookSheet.TIMING_RULES,
                row: row.__row,
                entity_key: key || undefined,
            };
            if (!key) {
                findings.push(err('MISSING_VALUE', 'Timing Rule ID is required.', at));
                return;
            }
            const failT = (code, message, column) => findings.push(err(code, message, { ...at, column }));
            checkEnum(row.window_type, enums_1.TimingWindowType, 'Window Type', failT);
            checkEnum(row.strength, enums_1.ThemeStrength, 'Strength', failT);
            if (!str(row.conditions)) {
                failT('MISSING_VALUE', 'Conditions are required.', 'Conditions');
            }
            const language = str(row.timing_language).toLowerCase();
            if (/\byou will\b|\bwill get\b|\bwill happen\b/.test(language)) {
                findings.push(err('TIMING_AS_EVENT_PREDICTION', 'Timing language predicts an event. A timing window describes a period, not a guaranteed occurrence.', at));
            }
        });
        const seenRemedies = new Set();
        remedies.forEach((row) => {
            const key = str(row.remedy_id);
            const at = {
                sheet: enums_1.RulebookSheet.REMEDIES,
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
            const failR = (code, message, column) => findings.push(err(code, message, { ...at, column }));
            if (!str(row.name))
                failR('MISSING_VALUE', 'Name is required.', 'Name');
            if (!str(row.purpose))
                failR('MISSING_VALUE', 'Purpose is required.', 'Purpose');
            if (!str(row.instructions)) {
                failR('MISSING_VALUE', 'Instructions are required. ZUNO never improvises how a remedy is performed.', 'Instructions');
            }
            checkEnum(row.remedy_type, enums_1.RemedyType, 'Type', failR);
            checkEnum(row.mka_dimension, enums_1.MkaDimension, 'MKA Dimension', failR);
            checkEnum(row.frequency, enums_1.RemedyFrequency, 'Frequency', failR);
            if (str(row.safety_class)) {
                checkEnum(row.safety_class, enums_1.RuleSafetyClass, 'Safety Class', failR);
            }
            if (bool(row.has_financial_cost)) {
                findings.push(warn('REMEDY_HAS_FINANCIAL_COST', `Remedy "${key}" has a financial cost. ZUNO favours remedies that create no financial burden, and must never imply a purchase is necessary for an outcome.`, at));
            }
            if (/\b(gemstone|ratna|stone)\b/i.test(str(row.name) + ' ' + str(row.instructions))) {
                findings.push(warn('GEMSTONE_REMEDY', `Remedy "${key}" appears to involve a gemstone. Step 08 section 53 requires a dedicated SME and safety framework before gemstones are introduced.`, at));
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
        conflicts.forEach((row) => {
            const key = str(row.conflict_id);
            const at = {
                sheet: enums_1.RulebookSheet.CONFLICT_RULES,
                row: row.__row,
                entity_key: key || undefined,
            };
            const referenced = list(row.rule_ids);
            if (referenced.length < 2) {
                findings.push(err('INVALID_CONFLICT', 'A conflict rule must reference at least two rules.', at));
            }
            referenced.forEach((ruleKey) => {
                if (!seenRuleKeys.has(ruleKey)) {
                    findings.push(err('BROKEN_REFERENCE', `Rule "${ruleKey}" does not exist.`, at));
                }
            });
            const winner = str(row.winning_rule_id);
            if (winner && !referenced.includes(winner)) {
                findings.push(err('INVALID_CONFLICT', `Winning rule "${winner}" is not among the conflicting rules.`, at));
            }
        });
        goldenCases.forEach((row) => {
            const key = str(row.case_id);
            const at = {
                sheet: enums_1.RulebookSheet.GOLDEN_CASES,
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
            }
            else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                findings.push(err('INVALID_DATE', `"${dob}" is not a valid date. Use YYYY-MM-DD.`, at));
            }
            list(row.expected_rule_ids).forEach((ruleKey) => {
                if (!seenRuleKeys.has(ruleKey)) {
                    findings.push(warn('BROKEN_REFERENCE', `Expected rule "${ruleKey}" does not exist in this rulebook.`, at));
                }
            });
        });
        const capped = findings.slice(0, MAX_FINDINGS);
        if (findings.length > MAX_FINDINGS) {
            capped.push(warn('FINDINGS_TRUNCATED', `${findings.length - MAX_FINDINGS} further findings were omitted. Fix the reported issues and re-validate.`, {}));
        }
        const errorCount = capped.filter((f) => f.severity === enums_1.ValidationSeverity.ERROR).length;
        const warningCount = capped.filter((f) => f.severity === enums_1.ValidationSeverity.WARNING).length;
        const result = {
            findings: capped,
            errorCount,
            warningCount,
            totalRules: rules.length,
            validRules: rules.length - invalidRuleKeys.size,
            invalidRules: invalidRuleKeys.size,
            duplicateCandidates,
            passed: errorCount === 0,
        };
        this.logger.log(`Validation complete: ${result.totalRules} rules, ${errorCount} errors, ${warningCount} warnings`);
        return result;
    }
};
exports.RulebookValidatorService = RulebookValidatorService;
exports.RulebookValidatorService = RulebookValidatorService = RulebookValidatorService_1 = __decorate([
    (0, common_1.Injectable)()
], RulebookValidatorService);
function str(value) {
    return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}
function list(value) {
    const raw = str(value);
    if (!raw)
        return [];
    return raw
        .split(/[,|;]/)
        .map((part) => part.trim())
        .filter(Boolean);
}
function bool(value) {
    return /^(yes|true|y|1)$/i.test(str(value));
}
function keySet(rows, field) {
    return new Set(rows.map((r) => str(r[field])).filter(Boolean));
}
function checkEnum(value, enumObject, column, fail) {
    const raw = str(value).toUpperCase();
    if (!raw) {
        fail('MISSING_VALUE', `${column} is required.`, column);
        return;
    }
    if (!Object.values(enumObject).includes(raw)) {
        fail('INVALID_ENUM', `${column} "${raw}" is not allowed. Valid values: ${Object.values(enumObject).join(', ')}.`, column);
    }
}
function err(code, message, extra = {}) {
    return { severity: enums_1.ValidationSeverity.ERROR, code, message, ...extra };
}
function warn(code, message, extra = {}) {
    return { severity: enums_1.ValidationSeverity.WARNING, code, message, ...extra };
}
//# sourceMappingURL=rulebook-validator.service.js.map