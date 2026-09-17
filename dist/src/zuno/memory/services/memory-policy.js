"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INFERENCE_AUTO_ACCEPT_CONFIDENCE = exports.MIN_PATTERN_EVIDENCE = void 0;
exports.isUnworthy = isUnworthy;
exports.assessWorthiness = assessWorthiness;
exports.confirmationRequirement = confirmationRequirement;
exports.classifySensitivity = classifySensitivity;
exports.defaultRetention = defaultRetention;
exports.defaultExpiryDays = defaultExpiryDays;
exports.contradicts = contradicts;
const memory_enum_1 = require("../enums/memory.enum");
function isUnworthy(verdict) {
    return verdict.worth === false;
}
function assessWorthiness(input) {
    const statement = (input.statement ?? '').trim();
    if (statement.length < 8) {
        return { worth: false, reason: memory_enum_1.MemoryRejectionReason.TRIVIAL };
    }
    if (TRIVIAL_STATEMENT.test(statement)) {
        return { worth: false, reason: memory_enum_1.MemoryRejectionReason.TRIVIAL };
    }
    if (UI_TELEMETRY.test(statement)) {
        return { worth: false, reason: memory_enum_1.MemoryRejectionReason.NOT_WORTH_REMEMBERING };
    }
    if (PERSONALITY_DIAGNOSIS.test(statement)) {
        return { worth: false, reason: memory_enum_1.MemoryRejectionReason.PERSONALITY_DIAGNOSIS };
    }
    if (input.evidenceType !== memory_enum_1.MemoryEvidenceType.EXPLICIT &&
        SENSITIVE_ATTRIBUTE.test(statement)) {
        return {
            worth: false,
            reason: memory_enum_1.MemoryRejectionReason.SENSITIVE_ATTRIBUTE_INFERENCE,
        };
    }
    if (input.factuality === memory_enum_1.MemoryFactuality.FACT &&
        PREDICTION_LANGUAGE.test(statement)) {
        return { worth: false, reason: memory_enum_1.MemoryRejectionReason.PREDICTION_AS_FACT };
    }
    if (input.factuality === memory_enum_1.MemoryFactuality.FACT &&
        HYPOTHETICAL_LANGUAGE.test(statement)) {
        return { worth: false, reason: memory_enum_1.MemoryRejectionReason.HYPOTHETICAL_AS_FACT };
    }
    if (input.type === memory_enum_1.MemoryType.PATTERN) {
        if ((input.evidenceCount ?? 0) < exports.MIN_PATTERN_EVIDENCE) {
            return {
                worth: false,
                reason: memory_enum_1.MemoryRejectionReason.INSUFFICIENT_PATTERN_EVIDENCE,
            };
        }
    }
    return { worth: true };
}
exports.MIN_PATTERN_EVIDENCE = 3;
exports.INFERENCE_AUTO_ACCEPT_CONFIDENCE = 0.85;
function confirmationRequirement(input) {
    if (input.conflictsWithActive && input.source !== memory_enum_1.MemorySource.USER_CORRECTION) {
        if (input.source !== memory_enum_1.MemorySource.USER_EXPLICIT) {
            return 'CONTRADICTS_ACTIVE_MEMORY';
        }
    }
    if (input.sensitivity !== memory_enum_1.MemorySensitivity.STANDARD) {
        return 'SENSITIVE_CLASSIFICATION';
    }
    if (input.evidenceType === memory_enum_1.MemoryEvidenceType.INFERRED &&
        input.confidence < exports.INFERENCE_AUTO_ACCEPT_CONFIDENCE) {
        return 'LOW_CONFIDENCE_INFERENCE';
    }
    if (input.evidenceType === memory_enum_1.MemoryEvidenceType.DERIVED &&
        input.type === memory_enum_1.MemoryType.PATTERN) {
        return 'DERIVED_PATTERN';
    }
    return null;
}
function classifySensitivity(type, statement) {
    const text = (statement ?? '').toLowerCase();
    if (BIRTH_DETAIL.test(text))
        return memory_enum_1.MemorySensitivity.RESTRICTED;
    if (SENSITIVE_ATTRIBUTE.test(text))
        return memory_enum_1.MemorySensitivity.RESTRICTED;
    if (SENSITIVE_CONTENT.test(text))
        return memory_enum_1.MemorySensitivity.SENSITIVE;
    if (type === memory_enum_1.MemoryType.ASTRO_CONTEXT_REFERENCE) {
        return memory_enum_1.MemorySensitivity.SENSITIVE;
    }
    return memory_enum_1.MemorySensitivity.STANDARD;
}
function defaultRetention(type, factuality) {
    if (factuality === memory_enum_1.MemoryFactuality.HYPOTHETICAL) {
        return memory_enum_1.MemoryRetentionClass.SHORT_TERM;
    }
    if (factuality === memory_enum_1.MemoryFactuality.FORECAST_CONTEXT) {
        return memory_enum_1.MemoryRetentionClass.SHORT_TERM;
    }
    switch (type) {
        case memory_enum_1.MemoryType.TEMPORARY_CONTEXT:
            return memory_enum_1.MemoryRetentionClass.SHORT_TERM;
        case memory_enum_1.MemoryType.PROFILE:
        case memory_enum_1.MemoryType.PREFERENCE:
            return memory_enum_1.MemoryRetentionClass.UNTIL_SUPERSEDED;
        case memory_enum_1.MemoryType.GOAL:
        case memory_enum_1.MemoryType.DECISION:
        case memory_enum_1.MemoryType.CONSTRAINT:
        case memory_enum_1.MemoryType.USER_CORRECTION:
            return memory_enum_1.MemoryRetentionClass.UNTIL_SUPERSEDED;
        case memory_enum_1.MemoryType.CHALLENGE:
        case memory_enum_1.MemoryType.COMMITMENT:
        case memory_enum_1.MemoryType.PLAN_CONTEXT:
        case memory_enum_1.MemoryType.PROGRESS:
            return memory_enum_1.MemoryRetentionClass.CHALLENGE_LIFETIME;
        case memory_enum_1.MemoryType.LIFE_EVENT:
        case memory_enum_1.MemoryType.PATTERN:
        case memory_enum_1.MemoryType.FUTURE_SELF_NARRATIVE:
            return memory_enum_1.MemoryRetentionClass.LONG_TERM;
        case memory_enum_1.MemoryType.ASTRO_CONTEXT_REFERENCE:
            return memory_enum_1.MemoryRetentionClass.CHALLENGE_LIFETIME;
        default:
            return memory_enum_1.MemoryRetentionClass.SHORT_TERM;
    }
}
function defaultExpiryDays(retention) {
    switch (retention) {
        case memory_enum_1.MemoryRetentionClass.SESSION:
            return 1;
        case memory_enum_1.MemoryRetentionClass.SHORT_TERM:
            return 14;
        case memory_enum_1.MemoryRetentionClass.CHALLENGE_LIFETIME:
        case memory_enum_1.MemoryRetentionClass.LONG_TERM:
        case memory_enum_1.MemoryRetentionClass.UNTIL_SUPERSEDED:
        case memory_enum_1.MemoryRetentionClass.USER_PINNED:
            return null;
        default:
            return null;
    }
}
function contradicts(incumbent, incoming) {
    if (incumbent.memory_key !== incoming.memory_key)
        return false;
    const assertive = [
        memory_enum_1.MemoryFactuality.FACT,
        memory_enum_1.MemoryFactuality.DECISION,
        memory_enum_1.MemoryFactuality.PLAN,
        memory_enum_1.MemoryFactuality.PREFERENCE,
    ];
    return (assertive.includes(incumbent.factuality) &&
        assertive.includes(incoming.factuality));
}
const TRIVIAL_STATEMENT = /^(ok(ay)?|sure|thanks?|thank you|yes|no|yeah|nope|hmm+|got it|fine|alright|cool|k)\b[.!]?$/i;
const UI_TELEMETRY = /\b(opened screen|clicked|tapped|scrolled|skipped .*card|viewed page|pressed continue)\b/i;
const PERSONALITY_DIAGNOSIS = /\b(is|has|suffers from|seems to be)\s+(a\s+)?(narcissis\w*|bipolar|borderline|sociopath\w*|psychopath\w*|adhd|autis\w*|ocd|ptsd|depress(ed|ion)|anxious personality|avoidant personality|neurotic)\b/i;
const SENSITIVE_ATTRIBUTE = /\b(hindu|muslim|christian|sikh|jain|buddhist|jewish|atheist|religion is|votes? for|political(ly)? (left|right|conservative|liberal)|bjp|congress party|gay|lesbian|bisexual|transgender|queer|hiv|cancer diagnosis|diagnosed with)\b/i;
const PREDICTION_LANGUAGE = /\b(will (likely |probably )?(get|lose|receive|change|marry|move)|is going to|predicted to|forecast(ed)? to|destined to|expected to (get|lose|receive))\b/i;
const HYPOTHETICAL_LANGUAGE = /\b(what if|if i (were|was|decide|choose|resign|move|quit)|might (resign|move|quit|leave)|considering whether|thinking about whether|hypothetical)\b/i;
const BIRTH_DETAIL = /\b(born (on|at|in)|birth (date|time|place|details)|date of birth|time of birth|natal chart|nakshatra|rashi|lagna|ascendant)\b/i;
const SENSITIVE_CONTENT = /\b(salary|income|debt|loan|emi|mortgage|bankrupt|savings|therapy|medication|counsell?ing|divorce|affair|abuse|miscarriage|fertility|infidelity)\b/i;
//# sourceMappingURL=memory-policy.js.map