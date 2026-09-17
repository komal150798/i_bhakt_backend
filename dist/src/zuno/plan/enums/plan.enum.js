"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_ENGINE_VERSION = exports.PlanReviewTrigger = exports.PlanItemEventSource = exports.PlanItemEventType = exports.PlanItemRealignmentPolicy = exports.PlanItemScenarioScope = exports.PLAN_ITEM_PRIORITY_RANK = exports.PlanItemPriority = exports.PlanItemSource = exports.PlanItemCategory = exports.CAPACITY_CONSUMING_STATUSES = exports.PLAN_ITEM_STATUS_TRANSITIONS = exports.PlanItemStatus = exports.PLAN_STATUS_TRANSITIONS = exports.PlanStatus = exports.PlanType = void 0;
exports.canTransitionPlan = canTransitionPlan;
exports.canTransitionPlanItem = canTransitionPlanItem;
var PlanType;
(function (PlanType) {
    PlanType["TODAY"] = "TODAY";
    PlanType["WEEKLY"] = "WEEKLY";
    PlanType["THIRTY_DAY"] = "THIRTY_DAY";
    PlanType["LONG_TERM"] = "LONG_TERM";
    PlanType["CUSTOM"] = "CUSTOM";
})(PlanType || (exports.PlanType = PlanType = {}));
var PlanStatus;
(function (PlanStatus) {
    PlanStatus["DRAFT"] = "DRAFT";
    PlanStatus["ACTIVE"] = "ACTIVE";
    PlanStatus["PAUSED"] = "PAUSED";
    PlanStatus["COMPLETED"] = "COMPLETED";
    PlanStatus["SUPERSEDED"] = "SUPERSEDED";
    PlanStatus["CANCELLED"] = "CANCELLED";
    PlanStatus["ARCHIVED"] = "ARCHIVED";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
exports.PLAN_STATUS_TRANSITIONS = {
    [PlanStatus.DRAFT]: [
        PlanStatus.ACTIVE,
        PlanStatus.CANCELLED,
        PlanStatus.SUPERSEDED,
    ],
    [PlanStatus.ACTIVE]: [
        PlanStatus.PAUSED,
        PlanStatus.COMPLETED,
        PlanStatus.SUPERSEDED,
        PlanStatus.CANCELLED,
    ],
    [PlanStatus.PAUSED]: [
        PlanStatus.ACTIVE,
        PlanStatus.SUPERSEDED,
        PlanStatus.CANCELLED,
        PlanStatus.ARCHIVED,
    ],
    [PlanStatus.COMPLETED]: [PlanStatus.ARCHIVED],
    [PlanStatus.SUPERSEDED]: [PlanStatus.ARCHIVED],
    [PlanStatus.CANCELLED]: [PlanStatus.ARCHIVED],
    [PlanStatus.ARCHIVED]: [],
};
function canTransitionPlan(from, to) {
    return (exports.PLAN_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
var PlanItemStatus;
(function (PlanItemStatus) {
    PlanItemStatus["CONDITIONAL"] = "CONDITIONAL";
    PlanItemStatus["PENDING"] = "PENDING";
    PlanItemStatus["IN_PROGRESS"] = "IN_PROGRESS";
    PlanItemStatus["DONE"] = "DONE";
    PlanItemStatus["NOT_DONE"] = "NOT_DONE";
    PlanItemStatus["MISSED"] = "MISSED";
    PlanItemStatus["SKIPPED"] = "SKIPPED";
    PlanItemStatus["DEFERRED"] = "DEFERRED";
    PlanItemStatus["BLOCKED"] = "BLOCKED";
    PlanItemStatus["CANCELLED_BY_USER"] = "CANCELLED_BY_USER";
    PlanItemStatus["CANCELLED_BY_REALIGNMENT"] = "CANCELLED_BY_REALIGNMENT";
    PlanItemStatus["NO_LONGER_RELEVANT"] = "NO_LONGER_RELEVANT";
})(PlanItemStatus || (exports.PlanItemStatus = PlanItemStatus = {}));
exports.PLAN_ITEM_STATUS_TRANSITIONS = {
    [PlanItemStatus.CONDITIONAL]: [
        PlanItemStatus.PENDING,
        PlanItemStatus.CANCELLED_BY_USER,
        PlanItemStatus.CANCELLED_BY_REALIGNMENT,
        PlanItemStatus.NO_LONGER_RELEVANT,
    ],
    [PlanItemStatus.PENDING]: [
        PlanItemStatus.IN_PROGRESS,
        PlanItemStatus.DONE,
        PlanItemStatus.NOT_DONE,
        PlanItemStatus.MISSED,
        PlanItemStatus.SKIPPED,
        PlanItemStatus.DEFERRED,
        PlanItemStatus.BLOCKED,
        PlanItemStatus.CANCELLED_BY_USER,
        PlanItemStatus.CANCELLED_BY_REALIGNMENT,
        PlanItemStatus.NO_LONGER_RELEVANT,
    ],
    [PlanItemStatus.IN_PROGRESS]: [
        PlanItemStatus.DONE,
        PlanItemStatus.PENDING,
        PlanItemStatus.NOT_DONE,
        PlanItemStatus.MISSED,
        PlanItemStatus.SKIPPED,
        PlanItemStatus.DEFERRED,
        PlanItemStatus.BLOCKED,
        PlanItemStatus.CANCELLED_BY_USER,
        PlanItemStatus.CANCELLED_BY_REALIGNMENT,
        PlanItemStatus.NO_LONGER_RELEVANT,
    ],
    [PlanItemStatus.DEFERRED]: [
        PlanItemStatus.PENDING,
        PlanItemStatus.IN_PROGRESS,
        PlanItemStatus.DONE,
        PlanItemStatus.MISSED,
        PlanItemStatus.SKIPPED,
        PlanItemStatus.BLOCKED,
        PlanItemStatus.CANCELLED_BY_USER,
        PlanItemStatus.CANCELLED_BY_REALIGNMENT,
        PlanItemStatus.NO_LONGER_RELEVANT,
    ],
    [PlanItemStatus.BLOCKED]: [
        PlanItemStatus.PENDING,
        PlanItemStatus.IN_PROGRESS,
        PlanItemStatus.DONE,
        PlanItemStatus.DEFERRED,
        PlanItemStatus.SKIPPED,
        PlanItemStatus.CANCELLED_BY_USER,
        PlanItemStatus.CANCELLED_BY_REALIGNMENT,
        PlanItemStatus.NO_LONGER_RELEVANT,
    ],
    [PlanItemStatus.SKIPPED]: [
        PlanItemStatus.PENDING,
        PlanItemStatus.CANCELLED_BY_REALIGNMENT,
        PlanItemStatus.NO_LONGER_RELEVANT,
    ],
    [PlanItemStatus.MISSED]: [
        PlanItemStatus.PENDING,
        PlanItemStatus.DEFERRED,
        PlanItemStatus.DONE,
        PlanItemStatus.CANCELLED_BY_REALIGNMENT,
        PlanItemStatus.NO_LONGER_RELEVANT,
    ],
    [PlanItemStatus.NOT_DONE]: [
        PlanItemStatus.PENDING,
        PlanItemStatus.DEFERRED,
        PlanItemStatus.DONE,
        PlanItemStatus.CANCELLED_BY_REALIGNMENT,
        PlanItemStatus.NO_LONGER_RELEVANT,
    ],
    [PlanItemStatus.DONE]: [],
    [PlanItemStatus.CANCELLED_BY_USER]: [],
    [PlanItemStatus.CANCELLED_BY_REALIGNMENT]: [],
    [PlanItemStatus.NO_LONGER_RELEVANT]: [],
};
function canTransitionPlanItem(from, to) {
    return (exports.PLAN_ITEM_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
exports.CAPACITY_CONSUMING_STATUSES = [
    PlanItemStatus.PENDING,
    PlanItemStatus.IN_PROGRESS,
    PlanItemStatus.BLOCKED,
];
var PlanItemCategory;
(function (PlanItemCategory) {
    PlanItemCategory["MIND"] = "MIND";
    PlanItemCategory["KARMA"] = "KARMA";
    PlanItemCategory["CAREER"] = "CAREER";
    PlanItemCategory["FINANCE"] = "FINANCE";
    PlanItemCategory["EDUCATION"] = "EDUCATION";
    PlanItemCategory["RELATIONSHIP"] = "RELATIONSHIP";
    PlanItemCategory["BUSINESS"] = "BUSINESS";
    PlanItemCategory["FAMILY"] = "FAMILY";
    PlanItemCategory["HEALTH_SUPPORT"] = "HEALTH_SUPPORT";
    PlanItemCategory["LEGAL_SUPPORT"] = "LEGAL_SUPPORT";
    PlanItemCategory["PROPERTY"] = "PROPERTY";
    PlanItemCategory["NETWORKING"] = "NETWORKING";
    PlanItemCategory["DECISION"] = "DECISION";
    PlanItemCategory["PREPARATION"] = "PREPARATION";
    PlanItemCategory["REVIEW"] = "REVIEW";
    PlanItemCategory["OTHER"] = "OTHER";
})(PlanItemCategory || (exports.PlanItemCategory = PlanItemCategory = {}));
var PlanItemSource;
(function (PlanItemSource) {
    PlanItemSource["WHATNOW"] = "WHATNOW";
    PlanItemSource["SCENARIO_SHARED_PREPARATION"] = "SCENARIO_SHARED_PREPARATION";
    PlanItemSource["SCENARIO_SPECIFIC"] = "SCENARIO_SPECIFIC";
    PlanItemSource["REALIGNMENT"] = "REALIGNMENT";
    PlanItemSource["MKA_MIND"] = "MKA_MIND";
    PlanItemSource["MKA_KARMA"] = "MKA_KARMA";
    PlanItemSource["MKA_ACTION"] = "MKA_ACTION";
    PlanItemSource["USER_CREATED"] = "USER_CREATED";
    PlanItemSource["USER_COMMITMENT"] = "USER_COMMITMENT";
    PlanItemSource["SYSTEM_REVIEW"] = "SYSTEM_REVIEW";
    PlanItemSource["EXPERT_SAFE_GUIDANCE"] = "EXPERT_SAFE_GUIDANCE";
})(PlanItemSource || (exports.PlanItemSource = PlanItemSource = {}));
var PlanItemPriority;
(function (PlanItemPriority) {
    PlanItemPriority["ESSENTIAL"] = "ESSENTIAL";
    PlanItemPriority["IMPORTANT"] = "IMPORTANT";
    PlanItemPriority["OPTIONAL"] = "OPTIONAL";
})(PlanItemPriority || (exports.PlanItemPriority = PlanItemPriority = {}));
exports.PLAN_ITEM_PRIORITY_RANK = {
    [PlanItemPriority.ESSENTIAL]: 1,
    [PlanItemPriority.IMPORTANT]: 2,
    [PlanItemPriority.OPTIONAL]: 3,
};
var PlanItemScenarioScope;
(function (PlanItemScenarioScope) {
    PlanItemScenarioScope["SHARED_ACROSS_SCENARIOS"] = "SHARED_ACROSS_SCENARIOS";
    PlanItemScenarioScope["SCENARIO_SPECIFIC"] = "SCENARIO_SPECIFIC";
    PlanItemScenarioScope["TRIGGERED_ONLY"] = "TRIGGERED_ONLY";
})(PlanItemScenarioScope || (exports.PlanItemScenarioScope = PlanItemScenarioScope = {}));
var PlanItemRealignmentPolicy;
(function (PlanItemRealignmentPolicy) {
    PlanItemRealignmentPolicy["PRESERVE_IF_RELEVANT"] = "PRESERVE_IF_RELEVANT";
    PlanItemRealignmentPolicy["ALWAYS_PRESERVE"] = "ALWAYS_PRESERVE";
    PlanItemRealignmentPolicy["REPLACEABLE"] = "REPLACEABLE";
})(PlanItemRealignmentPolicy || (exports.PlanItemRealignmentPolicy = PlanItemRealignmentPolicy = {}));
var PlanItemEventType;
(function (PlanItemEventType) {
    PlanItemEventType["CREATED"] = "CREATED";
    PlanItemEventType["STATUS_CHANGED"] = "STATUS_CHANGED";
    PlanItemEventType["RESCHEDULED"] = "RESCHEDULED";
    PlanItemEventType["EDITED"] = "EDITED";
    PlanItemEventType["DEPENDENCY_BLOCKED"] = "DEPENDENCY_BLOCKED";
    PlanItemEventType["CAPACITY_DEFERRED"] = "CAPACITY_DEFERRED";
})(PlanItemEventType || (exports.PlanItemEventType = PlanItemEventType = {}));
var PlanItemEventSource;
(function (PlanItemEventSource) {
    PlanItemEventSource["USER"] = "USER";
    PlanItemEventSource["SYSTEM"] = "SYSTEM";
    PlanItemEventSource["PLAN_ENGINE"] = "PLAN_ENGINE";
    PlanItemEventSource["REALIGNMENT"] = "REALIGNMENT";
    PlanItemEventSource["MKA"] = "MKA";
})(PlanItemEventSource || (exports.PlanItemEventSource = PlanItemEventSource = {}));
var PlanReviewTrigger;
(function (PlanReviewTrigger) {
    PlanReviewTrigger["END_OF_HORIZON"] = "END_OF_HORIZON";
    PlanReviewTrigger["END_OF_WEEK"] = "END_OF_WEEK";
    PlanReviewTrigger["LIFE_SIGNAL"] = "LIFE_SIGNAL";
    PlanReviewTrigger["MAJOR_REALIGNMENT"] = "MAJOR_REALIGNMENT";
    PlanReviewTrigger["USER_REQUEST"] = "USER_REQUEST";
})(PlanReviewTrigger || (exports.PlanReviewTrigger = PlanReviewTrigger = {}));
exports.PLAN_ENGINE_VERSION = 'plan-engine-1.0.0';
//# sourceMappingURL=plan.enum.js.map