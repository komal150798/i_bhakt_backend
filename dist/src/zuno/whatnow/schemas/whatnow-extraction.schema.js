"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWhatNowExtraction = validateWhatNowExtraction;
const enums_1 = require("../../common/enums");
function validateWhatNowExtraction(raw) {
    const errors = [];
    if (!isRecord(raw)) {
        return { ok: false, errors: ['root is not an object'] };
    }
    const summary = asString(raw.summary);
    if (!summary)
        errors.push('summary is required and must be a non-empty string');
    const primaryDomainRaw = asString(raw.primary_domain);
    if (!primaryDomainRaw) {
        errors.push('primary_domain is required');
    }
    else if (!(0, enums_1.isZunoDomain)(primaryDomainRaw)) {
        errors.push(`primary_domain "${primaryDomainRaw}" is not a known ZUNO domain`);
    }
    const confidence = asNumber(raw.confidence);
    if (confidence === null) {
        errors.push('confidence is required and must be a number');
    }
    else if (confidence < 0 || confidence > 1) {
        errors.push('confidence must be between 0 and 1');
    }
    if (!Array.isArray(raw.items)) {
        errors.push('items must be an array');
    }
    if (errors.length > 0) {
        return { ok: false, errors };
    }
    const items = raw.items
        .filter(isRecord)
        .map((item) => ({
        text: asString(item.text) ?? '',
        type: coerceEnum(asString(item.type), enums_1.ContextItemType, enums_1.ContextItemType.UNKNOWN),
        source: coerceEnum(asString(item.source), enums_1.ContextItemSource, enums_1.ContextItemSource.INFERRED),
        confidence: clamp01(asNumber(item.confidence) ?? 0.5),
    }))
        .filter((item) => item.text.length > 0);
    const secondaryDomains = asArray(raw.secondary_domains)
        .filter(isRecord)
        .map((entry) => ({
        domain: asString(entry.domain),
        confidence: clamp01(asNumber(entry.confidence) ?? 0.5),
    }))
        .filter((entry) => entry.domain !== null && (0, enums_1.isZunoDomain)(entry.domain));
    const dependencies = asArray(raw.dependencies)
        .filter(isRecord)
        .map((entry) => ({
        from: asString(entry.from) ?? '',
        to: asString(entry.to) ?? '',
        description: asString(entry.description) ?? undefined,
    }))
        .filter((entry) => entry.from.length > 0 && entry.to.length > 0);
    const desiredOutcomes = asArray(raw.desired_outcomes)
        .filter(isRecord)
        .map((entry) => ({
        goal: asString(entry.goal) ?? '',
        status: coerceEnum(asString(entry.status), enums_1.GoalStatus, enums_1.GoalStatus.INFERRED),
        confidence: clamp01(asNumber(entry.confidence) ?? 0.5),
    }))
        .filter((entry) => entry.goal.length > 0);
    const decisions = asArray(raw.decisions)
        .filter(isRecord)
        .map((entry) => ({
        question: asString(entry.question) ?? '',
        options: asArray(entry.options)
            .map((option) => asString(option))
            .filter((option) => option !== null),
        confidence: clamp01(asNumber(entry.confidence) ?? 0.5),
    }))
        .filter((entry) => entry.question.length > 0);
    const temporalAnchors = asArray(raw.temporal_anchors)
        .filter(isRecord)
        .map((entry) => ({
        raw: asString(entry.raw) ?? '',
        normalized_date: asIsoDate(entry.normalized_date),
        timeline: coerceEnum(asString(entry.timeline), enums_1.ChallengeTimeline, enums_1.ChallengeTimeline.UNKNOWN),
    }))
        .filter((entry) => entry.raw.length > 0);
    const missingInformation = asArray(raw.missing_information)
        .filter(isRecord)
        .map((entry) => ({
        question: asString(entry.question) ?? '',
        information_gain: clamp01(asNumber(entry.information_gain) ?? 0.5),
        rationale: asString(entry.rationale) ?? '',
    }))
        .filter((entry) => entry.question.length > 0);
    const emotionalSignals = asArray(raw.emotional_signals)
        .map((signal) => asString(signal))
        .filter((signal) => signal !== null)
        .filter((signal) => Object.values(enums_1.EmotionalSignal).includes(signal));
    const safetyFlags = asArray(raw.safety_flags)
        .map((flag) => asString(flag))
        .filter((flag) => flag !== null)
        .filter((flag) => Object.values(enums_1.SafetyFlag).includes(flag));
    return {
        ok: true,
        value: {
            summary: summary,
            primary_domain: primaryDomainRaw,
            secondary_domains: secondaryDomains,
            theme: asString(raw.theme),
            subthemes: asArray(raw.subthemes)
                .map((item) => asString(item))
                .filter((item) => item !== null),
            items,
            dependencies,
            desired_outcomes: desiredOutcomes,
            decisions,
            controllable: asArray(raw.controllable)
                .map((item) => asString(item))
                .filter((item) => item !== null),
            external: asArray(raw.external)
                .map((item) => asString(item))
                .filter((item) => item !== null),
            temporal_anchors: temporalAnchors,
            missing_information: missingInformation,
            emotional_signals: emotionalSignals,
            emotional_intensity: coerceEnum(asString(raw.emotional_intensity), enums_1.EmotionalIntensity, enums_1.EmotionalIntensity.MODERATE),
            urgency: coerceEnum(asString(raw.urgency), enums_1.Urgency, enums_1.Urgency.MEDIUM),
            safety_flags: safetyFlags,
            confidence: clamp01(confidence),
        },
    };
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function asString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
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
function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}
function asIsoDate(value) {
    const text = asString(value);
    if (!text)
        return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}
function coerceEnum(value, enumObject, fallback) {
    if (value && Object.values(enumObject).includes(value)) {
        return value;
    }
    return fallback;
}
//# sourceMappingURL=whatnow-extraction.schema.js.map