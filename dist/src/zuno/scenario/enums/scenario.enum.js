"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCENARIO_LOW_CONFIDENCE_THRESHOLD = exports.WHAT_IF_MAX_CASCADE_DEPTH = exports.SCENARIO_MAX_USER_FACING = exports.SCENARIO_PREFERRED_USER_FACING = exports.SCENARIO_MIN_USER_FACING = exports.ScenarioChangeType = exports.WhatIfAssumptionType = exports.WhatIfSessionStatus = exports.ScenarioSetStatus = exports.DecisionReadiness = exports.Reversibility = exports.ScenarioConditionType = exports.PreparationClass = exports.UNSUPPORTED_EVIDENCE_CLASSES = exports.ScenarioEvidenceClass = exports.SCENARIO_STATUS_TRANSITIONS = exports.ScenarioStatus = exports.ScenarioHorizon = exports.SCENARIO_IMPACT_WEIGHT = exports.ScenarioImpact = exports.SCENARIO_RELEVANCE_WEIGHT = exports.ScenarioRelevance = exports.SCENARIO_TYPE_CASE_CLASS = exports.ScenarioCaseClass = exports.SCENARIO_TYPES = exports.ScenarioType = void 0;
exports.canTransitionScenario = canTransitionScenario;
var ScenarioType;
(function (ScenarioType) {
    ScenarioType["CONTINUITY"] = "CONTINUITY";
    ScenarioType["CHANGE"] = "CHANGE";
    ScenarioType["TRANSITION"] = "TRANSITION";
    ScenarioType["RECOVERY"] = "RECOVERY";
    ScenarioType["OPPORTUNITY"] = "OPPORTUNITY";
    ScenarioType["DECISION"] = "DECISION";
    ScenarioType["CONTINGENCY"] = "CONTINGENCY";
    ScenarioType["USER_DEFINED_WHAT_IF"] = "USER_DEFINED_WHAT_IF";
})(ScenarioType || (exports.ScenarioType = ScenarioType = {}));
exports.SCENARIO_TYPES = Object.values(ScenarioType);
var ScenarioCaseClass;
(function (ScenarioCaseClass) {
    ScenarioCaseClass["BASE_CASE"] = "BASE_CASE";
    ScenarioCaseClass["POSITIVE_CASE"] = "POSITIVE_CASE";
    ScenarioCaseClass["ADVERSE_CASE"] = "ADVERSE_CASE";
    ScenarioCaseClass["USER_DEFINED"] = "USER_DEFINED";
    ScenarioCaseClass["SYSTEM_GENERATED"] = "SYSTEM_GENERATED";
})(ScenarioCaseClass || (exports.ScenarioCaseClass = ScenarioCaseClass = {}));
exports.SCENARIO_TYPE_CASE_CLASS = {
    [ScenarioType.CONTINUITY]: ScenarioCaseClass.BASE_CASE,
    [ScenarioType.CHANGE]: ScenarioCaseClass.SYSTEM_GENERATED,
    [ScenarioType.TRANSITION]: ScenarioCaseClass.ADVERSE_CASE,
    [ScenarioType.RECOVERY]: ScenarioCaseClass.ADVERSE_CASE,
    [ScenarioType.OPPORTUNITY]: ScenarioCaseClass.POSITIVE_CASE,
    [ScenarioType.DECISION]: ScenarioCaseClass.SYSTEM_GENERATED,
    [ScenarioType.CONTINGENCY]: ScenarioCaseClass.ADVERSE_CASE,
    [ScenarioType.USER_DEFINED_WHAT_IF]: ScenarioCaseClass.USER_DEFINED,
};
var ScenarioRelevance;
(function (ScenarioRelevance) {
    ScenarioRelevance["HIGH"] = "HIGH";
    ScenarioRelevance["MEDIUM"] = "MEDIUM";
    ScenarioRelevance["LOW"] = "LOW";
    ScenarioRelevance["CONTINGENCY"] = "CONTINGENCY";
})(ScenarioRelevance || (exports.ScenarioRelevance = ScenarioRelevance = {}));
exports.SCENARIO_RELEVANCE_WEIGHT = {
    [ScenarioRelevance.HIGH]: 3,
    [ScenarioRelevance.MEDIUM]: 2,
    [ScenarioRelevance.CONTINGENCY]: 1,
    [ScenarioRelevance.LOW]: 0,
};
var ScenarioImpact;
(function (ScenarioImpact) {
    ScenarioImpact["LOW"] = "LOW";
    ScenarioImpact["MODERATE"] = "MODERATE";
    ScenarioImpact["HIGH"] = "HIGH";
    ScenarioImpact["CRITICAL"] = "CRITICAL";
})(ScenarioImpact || (exports.ScenarioImpact = ScenarioImpact = {}));
exports.SCENARIO_IMPACT_WEIGHT = {
    [ScenarioImpact.LOW]: 0,
    [ScenarioImpact.MODERATE]: 1,
    [ScenarioImpact.HIGH]: 2,
    [ScenarioImpact.CRITICAL]: 3,
};
var ScenarioHorizon;
(function (ScenarioHorizon) {
    ScenarioHorizon["IMMEDIATE"] = "IMMEDIATE";
    ScenarioHorizon["NEAR_TERM"] = "NEAR_TERM";
    ScenarioHorizon["MEDIUM_TERM"] = "MEDIUM_TERM";
    ScenarioHorizon["LONG_TERM"] = "LONG_TERM";
    ScenarioHorizon["UNSPECIFIED"] = "UNSPECIFIED";
})(ScenarioHorizon || (exports.ScenarioHorizon = ScenarioHorizon = {}));
var ScenarioStatus;
(function (ScenarioStatus) {
    ScenarioStatus["ACTIVE_CANDIDATE"] = "ACTIVE_CANDIDATE";
    ScenarioStatus["INCREASING"] = "INCREASING";
    ScenarioStatus["DECREASING"] = "DECREASING";
    ScenarioStatus["LIKELY_PATH"] = "LIKELY_PATH";
    ScenarioStatus["TRIGGERED"] = "TRIGGERED";
    ScenarioStatus["DISMISSED"] = "DISMISSED";
    ScenarioStatus["RESOLVED"] = "RESOLVED";
    ScenarioStatus["ARCHIVED"] = "ARCHIVED";
    ScenarioStatus["USER_ADOPTED"] = "USER_ADOPTED";
    ScenarioStatus["USER_REJECTED"] = "USER_REJECTED";
})(ScenarioStatus || (exports.ScenarioStatus = ScenarioStatus = {}));
exports.SCENARIO_STATUS_TRANSITIONS = {
    [ScenarioStatus.ACTIVE_CANDIDATE]: [
        ScenarioStatus.INCREASING,
        ScenarioStatus.DECREASING,
        ScenarioStatus.LIKELY_PATH,
        ScenarioStatus.TRIGGERED,
        ScenarioStatus.DISMISSED,
        ScenarioStatus.RESOLVED,
        ScenarioStatus.ARCHIVED,
        ScenarioStatus.USER_ADOPTED,
        ScenarioStatus.USER_REJECTED,
    ],
    [ScenarioStatus.INCREASING]: [
        ScenarioStatus.LIKELY_PATH,
        ScenarioStatus.DECREASING,
        ScenarioStatus.ACTIVE_CANDIDATE,
        ScenarioStatus.TRIGGERED,
        ScenarioStatus.DISMISSED,
        ScenarioStatus.RESOLVED,
        ScenarioStatus.ARCHIVED,
        ScenarioStatus.USER_ADOPTED,
        ScenarioStatus.USER_REJECTED,
    ],
    [ScenarioStatus.DECREASING]: [
        ScenarioStatus.ACTIVE_CANDIDATE,
        ScenarioStatus.INCREASING,
        ScenarioStatus.DISMISSED,
        ScenarioStatus.RESOLVED,
        ScenarioStatus.ARCHIVED,
        ScenarioStatus.USER_REJECTED,
    ],
    [ScenarioStatus.LIKELY_PATH]: [
        ScenarioStatus.TRIGGERED,
        ScenarioStatus.INCREASING,
        ScenarioStatus.DECREASING,
        ScenarioStatus.RESOLVED,
        ScenarioStatus.ARCHIVED,
        ScenarioStatus.USER_ADOPTED,
        ScenarioStatus.USER_REJECTED,
    ],
    [ScenarioStatus.TRIGGERED]: [ScenarioStatus.RESOLVED, ScenarioStatus.ARCHIVED],
    [ScenarioStatus.DISMISSED]: [ScenarioStatus.ARCHIVED, ScenarioStatus.ACTIVE_CANDIDATE],
    [ScenarioStatus.RESOLVED]: [ScenarioStatus.ARCHIVED],
    [ScenarioStatus.ARCHIVED]: [],
    [ScenarioStatus.USER_ADOPTED]: [
        ScenarioStatus.TRIGGERED,
        ScenarioStatus.RESOLVED,
        ScenarioStatus.ARCHIVED,
        ScenarioStatus.USER_REJECTED,
    ],
    [ScenarioStatus.USER_REJECTED]: [
        ScenarioStatus.ARCHIVED,
        ScenarioStatus.ACTIVE_CANDIDATE,
    ],
};
function canTransitionScenario(from, to) {
    return (exports.SCENARIO_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
var ScenarioEvidenceClass;
(function (ScenarioEvidenceClass) {
    ScenarioEvidenceClass["USER_STATED"] = "USER_STATED";
    ScenarioEvidenceClass["USER_CONFIRMED"] = "USER_CONFIRMED";
    ScenarioEvidenceClass["CURRENT_REALITY"] = "CURRENT_REALITY";
    ScenarioEvidenceClass["LIFE_SIGNAL"] = "LIFE_SIGNAL";
    ScenarioEvidenceClass["ASTRO_THEME"] = "ASTRO_THEME";
    ScenarioEvidenceClass["TIMING_WINDOW"] = "TIMING_WINDOW";
    ScenarioEvidenceClass["DEPENDENCY"] = "DEPENDENCY";
    ScenarioEvidenceClass["MEMORY"] = "MEMORY";
    ScenarioEvidenceClass["SYSTEM_INFERENCE"] = "SYSTEM_INFERENCE";
    ScenarioEvidenceClass["USER_CONCERN"] = "USER_CONCERN";
    ScenarioEvidenceClass["EXTERNAL_EVENT"] = "EXTERNAL_EVENT";
})(ScenarioEvidenceClass || (exports.ScenarioEvidenceClass = ScenarioEvidenceClass = {}));
exports.UNSUPPORTED_EVIDENCE_CLASSES = [
    ScenarioEvidenceClass.SYSTEM_INFERENCE,
];
var PreparationClass;
(function (PreparationClass) {
    PreparationClass["COMMON"] = "COMMON";
    PreparationClass["SCENARIO_SPECIFIC"] = "SCENARIO_SPECIFIC";
    PreparationClass["CONTINGENCY_ONLY"] = "CONTINGENCY_ONLY";
})(PreparationClass || (exports.PreparationClass = PreparationClass = {}));
var ScenarioConditionType;
(function (ScenarioConditionType) {
    ScenarioConditionType["SIGNAL_FOR"] = "SIGNAL_FOR";
    ScenarioConditionType["SIGNAL_AGAINST"] = "SIGNAL_AGAINST";
    ScenarioConditionType["DEPENDENCY"] = "DEPENDENCY";
})(ScenarioConditionType || (exports.ScenarioConditionType = ScenarioConditionType = {}));
var Reversibility;
(function (Reversibility) {
    Reversibility["HIGH"] = "HIGH";
    Reversibility["MEDIUM"] = "MEDIUM";
    Reversibility["LOW"] = "LOW";
})(Reversibility || (exports.Reversibility = Reversibility = {}));
var DecisionReadiness;
(function (DecisionReadiness) {
    DecisionReadiness["READY"] = "READY";
    DecisionReadiness["PARTIALLY_READY"] = "PARTIALLY_READY";
    DecisionReadiness["INSUFFICIENT_INFORMATION"] = "INSUFFICIENT_INFORMATION";
})(DecisionReadiness || (exports.DecisionReadiness = DecisionReadiness = {}));
var ScenarioSetStatus;
(function (ScenarioSetStatus) {
    ScenarioSetStatus["CURRENT"] = "CURRENT";
    ScenarioSetStatus["SUPERSEDED"] = "SUPERSEDED";
})(ScenarioSetStatus || (exports.ScenarioSetStatus = ScenarioSetStatus = {}));
var WhatIfSessionStatus;
(function (WhatIfSessionStatus) {
    WhatIfSessionStatus["ACTIVE"] = "ACTIVE";
    WhatIfSessionStatus["EXPIRED"] = "EXPIRED";
    WhatIfSessionStatus["DISCARDED"] = "DISCARDED";
})(WhatIfSessionStatus || (exports.WhatIfSessionStatus = WhatIfSessionStatus = {}));
var WhatIfAssumptionType;
(function (WhatIfAssumptionType) {
    WhatIfAssumptionType["USER_STATED"] = "USER_STATED";
    WhatIfAssumptionType["DERIVED_DEPENDENCY"] = "DERIVED_DEPENDENCY";
    WhatIfAssumptionType["CONTEXT_CARRIED"] = "CONTEXT_CARRIED";
})(WhatIfAssumptionType || (exports.WhatIfAssumptionType = WhatIfAssumptionType = {}));
var ScenarioChangeType;
(function (ScenarioChangeType) {
    ScenarioChangeType["ADDED"] = "ADDED";
    ScenarioChangeType["REMOVED"] = "REMOVED";
    ScenarioChangeType["RELEVANCE_INCREASED"] = "RELEVANCE_INCREASED";
    ScenarioChangeType["RELEVANCE_DECREASED"] = "RELEVANCE_DECREASED";
    ScenarioChangeType["IMPACT_CHANGED"] = "IMPACT_CHANGED";
    ScenarioChangeType["TRIGGERED"] = "TRIGGERED";
    ScenarioChangeType["RESOLVED"] = "RESOLVED";
})(ScenarioChangeType || (exports.ScenarioChangeType = ScenarioChangeType = {}));
exports.SCENARIO_MIN_USER_FACING = 2;
exports.SCENARIO_PREFERRED_USER_FACING = 3;
exports.SCENARIO_MAX_USER_FACING = 4;
exports.WHAT_IF_MAX_CASCADE_DEPTH = 3;
exports.SCENARIO_LOW_CONFIDENCE_THRESHOLD = 0.4;
//# sourceMappingURL=scenario.enum.js.map