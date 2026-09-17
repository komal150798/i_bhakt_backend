export declare enum RealignmentLevel {
    NONE = "NONE",
    MICRO = "MICRO",
    PARTIAL = "PARTIAL",
    MAJOR = "MAJOR",
    CRITICAL = "CRITICAL"
}
export declare const REALIGNMENT_LEVEL_RANK: Readonly<Record<RealignmentLevel, number>>;
export declare enum RealignmentScope {
    TASK = "TASK",
    DAY = "DAY",
    WEEK = "WEEK",
    THIRTY_DAY_PLAN = "THIRTY_DAY_PLAN",
    SCENARIO = "SCENARIO",
    GOAL = "GOAL",
    CHALLENGE = "CHALLENGE",
    MULTI_CHALLENGE = "MULTI_CHALLENGE"
}
export declare enum RealignmentStatus {
    PENDING = "PENDING",
    EVALUATED = "EVALUATED",
    AWAITING_USER_CONFIRMATION = "AWAITING_USER_CONFIRMATION",
    APPLIED = "APPLIED",
    SUPERSEDED = "SUPERSEDED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED"
}
export declare const REALIGNMENT_STATUS_TRANSITIONS: Readonly<Record<RealignmentStatus, readonly RealignmentStatus[]>>;
export declare function canTransitionRealignment(from: RealignmentStatus, to: RealignmentStatus): boolean;
export declare enum RealignmentChangeType {
    PRESERVE = "PRESERVE",
    MODIFY = "MODIFY",
    REMOVE = "REMOVE",
    ADD = "ADD",
    PLAN_REPLACED = "PLAN_REPLACED",
    PLAN_PATCHED = "PLAN_PATCHED",
    MKA_SUPERSEDED = "MKA_SUPERSEDED",
    REMINDERS_SUPPRESSED = "REMINDERS_SUPPRESSED",
    ITEMS_CANCELLED = "ITEMS_CANCELLED"
}
export declare enum RealignmentEntityType {
    PLAN = "PLAN",
    PLAN_ITEM = "PLAN_ITEM",
    MKA_PROGRAM = "MKA_PROGRAM",
    REMINDER = "REMINDER",
    SCENARIO = "SCENARIO",
    CHALLENGE = "CHALLENGE",
    ASSUMPTION = "ASSUMPTION"
}
export declare enum RealignmentTrigger {
    LIFE_SIGNAL = "LIFE_SIGNAL",
    USER_REQUEST = "USER_REQUEST",
    SCENARIO_TRIGGER = "SCENARIO_TRIGGER",
    TIME_EVENT = "TIME_EVENT",
    PLAN_FAILURE_PATTERN = "PLAN_FAILURE_PATTERN",
    SAFETY_CHANGE = "SAFETY_CHANGE",
    RULEBOOK_REASSESSMENT = "RULEBOOK_REASSESSMENT",
    CHALLENGE_CONTEXT_UPDATE = "CHALLENGE_CONTEXT_UPDATE"
}
export declare enum AssumptionStatus {
    HOLDS = "HOLDS",
    UNCERTAIN = "UNCERTAIN",
    INVALIDATED = "INVALIDATED"
}
export declare enum PlanChangeMode {
    NONE = "NONE",
    PATCH = "PATCH",
    REGENERATE = "REGENERATE"
}
export declare const PLAN_PATCH_MAX_CHANGED_COMPONENTS = 3;
export declare const REALIGNMENT_EVENT_TYPES: {
    readonly REALIGNMENT_REQUESTED: "zuno.realignment.requested";
    readonly REALIGNMENT_EVALUATED: "zuno.realignment.evaluated";
    readonly REALIGNMENT_CONFIRMATION_REQUIRED: "zuno.realignment.confirmation_required";
    readonly REALIGNMENT_APPLIED: "zuno.realignment.applied";
    readonly REALIGNMENT_COMPLETED: "zuno.realignment.completed";
    readonly REALIGNMENT_FAILED: "zuno.realignment.failed";
};
export declare const REALIGNMENT_AGGREGATE = "REALIGNMENT";
