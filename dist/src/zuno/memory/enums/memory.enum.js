"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryRequestContext = exports.MemoryEvidenceRole = exports.MemoryConflictResolution = exports.MemoryRejectionReason = exports.MemoryCandidateStatus = exports.MemoryScope = exports.NON_FACTUAL_FACTUALITIES = exports.MemoryFactuality = exports.SENSITIVITY_RANK = exports.MemorySensitivity = exports.RETENTION_RECENCY_HALF_LIFE_DAYS = exports.RETENTION_IMPORTANCE = exports.MemoryRetentionClass = exports.MEMORY_SOURCE_AUTHORITY = exports.MemorySource = exports.MemoryEvidenceType = exports.RETRIEVABLE_MEMORY_STATUSES = exports.MemoryStatus = exports.MEMORY_TYPES = exports.MemoryType = void 0;
exports.isMemoryType = isMemoryType;
var MemoryType;
(function (MemoryType) {
    MemoryType["PROFILE"] = "PROFILE";
    MemoryType["PREFERENCE"] = "PREFERENCE";
    MemoryType["GOAL"] = "GOAL";
    MemoryType["CHALLENGE"] = "CHALLENGE";
    MemoryType["CONSTRAINT"] = "CONSTRAINT";
    MemoryType["DECISION"] = "DECISION";
    MemoryType["COMMITMENT"] = "COMMITMENT";
    MemoryType["PLAN_CONTEXT"] = "PLAN_CONTEXT";
    MemoryType["PROGRESS"] = "PROGRESS";
    MemoryType["LIFE_EVENT"] = "LIFE_EVENT";
    MemoryType["PATTERN"] = "PATTERN";
    MemoryType["USER_CORRECTION"] = "USER_CORRECTION";
    MemoryType["ASTRO_CONTEXT_REFERENCE"] = "ASTRO_CONTEXT_REFERENCE";
    MemoryType["FUTURE_SELF_NARRATIVE"] = "FUTURE_SELF_NARRATIVE";
    MemoryType["TEMPORARY_CONTEXT"] = "TEMPORARY_CONTEXT";
})(MemoryType || (exports.MemoryType = MemoryType = {}));
exports.MEMORY_TYPES = Object.values(MemoryType);
function isMemoryType(value) {
    return exports.MEMORY_TYPES.includes(value);
}
var MemoryStatus;
(function (MemoryStatus) {
    MemoryStatus["PENDING_CONFIRMATION"] = "PENDING_CONFIRMATION";
    MemoryStatus["ACTIVE"] = "ACTIVE";
    MemoryStatus["SUPERSEDED"] = "SUPERSEDED";
    MemoryStatus["EXPIRED"] = "EXPIRED";
    MemoryStatus["DELETED"] = "DELETED";
})(MemoryStatus || (exports.MemoryStatus = MemoryStatus = {}));
exports.RETRIEVABLE_MEMORY_STATUSES = [
    MemoryStatus.ACTIVE,
];
var MemoryEvidenceType;
(function (MemoryEvidenceType) {
    MemoryEvidenceType["EXPLICIT"] = "EXPLICIT";
    MemoryEvidenceType["INFERRED"] = "INFERRED";
    MemoryEvidenceType["DERIVED"] = "DERIVED";
})(MemoryEvidenceType || (exports.MemoryEvidenceType = MemoryEvidenceType = {}));
var MemorySource;
(function (MemorySource) {
    MemorySource["USER_EXPLICIT"] = "USER_EXPLICIT";
    MemorySource["USER_CORRECTION"] = "USER_CORRECTION";
    MemorySource["WHATNOW_ENGINE"] = "WHATNOW_ENGINE";
    MemorySource["PLAN_ENGINE"] = "PLAN_ENGINE";
    MemorySource["MKA_ENGINE"] = "MKA_ENGINE";
    MemorySource["KARMA_LEDGER"] = "KARMA_LEDGER";
    MemorySource["LIFE_SIGNAL_ENGINE"] = "LIFE_SIGNAL_ENGINE";
    MemorySource["REALIGNMENT_ENGINE"] = "REALIGNMENT_ENGINE";
    MemorySource["SYSTEM_DERIVED"] = "SYSTEM_DERIVED";
})(MemorySource || (exports.MemorySource = MemorySource = {}));
exports.MEMORY_SOURCE_AUTHORITY = {
    [MemorySource.USER_CORRECTION]: 100,
    [MemorySource.USER_EXPLICIT]: 90,
    [MemorySource.WHATNOW_ENGINE]: 70,
    [MemorySource.PLAN_ENGINE]: 70,
    [MemorySource.REALIGNMENT_ENGINE]: 70,
    [MemorySource.MKA_ENGINE]: 65,
    [MemorySource.KARMA_LEDGER]: 65,
    [MemorySource.LIFE_SIGNAL_ENGINE]: 65,
    [MemorySource.SYSTEM_DERIVED]: 40,
};
var MemoryRetentionClass;
(function (MemoryRetentionClass) {
    MemoryRetentionClass["SESSION"] = "SESSION";
    MemoryRetentionClass["SHORT_TERM"] = "SHORT_TERM";
    MemoryRetentionClass["CHALLENGE_LIFETIME"] = "CHALLENGE_LIFETIME";
    MemoryRetentionClass["LONG_TERM"] = "LONG_TERM";
    MemoryRetentionClass["UNTIL_SUPERSEDED"] = "UNTIL_SUPERSEDED";
    MemoryRetentionClass["USER_PINNED"] = "USER_PINNED";
})(MemoryRetentionClass || (exports.MemoryRetentionClass = MemoryRetentionClass = {}));
exports.RETENTION_IMPORTANCE = {
    [MemoryRetentionClass.USER_PINNED]: 1.0,
    [MemoryRetentionClass.LONG_TERM]: 0.85,
    [MemoryRetentionClass.UNTIL_SUPERSEDED]: 0.8,
    [MemoryRetentionClass.CHALLENGE_LIFETIME]: 0.7,
    [MemoryRetentionClass.SHORT_TERM]: 0.45,
    [MemoryRetentionClass.SESSION]: 0.3,
};
exports.RETENTION_RECENCY_HALF_LIFE_DAYS = {
    [MemoryRetentionClass.USER_PINNED]: Number.POSITIVE_INFINITY,
    [MemoryRetentionClass.LONG_TERM]: 365,
    [MemoryRetentionClass.UNTIL_SUPERSEDED]: 240,
    [MemoryRetentionClass.CHALLENGE_LIFETIME]: 90,
    [MemoryRetentionClass.SHORT_TERM]: 14,
    [MemoryRetentionClass.SESSION]: 1,
};
var MemorySensitivity;
(function (MemorySensitivity) {
    MemorySensitivity["STANDARD"] = "STANDARD";
    MemorySensitivity["SENSITIVE"] = "SENSITIVE";
    MemorySensitivity["RESTRICTED"] = "RESTRICTED";
})(MemorySensitivity || (exports.MemorySensitivity = MemorySensitivity = {}));
exports.SENSITIVITY_RANK = {
    [MemorySensitivity.STANDARD]: 0,
    [MemorySensitivity.SENSITIVE]: 1,
    [MemorySensitivity.RESTRICTED]: 2,
};
var MemoryFactuality;
(function (MemoryFactuality) {
    MemoryFactuality["FACT"] = "FACT";
    MemoryFactuality["PLAN"] = "PLAN";
    MemoryFactuality["DECISION"] = "DECISION";
    MemoryFactuality["PREFERENCE"] = "PREFERENCE";
    MemoryFactuality["HYPOTHETICAL"] = "HYPOTHETICAL";
    MemoryFactuality["FORECAST_CONTEXT"] = "FORECAST_CONTEXT";
})(MemoryFactuality || (exports.MemoryFactuality = MemoryFactuality = {}));
exports.NON_FACTUAL_FACTUALITIES = [
    MemoryFactuality.HYPOTHETICAL,
    MemoryFactuality.FORECAST_CONTEXT,
];
var MemoryScope;
(function (MemoryScope) {
    MemoryScope["GLOBAL"] = "GLOBAL";
    MemoryScope["CHALLENGE"] = "CHALLENGE";
})(MemoryScope || (exports.MemoryScope = MemoryScope = {}));
var MemoryCandidateStatus;
(function (MemoryCandidateStatus) {
    MemoryCandidateStatus["PENDING"] = "PENDING";
    MemoryCandidateStatus["AWAITING_CONFIRMATION"] = "AWAITING_CONFIRMATION";
    MemoryCandidateStatus["ACCEPTED"] = "ACCEPTED";
    MemoryCandidateStatus["REJECTED"] = "REJECTED";
    MemoryCandidateStatus["MERGED"] = "MERGED";
})(MemoryCandidateStatus || (exports.MemoryCandidateStatus = MemoryCandidateStatus = {}));
var MemoryRejectionReason;
(function (MemoryRejectionReason) {
    MemoryRejectionReason["NOT_WORTH_REMEMBERING"] = "NOT_WORTH_REMEMBERING";
    MemoryRejectionReason["TRIVIAL"] = "TRIVIAL";
    MemoryRejectionReason["SENSITIVE_ATTRIBUTE_INFERENCE"] = "SENSITIVE_ATTRIBUTE_INFERENCE";
    MemoryRejectionReason["PERSONALITY_DIAGNOSIS"] = "PERSONALITY_DIAGNOSIS";
    MemoryRejectionReason["INSUFFICIENT_PATTERN_EVIDENCE"] = "INSUFFICIENT_PATTERN_EVIDENCE";
    MemoryRejectionReason["PREDICTION_AS_FACT"] = "PREDICTION_AS_FACT";
    MemoryRejectionReason["HYPOTHETICAL_AS_FACT"] = "HYPOTHETICAL_AS_FACT";
    MemoryRejectionReason["DUPLICATE"] = "DUPLICATE";
    MemoryRejectionReason["USER_REJECTED"] = "USER_REJECTED";
    MemoryRejectionReason["SAFETY_BLOCKED"] = "SAFETY_BLOCKED";
})(MemoryRejectionReason || (exports.MemoryRejectionReason = MemoryRejectionReason = {}));
var MemoryConflictResolution;
(function (MemoryConflictResolution) {
    MemoryConflictResolution["UNRESOLVED"] = "UNRESOLVED";
    MemoryConflictResolution["RESOLVED_BY_SUPERSESSION"] = "RESOLVED_BY_SUPERSESSION";
    MemoryConflictResolution["RESOLVED_BY_USER"] = "RESOLVED_BY_USER";
    MemoryConflictResolution["DISMISSED"] = "DISMISSED";
})(MemoryConflictResolution || (exports.MemoryConflictResolution = MemoryConflictResolution = {}));
var MemoryEvidenceRole;
(function (MemoryEvidenceRole) {
    MemoryEvidenceRole["SUPPORTS"] = "SUPPORTS";
    MemoryEvidenceRole["CONTRADICTS"] = "CONTRADICTS";
    MemoryEvidenceRole["ORIGIN"] = "ORIGIN";
    MemoryEvidenceRole["CONFIRMATION"] = "CONFIRMATION";
})(MemoryEvidenceRole || (exports.MemoryEvidenceRole = MemoryEvidenceRole = {}));
var MemoryRequestContext;
(function (MemoryRequestContext) {
    MemoryRequestContext["CAREER_WEEKLY_REVIEW"] = "CAREER_WEEKLY_REVIEW";
    MemoryRequestContext["CHALLENGE_GUIDANCE"] = "CHALLENGE_GUIDANCE";
    MemoryRequestContext["FUTURE_SELF_DAILY"] = "FUTURE_SELF_DAILY";
    MemoryRequestContext["FUTURE_SELF_WEEKLY"] = "FUTURE_SELF_WEEKLY";
    MemoryRequestContext["FUTURE_SELF_MILESTONE"] = "FUTURE_SELF_MILESTONE";
    MemoryRequestContext["FUTURE_SELF_REALIGNMENT"] = "FUTURE_SELF_REALIGNMENT";
    MemoryRequestContext["FUTURE_SELF_REFLECTION"] = "FUTURE_SELF_REFLECTION";
    MemoryRequestContext["PLAN_GENERATION"] = "PLAN_GENERATION";
    MemoryRequestContext["USER_MEMORY_VIEW"] = "USER_MEMORY_VIEW";
})(MemoryRequestContext || (exports.MemoryRequestContext = MemoryRequestContext = {}));
//# sourceMappingURL=memory.enum.js.map