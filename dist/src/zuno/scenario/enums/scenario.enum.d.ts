export declare enum ScenarioType {
    CONTINUITY = "CONTINUITY",
    CHANGE = "CHANGE",
    TRANSITION = "TRANSITION",
    RECOVERY = "RECOVERY",
    OPPORTUNITY = "OPPORTUNITY",
    DECISION = "DECISION",
    CONTINGENCY = "CONTINGENCY",
    USER_DEFINED_WHAT_IF = "USER_DEFINED_WHAT_IF"
}
export declare const SCENARIO_TYPES: readonly ScenarioType[];
export declare enum ScenarioCaseClass {
    BASE_CASE = "BASE_CASE",
    POSITIVE_CASE = "POSITIVE_CASE",
    ADVERSE_CASE = "ADVERSE_CASE",
    USER_DEFINED = "USER_DEFINED",
    SYSTEM_GENERATED = "SYSTEM_GENERATED"
}
export declare const SCENARIO_TYPE_CASE_CLASS: Readonly<Record<ScenarioType, ScenarioCaseClass>>;
export declare enum ScenarioRelevance {
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW",
    CONTINGENCY = "CONTINGENCY"
}
export declare const SCENARIO_RELEVANCE_WEIGHT: Readonly<Record<ScenarioRelevance, number>>;
export declare enum ScenarioImpact {
    LOW = "LOW",
    MODERATE = "MODERATE",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare const SCENARIO_IMPACT_WEIGHT: Readonly<Record<ScenarioImpact, number>>;
export declare enum ScenarioHorizon {
    IMMEDIATE = "IMMEDIATE",
    NEAR_TERM = "NEAR_TERM",
    MEDIUM_TERM = "MEDIUM_TERM",
    LONG_TERM = "LONG_TERM",
    UNSPECIFIED = "UNSPECIFIED"
}
export declare enum ScenarioStatus {
    ACTIVE_CANDIDATE = "ACTIVE_CANDIDATE",
    INCREASING = "INCREASING",
    DECREASING = "DECREASING",
    LIKELY_PATH = "LIKELY_PATH",
    TRIGGERED = "TRIGGERED",
    DISMISSED = "DISMISSED",
    RESOLVED = "RESOLVED",
    ARCHIVED = "ARCHIVED",
    USER_ADOPTED = "USER_ADOPTED",
    USER_REJECTED = "USER_REJECTED"
}
export declare const SCENARIO_STATUS_TRANSITIONS: Readonly<Record<ScenarioStatus, readonly ScenarioStatus[]>>;
export declare function canTransitionScenario(from: ScenarioStatus, to: ScenarioStatus): boolean;
export declare enum ScenarioEvidenceClass {
    USER_STATED = "USER_STATED",
    USER_CONFIRMED = "USER_CONFIRMED",
    CURRENT_REALITY = "CURRENT_REALITY",
    LIFE_SIGNAL = "LIFE_SIGNAL",
    ASTRO_THEME = "ASTRO_THEME",
    TIMING_WINDOW = "TIMING_WINDOW",
    DEPENDENCY = "DEPENDENCY",
    MEMORY = "MEMORY",
    SYSTEM_INFERENCE = "SYSTEM_INFERENCE",
    USER_CONCERN = "USER_CONCERN",
    EXTERNAL_EVENT = "EXTERNAL_EVENT"
}
export declare const UNSUPPORTED_EVIDENCE_CLASSES: readonly ScenarioEvidenceClass[];
export declare enum PreparationClass {
    COMMON = "COMMON",
    SCENARIO_SPECIFIC = "SCENARIO_SPECIFIC",
    CONTINGENCY_ONLY = "CONTINGENCY_ONLY"
}
export declare enum ScenarioConditionType {
    SIGNAL_FOR = "SIGNAL_FOR",
    SIGNAL_AGAINST = "SIGNAL_AGAINST",
    DEPENDENCY = "DEPENDENCY"
}
export declare enum Reversibility {
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW"
}
export declare enum DecisionReadiness {
    READY = "READY",
    PARTIALLY_READY = "PARTIALLY_READY",
    INSUFFICIENT_INFORMATION = "INSUFFICIENT_INFORMATION"
}
export declare enum ScenarioSetStatus {
    CURRENT = "CURRENT",
    SUPERSEDED = "SUPERSEDED"
}
export declare enum WhatIfSessionStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    DISCARDED = "DISCARDED"
}
export declare enum WhatIfAssumptionType {
    USER_STATED = "USER_STATED",
    DERIVED_DEPENDENCY = "DERIVED_DEPENDENCY",
    CONTEXT_CARRIED = "CONTEXT_CARRIED"
}
export declare enum ScenarioChangeType {
    ADDED = "ADDED",
    REMOVED = "REMOVED",
    RELEVANCE_INCREASED = "RELEVANCE_INCREASED",
    RELEVANCE_DECREASED = "RELEVANCE_DECREASED",
    IMPACT_CHANGED = "IMPACT_CHANGED",
    TRIGGERED = "TRIGGERED",
    RESOLVED = "RESOLVED"
}
export declare const SCENARIO_MIN_USER_FACING = 2;
export declare const SCENARIO_PREFERRED_USER_FACING = 3;
export declare const SCENARIO_MAX_USER_FACING = 4;
export declare const WHAT_IF_MAX_CASCADE_DEPTH = 3;
export declare const SCENARIO_LOW_CONFIDENCE_THRESHOLD = 0.4;
