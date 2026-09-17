"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFutureSelfNarrative = validateFutureSelfNarrative;
function validateFutureSelfNarrative(raw) {
    const errors = [];
    if (!isRecord(raw)) {
        return { ok: false, errors: ['root is not an object'] };
    }
    const summary = asString(raw.summary) ?? asString(raw.message);
    if (!summary) {
        errors.push('summary is required and must be a non-empty string');
    }
    if (errors.length > 0) {
        return { ok: false, errors };
    }
    return {
        ok: true,
        value: {
            summary,
            progress_themes: asStringArray(raw.progress_themes, 8),
            open_loops: asStringArray(raw.open_loops, 8),
            strengths_observed: asStringArray(raw.strengths_observed, 8),
            next_focus: asStringArray(raw.next_focus, 5),
            source_refs: asStringArray(raw.source_refs, 40),
        },
    };
}
function asStringArray(value, cap) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((entry) => asString(entry))
        .filter((entry) => entry !== null)
        .slice(0, cap);
}
function asString(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=future-self-narrative.schema.js.map