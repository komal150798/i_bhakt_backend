export declare enum ResponseSectionType {
    CONTEXT_VALIDATION = "CONTEXT_VALIDATION",
    OUTLOOK = "OUTLOOK",
    KEY_TAKEAWAY = "KEY_TAKEAWAY",
    SCENARIO_PATHS = "SCENARIO_PATHS",
    WHAT_IF = "WHAT_IF",
    FOCUS_PRIORITIES = "FOCUS_PRIORITIES",
    TIMELINE = "TIMELINE",
    MKA = "MKA",
    PLAN_SUMMARY = "PLAN_SUMMARY",
    LIFE_SIGNAL = "LIFE_SIGNAL",
    REALIGNMENT = "REALIGNMENT",
    KARMA_REFLECTION = "KARMA_REFLECTION",
    FUTURE_SELF = "FUTURE_SELF",
    SAFETY_BOUNDARY = "SAFETY_BOUNDARY",
    ASK_ZUNO = "ASK_ZUNO",
    CLARIFICATION = "CLARIFICATION"
}
export declare enum ResponseType {
    CONTEXT_VALIDATION = "CONTEXT_VALIDATION",
    FORECAST = "FORECAST",
    SCENARIO = "SCENARIO",
    ACTION_PLAN = "ACTION_PLAN",
    MKA = "MKA",
    REALIGNMENT = "REALIGNMENT",
    FUTURE_SELF = "FUTURE_SELF",
    GENERAL = "GENERAL"
}
export declare enum SectionEmphasis {
    PRIMARY = "PRIMARY",
    SECONDARY = "SECONDARY",
    SUPPORTING = "SUPPORTING"
}
export declare enum EngineType {
    WHATNOW = "WHATNOW",
    ASTROLOGY = "ASTROLOGY",
    SCENARIO = "SCENARIO",
    LIFE_SIGNAL = "LIFE_SIGNAL",
    REALIGNMENT = "REALIGNMENT",
    MKA = "MKA",
    PLAN = "PLAN",
    KARMA = "KARMA",
    MEMORY = "MEMORY",
    FUTURE_SELF = "FUTURE_SELF",
    SAFETY = "SAFETY"
}
export declare enum EngineRunStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    NO_RESULT = "NO_RESULT"
}
export declare enum ProcessingState {
    PROCESSING = "PROCESSING",
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export interface EngineRouting {
    scenario_engine: boolean;
    life_signal_engine: boolean;
    realignment_engine: boolean;
    mka_engine: boolean;
    plan_engine: boolean;
    karma_ledger: boolean;
    memory_context: boolean;
    safety_review: boolean;
    astrology: boolean;
}
