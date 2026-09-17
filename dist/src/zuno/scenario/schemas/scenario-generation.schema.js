"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateScenarioGeneration = validateScenarioGeneration;
const enums_1 = require("../../common/enums");
const scenario_enum_1 = require("../enums/scenario.enum");
const deterministic_language_guard_1 = require("./deterministic-language.guard");
function validateScenarioGeneration(raw) {
    const errors = [];
    if (!isRecord(raw)) {
        return { ok: false, errors: ['root is not an object'] };
    }
    if (!Array.isArray(raw.scenarios)) {
        return { ok: false, errors: ['scenarios must be an array'] };
    }
    const claims = (0, deterministic_language_guard_1.scanForDeterministicClaims)(raw);
    if (claims.length > 0) {
        return { ok: false, errors: (0, deterministic_language_guard_1.claimsToValidationErrors)(claims) };
    }
    const scenarios = raw.scenarios
        .filter(isRecord)
        .map(parseCandidate)
        .filter((candidate) => candidate !== null);
    if (scenarios.length === 0) {
        errors.push('scenarios contained no usable entry (each needs title and summary)');
    }
    if (errors.length > 0) {
        return { ok: false, errors };
    }
    return {
        ok: true,
        value: {
            seeds: stringArray(raw.seeds),
            scenarios,
            shared_preparation: parsePreparation(raw.shared_preparation, scenario_enum_1.PreparationClass.COMMON),
            watch_signals: stringArray(raw.watch_signals),
            comparison: asArray(raw.comparison)
                .filter(isRecord)
                .map((entry) => ({
                dimension: asString(entry.dimension) ?? '',
                values: parseStringMap(entry.values),
            }))
                .filter((entry) => entry.dimension.length > 0),
            decision_readiness: coerceEnum(asString(raw.decision_readiness), scenario_enum_1.DecisionReadiness, scenario_enum_1.DecisionReadiness.PARTIALLY_READY),
            safety_flags: asArray(raw.safety_flags)
                .map((flag) => asString(flag))
                .filter((flag) => flag !== null)
                .filter((flag) => Object.values(enums_1.SafetyFlag).includes(flag)),
        },
    };
}
function parseCandidate(raw) {
    const title = asString(raw.title);
    const summary = asString(raw.summary) ?? asString(raw.description);
    if (!title || !summary)
        return null;
    return {
        title,
        summary,
        scenario_type: coerceEnum(asString(raw.scenario_type) ?? asString(raw.type), scenario_enum_1.ScenarioType, scenario_enum_1.ScenarioType.CHANGE),
        horizon: coerceEnum(asString(raw.horizon) ?? asString(raw.time_horizon), scenario_enum_1.ScenarioHorizon, scenario_enum_1.ScenarioHorizon.UNSPECIFIED),
        impact: coerceEnum(asString(raw.impact), scenario_enum_1.ScenarioImpact, scenario_enum_1.ScenarioImpact.MODERATE),
        relevance: coerceEnum(asString(raw.relevance), scenario_enum_1.ScenarioRelevance, scenario_enum_1.ScenarioRelevance.CONTINGENCY),
        confidence: clamp01(asNumber(raw.confidence) ?? 0.5),
        basis: asArray(raw.basis)
            .filter(isRecord)
            .map((entry) => ({
            type: coerceEnum(asString(entry.type), scenario_enum_1.ScenarioEvidenceClass, scenario_enum_1.ScenarioEvidenceClass.SYSTEM_INFERENCE),
            reference: asString(entry.reference) ?? '',
        }))
            .filter((entry) => entry.reference.length > 0),
        signals_for: stringArray(raw.signals_for),
        signals_against: stringArray(raw.signals_against),
        dependencies: asArray(raw.dependencies)
            .filter(isRecord)
            .map((entry) => ({
            from: asString(entry.from) ?? '',
            to: asString(entry.to) ?? '',
            description: asString(entry.description),
        }))
            .filter((entry) => entry.from.length > 0 && entry.to.length > 0),
        risks: stringArray(raw.risks),
        opportunities: stringArray(raw.opportunities),
        controllable_factors: stringArray(raw.controllable_factors),
        impact_areas: asArray(raw.impact_areas)
            .map((entry) => asString(entry))
            .filter((entry) => (0, enums_1.isZunoDomain)(entry)),
        scenario_specific_preparation: parsePreparation(raw.scenario_specific_preparation ?? raw.preparation, scenario_enum_1.PreparationClass.SCENARIO_SPECIFIC),
        benefits: stringArray(raw.benefits),
        constraints: stringArray(raw.constraints),
        reversibility: coerceEnumOrNull(asString(raw.reversibility), scenario_enum_1.Reversibility),
        option_ref: asString(raw.option_ref) ?? asString(raw.option_id),
    };
}
function parsePreparation(raw, defaultClass) {
    return asArray(raw)
        .map((entry) => {
        if (typeof entry === 'string') {
            const action = entry.trim();
            return action.length > 0
                ? { action, classification: defaultClass }
                : null;
        }
        if (isRecord(entry)) {
            const action = asString(entry.action) ?? asString(entry.text);
            if (!action)
                return null;
            return {
                action,
                classification: coerceEnum(asString(entry.classification), scenario_enum_1.PreparationClass, defaultClass),
            };
        }
        return null;
    })
        .filter((entry) => entry !== null);
}
function parseStringMap(raw) {
    if (!isRecord(raw))
        return {};
    const out = {};
    for (const [key, value] of Object.entries(raw)) {
        const text = asString(value);
        if (text)
            out[key] = text;
    }
    return out;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function asString(value) {
    return typeof value === 'string' && value.trim().length > 0
        ? value.trim()
        : null;
}
function asNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return null;
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function stringArray(value) {
    return asArray(value)
        .map((entry) => asString(entry))
        .filter((entry) => entry !== null);
}
function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}
function coerceEnum(value, enumObject, fallback) {
    if (value && Object.values(enumObject).includes(value)) {
        return value;
    }
    return fallback;
}
function coerceEnumOrNull(value, enumObject) {
    if (value && Object.values(enumObject).includes(value)) {
        return value;
    }
    return null;
}
//# sourceMappingURL=scenario-generation.schema.js.map