export declare enum ZunoEventType {
    CHALLENGE_CREATED = "zuno.challenge.created",
    CHALLENGE_ANALYZED = "zuno.challenge.analyzed",
    CHALLENGE_CONTEXT_VERSIONED = "zuno.challenge.context_versioned",
    CHALLENGE_STATUS_CHANGED = "zuno.challenge.status_changed",
    CHALLENGE_RESOLVED = "zuno.challenge.resolved",
    CHALLENGE_REOPENED = "zuno.challenge.reopened",
    CLARIFICATION_REQUESTED = "zuno.challenge.clarification_requested",
    RESPONSE_GENERATED = "zuno.response.generated",
    SAFETY_DECISION_RECORDED = "zuno.safety.decision_recorded",
    SAFETY_CRITICAL_ESCALATION = "zuno.safety.critical_escalation",
    BIRTH_PROFILE_UPDATED = "zuno.birth_profile.updated",
    USER_CONSENT_CHANGED = "zuno.user.consent_changed"
}
export declare enum OutboxStatus {
    PENDING = "PENDING",
    PUBLISHING = "PUBLISHING",
    PUBLISHED = "PUBLISHED",
    FAILED = "FAILED",
    DEAD_LETTER = "DEAD_LETTER"
}
export declare enum ZunoAggregateType {
    CHALLENGE = "CHALLENGE",
    RESPONSE = "RESPONSE",
    USER = "USER",
    BIRTH_PROFILE = "BIRTH_PROFILE",
    SAFETY_DECISION = "SAFETY_DECISION"
}
