"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUALITATIVE_RELEVANCE_LABELS = exports.DeterministicClaimKind = void 0;
exports.findDeterministicClaims = findDeterministicClaims;
exports.hasDeterministicClaim = hasDeterministicClaim;
exports.scanForDeterministicClaims = scanForDeterministicClaims;
exports.claimsToValidationErrors = claimsToValidationErrors;
exports.isQualitativeProbabilityLabel = isQualitativeProbabilityLabel;
var DeterministicClaimKind;
(function (DeterministicClaimKind) {
    DeterministicClaimKind["GUARANTEED_OUTCOME"] = "GUARANTEED_OUTCOME";
    DeterministicClaimKind["NUMERIC_PROBABILITY"] = "NUMERIC_PROBABILITY";
    DeterministicClaimKind["PREDICTION"] = "PREDICTION";
    DeterministicClaimKind["FATALISM"] = "FATALISM";
    DeterministicClaimKind["CERTAIN_TIMING"] = "CERTAIN_TIMING";
})(DeterministicClaimKind || (exports.DeterministicClaimKind = DeterministicClaimKind = {}));
const RULES = [
    { kind: DeterministicClaimKind.GUARANTEED_OUTCOME, pattern: /\bis\s+guaranteed\b/ },
    {
        kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
        pattern: /\bguarantee(s|d)?\s+(that|you|your|a|an|the)\b/,
    },
    {
        kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
        pattern: /\byou\s+will\s+(definitely|certainly|surely|undoubtedly)\b/,
    },
    {
        kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
        pattern: /\b(will|shall)\s+definitely\s+(happen|occur|be|come)\b/,
    },
    {
        kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
        pattern: /\bthere\s+is\s+no\s+doubt\b/,
    },
    {
        kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
        pattern: /\bwithout\s+(a\s+)?doubt\b/,
    },
    {
        kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
        pattern: /\b(is|are)\s+certain\s+to\s+(happen|occur|fail|succeed|end|come)\b/,
    },
    {
        kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
        pattern: /\b(is|are)\s+bound\s+to\s+(happen|occur|fail|end|be)\b/,
    },
    { kind: DeterministicClaimKind.GUARANTEED_OUTCOME, pattern: /\binevitabl[ey]\b/ },
    {
        kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
        pattern: /\b100\s*(%|percent)\s*(certain|sure|chance|guaranteed|likely)\b/,
    },
    {
        kind: DeterministicClaimKind.NUMERIC_PROBABILITY,
        pattern: /\b\d{1,3}(\.\d+)?\s*(%|percent)\s*(chance|probability|likelihood|likely|risk|odds|certain)\b/,
    },
    {
        kind: DeterministicClaimKind.NUMERIC_PROBABILITY,
        pattern: /\b(chance|probability|likelihood|odds|risk)\s+(of|is|are|at|:)?\s*\d{1,3}(\.\d+)?\s*(%|percent)/,
    },
    {
        kind: DeterministicClaimKind.NUMERIC_PROBABILITY,
        pattern: /\b(probability|likelihood|odds)\s*(of|is|are|:)?\s*0?\.\d+/,
    },
    {
        kind: DeterministicClaimKind.NUMERIC_PROBABILITY,
        pattern: /\b\d{1,2}\s+(in|out\s+of)\s+\d{1,3}\s+(chance|likelihood|odds)\b/,
    },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\b(i|we|zuno)\s+(predict|forecast|foresee)\b/,
    },
    { kind: DeterministicClaimKind.PREDICTION, pattern: /\bwe\s+can\s+predict\b/ },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\byou\s+(are|is)\s+going\s+to\s+(lose|fail|be\s+fired|get\s+fired|be\s+terminated|be\s+laid\s+off|divorce)\b/,
    },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\byou\s+will\s+(lose|fail|be\s+fired|get\s+fired|be\s+terminated|be\s+laid\s+off|be\s+rejected|get\s+divorced)\b/,
    },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\byour\s+(job|role|employment|marriage|relationship|business|visa)\s+will\s+(end|be\s+terminated|fail|be\s+lost|collapse)\b/,
    },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\b(this|that|it)\s+will\s+happen\b/,
    },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\bthe\s+outcome\s+will\s+be\b/,
    },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\b(destined|fated)\s+to\b/,
    },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\bpredicted\s+(outcome|event|result|scenario)\b/,
    },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\byour\s+(partner|spouse|husband|wife|employer|manager|boss|company|landlord|bank|lender|family|parents)\s+will\s+(leave|divorce|fire|terminate|dismiss|reject|refuse|deny|approve|agree|accept|end|cut|remove|keep|retain|promote|forgive|support)\b/,
    },
    {
        kind: DeterministicClaimKind.PREDICTION,
        pattern: /\b(he|she|they)\s+will\s+(leave|divorce|fire|reject|refuse|deny|approve|agree|accept)\b/,
    },
    {
        kind: DeterministicClaimKind.FATALISM,
        pattern: /\bnothing\s+(you\s+)?can\s+(be\s+)?do(ne)?\b/,
    },
    {
        kind: DeterministicClaimKind.FATALISM,
        pattern: /\bcannot\s+be\s+(avoided|changed|escaped|prevented)\b/,
    },
    {
        kind: DeterministicClaimKind.FATALISM,
        pattern: /\bno\s+way\s+(out|to\s+avoid|to\s+change)\b/,
    },
    {
        kind: DeterministicClaimKind.FATALISM,
        pattern: /\b(it|this)\s+is\s+(your\s+)?(fate|destiny|written)\b/,
    },
    {
        kind: DeterministicClaimKind.FATALISM,
        pattern: /\bthere\s+is\s+nothing\s+(you|we)\s+can\s+do\b/,
    },
    {
        kind: DeterministicClaimKind.CERTAIN_TIMING,
        pattern: /\bwill\s+(happen|occur|end|begin|start)\s+(on|in|by|within)\s+\S/,
    },
    {
        kind: DeterministicClaimKind.CERTAIN_TIMING,
        pattern: /\bwill\s+(be\s+)?(fired|terminated|laid\s+off|rejected|approved|dismissed)\b/,
    },
    {
        kind: DeterministicClaimKind.CERTAIN_TIMING,
        pattern: /\bwill\s+(fire|terminate|dismiss|reject|lay\s+off)\s+(you|him|her|them)\b/,
    },
    {
        kind: DeterministicClaimKind.CERTAIN_TIMING,
        pattern: /\bby\s+(next\s+)?(week|month|year)\s+you\s+will\b/,
    },
];
function findDeterministicClaims(text, field = 'text') {
    if (!text)
        return [];
    const lowered = text.toLowerCase();
    const found = [];
    for (const rule of RULES) {
        const match = lowered.match(rule.pattern);
        if (match) {
            found.push({ kind: rule.kind, excerpt: match[0], field });
        }
    }
    return found;
}
function hasDeterministicClaim(text) {
    return findDeterministicClaims(text).length > 0;
}
function scanForDeterministicClaims(value, path = '$') {
    if (typeof value === 'string') {
        return findDeterministicClaims(value, path);
    }
    if (Array.isArray(value)) {
        return value.flatMap((entry, index) => scanForDeterministicClaims(entry, `${path}[${index}]`));
    }
    if (value && typeof value === 'object') {
        return Object.entries(value).flatMap(([key, entry]) => scanForDeterministicClaims(entry, `${path}.${key}`));
    }
    return [];
}
function claimsToValidationErrors(claims) {
    return claims.map((claim) => `deterministic claim (${claim.kind}) at ${claim.field}: "${claim.excerpt}" - ` +
        'a scenario explores possibilities and must not assert a determined outcome ' +
        '(Step 12 Rules 1-2, Step 19 sections 7 and 10)');
}
exports.QUALITATIVE_RELEVANCE_LABELS = [
    'PRIMARY',
    'PLAUSIBLE',
    'SECONDARY',
    'CONTINGENCY',
];
function isQualitativeProbabilityLabel(label) {
    if (label === null || label === undefined)
        return true;
    if (/\d/.test(label))
        return false;
    return exports.QUALITATIVE_RELEVANCE_LABELS.includes(label.toUpperCase());
}
//# sourceMappingURL=deterministic-language.guard.js.map