"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIFE_SIGNAL_AGGREGATE = exports.SIGNAL_EVENT_TYPES = exports.TREND_MIN_OBSERVATIONS = exports.DEFAULT_SIGNAL_FRESHNESS_DAYS = exports.NON_DECAYING_SIGNAL_TYPES = exports.SignalImpactEntityType = exports.SignalImpactType = exports.RealignmentReasonCode = exports.UrgencyChange = exports.SignalTrendDirection = exports.SignalPatternType = exports.SignalConfirmationActor = exports.CONFIRMED_SIGNAL_STATUSES = exports.SignalConfirmationStatus = exports.LIFE_SIGNAL_STATUS_TRANSITIONS = exports.LifeSignalStatus = exports.LifeSignalRelevance = exports.MATERIALITY_RANK = exports.LifeSignalMateriality = exports.INFERRED_RELIABILITIES = exports.LifeSignalReliability = exports.LifeSignalNature = exports.LifeSignalType = exports.LifeSignalOrigin = exports.ACCEPTED_LIFE_SIGNAL_SOURCES = exports.LifeSignalSource = void 0;
exports.canTransitionLifeSignal = canTransitionLifeSignal;
exports.isConfirmedSignal = isConfirmedSignal;
var LifeSignalSource;
(function (LifeSignalSource) {
    LifeSignalSource["USER_EXPLICIT"] = "USER_EXPLICIT";
    LifeSignalSource["PLAN_EVENT"] = "PLAN_EVENT";
    LifeSignalSource["KARMA_LEDGER"] = "KARMA_LEDGER";
    LifeSignalSource["SYSTEM_DERIVED"] = "SYSTEM_DERIVED";
    LifeSignalSource["EXTERNAL_SOURCE"] = "EXTERNAL_SOURCE";
    LifeSignalSource["ADMIN"] = "ADMIN";
})(LifeSignalSource || (exports.LifeSignalSource = LifeSignalSource = {}));
exports.ACCEPTED_LIFE_SIGNAL_SOURCES = [
    LifeSignalSource.USER_EXPLICIT,
    LifeSignalSource.PLAN_EVENT,
    LifeSignalSource.KARMA_LEDGER,
    LifeSignalSource.SYSTEM_DERIVED,
    LifeSignalSource.ADMIN,
];
var LifeSignalOrigin;
(function (LifeSignalOrigin) {
    LifeSignalOrigin["USER_MESSAGE"] = "USER_MESSAGE";
    LifeSignalOrigin["USER_CHECK_IN"] = "USER_CHECK_IN";
    LifeSignalOrigin["USER_ACTION"] = "USER_ACTION";
    LifeSignalOrigin["PLAN_PROGRESS"] = "PLAN_PROGRESS";
    LifeSignalOrigin["KARMA_LEDGER"] = "KARMA_LEDGER";
    LifeSignalOrigin["SCENARIO_UPDATE"] = "SCENARIO_UPDATE";
    LifeSignalOrigin["PROFILE_CHANGE"] = "PROFILE_CHANGE";
    LifeSignalOrigin["TIME_EVENT"] = "TIME_EVENT";
    LifeSignalOrigin["SYSTEM_EVENT"] = "SYSTEM_EVENT";
    LifeSignalOrigin["NOTIFICATION_RESPONSE"] = "NOTIFICATION_RESPONSE";
    LifeSignalOrigin["CONNECTED_DATA_SOURCE"] = "CONNECTED_DATA_SOURCE";
    LifeSignalOrigin["ADMIN_CONFIG"] = "ADMIN_CONFIG";
})(LifeSignalOrigin || (exports.LifeSignalOrigin = LifeSignalOrigin = {}));
var LifeSignalType;
(function (LifeSignalType) {
    LifeSignalType["STATUS_CHANGE"] = "STATUS_CHANGE";
    LifeSignalType["EXTERNAL_EVENT"] = "EXTERNAL_EVENT";
    LifeSignalType["OPPORTUNITY"] = "OPPORTUNITY";
    LifeSignalType["SETBACK"] = "SETBACK";
    LifeSignalType["DECISION"] = "DECISION";
    LifeSignalType["DEADLINE"] = "DEADLINE";
    LifeSignalType["FINANCIAL_CHANGE"] = "FINANCIAL_CHANGE";
    LifeSignalType["CAREER_EVENT"] = "CAREER_EVENT";
    LifeSignalType["RELATIONSHIP_EVENT"] = "RELATIONSHIP_EVENT";
    LifeSignalType["EDUCATION_EVENT"] = "EDUCATION_EVENT";
    LifeSignalType["BUSINESS_EVENT"] = "BUSINESS_EVENT";
    LifeSignalType["FAMILY_EVENT"] = "FAMILY_EVENT";
    LifeSignalType["PROPERTY_EVENT"] = "PROPERTY_EVENT";
    LifeSignalType["LEGAL_EVENT"] = "LEGAL_EVENT";
    LifeSignalType["LOCATION_EVENT"] = "LOCATION_EVENT";
    LifeSignalType["WELLBEING_SIGNAL"] = "WELLBEING_SIGNAL";
    LifeSignalType["PLAN_PROGRESS"] = "PLAN_PROGRESS";
    LifeSignalType["PLAN_BLOCKER"] = "PLAN_BLOCKER";
    LifeSignalType["PREFERENCE_CHANGE"] = "PREFERENCE_CHANGE";
    LifeSignalType["GOAL_CHANGE"] = "GOAL_CHANGE";
    LifeSignalType["RISK_CHANGE"] = "RISK_CHANGE";
    LifeSignalType["TIME_SIGNAL"] = "TIME_SIGNAL";
    LifeSignalType["ASTRO_TIMING_CHANGE"] = "ASTRO_TIMING_CHANGE";
    LifeSignalType["OTHER"] = "OTHER";
})(LifeSignalType || (exports.LifeSignalType = LifeSignalType = {}));
var LifeSignalNature;
(function (LifeSignalNature) {
    LifeSignalNature["EVENT"] = "EVENT";
    LifeSignalNature["STATE"] = "STATE";
})(LifeSignalNature || (exports.LifeSignalNature = LifeSignalNature = {}));
var LifeSignalReliability;
(function (LifeSignalReliability) {
    LifeSignalReliability["USER_REPORTED"] = "USER_REPORTED";
    LifeSignalReliability["USER_CONFIRMED"] = "USER_CONFIRMED";
    LifeSignalReliability["SYSTEM_OBSERVED"] = "SYSTEM_OBSERVED";
    LifeSignalReliability["CONNECTED_SOURCE"] = "CONNECTED_SOURCE";
    LifeSignalReliability["ADMIN_CONFIRMED"] = "ADMIN_CONFIRMED";
    LifeSignalReliability["INFERRED"] = "INFERRED";
    LifeSignalReliability["UNVERIFIED"] = "UNVERIFIED";
})(LifeSignalReliability || (exports.LifeSignalReliability = LifeSignalReliability = {}));
exports.INFERRED_RELIABILITIES = [
    LifeSignalReliability.INFERRED,
    LifeSignalReliability.UNVERIFIED,
];
var LifeSignalMateriality;
(function (LifeSignalMateriality) {
    LifeSignalMateriality["LOW"] = "LOW";
    LifeSignalMateriality["MEDIUM"] = "MEDIUM";
    LifeSignalMateriality["HIGH"] = "HIGH";
    LifeSignalMateriality["CRITICAL"] = "CRITICAL";
})(LifeSignalMateriality || (exports.LifeSignalMateriality = LifeSignalMateriality = {}));
exports.MATERIALITY_RANK = {
    [LifeSignalMateriality.LOW]: 0,
    [LifeSignalMateriality.MEDIUM]: 1,
    [LifeSignalMateriality.HIGH]: 2,
    [LifeSignalMateriality.CRITICAL]: 3,
};
var LifeSignalRelevance;
(function (LifeSignalRelevance) {
    LifeSignalRelevance["DIRECT"] = "DIRECT";
    LifeSignalRelevance["INDIRECT"] = "INDIRECT";
    LifeSignalRelevance["UNRELATED"] = "UNRELATED";
    LifeSignalRelevance["UNCERTAIN"] = "UNCERTAIN";
})(LifeSignalRelevance || (exports.LifeSignalRelevance = LifeSignalRelevance = {}));
var LifeSignalStatus;
(function (LifeSignalStatus) {
    LifeSignalStatus["CANDIDATE"] = "CANDIDATE";
    LifeSignalStatus["ACTIVE"] = "ACTIVE";
    LifeSignalStatus["SUPERSEDED"] = "SUPERSEDED";
    LifeSignalStatus["STALE"] = "STALE";
    LifeSignalStatus["DISMISSED"] = "DISMISSED";
    LifeSignalStatus["RESOLVED"] = "RESOLVED";
    LifeSignalStatus["ARCHIVED"] = "ARCHIVED";
})(LifeSignalStatus || (exports.LifeSignalStatus = LifeSignalStatus = {}));
exports.LIFE_SIGNAL_STATUS_TRANSITIONS = {
    [LifeSignalStatus.CANDIDATE]: [
        LifeSignalStatus.ACTIVE,
        LifeSignalStatus.DISMISSED,
        LifeSignalStatus.STALE,
        LifeSignalStatus.ARCHIVED,
    ],
    [LifeSignalStatus.ACTIVE]: [
        LifeSignalStatus.SUPERSEDED,
        LifeSignalStatus.STALE,
        LifeSignalStatus.RESOLVED,
        LifeSignalStatus.DISMISSED,
        LifeSignalStatus.ARCHIVED,
    ],
    [LifeSignalStatus.SUPERSEDED]: [LifeSignalStatus.ARCHIVED],
    [LifeSignalStatus.STALE]: [LifeSignalStatus.ACTIVE, LifeSignalStatus.ARCHIVED],
    [LifeSignalStatus.DISMISSED]: [LifeSignalStatus.ARCHIVED],
    [LifeSignalStatus.RESOLVED]: [LifeSignalStatus.ARCHIVED],
    [LifeSignalStatus.ARCHIVED]: [],
};
function canTransitionLifeSignal(from, to) {
    return (exports.LIFE_SIGNAL_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
var SignalConfirmationStatus;
(function (SignalConfirmationStatus) {
    SignalConfirmationStatus["UNCONFIRMED"] = "UNCONFIRMED";
    SignalConfirmationStatus["AWAITING_USER_CONFIRMATION"] = "AWAITING_USER_CONFIRMATION";
    SignalConfirmationStatus["CONFIRMED_USER_REPORTED"] = "CONFIRMED_USER_REPORTED";
    SignalConfirmationStatus["CONFIRMED_SYSTEM_OBSERVED"] = "CONFIRMED_SYSTEM_OBSERVED";
    SignalConfirmationStatus["CONFIRMED_ADMIN"] = "CONFIRMED_ADMIN";
    SignalConfirmationStatus["REJECTED"] = "REJECTED";
})(SignalConfirmationStatus || (exports.SignalConfirmationStatus = SignalConfirmationStatus = {}));
exports.CONFIRMED_SIGNAL_STATUSES = [
    SignalConfirmationStatus.CONFIRMED_USER_REPORTED,
    SignalConfirmationStatus.CONFIRMED_SYSTEM_OBSERVED,
    SignalConfirmationStatus.CONFIRMED_ADMIN,
];
function isConfirmedSignal(status) {
    return exports.CONFIRMED_SIGNAL_STATUSES.includes(status);
}
var SignalConfirmationActor;
(function (SignalConfirmationActor) {
    SignalConfirmationActor["USER"] = "USER";
    SignalConfirmationActor["SYSTEM"] = "SYSTEM";
    SignalConfirmationActor["ADMIN"] = "ADMIN";
})(SignalConfirmationActor || (exports.SignalConfirmationActor = SignalConfirmationActor = {}));
var SignalPatternType;
(function (SignalPatternType) {
    SignalPatternType["SINGLE_EVENT"] = "SINGLE_EVENT";
    SignalPatternType["REPEATED_PATTERN"] = "REPEATED_PATTERN";
    SignalPatternType["TREND"] = "TREND";
    SignalPatternType["REVERSAL"] = "REVERSAL";
    SignalPatternType["MILESTONE"] = "MILESTONE";
})(SignalPatternType || (exports.SignalPatternType = SignalPatternType = {}));
var SignalTrendDirection;
(function (SignalTrendDirection) {
    SignalTrendDirection["IMPROVING"] = "IMPROVING";
    SignalTrendDirection["STEADY"] = "STEADY";
    SignalTrendDirection["DECLINING"] = "DECLINING";
    SignalTrendDirection["MIXED"] = "MIXED";
    SignalTrendDirection["INSUFFICIENT_EVIDENCE"] = "INSUFFICIENT_EVIDENCE";
})(SignalTrendDirection || (exports.SignalTrendDirection = SignalTrendDirection = {}));
var UrgencyChange;
(function (UrgencyChange) {
    UrgencyChange["INCREASE"] = "INCREASE";
    UrgencyChange["DECREASE"] = "DECREASE";
    UrgencyChange["NONE"] = "NONE";
})(UrgencyChange || (exports.UrgencyChange = UrgencyChange = {}));
var RealignmentReasonCode;
(function (RealignmentReasonCode) {
    RealignmentReasonCode["NEW_FACT"] = "NEW_FACT";
    RealignmentReasonCode["FACT_CORRECTED"] = "FACT_CORRECTED";
    RealignmentReasonCode["SCENARIO_TRIGGERED"] = "SCENARIO_TRIGGERED";
    RealignmentReasonCode["SCENARIO_RELEVANCE_CHANGED"] = "SCENARIO_RELEVANCE_CHANGED";
    RealignmentReasonCode["NEW_SCENARIO"] = "NEW_SCENARIO";
    RealignmentReasonCode["SCENARIO_DISMISSED"] = "SCENARIO_DISMISSED";
    RealignmentReasonCode["DEPENDENCY_CHANGED"] = "DEPENDENCY_CHANGED";
    RealignmentReasonCode["CONSTRAINT_CHANGED"] = "CONSTRAINT_CHANGED";
    RealignmentReasonCode["GOAL_CHANGED"] = "GOAL_CHANGED";
    RealignmentReasonCode["PREFERENCE_CHANGED"] = "PREFERENCE_CHANGED";
    RealignmentReasonCode["PLAN_BLOCKED"] = "PLAN_BLOCKED";
    RealignmentReasonCode["PLAN_INEFFECTIVE"] = "PLAN_INEFFECTIVE";
    RealignmentReasonCode["PLAN_TOO_COMPLEX"] = "PLAN_TOO_COMPLEX";
    RealignmentReasonCode["PLAN_COMPLETED"] = "PLAN_COMPLETED";
    RealignmentReasonCode["URGENCY_INCREASED"] = "URGENCY_INCREASED";
    RealignmentReasonCode["URGENCY_DECREASED"] = "URGENCY_DECREASED";
    RealignmentReasonCode["RISK_CHANGED"] = "RISK_CHANGED";
    RealignmentReasonCode["OPPORTUNITY_APPEARED"] = "OPPORTUNITY_APPEARED";
    RealignmentReasonCode["OPPORTUNITY_DISAPPEARED"] = "OPPORTUNITY_DISAPPEARED";
    RealignmentReasonCode["TIME_WINDOW_CHANGED"] = "TIME_WINDOW_CHANGED";
    RealignmentReasonCode["ASTRO_TIMING_CHANGED"] = "ASTRO_TIMING_CHANGED";
    RealignmentReasonCode["SAFETY_CHANGED"] = "SAFETY_CHANGED";
    RealignmentReasonCode["USER_REQUESTED_REASSESSMENT"] = "USER_REQUESTED_REASSESSMENT";
    RealignmentReasonCode["RULEBOOK_REASSESSMENT"] = "RULEBOOK_REASSESSMENT";
    RealignmentReasonCode["PRIMARY_STRATEGY_INVALIDATED"] = "PRIMARY_STRATEGY_INVALIDATED";
})(RealignmentReasonCode || (exports.RealignmentReasonCode = RealignmentReasonCode = {}));
var SignalImpactType;
(function (SignalImpactType) {
    SignalImpactType["SUPPORTS"] = "SUPPORTS";
    SignalImpactType["CONTRADICTS"] = "CONTRADICTS";
    SignalImpactType["INVALIDATES"] = "INVALIDATES";
    SignalImpactType["INTRODUCES"] = "INTRODUCES";
    SignalImpactType["PROGRESSES"] = "PROGRESSES";
    SignalImpactType["BLOCKS"] = "BLOCKS";
})(SignalImpactType || (exports.SignalImpactType = SignalImpactType = {}));
var SignalImpactEntityType;
(function (SignalImpactEntityType) {
    SignalImpactEntityType["CHALLENGE"] = "CHALLENGE";
    SignalImpactEntityType["CHALLENGE_CONTEXT"] = "CHALLENGE_CONTEXT";
    SignalImpactEntityType["SCENARIO"] = "SCENARIO";
    SignalImpactEntityType["PLAN"] = "PLAN";
    SignalImpactEntityType["PLAN_ITEM"] = "PLAN_ITEM";
    SignalImpactEntityType["MKA_PROGRAM"] = "MKA_PROGRAM";
    SignalImpactEntityType["ASSUMPTION"] = "ASSUMPTION";
})(SignalImpactEntityType || (exports.SignalImpactEntityType = SignalImpactEntityType = {}));
exports.NON_DECAYING_SIGNAL_TYPES = [
    LifeSignalType.STATUS_CHANGE,
    LifeSignalType.DECISION,
    LifeSignalType.GOAL_CHANGE,
    LifeSignalType.PREFERENCE_CHANGE,
    LifeSignalType.LOCATION_EVENT,
    LifeSignalType.LEGAL_EVENT,
];
exports.DEFAULT_SIGNAL_FRESHNESS_DAYS = 45;
exports.TREND_MIN_OBSERVATIONS = 3;
exports.SIGNAL_EVENT_TYPES = {
    LIFE_SIGNAL_DETECTED: 'zuno.life_signal.detected',
    LIFE_SIGNAL_VALIDATED: 'zuno.life_signal.validated',
    LIFE_SIGNAL_MATERIAL: 'zuno.life_signal.material',
    LIFE_SIGNAL_CONFIRMED: 'zuno.life_signal.confirmed',
    LIFE_SIGNAL_REJECTED: 'zuno.life_signal.rejected',
    LIFE_SIGNAL_SUPERSEDED: 'zuno.life_signal.superseded',
    LIFE_SIGNAL_STALE: 'zuno.life_signal.stale',
    REALIGNMENT_REQUESTED: 'zuno.realignment.requested',
};
exports.LIFE_SIGNAL_AGGREGATE = 'LIFE_SIGNAL';
//# sourceMappingURL=signal.enum.js.map