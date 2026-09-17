"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MKA_ENGINE_VERSION = exports.MKA_MAX_ASTRO_REMEDIES = exports.MKA_DIMENSION_LIMITS = exports.MkaRemedyStatus = exports.MkaReviewTrigger = exports.MkaCompletionSource = exports.MkaCompletionStatus = exports.MKA_ITEM_TRANSITIONS = exports.MkaItemStatus = exports.MkaPriority = exports.MkaFrequency = exports.ASTRO_DERIVED_SOURCE_TYPES = exports.MkaSourceType = exports.MKA_PERIOD_DAYS = exports.MkaPeriodType = exports.MKA_PROGRAM_TRANSITIONS = exports.MkaProgramStatus = exports.MkaDimension = void 0;
exports.canTransitionMkaProgram = canTransitionMkaProgram;
exports.canTransitionMkaItem = canTransitionMkaItem;
const enums_1 = require("../../common/enums");
Object.defineProperty(exports, "MkaDimension", { enumerable: true, get: function () { return enums_1.MkaDimension; } });
var MkaProgramStatus;
(function (MkaProgramStatus) {
    MkaProgramStatus["DRAFT"] = "DRAFT";
    MkaProgramStatus["ACTIVE"] = "ACTIVE";
    MkaProgramStatus["EXPIRED"] = "EXPIRED";
    MkaProgramStatus["COMPLETED"] = "COMPLETED";
    MkaProgramStatus["SUPERSEDED"] = "SUPERSEDED";
    MkaProgramStatus["CANCELLED"] = "CANCELLED";
})(MkaProgramStatus || (exports.MkaProgramStatus = MkaProgramStatus = {}));
exports.MKA_PROGRAM_TRANSITIONS = {
    [MkaProgramStatus.DRAFT]: [
        MkaProgramStatus.ACTIVE,
        MkaProgramStatus.CANCELLED,
        MkaProgramStatus.SUPERSEDED,
    ],
    [MkaProgramStatus.ACTIVE]: [
        MkaProgramStatus.EXPIRED,
        MkaProgramStatus.COMPLETED,
        MkaProgramStatus.SUPERSEDED,
        MkaProgramStatus.CANCELLED,
    ],
    [MkaProgramStatus.EXPIRED]: [
        MkaProgramStatus.COMPLETED,
        MkaProgramStatus.SUPERSEDED,
        MkaProgramStatus.ACTIVE,
    ],
    [MkaProgramStatus.COMPLETED]: [],
    [MkaProgramStatus.SUPERSEDED]: [],
    [MkaProgramStatus.CANCELLED]: [],
};
function canTransitionMkaProgram(from, to) {
    return (exports.MKA_PROGRAM_TRANSITIONS[from] ?? []).includes(to);
}
var MkaPeriodType;
(function (MkaPeriodType) {
    MkaPeriodType["WEEK"] = "WEEK";
    MkaPeriodType["FORTNIGHT"] = "FORTNIGHT";
    MkaPeriodType["MONTH"] = "MONTH";
    MkaPeriodType["CUSTOM"] = "CUSTOM";
})(MkaPeriodType || (exports.MkaPeriodType = MkaPeriodType = {}));
exports.MKA_PERIOD_DAYS = {
    [MkaPeriodType.WEEK]: 7,
    [MkaPeriodType.FORTNIGHT]: 14,
    [MkaPeriodType.MONTH]: 30,
    [MkaPeriodType.CUSTOM]: 7,
};
var MkaSourceType;
(function (MkaSourceType) {
    MkaSourceType["APPROVED_ASTRO_REMEDY"] = "APPROVED_ASTRO_REMEDY";
    MkaSourceType["ZUNO_BEHAVIOURAL_GUIDANCE"] = "ZUNO_BEHAVIOURAL_GUIDANCE";
    MkaSourceType["SERVICE"] = "SERVICE";
    MkaSourceType["GRATITUDE"] = "GRATITUDE";
    MkaSourceType["DISCIPLINE"] = "DISCIPLINE";
    MkaSourceType["GENEROSITY"] = "GENEROSITY";
    MkaSourceType["REFLECTION"] = "REFLECTION";
    MkaSourceType["RELATIONSHIP_REPAIR"] = "RELATIONSHIP_REPAIR";
    MkaSourceType["RESPONSIBILITY"] = "RESPONSIBILITY";
    MkaSourceType["CONSTRUCTIVE_HABIT"] = "CONSTRUCTIVE_HABIT";
    MkaSourceType["SME_APPROVED_PRACTICE"] = "SME_APPROVED_PRACTICE";
    MkaSourceType["WHATNOW"] = "WHATNOW";
    MkaSourceType["SCENARIO_PREPARATION"] = "SCENARIO_PREPARATION";
    MkaSourceType["REALIGNMENT"] = "REALIGNMENT";
    MkaSourceType["USER_GOAL"] = "USER_GOAL";
    MkaSourceType["PLAN_REQUIREMENT"] = "PLAN_REQUIREMENT";
    MkaSourceType["EXPERT_SAFE_GENERAL_GUIDANCE"] = "EXPERT_SAFE_GENERAL_GUIDANCE";
})(MkaSourceType || (exports.MkaSourceType = MkaSourceType = {}));
exports.ASTRO_DERIVED_SOURCE_TYPES = [
    MkaSourceType.APPROVED_ASTRO_REMEDY,
    MkaSourceType.SME_APPROVED_PRACTICE,
];
var MkaFrequency;
(function (MkaFrequency) {
    MkaFrequency["ONCE"] = "ONCE";
    MkaFrequency["DAILY"] = "DAILY";
    MkaFrequency["WEEKDAYS"] = "WEEKDAYS";
    MkaFrequency["SPECIFIC_DAY"] = "SPECIFIC_DAY";
    MkaFrequency["WEEKLY"] = "WEEKLY";
    MkaFrequency["CUSTOM"] = "CUSTOM";
    MkaFrequency["EVENT_TRIGGERED"] = "EVENT_TRIGGERED";
})(MkaFrequency || (exports.MkaFrequency = MkaFrequency = {}));
var MkaPriority;
(function (MkaPriority) {
    MkaPriority["ESSENTIAL"] = "ESSENTIAL";
    MkaPriority["IMPORTANT"] = "IMPORTANT";
    MkaPriority["OPTIONAL"] = "OPTIONAL";
})(MkaPriority || (exports.MkaPriority = MkaPriority = {}));
var MkaItemStatus;
(function (MkaItemStatus) {
    MkaItemStatus["ACTIVE"] = "ACTIVE";
    MkaItemStatus["COMPLETED"] = "COMPLETED";
    MkaItemStatus["EXPIRED"] = "EXPIRED";
    MkaItemStatus["DECLINED"] = "DECLINED";
    MkaItemStatus["NO_LONGER_RELEVANT"] = "NO_LONGER_RELEVANT";
    MkaItemStatus["CANCELLED_BY_REALIGNMENT"] = "CANCELLED_BY_REALIGNMENT";
})(MkaItemStatus || (exports.MkaItemStatus = MkaItemStatus = {}));
exports.MKA_ITEM_TRANSITIONS = {
    [MkaItemStatus.ACTIVE]: [
        MkaItemStatus.COMPLETED,
        MkaItemStatus.EXPIRED,
        MkaItemStatus.DECLINED,
        MkaItemStatus.NO_LONGER_RELEVANT,
        MkaItemStatus.CANCELLED_BY_REALIGNMENT,
    ],
    [MkaItemStatus.COMPLETED]: [],
    [MkaItemStatus.EXPIRED]: [
        MkaItemStatus.NO_LONGER_RELEVANT,
        MkaItemStatus.CANCELLED_BY_REALIGNMENT,
    ],
    [MkaItemStatus.DECLINED]: [MkaItemStatus.NO_LONGER_RELEVANT],
    [MkaItemStatus.NO_LONGER_RELEVANT]: [],
    [MkaItemStatus.CANCELLED_BY_REALIGNMENT]: [],
};
function canTransitionMkaItem(from, to) {
    return (exports.MKA_ITEM_TRANSITIONS[from] ?? []).includes(to);
}
var MkaCompletionStatus;
(function (MkaCompletionStatus) {
    MkaCompletionStatus["DONE"] = "DONE";
    MkaCompletionStatus["NOT_DONE"] = "NOT_DONE";
    MkaCompletionStatus["MISSED"] = "MISSED";
    MkaCompletionStatus["SKIPPED"] = "SKIPPED";
    MkaCompletionStatus["DEFERRED"] = "DEFERRED";
    MkaCompletionStatus["NO_LONGER_RELEVANT"] = "NO_LONGER_RELEVANT";
    MkaCompletionStatus["CANCELLED_BY_REALIGNMENT"] = "CANCELLED_BY_REALIGNMENT";
})(MkaCompletionStatus || (exports.MkaCompletionStatus = MkaCompletionStatus = {}));
var MkaCompletionSource;
(function (MkaCompletionSource) {
    MkaCompletionSource["USER"] = "USER";
    MkaCompletionSource["SYSTEM"] = "SYSTEM";
    MkaCompletionSource["PLAN"] = "PLAN";
    MkaCompletionSource["REALIGNMENT"] = "REALIGNMENT";
})(MkaCompletionSource || (exports.MkaCompletionSource = MkaCompletionSource = {}));
var MkaReviewTrigger;
(function (MkaReviewTrigger) {
    MkaReviewTrigger["END_OF_PERIOD"] = "END_OF_PERIOD";
    MkaReviewTrigger["LIFE_SIGNAL"] = "LIFE_SIGNAL";
    MkaReviewTrigger["MAJOR_REALIGNMENT"] = "MAJOR_REALIGNMENT";
    MkaReviewTrigger["TIMING_WINDOW_CHANGE"] = "TIMING_WINDOW_CHANGE";
    MkaReviewTrigger["USER_REQUEST"] = "USER_REQUEST";
})(MkaReviewTrigger || (exports.MkaReviewTrigger = MkaReviewTrigger = {}));
var MkaRemedyStatus;
(function (MkaRemedyStatus) {
    MkaRemedyStatus["APPROVED_RULE_APPLIED"] = "APPROVED_RULE_APPLIED";
    MkaRemedyStatus["NO_APPROVED_RULE_AVAILABLE"] = "NO_APPROVED_RULE_AVAILABLE";
    MkaRemedyStatus["SUPPRESSED_BY_SAFETY"] = "SUPPRESSED_BY_SAFETY";
    MkaRemedyStatus["DECLINED_BY_USER_PREFERENCE"] = "DECLINED_BY_USER_PREFERENCE";
})(MkaRemedyStatus || (exports.MkaRemedyStatus = MkaRemedyStatus = {}));
exports.MKA_DIMENSION_LIMITS = {
    [enums_1.MkaDimension.MIND]: 1,
    [enums_1.MkaDimension.KARMA]: 2,
    [enums_1.MkaDimension.ACTION]: 3,
};
exports.MKA_MAX_ASTRO_REMEDIES = 1;
exports.MKA_ENGINE_VERSION = 'mka-engine-1.0.0';
//# sourceMappingURL=mka.enum.js.map