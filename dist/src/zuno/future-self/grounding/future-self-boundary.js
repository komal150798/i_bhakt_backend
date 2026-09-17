"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGroundingSet = buildGroundingSet;
exports.checkFutureSelfBoundary = checkFutureSelfBoundary;
exports.extractProperNouns = extractProperNouns;
exports.extractFigures = extractFigures;
const future_self_enum_1 = require("../enums/future-self.enum");
function buildGroundingSet(sources) {
    const terms = new Set();
    const figures = new Set();
    const sourceRefs = new Set();
    for (const source of sources) {
        sourceRefs.add(`${source.entityType}:${source.entityId}`);
        for (const token of tokenise(source.text))
            terms.add(token);
        for (const figure of extractFigures(source.text)) {
            figures.add(normaliseFigure(figure));
        }
    }
    return { terms, figures, sourceRefs };
}
function checkFutureSelfBoundary(input) {
    const violations = new Set();
    const offending = [];
    const text = input.candidateText ?? '';
    const lower = text.toLowerCase();
    const flag = (violation, fragment) => {
        violations.add(violation);
        if (offending.length < 20)
            offending.push(fragment);
    };
    for (const pattern of GUARANTEE_PATTERNS) {
        const match = lower.match(pattern);
        if (match)
            flag(future_self_enum_1.FutureSelfViolation.GUARANTEED_OUTCOME, match[0]);
    }
    for (const pattern of FUTURE_KNOWLEDGE_PATTERNS) {
        const match = lower.match(pattern);
        if (match)
            flag(future_self_enum_1.FutureSelfViolation.LITERAL_FUTURE_KNOWLEDGE, match[0]);
    }
    for (const pattern of MYSTICAL_PATTERNS) {
        const match = lower.match(pattern);
        if (match)
            flag(future_self_enum_1.FutureSelfViolation.MYSTICAL_CAUSATION, match[0]);
    }
    for (const pattern of EMOTIONAL_CLAIM_PATTERNS) {
        const match = lower.match(pattern);
        if (!match)
            continue;
        const claimWord = match[match.length - 1] ?? match[0];
        if (!input.grounding.terms.has(claimWord.toLowerCase())) {
            flag(future_self_enum_1.FutureSelfViolation.UNGROUNDED_EMOTIONAL_CLAIM, match[0]);
        }
    }
    for (const pattern of IDENTITY_LABEL_PATTERNS) {
        const match = lower.match(pattern);
        if (match)
            flag(future_self_enum_1.FutureSelfViolation.IDENTITY_LABEL, match[0]);
    }
    for (const figure of extractFigures(text)) {
        if (!input.grounding.figures.has(normaliseFigure(figure))) {
            flag(future_self_enum_1.FutureSelfViolation.INVENTED_SALARY, figure);
        }
    }
    for (const candidate of extractProperNouns(text)) {
        if (isGroundedPhrase(candidate.phrase, input.grounding))
            continue;
        const kind = classifyEntity(text, candidate.index, candidate.phrase);
        flag(kind, candidate.phrase);
    }
    for (const ref of input.claimedSourceRefs ?? []) {
        if (!input.grounding.sourceRefs.has(ref)) {
            flag(future_self_enum_1.FutureSelfViolation.UNVERIFIABLE_SOURCE, ref);
        }
    }
    const ceiling = future_self_enum_1.MODE_MAX_SUMMARY_CHARS[input.mode] ?? 900;
    if ((input.summary ?? '').length > ceiling) {
        flag(future_self_enum_1.FutureSelfViolation.MODE_LENGTH_EXCEEDED, `${input.summary.length}>${ceiling}`);
    }
    return {
        allowed: violations.size === 0,
        violations: Array.from(violations),
        offending,
    };
}
function extractProperNouns(text) {
    const candidates = [];
    const pattern = /\b([A-Z][A-Za-z'&.-]*(?:\s+[A-Z][A-Za-z'&.-]*)*)\b/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
        const phrase = match[1].trim();
        if (phrase.length < 2)
            continue;
        const words = phrase.split(/\s+/).filter((word) => word.length > 1);
        if (words.length === 0)
            continue;
        const meaningful = words.filter((word) => !COMMON_CAPITALISED.has(word.toLowerCase().replace(/[.'&-]/g, '')));
        if (meaningful.length === 0)
            continue;
        candidates.push({ phrase: meaningful.join(' '), index: match.index });
    }
    return candidates;
}
function isGroundedPhrase(phrase, grounding) {
    const words = tokenise(phrase);
    if (words.length === 0)
        return true;
    return words.every((word) => grounding.terms.has(word));
}
function classifyEntity(text, index, phrase) {
    const before = text.slice(Math.max(0, index - 40), index).toLowerCase();
    const after = text
        .slice(index + phrase.length, index + phrase.length + 40)
        .toLowerCase();
    if (EMPLOYER_CONTEXT.test(before) || EMPLOYER_SUFFIX.test(after)) {
        return future_self_enum_1.FutureSelfViolation.INVENTED_EMPLOYER;
    }
    if (PARTNER_CONTEXT.test(before) || PARTNER_SUFFIX.test(after)) {
        return future_self_enum_1.FutureSelfViolation.INVENTED_PARTNER;
    }
    return future_self_enum_1.FutureSelfViolation.UNGROUNDED_ENTITY;
}
function extractFigures(text) {
    const found = [];
    for (const pattern of FIGURE_PATTERNS) {
        const matches = text.match(pattern);
        if (matches)
            found.push(...matches);
    }
    return found;
}
function normaliseFigure(figure) {
    return figure.toLowerCase().replace(/[\s,]/g, '');
}
function tokenise(text) {
    return (text ?? '')
        .toLowerCase()
        .split(/[^a-z0-9'&]+/)
        .map((token) => token.replace(/^'+|'+$/g, ''))
        .filter((token) => token.length > 1);
}
const FIGURE_PATTERNS = [
    /(?:AED|USD|INR|SAR|GBP|EUR|Rs\.?|₹|\$|£|€)\s?\d[\d,]*(?:\.\d+)?\s?(?:k|lakh|lakhs|crore|cr|million|mn|m|bn)?/gi,
    /\b\d[\d,]*(?:\.\d+)?\s?(?:k|lakh|lakhs|crore|cr|lpa|million)\b/gi,
    /\b\d[\d,]{2,}(?:\.\d+)?\s?(?:per|a|each)\s?(?:month|year|annum|week)\b/gi,
    /\b\d{1,3}\s?%\s?(?:raise|increase|hike|increment)\b/gi,
];
const GUARANTEE_PATTERNS = [
    /\b(?:you|we)\s+will\s+(?:definitely|certainly|surely|absolutely|for sure)\b/,
    /\b(?:you|we)\s+(?:are|'re)\s+going\s+to\s+(?:get|land|receive|keep|secure|win)\b/,
    /\b(?:you|we)\s+will\s+(?:get|land|receive|secure|be\s+offered|be\s+given|keep|win)\s+(?:the|a|an|your|another)\s+\w+/,
    /\bis\s+guaranteed\b/,
    /\bi\s+guarantee\b/,
    /\bguaranteed\s+to\s+(?:happen|work|succeed|come\s+through)\b/,
    /\bthere\s+is\s+no\s+doubt\s+(?:that\s+)?(?:you|we)\b/,
    /\bwithout\s+(?:a\s+)?doubt,?\s+(?:you|we)\b/,
    /\beverything\s+(?:will\s+)?(?:works?|work)\s+out\b/,
    /\bit\s+(?:will\s+)?all\s+works?\s+out\b/,
    /\btrust\s+me\b/,
    /\bi\s+(?:can\s+)?promise\s+(?:you|that|this)\b/,
    /\brest\s+assured\b/,
    /\byour\s+job\s+is\s+safe\b/,
    /\byou\s+(?:are|'re)\s+not\s+going\s+to\s+(?:lose|be\s+laid\s+off)\b/,
    /\bby\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+(?:you|we)\s+will\s+(?:have|be)\b/,
];
const FUTURE_KNOWLEDGE_PATTERNS = [
    /\bi\s+(?:am|'m)\s+(?:you|your\s+\w+)\s+(?:from|in)\s+(?:the\s+future|\w+\s+\d{4}|\d{4})\b/,
    /\bi\s+(?:am|'m)\s+speaking\s+to\s+you\s+from\s+(?:the\s+future|\d{4})\b/,
    /\bi\s+(?:have\s+)?seen\s+your\s+future\b/,
    /\bi\s+know\s+(?:exactly\s+)?(?:what\s+happens|how\s+this\s+ends|what\s+will\s+happen)\b/,
    /\bi\s+know\s+that\s+you\s+will\b/,
    /\bhaving\s+lived\s+(?:through\s+)?(?:this|your\s+future)\b/,
    /\bfrom\s+where\s+i\s+(?:am|stand)\s+in\s+\d{4}\b/,
    /\bi\s+remember\s+how\s+this\s+turns\s+out\b/,
];
const MYSTICAL_PATTERNS = [
    /\bbecause\s+(?:your|our)\s+(?:karma|chart|planets?|stars?|dasha|transit)\b/,
    /\b(?:your|our)\s+(?:karma|cosmic\s+\w+)\s+(?:has\s+)?(?:improved|changed|shifted)\b/,
    /\bthe\s+(?:planets?|stars?|universe)\s+(?:will\s+)?(?:bring|give|protect|reward|favour|favor)\b/,
    /\b(?:destiny|fate)\s+(?:will|has)\s+\w+/,
    /\b(?:this|it)\s+is\s+(?:written|meant\s+to\s+be|your\s+destiny)\b/,
];
const EMOTIONAL_CLAIM_PATTERNS = [
    /\b(?:you|we)\s+(?:are|'re|have\s+become|became)\s+(?:so\s+|much\s+|far\s+|clearly\s+|a\s+lot\s+)?(calmer|calm|stronger|happier|healed|transformed|fearless|confident|resilient|peaceful)\b/,
    /\b(?:you|we)\s+(?:have\s+)?(?:grown|matured)\s+(?:so\s+much|a\s+lot|enormously)\b/,
];
const IDENTITY_LABEL_PATTERNS = [
    /\byou\s+(?:always|never)\s+\w+/,
    /\byou\s+are\s+(?:a|an)\s+(?:procrastinator|avoider|perfectionist|pessimist|quitter|overthinker|worrier)\b/,
    /\byou\s+are\s+the\s+(?:kind|type)\s+of\s+person\s+who\b/,
    /\bthat\s+is\s+(?:just\s+)?who\s+you\s+are\b/,
];
const EMPLOYER_CONTEXT = /\b(?:at|join|joining|joined|offer\s+from|offers?\s+at|work(?:ing)?\s+(?:for|at|with)|hired\s+by|recruited\s+by|role\s+at|position\s+at|job\s+at|interview\s+(?:with|at)|company\s+called|employer|move\s+to|land\s+(?:a\s+)?(?:job|role)\s+at)\s+$/;
const EMPLOYER_SUFFIX = /^\s*(?:will\s+(?:hire|offer|call|reach\s+out)|is\s+hiring|has\s+an\s+opening|are\s+hiring)\b/;
const PARTNER_CONTEXT = /\b(?:marry|marrying|married\s+to|engaged\s+to|partner(?:\s+called)?|wife|husband|fianc[ée]e?|spouse|dating|meet(?:ing)?\s+someone\s+(?:called|named))\s+$/;
const PARTNER_SUFFIX = /^\s*(?:will\s+(?:be\s+)?(?:your|the)\s+(?:wife|husband|partner)|is\s+(?:your|the)\s+(?:wife|husband|partner))\b/;
const COMMON_CAPITALISED = new Set([
    'i', 'we', 'our', 'ours', 'us', 'you', 'your', 'yours', 'it', 'its', 'they',
    'them', 'their', 'this', 'that', 'these', 'those', 'a', 'an', 'the', 'my',
    'and', 'but', 'or', 'so', 'if', 'as', 'at', 'by', 'for', 'from', 'in', 'into',
    'of', 'on', 'to', 'with', 'without', 'when', 'where', 'while', 'since',
    'because', 'although', 'though', 'after', 'before', 'until', 'unless',
    'however', 'still', 'then', 'there', 'here', 'now', 'today', 'tomorrow',
    'yesterday', 'once', 'again', 'also', 'even', 'just', 'only', 'not', 'no',
    'yes', 'both', 'each', 'every', 'either', 'neither', 'some', 'any', 'all',
    'more', 'most', 'less', 'least', 'much', 'many', 'few', 'one', 'two', 'three',
    'first', 'second', 'third', 'next', 'last', 'other', 'another', 'same',
    'what', 'which', 'who', 'whom', 'whose', 'why', 'how',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'can', 'could', 'will', 'would', 'shall', 'should',
    'may', 'might', 'must', 'let', 'keep', 'keeping', 'kept', 'make', 'making',
    'take', 'taking', 'get', 'getting', 'go', 'going', 'come', 'coming', 'see',
    'seeing', 'know', 'knowing', 'think', 'thinking', 'look', 'looking', 'want',
    'need', 'try', 'trying', 'start', 'starting', 'stay', 'staying', 'move',
    'work', 'working', 'put', 'give', 'giving', 'find', 'finding', 'use',
    'using', 'ask', 'asking', 'tell', 'telling', 'say', 'saying', 'feel',
    'feeling', 'seem', 'become', 'becoming', 'remain', 'remaining',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december',
    'zuno', 'whatnow', 'plan', 'memory', 'future', 'self', 'option', 'step',
    'week', 'weekly', 'daily', 'month', 'monthly', 'year', 'progress',
]);
//# sourceMappingURL=future-self-boundary.js.map