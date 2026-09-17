"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulebookCompilerService = exports.RULEBOOK_COMPILER_VERSION = void 0;
const common_1 = require("@nestjs/common");
const zuno_rulebook_rule_entity_1 = require("../entities/zuno-rulebook-rule.entity");
const zuno_rulebook_knowledge_entity_1 = require("../entities/zuno-rulebook-knowledge.entity");
const enums_1 = require("../../common/enums");
exports.RULEBOOK_COMPILER_VERSION = 'rulebook-compiler-1.0.0';
let RulebookCompilerService = class RulebookCompilerService {
    async compile(manager, rulebookVersionId, workbook) {
        const domainsCovered = new Set();
        const domainRows = workbook.sheets.get(enums_1.RulebookSheet.DOMAINS) ?? [];
        const domainConfigs = domainRows.map((row) => manager.create(zuno_rulebook_knowledge_entity_1.ZunoRulebookDomainConfig, {
            rulebook_version_id: rulebookVersionId,
            domain: upper(row.domain),
            primary_houses: numbers(row.primary_houses),
            secondary_houses: numbers(row.secondary_houses),
            primary_planets: list(row.primary_planets).map(upperStr),
            supporting_planets: list(row.supporting_planets).map(upperStr),
            relevant_divisional_charts: list(row.relevant_divisional_charts).map(upperStr),
            timing_factors: list(row.timing_factors).map(upperStr),
            methodology_notes: nullable(row.methodology_notes),
            source_row: row.__row,
        }));
        if (domainConfigs.length) {
            await manager.save(zuno_rulebook_knowledge_entity_1.ZunoRulebookDomainConfig, domainConfigs);
        }
        const interpretationRows = workbook.sheets.get(enums_1.RulebookSheet.INTERPRETATIONS) ?? [];
        const interpretations = interpretationRows.map((row) => manager.create(zuno_rulebook_knowledge_entity_1.ZunoRulebookInterpretation, {
            rulebook_version_id: rulebookVersionId,
            external_interpretation_key: str(row.interpretation_id),
            theme: upper(row.theme) || null,
            meaning: str(row.meaning),
            allowed_domains: list(row.allowed_domains).map(upperStr),
            user_safe_summary: nullable(row.user_safe_summary),
            status: upper(row.status) || enums_1.RuleStatus.DRAFT,
            source_row: row.__row,
        }));
        if (interpretations.length) {
            await manager.save(zuno_rulebook_knowledge_entity_1.ZunoRulebookInterpretation, interpretations);
        }
        const timingRows = workbook.sheets.get(enums_1.RulebookSheet.TIMING_RULES) ?? [];
        const timingRules = timingRows.map((row) => manager.create(zuno_rulebook_knowledge_entity_1.ZunoRulebookTimingRule, {
            rulebook_version_id: rulebookVersionId,
            external_timing_key: str(row.timing_rule_id),
            domain: upper(row.domain) || null,
            window_type: upper(row.window_type),
            strength: upper(row.strength),
            conditions: [{ raw_expression: str(row.conditions) }],
            timing_language: nullable(row.timing_language),
            status: upper(row.status) || enums_1.RuleStatus.DRAFT,
            source_row: row.__row,
        }));
        if (timingRules.length) {
            await manager.save(zuno_rulebook_knowledge_entity_1.ZunoRulebookTimingRule, timingRules);
        }
        const remedyRows = workbook.sheets.get(enums_1.RulebookSheet.REMEDIES) ?? [];
        const remedies = remedyRows.map((row) => manager.create(zuno_rulebook_knowledge_entity_1.ZunoRulebookRemedy, {
            rulebook_version_id: rulebookVersionId,
            external_remedy_key: str(row.remedy_id),
            name: str(row.name),
            remedy_type: upper(row.remedy_type),
            mka_dimension: upper(row.mka_dimension),
            purpose: str(row.purpose),
            astrological_basis: nullable(row.astrological_basis),
            instructions: str(row.instructions),
            frequency: upper(row.frequency),
            duration: nullable(row.duration),
            preferred_time: nullable(row.preferred_time),
            restrictions: nullable(row.restrictions),
            conflicts_with: list(row.conflicts_with),
            safety_class: upper(row.safety_class) || enums_1.RuleSafetyClass.LOW_RISK,
            has_financial_cost: bool(row.has_financial_cost),
            is_devotional: bool(row.is_devotional),
            alternative_keys: list(row.alternative_keys),
            user_explanation: nullable(row.user_explanation),
            status: upper(row.status) || enums_1.RuleStatus.DRAFT,
            source_row: row.__row,
        }));
        if (remedies.length) {
            await manager.save(zuno_rulebook_knowledge_entity_1.ZunoRulebookRemedy, remedies);
        }
        const ruleRows = workbook.sheets.get(enums_1.RulebookSheet.RULES) ?? [];
        const rules = ruleRows.map((row) => {
            const domain = upper(row.domain);
            domainsCovered.add(domain);
            return manager.create(zuno_rulebook_rule_entity_1.ZunoRulebookRule, {
                rulebook_version_id: rulebookVersionId,
                external_rule_key: str(row.rule_id),
                rule_name: str(row.rule_name),
                domain,
                subcategory: nullable(row.subcategory),
                conditions: this.buildConditions(row),
                theme: upper(row.theme),
                direction: upper(row.direction),
                strength: upper(row.strength),
                interpretation_key: nullable(row.interpretation_id),
                timing_rule_keys: list(row.timing_rule_ids),
                remedy_keys: list(row.remedy_ids),
                conflict_rule_keys: list(row.conflict_rule_ids),
                status: upper(row.status) || enums_1.RuleStatus.DRAFT,
                safety_class: upper(row.safety_class),
                sensitive_subjects: list(row.sensitive_subjects).map(upperStr),
                sme_confidence: upper(row.sme_confidence) ||
                    enums_1.SmeConfidence.CONTEXT_DEPENDENT,
                sme_comment: nullable(row.sme_comment),
                effective_from: nullable(row.effective_from),
                effective_until: nullable(row.effective_until),
                rule_version: str(row.version) || '1.0',
                change_reason: nullable(row.change_reason),
                source_row: row.__row,
            });
        });
        if (rules.length) {
            await manager.save(zuno_rulebook_rule_entity_1.ZunoRulebookRule, rules, { chunk: 200 });
        }
        const conflictRows = workbook.sheets.get(enums_1.RulebookSheet.CONFLICT_RULES) ?? [];
        const conflictRules = conflictRows.map((row) => manager.create(zuno_rulebook_knowledge_entity_1.ZunoRulebookConflictRule, {
            rulebook_version_id: rulebookVersionId,
            external_conflict_key: str(row.conflict_id),
            rule_keys: list(row.rule_ids),
            resolution_strategy: upper(row.resolution_strategy),
            winning_rule_key: nullable(row.winning_rule_id),
            rationale: nullable(row.rationale),
            source_row: row.__row,
        }));
        if (conflictRules.length) {
            await manager.save(zuno_rulebook_knowledge_entity_1.ZunoRulebookConflictRule, conflictRules);
        }
        const goldenRows = workbook.sheets.get(enums_1.RulebookSheet.GOLDEN_CASES) ?? [];
        const goldenCases = goldenRows.map((row) => manager.create(zuno_rulebook_knowledge_entity_1.ZunoRulebookGoldenCase, {
            rulebook_version_id: rulebookVersionId,
            external_case_key: str(row.case_id),
            case_name: str(row.case_name),
            domain: upper(row.domain) || null,
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
        }));
        if (goldenCases.length) {
            await manager.save(zuno_rulebook_knowledge_entity_1.ZunoRulebookGoldenCase, goldenCases);
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
    buildConditions(row) {
        const conditions = [];
        const primary = str(row.primary_factor);
        if (primary) {
            conditions.push(this.inferCondition(primary, enums_1.RuleFactorRole.PRIMARY));
        }
        splitFactors(row.supporting_factors).forEach((text) => conditions.push(this.inferCondition(text, enums_1.RuleFactorRole.SUPPORTING)));
        splitFactors(row.counter_factors).forEach((text) => conditions.push(this.inferCondition(text, enums_1.RuleFactorRole.COUNTER)));
        return conditions;
    }
    inferCondition(text, role) {
        const condition = {
            type: enums_1.RuleConditionType.MULTIPLE_CONDITION,
            role,
            operator: enums_1.RuleConditionOperator.AND,
            raw_expression: text,
        };
        const upperText = text.toUpperCase();
        const planet = PLANETS.find((p) => new RegExp(`\\b${p}\\b`).test(upperText));
        if (planet)
            condition.planet = planet;
        const houseMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+house\b/i);
        if (houseMatch) {
            const house = Number(houseMatch[1]);
            if (house >= 1 && house <= 12)
                condition.house = house;
        }
        if (/\bretrograde\b/i.test(text)) {
            condition.type = enums_1.RuleConditionType.PLANET_RETROGRADE;
        }
        else if (/\bcombust\b/i.test(text)) {
            condition.type = enums_1.RuleConditionType.PLANET_COMBUST;
        }
        else if (/\bantara\b/i.test(text)) {
            condition.type = enums_1.RuleConditionType.ANTARA_LORD;
        }
        else if (/\bbhukti\b|\bantardasha\b/i.test(text)) {
            condition.type = enums_1.RuleConditionType.BHUKTI_LORD;
        }
        else if (/\bmahadasha\b|\bdasha\s+lord\b/i.test(text)) {
            condition.type = enums_1.RuleConditionType.DASHA_LORD;
        }
        else if (/\btransit\b/i.test(text)) {
            condition.type = condition.house
                ? enums_1.RuleConditionType.TRANSIT_IN_HOUSE
                : enums_1.RuleConditionType.TRANSIT_ASPECT;
        }
        else if (/\bconjunct/i.test(text)) {
            condition.type = enums_1.RuleConditionType.PLANET_CONJUNCTION;
        }
        else if (/\baspect/i.test(text)) {
            condition.type = enums_1.RuleConditionType.PLANET_ASPECT;
        }
        else if (/\bnakshatra\b/i.test(text)) {
            condition.type = enums_1.RuleConditionType.NAKSHATRA;
        }
        else if (/\blord\s+(of|in)\b/i.test(text)) {
            condition.type = enums_1.RuleConditionType.HOUSE_LORD_IN_HOUSE;
        }
        else if (condition.house && condition.planet) {
            condition.type = enums_1.RuleConditionType.PLANET_IN_HOUSE;
        }
        return condition;
    }
};
exports.RulebookCompilerService = RulebookCompilerService;
exports.RulebookCompilerService = RulebookCompilerService = __decorate([
    (0, common_1.Injectable)()
], RulebookCompilerService);
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
];
function str(value) {
    return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}
function upper(value) {
    return str(value).toUpperCase();
}
function upperStr(value) {
    return value.toUpperCase();
}
function nullable(value) {
    const s = str(value);
    return s.length > 0 ? s : null;
}
function list(value) {
    const raw = str(value);
    if (!raw)
        return [];
    return raw
        .split(/[,;]/)
        .map((p) => p.trim())
        .filter(Boolean);
}
function splitFactors(value) {
    const raw = str(value);
    if (!raw)
        return [];
    return raw
        .split('|')
        .map((p) => p.trim())
        .filter(Boolean);
}
function numbers(value) {
    return list(value)
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n));
}
function bool(value) {
    return /^(yes|true|y|1)$/i.test(str(value));
}
//# sourceMappingURL=rulebook-compiler.service.js.map