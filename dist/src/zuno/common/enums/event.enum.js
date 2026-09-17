"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZunoAggregateType = exports.OutboxStatus = exports.ZunoEventType = void 0;
var ZunoEventType;
(function (ZunoEventType) {
    ZunoEventType["CHALLENGE_CREATED"] = "zuno.challenge.created";
    ZunoEventType["CHALLENGE_ANALYZED"] = "zuno.challenge.analyzed";
    ZunoEventType["CHALLENGE_CONTEXT_VERSIONED"] = "zuno.challenge.context_versioned";
    ZunoEventType["CHALLENGE_STATUS_CHANGED"] = "zuno.challenge.status_changed";
    ZunoEventType["CHALLENGE_RESOLVED"] = "zuno.challenge.resolved";
    ZunoEventType["CHALLENGE_REOPENED"] = "zuno.challenge.reopened";
    ZunoEventType["CLARIFICATION_REQUESTED"] = "zuno.challenge.clarification_requested";
    ZunoEventType["RESPONSE_GENERATED"] = "zuno.response.generated";
    ZunoEventType["SAFETY_DECISION_RECORDED"] = "zuno.safety.decision_recorded";
    ZunoEventType["SAFETY_CRITICAL_ESCALATION"] = "zuno.safety.critical_escalation";
    ZunoEventType["BIRTH_PROFILE_UPDATED"] = "zuno.birth_profile.updated";
    ZunoEventType["USER_CONSENT_CHANGED"] = "zuno.user.consent_changed";
})(ZunoEventType || (exports.ZunoEventType = ZunoEventType = {}));
var OutboxStatus;
(function (OutboxStatus) {
    OutboxStatus["PENDING"] = "PENDING";
    OutboxStatus["PUBLISHING"] = "PUBLISHING";
    OutboxStatus["PUBLISHED"] = "PUBLISHED";
    OutboxStatus["FAILED"] = "FAILED";
    OutboxStatus["DEAD_LETTER"] = "DEAD_LETTER";
})(OutboxStatus || (exports.OutboxStatus = OutboxStatus = {}));
var ZunoAggregateType;
(function (ZunoAggregateType) {
    ZunoAggregateType["CHALLENGE"] = "CHALLENGE";
    ZunoAggregateType["RESPONSE"] = "RESPONSE";
    ZunoAggregateType["USER"] = "USER";
    ZunoAggregateType["BIRTH_PROFILE"] = "BIRTH_PROFILE";
    ZunoAggregateType["SAFETY_DECISION"] = "SAFETY_DECISION";
})(ZunoAggregateType || (exports.ZunoAggregateType = ZunoAggregateType = {}));
//# sourceMappingURL=event.enum.js.map