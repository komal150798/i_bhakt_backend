import { MkaDimension } from '../../common/enums';
export { MkaDimension };
export declare enum MkaProgramStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    COMPLETED = "COMPLETED",
    SUPERSEDED = "SUPERSEDED",
    CANCELLED = "CANCELLED"
}
export declare const MKA_PROGRAM_TRANSITIONS: Readonly<Record<MkaProgramStatus, readonly MkaProgramStatus[]>>;
export declare function canTransitionMkaProgram(from: MkaProgramStatus, to: MkaProgramStatus): boolean;
export declare enum MkaPeriodType {
    WEEK = "WEEK",
    FORTNIGHT = "FORTNIGHT",
    MONTH = "MONTH",
    CUSTOM = "CUSTOM"
}
export declare const MKA_PERIOD_DAYS: Readonly<Record<MkaPeriodType, number>>;
export declare enum MkaSourceType {
    APPROVED_ASTRO_REMEDY = "APPROVED_ASTRO_REMEDY",
    ZUNO_BEHAVIOURAL_GUIDANCE = "ZUNO_BEHAVIOURAL_GUIDANCE",
    SERVICE = "SERVICE",
    GRATITUDE = "GRATITUDE",
    DISCIPLINE = "DISCIPLINE",
    GENEROSITY = "GENEROSITY",
    REFLECTION = "REFLECTION",
    RELATIONSHIP_REPAIR = "RELATIONSHIP_REPAIR",
    RESPONSIBILITY = "RESPONSIBILITY",
    CONSTRUCTIVE_HABIT = "CONSTRUCTIVE_HABIT",
    SME_APPROVED_PRACTICE = "SME_APPROVED_PRACTICE",
    WHATNOW = "WHATNOW",
    SCENARIO_PREPARATION = "SCENARIO_PREPARATION",
    REALIGNMENT = "REALIGNMENT",
    USER_GOAL = "USER_GOAL",
    PLAN_REQUIREMENT = "PLAN_REQUIREMENT",
    EXPERT_SAFE_GENERAL_GUIDANCE = "EXPERT_SAFE_GENERAL_GUIDANCE"
}
export declare const ASTRO_DERIVED_SOURCE_TYPES: readonly MkaSourceType[];
export declare enum MkaFrequency {
    ONCE = "ONCE",
    DAILY = "DAILY",
    WEEKDAYS = "WEEKDAYS",
    SPECIFIC_DAY = "SPECIFIC_DAY",
    WEEKLY = "WEEKLY",
    CUSTOM = "CUSTOM",
    EVENT_TRIGGERED = "EVENT_TRIGGERED"
}
export declare enum MkaPriority {
    ESSENTIAL = "ESSENTIAL",
    IMPORTANT = "IMPORTANT",
    OPTIONAL = "OPTIONAL"
}
export declare enum MkaItemStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    EXPIRED = "EXPIRED",
    DECLINED = "DECLINED",
    NO_LONGER_RELEVANT = "NO_LONGER_RELEVANT",
    CANCELLED_BY_REALIGNMENT = "CANCELLED_BY_REALIGNMENT"
}
export declare const MKA_ITEM_TRANSITIONS: Readonly<Record<MkaItemStatus, readonly MkaItemStatus[]>>;
export declare function canTransitionMkaItem(from: MkaItemStatus, to: MkaItemStatus): boolean;
export declare enum MkaCompletionStatus {
    DONE = "DONE",
    NOT_DONE = "NOT_DONE",
    MISSED = "MISSED",
    SKIPPED = "SKIPPED",
    DEFERRED = "DEFERRED",
    NO_LONGER_RELEVANT = "NO_LONGER_RELEVANT",
    CANCELLED_BY_REALIGNMENT = "CANCELLED_BY_REALIGNMENT"
}
export declare enum MkaCompletionSource {
    USER = "USER",
    SYSTEM = "SYSTEM",
    PLAN = "PLAN",
    REALIGNMENT = "REALIGNMENT"
}
export declare enum MkaReviewTrigger {
    END_OF_PERIOD = "END_OF_PERIOD",
    LIFE_SIGNAL = "LIFE_SIGNAL",
    MAJOR_REALIGNMENT = "MAJOR_REALIGNMENT",
    TIMING_WINDOW_CHANGE = "TIMING_WINDOW_CHANGE",
    USER_REQUEST = "USER_REQUEST"
}
export declare enum MkaRemedyStatus {
    APPROVED_RULE_APPLIED = "APPROVED_RULE_APPLIED",
    NO_APPROVED_RULE_AVAILABLE = "NO_APPROVED_RULE_AVAILABLE",
    SUPPRESSED_BY_SAFETY = "SUPPRESSED_BY_SAFETY",
    DECLINED_BY_USER_PREFERENCE = "DECLINED_BY_USER_PREFERENCE"
}
export declare const MKA_DIMENSION_LIMITS: Readonly<Record<MkaDimension, number>>;
export declare const MKA_MAX_ASTRO_REMEDIES = 1;
export declare const MKA_ENGINE_VERSION = "mka-engine-1.0.0";
