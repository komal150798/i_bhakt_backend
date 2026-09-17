export declare enum ChallengeStatus {
    NEW = "NEW",
    UNDERSTANDING = "UNDERSTANDING",
    ACTIVE = "ACTIVE",
    MONITORING = "MONITORING",
    CHANGED = "CHANGED",
    REALIGNMENT_REQUIRED = "REALIGNMENT_REQUIRED",
    RESOLVED = "RESOLVED",
    PAUSED = "PAUSED",
    ARCHIVED = "ARCHIVED"
}
export declare const CHALLENGE_STATUS_TRANSITIONS: Readonly<Record<ChallengeStatus, readonly ChallengeStatus[]>>;
export declare function canTransitionChallenge(from: ChallengeStatus, to: ChallengeStatus): boolean;
export declare enum ChallengeMode {
    UNDERSTAND = "UNDERSTAND",
    PREPARE = "PREPARE",
    WATCH = "WATCH",
    ACT = "ACT",
    DECIDE = "DECIDE",
    TRANSITION = "TRANSITION",
    RECOVER = "RECOVER",
    STABILISE = "STABILISE",
    GROW = "GROW",
    CELEBRATE = "CELEBRATE"
}
export declare enum Urgency {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    IMMEDIATE = "IMMEDIATE"
}
export declare enum EmotionalIntensity {
    LOW = "LOW",
    MODERATE = "MODERATE",
    HIGH = "HIGH",
    VERY_HIGH = "VERY_HIGH"
}
export declare enum EmotionalSignal {
    CALM = "CALM",
    UNCERTAIN = "UNCERTAIN",
    WORRIED = "WORRIED",
    ANXIOUS = "ANXIOUS",
    FRUSTRATED = "FRUSTRATED",
    OVERWHELMED = "OVERWHELMED",
    HOPEFUL = "HOPEFUL",
    CONFUSED = "CONFUSED",
    URGENT = "URGENT"
}
export declare enum ContextItemType {
    FACT = "FACT",
    USER_BELIEF = "USER_BELIEF",
    FEAR = "FEAR",
    ASSUMPTION = "ASSUMPTION",
    DEPENDENCY = "DEPENDENCY",
    CONSTRAINT = "CONSTRAINT",
    DESIRED_OUTCOME = "DESIRED_OUTCOME",
    DECISION = "DECISION",
    PREFERENCE = "PREFERENCE",
    EXTERNAL_EVENT = "EXTERNAL_EVENT",
    UNKNOWN = "UNKNOWN"
}
export declare const FACTUAL_CONTEXT_ITEM_TYPES: readonly ContextItemType[];
export declare const NON_FACTUAL_CONTEXT_ITEM_TYPES: readonly ContextItemType[];
export declare enum ContextItemSource {
    USER_STATED = "USER_STATED",
    USER_CONFIRMED = "USER_CONFIRMED",
    INFERRED = "INFERRED",
    MEMORY = "MEMORY",
    LIFE_SIGNAL = "LIFE_SIGNAL",
    SYSTEM_DERIVED = "SYSTEM_DERIVED"
}
export declare enum GoalStatus {
    USER_STATED = "USER_STATED",
    INFERRED = "INFERRED",
    CONFIRMED = "CONFIRMED",
    REJECTED = "REJECTED"
}
export declare enum ChallengeTimeline {
    PAST = "PAST",
    CURRENT = "CURRENT",
    UPCOMING = "UPCOMING",
    ONGOING = "ONGOING",
    RECURRING = "RECURRING",
    LONG_TERM = "LONG_TERM",
    UNKNOWN = "UNKNOWN"
}
export declare enum ResponseDepth {
    QUICK = "QUICK",
    STANDARD = "STANDARD",
    DEEP = "DEEP"
}
export declare enum ChallengeLinkType {
    IMPACTS = "IMPACTS",
    CAUSED_BY = "CAUSED_BY",
    SUPERSEDES = "SUPERSEDES",
    SUPERSEDED_BY = "SUPERSEDED_BY",
    RELATED_TO = "RELATED_TO",
    SPAWNED_FROM = "SPAWNED_FROM"
}
