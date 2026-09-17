"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REALIGNMENT_AGGREGATE = exports.REALIGNMENT_EVENT_TYPES = exports.PLAN_PATCH_MAX_CHANGED_COMPONENTS = exports.PlanChangeMode = exports.AssumptionStatus = exports.RealignmentTrigger = exports.RealignmentEntityType = exports.RealignmentChangeType = exports.REALIGNMENT_STATUS_TRANSITIONS = exports.RealignmentStatus = exports.RealignmentScope = exports.REALIGNMENT_LEVEL_RANK = exports.RealignmentLevel = void 0;
exports.canTransitionRealignment = canTransitionRealignment;
var RealignmentLevel;
(function (RealignmentLevel) {
    RealignmentLevel["NONE"] = "NONE";
    RealignmentLevel["MICRO"] = "MICRO";
    RealignmentLevel["PARTIAL"] = "PARTIAL";
    RealignmentLevel["MAJOR"] = "MAJOR";
    RealignmentLevel["CRITICAL"] = "CRITICAL";
})(RealignmentLevel || (exports.RealignmentLevel = RealignmentLevel = {}));
exports.REALIGNMENT_LEVEL_RANK = {
    [RealignmentLevel.NONE]: 0,
    [RealignmentLevel.MICRO]: 1,
    [RealignmentLevel.PARTIAL]: 2,
    [RealignmentLevel.MAJOR]: 3,
    [RealignmentLevel.CRITICAL]: 4,
};
var RealignmentScope;
(function (RealignmentScope) {
    RealignmentScope["TASK"] = "TASK";
    RealignmentScope["DAY"] = "DAY";
    RealignmentScope["WEEK"] = "WEEK";
    RealignmentScope["THIRTY_DAY_PLAN"] = "THIRTY_DAY_PLAN";
    RealignmentScope["SCENARIO"] = "SCENARIO";
    RealignmentScope["GOAL"] = "GOAL";
    RealignmentScope["CHALLENGE"] = "CHALLENGE";
    RealignmentScope["MULTI_CHALLENGE"] = "MULTI_CHALLENGE";
})(RealignmentScope || (exports.RealignmentScope = RealignmentScope = {}));
var RealignmentStatus;
(function (RealignmentStatus) {
    RealignmentStatus["PENDING"] = "PENDING";
    RealignmentStatus["EVALUATED"] = "EVALUATED";
    RealignmentStatus["AWAITING_USER_CONFIRMATION"] = "AWAITING_USER_CONFIRMATION";
    RealignmentStatus["APPLIED"] = "APPLIED";
    RealignmentStatus["SUPERSEDED"] = "SUPERSEDED";
    RealignmentStatus["CANCELLED"] = "CANCELLED";
    RealignmentStatus["FAILED"] = "FAILED";
})(RealignmentStatus || (exports.RealignmentStatus = RealignmentStatus = {}));
exports.REALIGNMENT_STATUS_TRANSITIONS = {
    [RealignmentStatus.PENDING]: [
        RealignmentStatus.EVALUATED,
        RealignmentStatus.SUPERSEDED,
        RealignmentStatus.CANCELLED,
        RealignmentStatus.FAILED,
    ],
    [RealignmentStatus.EVALUATED]: [
        RealignmentStatus.AWAITING_USER_CONFIRMATION,
        RealignmentStatus.APPLIED,
        RealignmentStatus.SUPERSEDED,
        RealignmentStatus.CANCELLED,
    ],
    [RealignmentStatus.AWAITING_USER_CONFIRMATION]: [
        RealignmentStatus.APPLIED,
        RealignmentStatus.CANCELLED,
        RealignmentStatus.SUPERSEDED,
    ],
    [RealignmentStatus.APPLIED]: [RealignmentStatus.SUPERSEDED],
    [RealignmentStatus.SUPERSEDED]: [],
    [RealignmentStatus.CANCELLED]: [],
    [RealignmentStatus.FAILED]: [RealignmentStatus.EVALUATED],
};
function canTransitionRealignment(from, to) {
    return (exports.REALIGNMENT_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
var RealignmentChangeType;
(function (RealignmentChangeType) {
    RealignmentChangeType["PRESERVE"] = "PRESERVE";
    RealignmentChangeType["MODIFY"] = "MODIFY";
    RealignmentChangeType["REMOVE"] = "REMOVE";
    RealignmentChangeType["ADD"] = "ADD";
    RealignmentChangeType["PLAN_REPLACED"] = "PLAN_REPLACED";
    RealignmentChangeType["PLAN_PATCHED"] = "PLAN_PATCHED";
    RealignmentChangeType["MKA_SUPERSEDED"] = "MKA_SUPERSEDED";
    RealignmentChangeType["REMINDERS_SUPPRESSED"] = "REMINDERS_SUPPRESSED";
    RealignmentChangeType["ITEMS_CANCELLED"] = "ITEMS_CANCELLED";
})(RealignmentChangeType || (exports.RealignmentChangeType = RealignmentChangeType = {}));
var RealignmentEntityType;
(function (RealignmentEntityType) {
    RealignmentEntityType["PLAN"] = "PLAN";
    RealignmentEntityType["PLAN_ITEM"] = "PLAN_ITEM";
    RealignmentEntityType["MKA_PROGRAM"] = "MKA_PROGRAM";
    RealignmentEntityType["REMINDER"] = "REMINDER";
    RealignmentEntityType["SCENARIO"] = "SCENARIO";
    RealignmentEntityType["CHALLENGE"] = "CHALLENGE";
    RealignmentEntityType["ASSUMPTION"] = "ASSUMPTION";
})(RealignmentEntityType || (exports.RealignmentEntityType = RealignmentEntityType = {}));
var RealignmentTrigger;
(function (RealignmentTrigger) {
    RealignmentTrigger["LIFE_SIGNAL"] = "LIFE_SIGNAL";
    RealignmentTrigger["USER_REQUEST"] = "USER_REQUEST";
    RealignmentTrigger["SCENARIO_TRIGGER"] = "SCENARIO_TRIGGER";
    RealignmentTrigger["TIME_EVENT"] = "TIME_EVENT";
    RealignmentTrigger["PLAN_FAILURE_PATTERN"] = "PLAN_FAILURE_PATTERN";
    RealignmentTrigger["SAFETY_CHANGE"] = "SAFETY_CHANGE";
    RealignmentTrigger["RULEBOOK_REASSESSMENT"] = "RULEBOOK_REASSESSMENT";
    RealignmentTrigger["CHALLENGE_CONTEXT_UPDATE"] = "CHALLENGE_CONTEXT_UPDATE";
})(RealignmentTrigger || (exports.RealignmentTrigger = RealignmentTrigger = {}));
var AssumptionStatus;
(function (AssumptionStatus) {
    AssumptionStatus["HOLDS"] = "HOLDS";
    AssumptionStatus["UNCERTAIN"] = "UNCERTAIN";
    AssumptionStatus["INVALIDATED"] = "INVALIDATED";
})(AssumptionStatus || (exports.AssumptionStatus = AssumptionStatus = {}));
var PlanChangeMode;
(function (PlanChangeMode) {
    PlanChangeMode["NONE"] = "NONE";
    PlanChangeMode["PATCH"] = "PATCH";
    PlanChangeMode["REGENERATE"] = "REGENERATE";
})(PlanChangeMode || (exports.PlanChangeMode = PlanChangeMode = {}));
exports.PLAN_PATCH_MAX_CHANGED_COMPONENTS = 3;
exports.REALIGNMENT_EVENT_TYPES = {
    REALIGNMENT_REQUESTED: 'zuno.realignment.requested',
    REALIGNMENT_EVALUATED: 'zuno.realignment.evaluated',
    REALIGNMENT_CONFIRMATION_REQUIRED: 'zuno.realignment.confirmation_required',
    REALIGNMENT_APPLIED: 'zuno.realignment.applied',
    REALIGNMENT_COMPLETED: 'zuno.realignment.completed',
    REALIGNMENT_FAILED: 'zuno.realignment.failed',
};
exports.REALIGNMENT_AGGREGATE = 'REALIGNMENT';
//# sourceMappingURL=realignment.enum.js.map