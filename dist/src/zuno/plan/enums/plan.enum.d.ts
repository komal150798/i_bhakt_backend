export declare enum PlanType {
    TODAY = "TODAY",
    WEEKLY = "WEEKLY",
    THIRTY_DAY = "THIRTY_DAY",
    LONG_TERM = "LONG_TERM",
    CUSTOM = "CUSTOM"
}
export declare enum PlanStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    SUPERSEDED = "SUPERSEDED",
    CANCELLED = "CANCELLED",
    ARCHIVED = "ARCHIVED"
}
export declare const PLAN_STATUS_TRANSITIONS: Readonly<Record<PlanStatus, readonly PlanStatus[]>>;
export declare function canTransitionPlan(from: PlanStatus, to: PlanStatus): boolean;
export declare enum PlanItemStatus {
    CONDITIONAL = "CONDITIONAL",
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
    NOT_DONE = "NOT_DONE",
    MISSED = "MISSED",
    SKIPPED = "SKIPPED",
    DEFERRED = "DEFERRED",
    BLOCKED = "BLOCKED",
    CANCELLED_BY_USER = "CANCELLED_BY_USER",
    CANCELLED_BY_REALIGNMENT = "CANCELLED_BY_REALIGNMENT",
    NO_LONGER_RELEVANT = "NO_LONGER_RELEVANT"
}
export declare const PLAN_ITEM_STATUS_TRANSITIONS: Readonly<Record<PlanItemStatus, readonly PlanItemStatus[]>>;
export declare function canTransitionPlanItem(from: PlanItemStatus, to: PlanItemStatus): boolean;
export declare const CAPACITY_CONSUMING_STATUSES: readonly PlanItemStatus[];
export declare enum PlanItemCategory {
    MIND = "MIND",
    KARMA = "KARMA",
    CAREER = "CAREER",
    FINANCE = "FINANCE",
    EDUCATION = "EDUCATION",
    RELATIONSHIP = "RELATIONSHIP",
    BUSINESS = "BUSINESS",
    FAMILY = "FAMILY",
    HEALTH_SUPPORT = "HEALTH_SUPPORT",
    LEGAL_SUPPORT = "LEGAL_SUPPORT",
    PROPERTY = "PROPERTY",
    NETWORKING = "NETWORKING",
    DECISION = "DECISION",
    PREPARATION = "PREPARATION",
    REVIEW = "REVIEW",
    OTHER = "OTHER"
}
export declare enum PlanItemSource {
    WHATNOW = "WHATNOW",
    SCENARIO_SHARED_PREPARATION = "SCENARIO_SHARED_PREPARATION",
    SCENARIO_SPECIFIC = "SCENARIO_SPECIFIC",
    REALIGNMENT = "REALIGNMENT",
    MKA_MIND = "MKA_MIND",
    MKA_KARMA = "MKA_KARMA",
    MKA_ACTION = "MKA_ACTION",
    USER_CREATED = "USER_CREATED",
    USER_COMMITMENT = "USER_COMMITMENT",
    SYSTEM_REVIEW = "SYSTEM_REVIEW",
    EXPERT_SAFE_GUIDANCE = "EXPERT_SAFE_GUIDANCE"
}
export declare enum PlanItemPriority {
    ESSENTIAL = "ESSENTIAL",
    IMPORTANT = "IMPORTANT",
    OPTIONAL = "OPTIONAL"
}
export declare const PLAN_ITEM_PRIORITY_RANK: Readonly<Record<PlanItemPriority, number>>;
export declare enum PlanItemScenarioScope {
    SHARED_ACROSS_SCENARIOS = "SHARED_ACROSS_SCENARIOS",
    SCENARIO_SPECIFIC = "SCENARIO_SPECIFIC",
    TRIGGERED_ONLY = "TRIGGERED_ONLY"
}
export declare enum PlanItemRealignmentPolicy {
    PRESERVE_IF_RELEVANT = "PRESERVE_IF_RELEVANT",
    ALWAYS_PRESERVE = "ALWAYS_PRESERVE",
    REPLACEABLE = "REPLACEABLE"
}
export declare enum PlanItemEventType {
    CREATED = "CREATED",
    STATUS_CHANGED = "STATUS_CHANGED",
    RESCHEDULED = "RESCHEDULED",
    EDITED = "EDITED",
    DEPENDENCY_BLOCKED = "DEPENDENCY_BLOCKED",
    CAPACITY_DEFERRED = "CAPACITY_DEFERRED"
}
export declare enum PlanItemEventSource {
    USER = "USER",
    SYSTEM = "SYSTEM",
    PLAN_ENGINE = "PLAN_ENGINE",
    REALIGNMENT = "REALIGNMENT",
    MKA = "MKA"
}
export declare enum PlanReviewTrigger {
    END_OF_HORIZON = "END_OF_HORIZON",
    END_OF_WEEK = "END_OF_WEEK",
    LIFE_SIGNAL = "LIFE_SIGNAL",
    MAJOR_REALIGNMENT = "MAJOR_REALIGNMENT",
    USER_REQUEST = "USER_REQUEST"
}
export declare const PLAN_ENGINE_VERSION = "plan-engine-1.0.0";
