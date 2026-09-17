"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWhatIfExploration = validateWhatIfExploration;
const enums_1 = require("../../common/enums");
const scenario_enum_1 = require("../enums/scenario.enum");
const deterministic_language_guard_1 = require("./deterministic-language.guard");
function validateWhatIfExploration(raw) {
    if (!isRecord(raw)) {
        return { ok: false, errors: ['root is not an object'] };
    }
    const claims = (0, deterministic_language_guard_1.scanForDeterministicClaims)(raw);
    if (claims.length > 0) {
        return { ok: false, errors: (0, deterministic_language_guard_1.claimsToValidationErrors)(claims) };
    }
    const assumption = asString(raw.assumption);
    if (!assumption) {
        return {
            ok: false,
            errors: ['assumption is required - the hypothetical must be stated back'],
        };
    }
    const implications = asArray(raw.implications)
        .map((entry) => {
        if (typeof entry === 'string') {
            const text = entry.trim();
            return text.length > 0
                ? {
                    text,
                    layer: 1,
                    basis: scenario_enum_1.ScenarioEvidenceClass.SYSTEM_INFERENCE,
                    dependency_reference: null,
                }
                : null;
        }
        if (!isRecord(entry))
            return null;
        const text = asString(entry.text) ?? asString(entry.implication);
        if (!text)
            return null;
        return {
            text,
            layer: clampLayer(asNumber(entry.layer) ?? 1),
            basis: coerceEnum(asString(entry.basis), scenario_enum_1.ScenarioEvidenceClass, scenario_enum_1.ScenarioEvidenceClass.SYSTEM_INFERENCE),
            dependency_reference: asString(entry.dependency_reference),
        };
    })
        .filter((entry) => entry !== null)
        .filter((entry) => entry.layer <= scenario_enum_1.WHAT_IF_MAX_CASCADE_DEPTH);
    if (implications.length === 0) {
        return {
            ok: false,
            errors: [
                'implications contained no usable entry within the permitted cascade depth',
            ],
        };
    }
    return {
        ok: true,
        value: {
            assumption,
            assumptions: asArray(raw.assumptions)
                .map((entry) => {
                if (typeof entry === 'string') {
                    const text = entry.trim();
                    return text.length > 0
                        ? {
                            text,
                            type: scenario_enum_1.WhatIfAssumptionType.DERIVED_DEPENDENCY,
                            dependency_reference: null,
                        }
                        : null;
                }
                if (!isRecord(entry))
                    return null;
                const text = asString(entry.text) ?? asString(entry.assumption_text);
                if (!text)
                    return null;
                return {
                    text,
                    type: coerceEnum(asString(entry.type), scenario_enum_1.WhatIfAssumptionType, scenario_enum_1.WhatIfAssumptionType.DERIVED_DEPENDENCY),
                    dependency_reference: asString(entry.dependency_reference),
                };
            })
                .filter((entry) => entry !== null),
            implications,
            controllable_actions: stringArray(raw.controllable_actions),
            existing_preparation_that_helps: stringArray(raw.existing_preparation_that_helps),
            preparation: asArray(raw.preparation)
                .map((entry) => {
                if (typeof entry === 'string') {
                    const action = entry.trim();
                    return action.length > 0
                        ? { action, classification: scenario_enum_1.PreparationClass.CONTINGENCY_ONLY }
                        : null;
                }
                if (!isRecord(entry))
                    return null;
                const action = asString(entry.action) ?? asString(entry.text);
                if (!action)
                    return null;
                return {
                    action,
                    classification: coerceEnum(asString(entry.classification), scenario_enum_1.PreparationClass, scenario_enum_1.PreparationClass.CONTINGENCY_ONLY),
                };
            })
                .filter((entry) => entry !== null),
            impact_areas: asArray(raw.impact_areas)
                .map((entry) => asString(entry))
                .filter((entry) => (0, enums_1.isZunoDomain)(entry)),
            impact: coerceEnum(asString(raw.impact), scenario_enum_1.ScenarioImpact, scenario_enum_1.ScenarioImpact.MODERATE),
            reversibility: coerceEnumOrNull(asString(raw.reversibility), scenario_enum_1.Reversibility),
            safety_flags: asArray(raw.safety_flags)
                .map((flag) => asString(flag))
                .filter((flag) => flag !== null)
                .filter((flag) => Object.values(enums_1.SafetyFlag).includes(flag)),
            confidence: clamp01(asNumber(raw.confidence) ?? 0.5),
        },
    };
}
function clampLayer(value) {
    const rounded = Math.round(value);
    if (!Number.isFinite(rounded) || rounded < 1)
        return 1;
    return rounded;
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
//# sourceMappingURL=what-if-exploration.schema.js.map