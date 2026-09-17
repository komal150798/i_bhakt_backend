"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeterministicKarmaClassifier = exports.DETERMINISTIC_KARMA_CLASSIFIER_VERSION = void 0;
const common_1 = require("@nestjs/common");
const karma_enum_1 = require("../enums/karma.enum");
exports.DETERMINISTIC_KARMA_CLASSIFIER_VERSION = 'karma-deterministic-1.0';
let DeterministicKarmaClassifier = class DeterministicKarmaClassifier {
    async classify(request) {
        const text = (request.text ?? '').toLowerCase();
        const evidence = [];
        const constructive = countMatches(CONSTRUCTIVE_SIGNALS, text);
        const unconstructive = countMatches(UNCONSTRUCTIVE_SIGNALS, text);
        const repair = countMatches(REPAIR_SIGNALS, text);
        if (constructive > 0)
            evidence.push('LEXICAL:CONSTRUCTIVE_ACTION');
        if (unconstructive > 0)
            evidence.push('LEXICAL:SELF_REPORTED_REGRET');
        if (repair > 0)
            evidence.push('LEXICAL:REPAIR');
        const category = request.suggestedCategory ?? detectCategory(text, repair > 0, evidence);
        const intent = detectIntent(text, category, repair > 0);
        const impactScope = detectImpactScope(text);
        const effort = request.effortHint ?? detectEffort(text, evidence);
        const relevance = request.relevanceHint ?? karma_enum_1.KarmaRelevance.MEDIUM;
        const { classification, confidence } = decide(constructive, unconstructive, repair, evidence);
        return {
            classification,
            category,
            intent,
            impactScope,
            effort,
            relevance,
            confidence,
            evidence,
            modelVersion: exports.DETERMINISTIC_KARMA_CLASSIFIER_VERSION,
        };
    }
};
exports.DeterministicKarmaClassifier = DeterministicKarmaClassifier;
exports.DeterministicKarmaClassifier = DeterministicKarmaClassifier = __decorate([
    (0, common_1.Injectable)()
], DeterministicKarmaClassifier);
function decide(constructive, unconstructive, repair, evidence) {
    if (constructive > 0 && unconstructive > 0) {
        evidence.push('SIGNAL:BOTH_DIRECTIONS');
        return { classification: karma_enum_1.KarmaClassification.MIXED, confidence: 0.6 };
    }
    if (repair > 0) {
        return { classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE, confidence: 0.8 };
    }
    if (constructive > 0) {
        return {
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            confidence: constructive >= 2 ? 0.85 : 0.78,
        };
    }
    if (unconstructive > 0) {
        return {
            classification: karma_enum_1.KarmaClassification.UNCONSTRUCTIVE,
            confidence: 0.55,
        };
    }
    evidence.push('SIGNAL:INSUFFICIENT_CONTEXT');
    return { classification: karma_enum_1.KarmaClassification.UNCERTAIN, confidence: 0.3 };
}
function countMatches(patterns, text) {
    return patterns.reduce((total, pattern) => (pattern.test(text) ? total + 1 : total), 0);
}
const CONSTRUCTIVE_SIGNALS = [
    /\b(helped|assisted|supported|mentored|taught|tutored|guided)\b/,
    /\b(volunteered|donated my time|gave my time|fed (the )?(stray|strays|animals))\b/,
    /\b(completed|finished|submitted|delivered|sent off|handed in)\b/,
    /\b(followed through|kept my (word|promise|commitment)|showed up)\b/,
    /\b(prepared|revised|studied|practised|practiced|trained|exercised)\b/,
    /\b(reviewed|reconciled|budgeted|paid off|paid back|saved)\b/,
    /\b(listened|checked in on|thanked|appreciated|encouraged)\b/,
    /\b(spoke to|called|reached out to|had the conversation)\b/,
    /\b(paused before|held back from) (react|respond)/,
];
const UNCONSTRUCTIVE_SIGNALS = [
    /\bi (lost my temper|shouted|yelled|snapped)\b/,
    /\bi (lied|misled|hid the truth)\b/,
    /\bi (broke my (word|promise)|let (them|him|her) down)\b/,
    /\bi (was|got) (harsh|rude|dismissive|unfair)\b/,
    /\bi (avoided|put off|postponed) (it|the|this|that)\b/,
    /\bi should not have\b/,
    /\bi (hurt|upset) (him|her|them|someone)\b/,
];
const REPAIR_SIGNALS = [
    /\b(apologi[sz]ed|said sorry|made amends|put it right|made it right)\b/,
    /\b(owned up|took responsibility|admitted)\b/,
];
const CATEGORY_SIGNALS = [
    {
        category: karma_enum_1.KarmaCategory.SERVICE,
        patterns: [
            /\b(helped|assisted|mentored|taught|tutored|volunteered|donated my time|fed (the )?(stray|strays|animals))\b/,
        ],
    },
    {
        category: karma_enum_1.KarmaCategory.CAREER,
        patterns: [/\b(cv|resume|interview|job|role|manager|client|colleague|work)\b/],
    },
    {
        category: karma_enum_1.KarmaCategory.FINANCIAL_RESPONSIBILITY,
        patterns: [/\b(budget|loan|bank|savings|invest|bill|debt|repayment|finances)\b/],
    },
    {
        category: karma_enum_1.KarmaCategory.LEARNING,
        patterns: [/\b(studied|revision|revised|exam|course|mock|learn|read a)\b/],
    },
    {
        category: karma_enum_1.KarmaCategory.HEALTH_SUPPORT,
        patterns: [/\b(exercised|walked|slept|doctor|appointment|physio|checkup)\b/],
    },
    {
        category: karma_enum_1.KarmaCategory.FAMILY,
        patterns: [/\b(parents|mother|father|mum|dad|son|daughter|sibling|brother|sister)\b/],
    },
    {
        category: karma_enum_1.KarmaCategory.RELATIONSHIP,
        patterns: [/\b(wife|husband|partner|spouse|friend|relationship)\b/],
    },
    {
        category: karma_enum_1.KarmaCategory.COMMUNICATION,
        patterns: [/\b(conversation|talked|spoke|call|message|explained|listened)\b/],
    },
    {
        category: karma_enum_1.KarmaCategory.MINDFULNESS,
        patterns: [/\b(breathing|meditat|grounding|journal|paused|reflected)\b/],
    },
    {
        category: karma_enum_1.KarmaCategory.SELF_DISCIPLINE,
        patterns: [/\b(routine|habit|discipline|stuck to|on time|woke up early)\b/],
    },
    {
        category: karma_enum_1.KarmaCategory.COURAGE,
        patterns: [/\b(difficult|had been avoiding|finally|nervous|afraid but)\b/],
    },
];
function detectCategory(text, isRepair, evidence) {
    if (isRepair) {
        evidence.push('CATEGORY:REPAIR');
        return karma_enum_1.KarmaCategory.REPAIR;
    }
    for (const entry of CATEGORY_SIGNALS) {
        if (countMatches(entry.patterns, text) > 0) {
            evidence.push(`CATEGORY:${entry.category}`);
            return entry.category;
        }
    }
    return karma_enum_1.KarmaCategory.OTHER;
}
function detectIntent(text, category, isRepair) {
    if (isRepair)
        return karma_enum_1.KarmaIntent.REPAIR;
    if (/\b(had been avoiding|finally|followed through|kept my)\b/.test(text)) {
        return karma_enum_1.KarmaIntent.FOLLOW_THROUGH;
    }
    if (category === karma_enum_1.KarmaCategory.SERVICE)
        return karma_enum_1.KarmaIntent.SUPPORT;
    if (category === karma_enum_1.KarmaCategory.RESPONSIBILITY ||
        category === karma_enum_1.KarmaCategory.FINANCIAL_RESPONSIBILITY) {
        return karma_enum_1.KarmaIntent.RESPONSIBILITY;
    }
    if (category === karma_enum_1.KarmaCategory.LEARNING ||
        category === karma_enum_1.KarmaCategory.MINDFULNESS) {
        return karma_enum_1.KarmaIntent.GROWTH;
    }
    return karma_enum_1.KarmaIntent.UNKNOWN;
}
function detectImpactScope(text) {
    if (/\b(colleague|client|team|manager|boss|customer)\b/.test(text)) {
        return karma_enum_1.KarmaImpactScope.WORK;
    }
    if (/\b(parents|mother|father|mum|dad|family|son|daughter|wife|husband)\b/.test(text)) {
        return karma_enum_1.KarmaImpactScope.FAMILY;
    }
    if (/\b(neighbour|neighbor|community|stranger|strays?|someone)\b/.test(text)) {
        return karma_enum_1.KarmaImpactScope.COMMUNITY;
    }
    if (/\b(friend|him|her|them|classmate)\b/.test(text)) {
        return karma_enum_1.KarmaImpactScope.OTHER_PERSON;
    }
    return karma_enum_1.KarmaImpactScope.SELF;
}
function detectEffort(text, evidence) {
    if (/\b(difficult|hard|had been avoiding|finally|for hours|all day|dreading|put it off for)\b/.test(text)) {
        evidence.push('EFFORT:HIGH_MARKER');
        return karma_enum_1.KarmaEffort.HIGH;
    }
    if (/\b(quick|quickly|briefly|a minute|small|just)\b/.test(text)) {
        evidence.push('EFFORT:LOW_MARKER');
        return karma_enum_1.KarmaEffort.LOW;
    }
    return karma_enum_1.KarmaEffort.MEDIUM;
}
//# sourceMappingURL=deterministic-karma-classifier.js.map