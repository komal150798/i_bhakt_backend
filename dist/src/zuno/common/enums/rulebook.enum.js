"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULEBOOK_ROLE_PERMISSIONS = exports.RulebookPermission = exports.RulebookRole = exports.REQUIRED_RULEBOOK_SHEETS = exports.RulebookSheet = exports.ValidationSeverity = exports.RulebookAuditAction = exports.RuleReviewStatus = exports.SensitiveSubject = exports.NON_PRODUCTION_SAFETY_CLASSES = exports.RuleSafetyClass = exports.RemedyFrequency = exports.MkaDimension = exports.RemedyType = exports.TimingWindowType = exports.ThemeStrength = exports.ThemeDirection = exports.RuleTheme = exports.RuleFactorRole = exports.RuleConditionOperator = exports.RuleConditionType = exports.SmeConfidence = exports.RuleStatus = exports.RulebookReleaseType = exports.RULEBOOK_STATUS_TRANSITIONS = exports.RulebookStatus = void 0;
exports.canTransitionRulebook = canTransitionRulebook;
var RulebookStatus;
(function (RulebookStatus) {
    RulebookStatus["UPLOADED"] = "UPLOADED";
    RulebookStatus["VALIDATING"] = "VALIDATING";
    RulebookStatus["VALIDATION_FAILED"] = "VALIDATION_FAILED";
    RulebookStatus["VALIDATED"] = "VALIDATED";
    RulebookStatus["SME_REVIEW_IN_PROGRESS"] = "SME_REVIEW_IN_PROGRESS";
    RulebookStatus["SME_REVIEWED"] = "SME_REVIEWED";
    RulebookStatus["SME_REJECTED"] = "SME_REJECTED";
    RulebookStatus["STAGING"] = "STAGING";
    RulebookStatus["REGRESSION_RUNNING"] = "REGRESSION_RUNNING";
    RulebookStatus["REGRESSION_PASSED"] = "REGRESSION_PASSED";
    RulebookStatus["REGRESSION_FAILED"] = "REGRESSION_FAILED";
    RulebookStatus["APPROVED"] = "APPROVED";
    RulebookStatus["PRODUCTION"] = "PRODUCTION";
    RulebookStatus["SUPERSEDED"] = "SUPERSEDED";
    RulebookStatus["ROLLED_BACK"] = "ROLLED_BACK";
    RulebookStatus["ARCHIVED"] = "ARCHIVED";
})(RulebookStatus || (exports.RulebookStatus = RulebookStatus = {}));
exports.RULEBOOK_STATUS_TRANSITIONS = {
    [RulebookStatus.UPLOADED]: [RulebookStatus.VALIDATING, RulebookStatus.ARCHIVED],
    [RulebookStatus.VALIDATING]: [
        RulebookStatus.VALIDATED,
        RulebookStatus.VALIDATION_FAILED,
    ],
    [RulebookStatus.VALIDATION_FAILED]: [
        RulebookStatus.VALIDATING,
        RulebookStatus.ARCHIVED,
    ],
    [RulebookStatus.VALIDATED]: [
        RulebookStatus.SME_REVIEW_IN_PROGRESS,
        RulebookStatus.ARCHIVED,
    ],
    [RulebookStatus.SME_REVIEW_IN_PROGRESS]: [
        RulebookStatus.SME_REVIEWED,
        RulebookStatus.SME_REJECTED,
    ],
    [RulebookStatus.SME_REJECTED]: [
        RulebookStatus.SME_REVIEW_IN_PROGRESS,
        RulebookStatus.ARCHIVED,
    ],
    [RulebookStatus.SME_REVIEWED]: [RulebookStatus.STAGING, RulebookStatus.ARCHIVED],
    [RulebookStatus.STAGING]: [
        RulebookStatus.REGRESSION_RUNNING,
        RulebookStatus.ARCHIVED,
    ],
    [RulebookStatus.REGRESSION_RUNNING]: [
        RulebookStatus.REGRESSION_PASSED,
        RulebookStatus.REGRESSION_FAILED,
    ],
    [RulebookStatus.REGRESSION_FAILED]: [
        RulebookStatus.STAGING,
        RulebookStatus.ARCHIVED,
    ],
    [RulebookStatus.REGRESSION_PASSED]: [
        RulebookStatus.APPROVED,
        RulebookStatus.ARCHIVED,
    ],
    [RulebookStatus.APPROVED]: [RulebookStatus.PRODUCTION, RulebookStatus.ARCHIVED],
    [RulebookStatus.PRODUCTION]: [
        RulebookStatus.SUPERSEDED,
        RulebookStatus.ROLLED_BACK,
    ],
    [RulebookStatus.SUPERSEDED]: [
        RulebookStatus.PRODUCTION,
        RulebookStatus.ARCHIVED,
    ],
    [RulebookStatus.ROLLED_BACK]: [RulebookStatus.ARCHIVED],
    [RulebookStatus.ARCHIVED]: [],
};
function canTransitionRulebook(from, to) {
    return (exports.RULEBOOK_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
var RulebookReleaseType;
(function (RulebookReleaseType) {
    RulebookReleaseType["PATCH"] = "PATCH";
    RulebookReleaseType["MINOR"] = "MINOR";
    RulebookReleaseType["MAJOR"] = "MAJOR";
})(RulebookReleaseType || (exports.RulebookReleaseType = RulebookReleaseType = {}));
var RuleStatus;
(function (RuleStatus) {
    RuleStatus["DRAFT"] = "DRAFT";
    RuleStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    RuleStatus["APPROVED"] = "APPROVED";
    RuleStatus["DISABLED"] = "DISABLED";
    RuleStatus["DEPRECATED"] = "DEPRECATED";
})(RuleStatus || (exports.RuleStatus = RuleStatus = {}));
var SmeConfidence;
(function (SmeConfidence) {
    SmeConfidence["ESTABLISHED"] = "ESTABLISHED";
    SmeConfidence["STRONG"] = "STRONG";
    SmeConfidence["CONTEXT_DEPENDENT"] = "CONTEXT_DEPENDENT";
    SmeConfidence["EXPERIMENTAL"] = "EXPERIMENTAL";
})(SmeConfidence || (exports.SmeConfidence = SmeConfidence = {}));
var RuleConditionType;
(function (RuleConditionType) {
    RuleConditionType["PLANET_IN_HOUSE"] = "PLANET_IN_HOUSE";
    RuleConditionType["PLANET_IN_SIGN"] = "PLANET_IN_SIGN";
    RuleConditionType["HOUSE_LORD_IN_HOUSE"] = "HOUSE_LORD_IN_HOUSE";
    RuleConditionType["HOUSE_LORD_RELATIONSHIP"] = "HOUSE_LORD_RELATIONSHIP";
    RuleConditionType["PLANET_ASPECT"] = "PLANET_ASPECT";
    RuleConditionType["PLANET_CONJUNCTION"] = "PLANET_CONJUNCTION";
    RuleConditionType["PLANET_RETROGRADE"] = "PLANET_RETROGRADE";
    RuleConditionType["PLANET_COMBUST"] = "PLANET_COMBUST";
    RuleConditionType["DASHA_LORD"] = "DASHA_LORD";
    RuleConditionType["BHUKTI_LORD"] = "BHUKTI_LORD";
    RuleConditionType["ANTARA_LORD"] = "ANTARA_LORD";
    RuleConditionType["TRANSIT_IN_HOUSE"] = "TRANSIT_IN_HOUSE";
    RuleConditionType["TRANSIT_ASPECT"] = "TRANSIT_ASPECT";
    RuleConditionType["NAKSHATRA"] = "NAKSHATRA";
    RuleConditionType["DIVISIONAL_POSITION"] = "DIVISIONAL_POSITION";
    RuleConditionType["MULTIPLE_CONDITION"] = "MULTIPLE_CONDITION";
})(RuleConditionType || (exports.RuleConditionType = RuleConditionType = {}));
var RuleConditionOperator;
(function (RuleConditionOperator) {
    RuleConditionOperator["AND"] = "AND";
    RuleConditionOperator["OR"] = "OR";
    RuleConditionOperator["NOT"] = "NOT";
})(RuleConditionOperator || (exports.RuleConditionOperator = RuleConditionOperator = {}));
var RuleFactorRole;
(function (RuleFactorRole) {
    RuleFactorRole["PRIMARY"] = "PRIMARY";
    RuleFactorRole["SUPPORTING"] = "SUPPORTING";
    RuleFactorRole["COUNTER"] = "COUNTER";
})(RuleFactorRole || (exports.RuleFactorRole = RuleFactorRole = {}));
var RuleTheme;
(function (RuleTheme) {
    RuleTheme["VOLATILITY"] = "VOLATILITY";
    RuleTheme["DELAY"] = "DELAY";
    RuleTheme["RENEGOTIATION"] = "RENEGOTIATION";
    RuleTheme["TRANSITION"] = "TRANSITION";
    RuleTheme["PRESSURE"] = "PRESSURE";
    RuleTheme["RECOVERY_SUPPORT"] = "RECOVERY_SUPPORT";
    RuleTheme["NETWORK_SUPPORT"] = "NETWORK_SUPPORT";
    RuleTheme["FINANCIAL_PRESSURE"] = "FINANCIAL_PRESSURE";
    RuleTheme["OPPORTUNITY"] = "OPPORTUNITY";
    RuleTheme["STABILITY"] = "STABILITY";
    RuleTheme["GROWTH"] = "GROWTH";
    RuleTheme["REASSESSMENT"] = "REASSESSMENT";
    RuleTheme["CAUTION"] = "CAUTION";
    RuleTheme["PREPARATION"] = "PREPARATION";
})(RuleTheme || (exports.RuleTheme = RuleTheme = {}));
var ThemeDirection;
(function (ThemeDirection) {
    ThemeDirection["SUPPORTIVE"] = "SUPPORTIVE";
    ThemeDirection["CAUTION"] = "CAUTION";
    ThemeDirection["NEUTRAL"] = "NEUTRAL";
    ThemeDirection["MIXED"] = "MIXED";
})(ThemeDirection || (exports.ThemeDirection = ThemeDirection = {}));
var ThemeStrength;
(function (ThemeStrength) {
    ThemeStrength["LOW"] = "LOW";
    ThemeStrength["MODERATE"] = "MODERATE";
    ThemeStrength["HIGH"] = "HIGH";
    ThemeStrength["VERY_HIGH"] = "VERY_HIGH";
})(ThemeStrength || (exports.ThemeStrength = ThemeStrength = {}));
var TimingWindowType;
(function (TimingWindowType) {
    TimingWindowType["PREPARATION"] = "PREPARATION";
    TimingWindowType["CAUTION"] = "CAUTION";
    TimingWindowType["TRANSITION"] = "TRANSITION";
    TimingWindowType["REVIEW"] = "REVIEW";
    TimingWindowType["SUPPORT"] = "SUPPORT";
    TimingWindowType["STABILISATION"] = "STABILISATION";
    TimingWindowType["GROWTH"] = "GROWTH";
})(TimingWindowType || (exports.TimingWindowType = TimingWindowType = {}));
var RemedyType;
(function (RemedyType) {
    RemedyType["MANTRA"] = "MANTRA";
    RemedyType["MEDITATION"] = "MEDITATION";
    RemedyType["DISCIPLINE"] = "DISCIPLINE";
    RemedyType["SERVICE"] = "SERVICE";
    RemedyType["CHARITY"] = "CHARITY";
    RemedyType["DEVOTIONAL"] = "DEVOTIONAL";
    RemedyType["RITUAL"] = "RITUAL";
    RemedyType["BEHAVIOURAL"] = "BEHAVIOURAL";
    RemedyType["LIFESTYLE"] = "LIFESTYLE";
})(RemedyType || (exports.RemedyType = RemedyType = {}));
var MkaDimension;
(function (MkaDimension) {
    MkaDimension["MIND"] = "MIND";
    MkaDimension["KARMA"] = "KARMA";
    MkaDimension["ACTION"] = "ACTION";
})(MkaDimension || (exports.MkaDimension = MkaDimension = {}));
var RemedyFrequency;
(function (RemedyFrequency) {
    RemedyFrequency["ONE_TIME"] = "ONE_TIME";
    RemedyFrequency["DAILY"] = "DAILY";
    RemedyFrequency["WEEKLY"] = "WEEKLY";
    RemedyFrequency["MONTHLY"] = "MONTHLY";
    RemedyFrequency["OCCASIONAL"] = "OCCASIONAL";
})(RemedyFrequency || (exports.RemedyFrequency = RemedyFrequency = {}));
var RuleSafetyClass;
(function (RuleSafetyClass) {
    RuleSafetyClass["STANDARD"] = "STANDARD";
    RuleSafetyClass["LOW_RISK"] = "LOW_RISK";
    RuleSafetyClass["REQUIRES_CAUTION"] = "REQUIRES_CAUTION";
    RuleSafetyClass["SME_SUPERVISION"] = "SME_SUPERVISION";
    RuleSafetyClass["EXCLUDE_PENDING_SPECIAL_REVIEW"] = "EXCLUDE_PENDING_SPECIAL_REVIEW";
})(RuleSafetyClass || (exports.RuleSafetyClass = RuleSafetyClass = {}));
exports.NON_PRODUCTION_SAFETY_CLASSES = [
    RuleSafetyClass.EXCLUDE_PENDING_SPECIAL_REVIEW,
    RuleSafetyClass.SME_SUPERVISION,
];
var SensitiveSubject;
(function (SensitiveSubject) {
    SensitiveSubject["HEALTH"] = "HEALTH";
    SensitiveSubject["DISEASE"] = "DISEASE";
    SensitiveSubject["DEATH"] = "DEATH";
    SensitiveSubject["LONGEVITY"] = "LONGEVITY";
    SensitiveSubject["MISSING_PERSON"] = "MISSING_PERSON";
    SensitiveSubject["PREGNANCY"] = "PREGNANCY";
    SensitiveSubject["CHILD_GENDER"] = "CHILD_GENDER";
    SensitiveSubject["LEGAL_CONSEQUENCE"] = "LEGAL_CONSEQUENCE";
    SensitiveSubject["FINANCIAL_LOSS"] = "FINANCIAL_LOSS";
})(SensitiveSubject || (exports.SensitiveSubject = SensitiveSubject = {}));
var RuleReviewStatus;
(function (RuleReviewStatus) {
    RuleReviewStatus["PENDING"] = "PENDING";
    RuleReviewStatus["APPROVED"] = "APPROVED";
    RuleReviewStatus["REJECTED"] = "REJECTED";
    RuleReviewStatus["NEEDS_CLARIFICATION"] = "NEEDS_CLARIFICATION";
    RuleReviewStatus["POSSIBLE_DUPLICATE"] = "POSSIBLE_DUPLICATE";
})(RuleReviewStatus || (exports.RuleReviewStatus = RuleReviewStatus = {}));
var RulebookAuditAction;
(function (RulebookAuditAction) {
    RulebookAuditAction["RULEBOOK_UPLOADED"] = "RULEBOOK_UPLOADED";
    RulebookAuditAction["VALIDATION_STARTED"] = "VALIDATION_STARTED";
    RulebookAuditAction["VALIDATION_FAILED"] = "VALIDATION_FAILED";
    RulebookAuditAction["VALIDATION_PASSED"] = "VALIDATION_PASSED";
    RulebookAuditAction["SME_REVIEW_STARTED"] = "SME_REVIEW_STARTED";
    RulebookAuditAction["SME_APPROVED"] = "SME_APPROVED";
    RulebookAuditAction["SME_REJECTED"] = "SME_REJECTED";
    RulebookAuditAction["STAGING_ACTIVATED"] = "STAGING_ACTIVATED";
    RulebookAuditAction["REGRESSION_STARTED"] = "REGRESSION_STARTED";
    RulebookAuditAction["REGRESSION_PASSED"] = "REGRESSION_PASSED";
    RulebookAuditAction["REGRESSION_FAILED"] = "REGRESSION_FAILED";
    RulebookAuditAction["PRODUCTION_ACTIVATED"] = "PRODUCTION_ACTIVATED";
    RulebookAuditAction["ROLLBACK_INITIATED"] = "ROLLBACK_INITIATED";
    RulebookAuditAction["ROLLBACK_COMPLETED"] = "ROLLBACK_COMPLETED";
    RulebookAuditAction["RULEBOOK_ARCHIVED"] = "RULEBOOK_ARCHIVED";
})(RulebookAuditAction || (exports.RulebookAuditAction = RulebookAuditAction = {}));
var ValidationSeverity;
(function (ValidationSeverity) {
    ValidationSeverity["ERROR"] = "ERROR";
    ValidationSeverity["WARNING"] = "WARNING";
    ValidationSeverity["INFO"] = "INFO";
})(ValidationSeverity || (exports.ValidationSeverity = ValidationSeverity = {}));
var RulebookSheet;
(function (RulebookSheet) {
    RulebookSheet["CONFIGURATION"] = "CONFIGURATION";
    RulebookSheet["DOMAINS"] = "DOMAINS";
    RulebookSheet["RULES"] = "RULES";
    RulebookSheet["INTERPRETATIONS"] = "INTERPRETATIONS";
    RulebookSheet["TIMING_RULES"] = "TIMING_RULES";
    RulebookSheet["REMEDIES"] = "REMEDIES";
    RulebookSheet["REMEDY_MAPPING"] = "REMEDY_MAPPING";
    RulebookSheet["CONFLICT_RULES"] = "CONFLICT_RULES";
    RulebookSheet["GOLDEN_CASES"] = "GOLDEN_CASES";
})(RulebookSheet || (exports.RulebookSheet = RulebookSheet = {}));
exports.REQUIRED_RULEBOOK_SHEETS = [
    RulebookSheet.DOMAINS,
    RulebookSheet.RULES,
    RulebookSheet.INTERPRETATIONS,
];
var RulebookRole;
(function (RulebookRole) {
    RulebookRole["SYSTEM_ADMIN"] = "SYSTEM_ADMIN";
    RulebookRole["ASTROLOGY_SME"] = "ASTROLOGY_SME";
    RulebookRole["PRODUCT_ADMIN"] = "PRODUCT_ADMIN";
    RulebookRole["SUPPORT"] = "SUPPORT";
})(RulebookRole || (exports.RulebookRole = RulebookRole = {}));
var RulebookPermission;
(function (RulebookPermission) {
    RulebookPermission["RULEBOOK_UPLOAD"] = "RULEBOOK_UPLOAD";
    RulebookPermission["RULEBOOK_VALIDATE"] = "RULEBOOK_VALIDATE";
    RulebookPermission["RULEBOOK_REVIEW"] = "RULEBOOK_REVIEW";
    RulebookPermission["RULEBOOK_APPROVE"] = "RULEBOOK_APPROVE";
    RulebookPermission["RULEBOOK_STAGE"] = "RULEBOOK_STAGE";
    RulebookPermission["RULEBOOK_ACTIVATE"] = "RULEBOOK_ACTIVATE";
    RulebookPermission["RULEBOOK_ROLLBACK"] = "RULEBOOK_ROLLBACK";
    RulebookPermission["RULEBOOK_VIEW"] = "RULEBOOK_VIEW";
})(RulebookPermission || (exports.RulebookPermission = RulebookPermission = {}));
exports.RULEBOOK_ROLE_PERMISSIONS = {
    [RulebookRole.SYSTEM_ADMIN]: [
        RulebookPermission.RULEBOOK_UPLOAD,
        RulebookPermission.RULEBOOK_VALIDATE,
        RulebookPermission.RULEBOOK_STAGE,
        RulebookPermission.RULEBOOK_ACTIVATE,
        RulebookPermission.RULEBOOK_ROLLBACK,
        RulebookPermission.RULEBOOK_VIEW,
    ],
    [RulebookRole.ASTROLOGY_SME]: [
        RulebookPermission.RULEBOOK_REVIEW,
        RulebookPermission.RULEBOOK_APPROVE,
        RulebookPermission.RULEBOOK_VIEW,
    ],
    [RulebookRole.PRODUCT_ADMIN]: [
        RulebookPermission.RULEBOOK_VIEW,
        RulebookPermission.RULEBOOK_ACTIVATE,
    ],
    [RulebookRole.SUPPORT]: [RulebookPermission.RULEBOOK_VIEW],
};
//# sourceMappingURL=rulebook.enum.js.map