"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarmaIngestResult = exports.KarmaRevisionActor = exports.KarmaRescorePolicy = exports.KarmaScoreConfigStatus = exports.KarmaPatternStatus = exports.KarmaPatternType = exports.NON_PENALISING_OUTCOMES = exports.KarmaActionOutcome = exports.KarmaRelevance = exports.KarmaEffort = exports.KarmaVisibility = exports.KarmaEntryStatus = exports.KarmaImpactScope = exports.KarmaIntent = exports.KARMA_CATEGORIES = exports.KarmaCategory = exports.SYSTEM_SOURCED_CLASSIFICATIONS = exports.KARMA_CLASSIFICATIONS = exports.KarmaClassification = exports.SYSTEM_KARMA_SOURCES = exports.KarmaEntrySource = void 0;
var KarmaEntrySource;
(function (KarmaEntrySource) {
    KarmaEntrySource["USER_CREATED"] = "USER_CREATED";
    KarmaEntrySource["PLAN_COMPLETION"] = "PLAN_COMPLETION";
    KarmaEntrySource["MKA_COMPLETION"] = "MKA_COMPLETION";
    KarmaEntrySource["USER_REFLECTION"] = "USER_REFLECTION";
    KarmaEntrySource["CONSTRUCTIVE_HABIT"] = "CONSTRUCTIVE_HABIT";
    KarmaEntrySource["SERVICE"] = "SERVICE";
    KarmaEntrySource["GRATITUDE"] = "GRATITUDE";
    KarmaEntrySource["RESPONSIBILITY"] = "RESPONSIBILITY";
    KarmaEntrySource["RELATIONSHIP_ACTION"] = "RELATIONSHIP_ACTION";
    KarmaEntrySource["CAREER_ACTION"] = "CAREER_ACTION";
    KarmaEntrySource["LEARNING_ACTION"] = "LEARNING_ACTION";
    KarmaEntrySource["SELF_DISCIPLINE"] = "SELF_DISCIPLINE";
    KarmaEntrySource["REPAIR_ACTION"] = "REPAIR_ACTION";
    KarmaEntrySource["OTHER"] = "OTHER";
})(KarmaEntrySource || (exports.KarmaEntrySource = KarmaEntrySource = {}));
exports.SYSTEM_KARMA_SOURCES = [
    KarmaEntrySource.PLAN_COMPLETION,
    KarmaEntrySource.MKA_COMPLETION,
];
var KarmaClassification;
(function (KarmaClassification) {
    KarmaClassification["CONSTRUCTIVE"] = "CONSTRUCTIVE";
    KarmaClassification["UNCONSTRUCTIVE"] = "UNCONSTRUCTIVE";
    KarmaClassification["NEUTRAL"] = "NEUTRAL";
    KarmaClassification["MIXED"] = "MIXED";
    KarmaClassification["UNCERTAIN"] = "UNCERTAIN";
})(KarmaClassification || (exports.KarmaClassification = KarmaClassification = {}));
exports.KARMA_CLASSIFICATIONS = Object.values(KarmaClassification);
exports.SYSTEM_SOURCED_CLASSIFICATIONS = [
    KarmaClassification.CONSTRUCTIVE,
    KarmaClassification.NEUTRAL,
    KarmaClassification.MIXED,
    KarmaClassification.UNCERTAIN,
];
var KarmaCategory;
(function (KarmaCategory) {
    KarmaCategory["SELF_DISCIPLINE"] = "SELF_DISCIPLINE";
    KarmaCategory["SERVICE"] = "SERVICE";
    KarmaCategory["GRATITUDE"] = "GRATITUDE";
    KarmaCategory["RESPONSIBILITY"] = "RESPONSIBILITY";
    KarmaCategory["CAREER"] = "CAREER";
    KarmaCategory["LEARNING"] = "LEARNING";
    KarmaCategory["RELATIONSHIP"] = "RELATIONSHIP";
    KarmaCategory["FAMILY"] = "FAMILY";
    KarmaCategory["FINANCIAL_RESPONSIBILITY"] = "FINANCIAL_RESPONSIBILITY";
    KarmaCategory["HEALTH_SUPPORT"] = "HEALTH_SUPPORT";
    KarmaCategory["COMMUNICATION"] = "COMMUNICATION";
    KarmaCategory["REPAIR"] = "REPAIR";
    KarmaCategory["COURAGE"] = "COURAGE";
    KarmaCategory["CONSISTENCY"] = "CONSISTENCY";
    KarmaCategory["MINDFULNESS"] = "MINDFULNESS";
    KarmaCategory["OTHER"] = "OTHER";
})(KarmaCategory || (exports.KarmaCategory = KarmaCategory = {}));
exports.KARMA_CATEGORIES = Object.values(KarmaCategory);
var KarmaIntent;
(function (KarmaIntent) {
    KarmaIntent["SUPPORT"] = "SUPPORT";
    KarmaIntent["RESPONSIBILITY"] = "RESPONSIBILITY";
    KarmaIntent["REPAIR"] = "REPAIR";
    KarmaIntent["GROWTH"] = "GROWTH";
    KarmaIntent["FOLLOW_THROUGH"] = "FOLLOW_THROUGH";
    KarmaIntent["INTENTIONAL_PRACTICE"] = "INTENTIONAL_PRACTICE";
    KarmaIntent["ROUTINE"] = "ROUTINE";
    KarmaIntent["UNKNOWN"] = "UNKNOWN";
})(KarmaIntent || (exports.KarmaIntent = KarmaIntent = {}));
var KarmaImpactScope;
(function (KarmaImpactScope) {
    KarmaImpactScope["SELF"] = "SELF";
    KarmaImpactScope["OTHER_PERSON"] = "OTHER_PERSON";
    KarmaImpactScope["FAMILY"] = "FAMILY";
    KarmaImpactScope["COMMUNITY"] = "COMMUNITY";
    KarmaImpactScope["WORK"] = "WORK";
    KarmaImpactScope["UNKNOWN"] = "UNKNOWN";
})(KarmaImpactScope || (exports.KarmaImpactScope = KarmaImpactScope = {}));
var KarmaEntryStatus;
(function (KarmaEntryStatus) {
    KarmaEntryStatus["ACTIVE"] = "ACTIVE";
    KarmaEntryStatus["EDITED"] = "EDITED";
    KarmaEntryStatus["DELETED"] = "DELETED";
    KarmaEntryStatus["SUPERSEDED"] = "SUPERSEDED";
})(KarmaEntryStatus || (exports.KarmaEntryStatus = KarmaEntryStatus = {}));
var KarmaVisibility;
(function (KarmaVisibility) {
    KarmaVisibility["PRIVATE"] = "PRIVATE";
})(KarmaVisibility || (exports.KarmaVisibility = KarmaVisibility = {}));
var KarmaEffort;
(function (KarmaEffort) {
    KarmaEffort["LOW"] = "LOW";
    KarmaEffort["MEDIUM"] = "MEDIUM";
    KarmaEffort["HIGH"] = "HIGH";
})(KarmaEffort || (exports.KarmaEffort = KarmaEffort = {}));
var KarmaRelevance;
(function (KarmaRelevance) {
    KarmaRelevance["LOW"] = "LOW";
    KarmaRelevance["MEDIUM"] = "MEDIUM";
    KarmaRelevance["HIGH"] = "HIGH";
})(KarmaRelevance || (exports.KarmaRelevance = KarmaRelevance = {}));
var KarmaActionOutcome;
(function (KarmaActionOutcome) {
    KarmaActionOutcome["COMPLETED"] = "COMPLETED";
    KarmaActionOutcome["MISSED"] = "MISSED";
    KarmaActionOutcome["DEFERRED"] = "DEFERRED";
    KarmaActionOutcome["CANCELLED_BY_REALIGNMENT"] = "CANCELLED_BY_REALIGNMENT";
})(KarmaActionOutcome || (exports.KarmaActionOutcome = KarmaActionOutcome = {}));
exports.NON_PENALISING_OUTCOMES = [
    KarmaActionOutcome.MISSED,
    KarmaActionOutcome.DEFERRED,
    KarmaActionOutcome.CANCELLED_BY_REALIGNMENT,
];
var KarmaPatternType;
(function (KarmaPatternType) {
    KarmaPatternType["FOLLOW_THROUGH_INCREASING"] = "FOLLOW_THROUGH_INCREASING";
    KarmaPatternType["SERVICE_CONSISTENT"] = "SERVICE_CONSISTENT";
    KarmaPatternType["AVOIDANCE_DECREASING"] = "AVOIDANCE_DECREASING";
    KarmaPatternType["REPAIR_BEHAVIOUR_INCREASING"] = "REPAIR_BEHAVIOUR_INCREASING";
    KarmaPatternType["STUDY_DISCIPLINE_IMPROVING"] = "STUDY_DISCIPLINE_IMPROVING";
    KarmaPatternType["CONSISTENCY_STEADY"] = "CONSISTENCY_STEADY";
})(KarmaPatternType || (exports.KarmaPatternType = KarmaPatternType = {}));
var KarmaPatternStatus;
(function (KarmaPatternStatus) {
    KarmaPatternStatus["OBSERVED"] = "OBSERVED";
    KarmaPatternStatus["FADED"] = "FADED";
})(KarmaPatternStatus || (exports.KarmaPatternStatus = KarmaPatternStatus = {}));
var KarmaScoreConfigStatus;
(function (KarmaScoreConfigStatus) {
    KarmaScoreConfigStatus["DRAFT"] = "DRAFT";
    KarmaScoreConfigStatus["ACTIVE"] = "ACTIVE";
    KarmaScoreConfigStatus["RETIRED"] = "RETIRED";
})(KarmaScoreConfigStatus || (exports.KarmaScoreConfigStatus = KarmaScoreConfigStatus = {}));
var KarmaRescorePolicy;
(function (KarmaRescorePolicy) {
    KarmaRescorePolicy["FUTURE_ONLY"] = "FUTURE_ONLY";
    KarmaRescorePolicy["USER_OPT_IN_RECALCULATION"] = "USER_OPT_IN_RECALCULATION";
    KarmaRescorePolicy["ADMIN_MIGRATION_WITH_AUDIT"] = "ADMIN_MIGRATION_WITH_AUDIT";
})(KarmaRescorePolicy || (exports.KarmaRescorePolicy = KarmaRescorePolicy = {}));
var KarmaRevisionActor;
(function (KarmaRevisionActor) {
    KarmaRevisionActor["USER"] = "USER";
    KarmaRevisionActor["SYSTEM"] = "SYSTEM";
})(KarmaRevisionActor || (exports.KarmaRevisionActor = KarmaRevisionActor = {}));
var KarmaIngestResult;
(function (KarmaIngestResult) {
    KarmaIngestResult["RECORDED"] = "RECORDED";
    KarmaIngestResult["DUPLICATE"] = "DUPLICATE";
    KarmaIngestResult["NOT_ELIGIBLE"] = "NOT_ELIGIBLE";
    KarmaIngestResult["NO_PENALTY"] = "NO_PENALTY";
    KarmaIngestResult["INTERPRETATION_UNAVAILABLE"] = "INTERPRETATION_UNAVAILABLE";
    KarmaIngestResult["SAFETY_ROUTED"] = "SAFETY_ROUTED";
    KarmaIngestResult["INVALID_EVENT"] = "INVALID_EVENT";
})(KarmaIngestResult || (exports.KarmaIngestResult = KarmaIngestResult = {}));
//# sourceMappingURL=karma.enum.js.map