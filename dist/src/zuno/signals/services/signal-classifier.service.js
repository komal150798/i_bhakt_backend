"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalClassifierService = exports.SIGNAL_DETECTOR_VERSION = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const enums_1 = require("../enums");
exports.SIGNAL_DETECTOR_VERSION = 'signal-classifier@1.0.0';
let SignalClassifierService = class SignalClassifierService {
    classify(input) {
        const text = input.statement.trim();
        const lower = text.toLowerCase();
        const noise = this.noiseReason(lower, input);
        if (noise) {
            return this.noiseResult(noise, input, text);
        }
        const signalType = input.declaredType ?? this.inferType(lower);
        const nature = this.inferNature(signalType, lower);
        const hedged = this.isHedged(lower);
        const explicit = this.isExplicit(lower);
        const reliability = this.inferReliability(input.source, hedged, explicit);
        const isInference = reliability === enums_1.LifeSignalReliability.INFERRED ||
            reliability === enums_1.LifeSignalReliability.UNVERIFIED;
        const confidence = this.scoreConfidence(hedged, explicit, input.source);
        const relevance = this.scoreRelevance(input, signalType);
        const urgencyChange = this.scoreUrgencyChange(signalType, lower);
        const materiality = this.scoreMateriality(signalType, relevance, urgencyChange, hedged);
        const clarificationRequired = hedged && enums_1.MATERIALITY_RANK[materiality] >= enums_1.MATERIALITY_RANK[enums_1.LifeSignalMateriality.HIGH];
        return {
            isCandidateSignal: true,
            noiseReason: null,
            signalType,
            nature,
            normalizedEvent: this.normalizeEvent(signalType, lower),
            reliability,
            isInference,
            confidence,
            materiality,
            relevance,
            urgencyChange,
            clarificationRequired,
            reasonCodes: this.reasonCodes(signalType, urgencyChange, materiality),
            staleAfter: this.staleAfter(signalType, nature, input),
            fingerprint: this.fingerprint(signalType, this.normalizeEvent(signalType, lower), input.occurredAt ?? input.detectedAt),
            requiresRulebook: signalType === enums_1.LifeSignalType.ASTRO_TIMING_CHANGE,
        };
    }
    fingerprintFor(signalType, normalizedEvent, at) {
        return this.fingerprint(signalType, normalizedEvent, at);
    }
    noiseReason(lower, input) {
        if (lower.length === 0)
            return 'EMPTY';
        if (input.source !== enums_1.LifeSignalSource.USER_EXPLICIT)
            return null;
        if (input.declaredType)
            return null;
        const ACKNOWLEDGEMENTS = [
            'ok',
            'okay',
            'thanks',
            'thank you',
            'got it',
            'sure',
            'fine',
            'tell me more',
            'i read the plan',
            'i opened the app',
            'i feel the same as yesterday',
            'no change',
            'nothing new',
            'same as before',
        ];
        const stripped = lower.replace(/[.!?,]/g, '').trim();
        if (ACKNOWLEDGEMENTS.includes(stripped))
            return 'ACKNOWLEDGEMENT';
        if (stripped.split(/\s+/).length < 3)
            return 'INSUFFICIENT_CONTENT';
        return null;
    }
    noiseResult(reason, input, text) {
        return {
            isCandidateSignal: false,
            noiseReason: reason,
            signalType: enums_1.LifeSignalType.OTHER,
            nature: enums_1.LifeSignalNature.EVENT,
            normalizedEvent: 'NONE',
            reliability: enums_1.LifeSignalReliability.UNVERIFIED,
            isInference: true,
            confidence: 0,
            materiality: enums_1.LifeSignalMateriality.LOW,
            relevance: enums_1.LifeSignalRelevance.UNRELATED,
            urgencyChange: enums_1.UrgencyChange.NONE,
            clarificationRequired: false,
            reasonCodes: [],
            staleAfter: null,
            fingerprint: this.fingerprint(enums_1.LifeSignalType.OTHER, text.slice(0, 64), input.detectedAt),
            requiresRulebook: false,
        };
    }
    isHedged(lower) {
        const HEDGES = [
            'i think',
            'i feel like',
            'maybe',
            'might',
            'may be',
            'may happen',
            'possibly',
            'perhaps',
            'not sure',
            'seemed',
            'seems',
            'hinted',
            'rumour',
            'rumor',
            'i heard',
            'apparently',
            'could be',
            'probably',
            'worried that',
            'afraid that',
        ];
        return HEDGES.some((hedge) => lower.includes(hedge));
    }
    isExplicit(lower) {
        const EXPLICIT = [
            'confirmed',
            'formally',
            'officially',
            'gave me',
            'i received',
            'i have received',
            'i signed',
            'i accepted',
            'i resigned',
            'i decided',
            'we decided',
            'i completed',
            'has been',
            'have been terminated',
            'last working day',
            'letter',
            'notice',
            'agreed',
        ];
        return EXPLICIT.some((token) => lower.includes(token));
    }
    inferType(lower) {
        const RULES = [
            [
                enums_1.LifeSignalType.PLAN_BLOCKER,
                ['refused', 'rejected my request', 'blocked', 'cannot proceed', 'will not discuss'],
            ],
            [
                enums_1.LifeSignalType.PLAN_PROGRESS,
                ['updated my cv', 'completed the', 'finished the', 'i completed', 'mock test completed'],
            ],
            [
                enums_1.LifeSignalType.OPPORTUNITY,
                ['offer', 'recruiter', 'interview', 'opportunity', 'wants me to join'],
            ],
            [
                enums_1.LifeSignalType.STATUS_CHANGE,
                ['terminated', 'termination', 'laid off', 'resigned', 'promoted', 'role is safe', 'retained'],
            ],
            [
                enums_1.LifeSignalType.FINANCIAL_CHANGE,
                ['loan', 'emi', 'bank', 'salary', 'income', 'revenue'],
            ],
            [enums_1.LifeSignalType.DEADLINE, ['expires', 'due on', 'deadline', 'last date']],
            [enums_1.LifeSignalType.GOAL_CHANGE, ['i want to leave', 'i no longer want to', 'my goal is now']],
            [enums_1.LifeSignalType.PREFERENCE_CHANGE, ["i don't want to", 'i do not want to', 'i prefer']],
            [enums_1.LifeSignalType.DECISION, ['i have decided', 'we decided', 'i no longer want']],
            [
                enums_1.LifeSignalType.CAREER_EVENT,
                ['restructuring', 'manager', 'hr ', 'layoff', 'appraisal', 'my role'],
            ],
            [enums_1.LifeSignalType.RELATIONSHIP_EVENT, ['partner', 'marriage', 'counseling', 'counselling']],
            [enums_1.LifeSignalType.EDUCATION_EVENT, ['exam', 'mock score', 'result', 'admission']],
            [enums_1.LifeSignalType.LEGAL_EVENT, ['legal notice', 'court', 'lawyer', 'summons']],
            [enums_1.LifeSignalType.LOCATION_EVENT, ['visa', 'relocate', 'residency', 'moving to']],
            [enums_1.LifeSignalType.WELLBEING_SIGNAL, ['doctor', 'diagnosed', 'medical', 'health']],
        ];
        for (const [type, tokens] of RULES) {
            if (tokens.some((token) => lower.includes(token)))
                return type;
        }
        return enums_1.LifeSignalType.OTHER;
    }
    inferNature(type, lower) {
        if (enums_1.NON_DECAYING_SIGNAL_TYPES.includes(type))
            return enums_1.LifeSignalNature.STATE;
        const STATE_MARKERS = ['i am now', 'i am currently', 'no longer', 'has become'];
        return STATE_MARKERS.some((marker) => lower.includes(marker))
            ? enums_1.LifeSignalNature.STATE
            : enums_1.LifeSignalNature.EVENT;
    }
    inferReliability(source, hedged, explicit) {
        if (source === enums_1.LifeSignalSource.ADMIN) {
            return enums_1.LifeSignalReliability.ADMIN_CONFIRMED;
        }
        if (source === enums_1.LifeSignalSource.PLAN_EVENT ||
            source === enums_1.LifeSignalSource.KARMA_LEDGER ||
            source === enums_1.LifeSignalSource.SYSTEM_DERIVED) {
            return enums_1.LifeSignalReliability.SYSTEM_OBSERVED;
        }
        if (hedged && !explicit)
            return enums_1.LifeSignalReliability.INFERRED;
        return enums_1.LifeSignalReliability.USER_REPORTED;
    }
    scoreConfidence(hedged, explicit, source) {
        if (source !== enums_1.LifeSignalSource.USER_EXPLICIT)
            return 0.95;
        if (explicit && !hedged)
            return 0.92;
        if (hedged && explicit)
            return 0.6;
        if (hedged)
            return 0.45;
        return 0.75;
    }
    scoreRelevance(input, signalType) {
        if (input.challengeDomains.length === 0)
            return enums_1.LifeSignalRelevance.UNCERTAIN;
        if (input.domain && input.challengeDomains.includes(input.domain)) {
            return enums_1.LifeSignalRelevance.DIRECT;
        }
        if (signalType === enums_1.LifeSignalType.PLAN_PROGRESS ||
            signalType === enums_1.LifeSignalType.PLAN_BLOCKER) {
            return enums_1.LifeSignalRelevance.DIRECT;
        }
        if (input.domain === null)
            return enums_1.LifeSignalRelevance.UNCERTAIN;
        return enums_1.LifeSignalRelevance.INDIRECT;
    }
    scoreUrgencyChange(signalType, lower) {
        const DECREASE_MARKERS = [
            'role is safe',
            'retained',
            'agreed to lower',
            'extended by',
            'postponed',
            'improved',
        ];
        if (DECREASE_MARKERS.some((marker) => lower.includes(marker))) {
            return enums_1.UrgencyChange.DECREASE;
        }
        const INCREASE_MARKERS = [
            'restructuring',
            'layoff',
            'laid off',
            'terminated',
            'termination',
            'notice period',
            'last working day',
            'legal notice',
            'refused',
            'blocked',
            'expires',
            'deadline',
        ];
        if (INCREASE_MARKERS.some((marker) => lower.includes(marker))) {
            return enums_1.UrgencyChange.INCREASE;
        }
        const INCREASE_TYPES = [
            enums_1.LifeSignalType.SETBACK,
            enums_1.LifeSignalType.DEADLINE,
            enums_1.LifeSignalType.PLAN_BLOCKER,
            enums_1.LifeSignalType.LEGAL_EVENT,
            enums_1.LifeSignalType.STATUS_CHANGE,
        ];
        if (INCREASE_TYPES.includes(signalType))
            return enums_1.UrgencyChange.INCREASE;
        return enums_1.UrgencyChange.NONE;
    }
    scoreMateriality(signalType, relevance, urgencyChange, hedged) {
        const BASELINE = {
            [enums_1.LifeSignalType.PLAN_PROGRESS]: enums_1.LifeSignalMateriality.LOW,
            [enums_1.LifeSignalType.OTHER]: enums_1.LifeSignalMateriality.LOW,
            [enums_1.LifeSignalType.TIME_SIGNAL]: enums_1.LifeSignalMateriality.MEDIUM,
            [enums_1.LifeSignalType.ASTRO_TIMING_CHANGE]: enums_1.LifeSignalMateriality.MEDIUM,
            [enums_1.LifeSignalType.EXTERNAL_EVENT]: enums_1.LifeSignalMateriality.MEDIUM,
            [enums_1.LifeSignalType.WELLBEING_SIGNAL]: enums_1.LifeSignalMateriality.HIGH,
            [enums_1.LifeSignalType.PLAN_BLOCKER]: enums_1.LifeSignalMateriality.HIGH,
            [enums_1.LifeSignalType.STATUS_CHANGE]: enums_1.LifeSignalMateriality.HIGH,
            [enums_1.LifeSignalType.OPPORTUNITY]: enums_1.LifeSignalMateriality.HIGH,
            [enums_1.LifeSignalType.GOAL_CHANGE]: enums_1.LifeSignalMateriality.HIGH,
            [enums_1.LifeSignalType.DECISION]: enums_1.LifeSignalMateriality.HIGH,
            [enums_1.LifeSignalType.LEGAL_EVENT]: enums_1.LifeSignalMateriality.HIGH,
            [enums_1.LifeSignalType.SETBACK]: enums_1.LifeSignalMateriality.HIGH,
        };
        let rank = enums_1.MATERIALITY_RANK[BASELINE[signalType] ?? enums_1.LifeSignalMateriality.MEDIUM];
        if (relevance === enums_1.LifeSignalRelevance.UNRELATED)
            rank -= 2;
        else if (relevance === enums_1.LifeSignalRelevance.INDIRECT)
            rank -= 1;
        if (urgencyChange !== enums_1.UrgencyChange.NONE)
            rank += 1;
        if (hedged)
            rank = Math.min(rank, enums_1.MATERIALITY_RANK[enums_1.LifeSignalMateriality.HIGH]);
        const CRITICAL_ELIGIBLE = [
            enums_1.LifeSignalType.WELLBEING_SIGNAL,
            enums_1.LifeSignalType.LEGAL_EVENT,
        ];
        if (!CRITICAL_ELIGIBLE.includes(signalType)) {
            rank = Math.min(rank, enums_1.MATERIALITY_RANK[enums_1.LifeSignalMateriality.HIGH]);
        }
        rank = Math.max(0, Math.min(3, rank));
        return (Object.keys(enums_1.MATERIALITY_RANK).find((key) => enums_1.MATERIALITY_RANK[key] === rank) ?? enums_1.LifeSignalMateriality.MEDIUM);
    }
    reasonCodes(signalType, urgencyChange, materiality) {
        const codes = [];
        switch (signalType) {
            case enums_1.LifeSignalType.STATUS_CHANGE:
                codes.push(enums_1.RealignmentReasonCode.NEW_FACT);
                break;
            case enums_1.LifeSignalType.OPPORTUNITY:
                codes.push(enums_1.RealignmentReasonCode.OPPORTUNITY_APPEARED);
                break;
            case enums_1.LifeSignalType.PLAN_BLOCKER:
                codes.push(enums_1.RealignmentReasonCode.PLAN_BLOCKED);
                break;
            case enums_1.LifeSignalType.GOAL_CHANGE:
                codes.push(enums_1.RealignmentReasonCode.GOAL_CHANGED);
                break;
            case enums_1.LifeSignalType.PREFERENCE_CHANGE:
                codes.push(enums_1.RealignmentReasonCode.PREFERENCE_CHANGED);
                break;
            case enums_1.LifeSignalType.DEADLINE:
            case enums_1.LifeSignalType.TIME_SIGNAL:
                codes.push(enums_1.RealignmentReasonCode.TIME_WINDOW_CHANGED);
                break;
            case enums_1.LifeSignalType.FINANCIAL_CHANGE:
                codes.push(enums_1.RealignmentReasonCode.DEPENDENCY_CHANGED);
                break;
            case enums_1.LifeSignalType.ASTRO_TIMING_CHANGE:
                codes.push(enums_1.RealignmentReasonCode.ASTRO_TIMING_CHANGED);
                break;
            default:
                break;
        }
        if (urgencyChange === enums_1.UrgencyChange.INCREASE) {
            codes.push(enums_1.RealignmentReasonCode.URGENCY_INCREASED);
        }
        if (urgencyChange === enums_1.UrgencyChange.DECREASE) {
            codes.push(enums_1.RealignmentReasonCode.URGENCY_DECREASED);
        }
        if (codes.length === 0 &&
            enums_1.MATERIALITY_RANK[materiality] >= enums_1.MATERIALITY_RANK[enums_1.LifeSignalMateriality.HIGH]) {
            codes.push(enums_1.RealignmentReasonCode.RISK_CHANGED);
        }
        return codes;
    }
    staleAfter(signalType, nature, input) {
        if (nature === enums_1.LifeSignalNature.STATE)
            return null;
        if (enums_1.NON_DECAYING_SIGNAL_TYPES.includes(signalType))
            return null;
        const anchor = input.occurredAt ?? input.detectedAt;
        return new Date(anchor.getTime() + enums_1.DEFAULT_SIGNAL_FRESHNESS_DAYS * 24 * 60 * 60 * 1000);
    }
    normalizeEvent(type, lower) {
        const significant = lower
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 3 && !STOPWORDS.has(word))
            .sort()
            .slice(0, 8)
            .join('_');
        return `${type}:${significant || 'unspecified'}`.slice(0, 120);
    }
    fingerprint(type, normalizedEvent, at) {
        const day = at.toISOString().slice(0, 10);
        return (0, crypto_1.createHash)('sha256')
            .update(`${type}|${normalizedEvent}|${day}`)
            .digest('hex')
            .slice(0, 64);
    }
};
exports.SignalClassifierService = SignalClassifierService;
exports.SignalClassifierService = SignalClassifierService = __decorate([
    (0, common_1.Injectable)()
], SignalClassifierService);
const STOPWORDS = new Set([
    'that',
    'this',
    'with',
    'have',
    'from',
    'they',
    'been',
    'will',
    'about',
    'there',
    'their',
    'today',
    'tomorrow',
    'just',
    'very',
    'into',
    'what',
    'when',
    'then',
    'than',
    'because',
]);
//# sourceMappingURL=signal-classifier.service.js.map