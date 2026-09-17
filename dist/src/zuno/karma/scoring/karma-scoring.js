"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KARMA_SCORING_V1 = void 0;
exports.assertNonPunitive = assertNonPunitive;
exports.calculateKarmaPoints = calculateKarmaPoints;
exports.requiresUserConfirmation = requiresUserConfirmation;
exports.withConfidenceFloor = withConfidenceFloor;
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const karma_enum_1 = require("../enums/karma.enum");
const neutrality_1 = require("../neutrality");
exports.KARMA_SCORING_V1 = {
    version: '1.0',
    maxPointsPerEntry: 10,
    minPointsPerEntry: 0,
    dailySoftCap: 30,
    negativeScoringEnabled: false,
    baseValue: 5,
    intentWeight: {
        [karma_enum_1.KarmaIntent.SUPPORT]: 1.1,
        [karma_enum_1.KarmaIntent.RESPONSIBILITY]: 1.1,
        [karma_enum_1.KarmaIntent.REPAIR]: 1.2,
        [karma_enum_1.KarmaIntent.GROWTH]: 1.05,
        [karma_enum_1.KarmaIntent.FOLLOW_THROUGH]: 1.15,
        [karma_enum_1.KarmaIntent.INTENTIONAL_PRACTICE]: 1.0,
        [karma_enum_1.KarmaIntent.ROUTINE]: 0.9,
        [karma_enum_1.KarmaIntent.UNKNOWN]: 1.0,
    },
    effortWeight: {
        [karma_enum_1.KarmaEffort.LOW]: 0.7,
        [karma_enum_1.KarmaEffort.MEDIUM]: 1.0,
        [karma_enum_1.KarmaEffort.HIGH]: 1.4,
    },
    relevanceWeight: {
        [karma_enum_1.KarmaRelevance.LOW]: 0.8,
        [karma_enum_1.KarmaRelevance.MEDIUM]: 1.0,
        [karma_enum_1.KarmaRelevance.HIGH]: 1.2,
    },
    repetitionCurve: [1.0, 1.0, 0.85, 0.7, 0.6, 0.5],
    repetitionWindowDays: 7,
    classificationFactor: {
        [karma_enum_1.KarmaClassification.CONSTRUCTIVE]: 1.0,
        [karma_enum_1.KarmaClassification.MIXED]: 0.5,
        [karma_enum_1.KarmaClassification.NEUTRAL]: 0,
        [karma_enum_1.KarmaClassification.UNCERTAIN]: 0,
        [karma_enum_1.KarmaClassification.UNCONSTRUCTIVE]: 0,
    },
    autoConfirmConfidence: 0.75,
    uncertainBelowConfidence: 0.45,
};
function assertNonPunitive(config, points) {
    if (config.negativeScoringEnabled) {
        throw zuno_exception_1.ZunoException.internal('karma negative scoring is disabled by Step 17 section 19 and requires Product, Safety, Behavioural Design and SME Governance approval');
    }
    if (points < 0) {
        throw zuno_exception_1.ZunoException.internal('karma scoring produced a negative value, which Step 17 Rule 4 forbids');
    }
}
function calculateKarmaPoints(observation, config = exports.KARMA_SCORING_V1) {
    assertNonPunitive(config, 0);
    const classificationFactor = config.classificationFactor[observation.classification] ?? 0;
    const intent = config.intentWeight[observation.intent] ?? 1;
    const effort = config.effortWeight[observation.effort] ?? 1;
    const relevance = config.relevanceWeight[observation.relevance] ?? 1;
    const repetition = repetitionMultiplier(observation.priorInCategoryInWindow, config);
    const raw = config.baseValue * intent * effort * relevance * repetition * classificationFactor;
    let points = Math.round(raw);
    points = Math.min(config.maxPointsPerEntry, Math.max(config.minPointsPerEntry, points));
    const remainingToday = Math.max(0, config.dailySoftCap - observation.pointsRecordedToday);
    const softCapApplied = points > remainingToday;
    if (softCapApplied) {
        points = remainingToday;
    }
    assertNonPunitive(config, points);
    const factors = [
        { factor: 'BASE', value: config.baseValue },
        { factor: `CLASSIFICATION:${observation.classification}`, value: classificationFactor },
        { factor: `INTENT:${observation.intent}`, value: intent },
        { factor: `EFFORT:${observation.effort}`, value: effort },
        { factor: `RELEVANCE:${observation.relevance}`, value: relevance },
        { factor: 'CONSISTENCY', value: repetition },
    ];
    if (softCapApplied) {
        factors.push({ factor: 'DAILY_SOFT_CAP', value: config.dailySoftCap });
    }
    return {
        points,
        scoringModelVersion: config.version,
        factors,
        softCapApplied,
        explanation: explain(points, observation, softCapApplied),
    };
}
function repetitionMultiplier(prior, config) {
    const curve = config.repetitionCurve;
    if (curve.length === 0)
        return 1;
    const index = Math.max(0, Math.min(prior, curve.length - 1));
    return curve[index];
}
function explain(points, observation, softCapApplied) {
    if (points === 0) {
        if (softCapApplied) {
            return 'Recorded in your ledger. You have already logged a full day of progress, so no further points were added.';
        }
        if (observation.classification === karma_enum_1.KarmaClassification.UNCERTAIN) {
            return 'Recorded in your ledger. There was not enough context to read it either way, so it is noted without points.';
        }
        if (observation.classification === karma_enum_1.KarmaClassification.UNCONSTRUCTIVE) {
            return 'Recorded in your ledger as something to reflect on. Nothing was added or taken away.';
        }
        return 'Recorded in your ledger. This one is noted without points.';
    }
    const reasons = [];
    if (observation.effort === karma_enum_1.KarmaEffort.HIGH) {
        reasons.push('it took real effort');
    }
    if (observation.relevance === karma_enum_1.KarmaRelevance.HIGH) {
        reasons.push('it moved something you said matters to you');
    }
    if (observation.intent === karma_enum_1.KarmaIntent.REPAIR) {
        reasons.push('it was a step towards putting something right');
    }
    if (observation.intent === karma_enum_1.KarmaIntent.FOLLOW_THROUGH) {
        reasons.push('you followed through on something you had committed to');
    }
    if (reasons.length === 0) {
        reasons.push('you recorded it and completed it');
    }
    const tail = observation.priorInCategoryInWindow >= 2
        ? ' You have been steady on this one recently, so repeats count for a little less.'
        : '';
    return `${points} ${neutrality_1.KARMA_POINTS_LABEL} because ${joinReasons(reasons)}.${tail}`;
}
function joinReasons(reasons) {
    if (reasons.length === 1)
        return reasons[0];
    return `${reasons.slice(0, -1).join(', ')} and ${reasons[reasons.length - 1]}`;
}
function requiresUserConfirmation(confidence, config = exports.KARMA_SCORING_V1) {
    return confidence < config.autoConfirmConfidence;
}
function withConfidenceFloor(classification, confidence, config = exports.KARMA_SCORING_V1) {
    if (confidence < config.uncertainBelowConfidence) {
        return karma_enum_1.KarmaClassification.UNCERTAIN;
    }
    return classification;
}
//# sourceMappingURL=karma-scoring.js.map