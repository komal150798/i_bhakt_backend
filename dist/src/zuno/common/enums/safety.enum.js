"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZUNO_SAFETY_POLICY_VERSION = exports.SafetyViolation = exports.SafetyBlockedCapability = exports.SafetyAction = exports.CRITICAL_SAFETY_FLAGS = exports.SafetyFlag = exports.RISK_CLASS_SEVERITY = exports.SAFETY_DISPOSITION_SEVERITY = exports.SafetyDisposition = exports.ZunoRiskClass = void 0;
const domain_enum_1 = require("./domain.enum");
Object.defineProperty(exports, "ZunoRiskClass", { enumerable: true, get: function () { return domain_enum_1.ZunoRiskClass; } });
var SafetyDisposition;
(function (SafetyDisposition) {
    SafetyDisposition["ALLOW"] = "ALLOW";
    SafetyDisposition["ALLOW_WITH_BOUNDARY"] = "ALLOW_WITH_BOUNDARY";
    SafetyDisposition["PROFESSIONAL_SUPPORT_RECOMMENDED"] = "PROFESSIONAL_SUPPORT_RECOMMENDED";
    SafetyDisposition["PROFESSIONAL_SUPPORT_REQUIRED"] = "PROFESSIONAL_SUPPORT_REQUIRED";
    SafetyDisposition["RESTRICT"] = "RESTRICT";
    SafetyDisposition["CRITICAL_ESCALATION"] = "CRITICAL_ESCALATION";
})(SafetyDisposition || (exports.SafetyDisposition = SafetyDisposition = {}));
exports.SAFETY_DISPOSITION_SEVERITY = {
    [SafetyDisposition.ALLOW]: 0,
    [SafetyDisposition.ALLOW_WITH_BOUNDARY]: 1,
    [SafetyDisposition.PROFESSIONAL_SUPPORT_RECOMMENDED]: 2,
    [SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED]: 3,
    [SafetyDisposition.RESTRICT]: 4,
    [SafetyDisposition.CRITICAL_ESCALATION]: 5,
};
exports.RISK_CLASS_SEVERITY = {
    [domain_enum_1.ZunoRiskClass.LOW_RISK]: 0,
    [domain_enum_1.ZunoRiskClass.MODERATE_RISK]: 1,
    [domain_enum_1.ZunoRiskClass.HIGH_STAKES]: 2,
    [domain_enum_1.ZunoRiskClass.CRITICAL_SAFETY]: 3,
};
var SafetyFlag;
(function (SafetyFlag) {
    SafetyFlag["SELF_HARM"] = "SELF_HARM";
    SafetyFlag["HARM_TO_OTHERS"] = "HARM_TO_OTHERS";
    SafetyFlag["IMMEDIATE_MEDICAL_RISK"] = "IMMEDIATE_MEDICAL_RISK";
    SafetyFlag["VIOLENCE"] = "VIOLENCE";
    SafetyFlag["ABUSE"] = "ABUSE";
    SafetyFlag["CHILD_SAFETY"] = "CHILD_SAFETY";
    SafetyFlag["CRIMINAL_REQUEST"] = "CRIMINAL_REQUEST";
    SafetyFlag["SERIOUS_LEGAL_RISK"] = "SERIOUS_LEGAL_RISK";
    SafetyFlag["SEVERE_FINANCIAL_RISK"] = "SEVERE_FINANCIAL_RISK";
})(SafetyFlag || (exports.SafetyFlag = SafetyFlag = {}));
exports.CRITICAL_SAFETY_FLAGS = [
    SafetyFlag.SELF_HARM,
    SafetyFlag.HARM_TO_OTHERS,
    SafetyFlag.IMMEDIATE_MEDICAL_RISK,
    SafetyFlag.VIOLENCE,
    SafetyFlag.ABUSE,
    SafetyFlag.CHILD_SAFETY,
];
var SafetyAction;
(function (SafetyAction) {
    SafetyAction["ALLOW_GENERAL_GUIDANCE"] = "ALLOW_GENERAL_GUIDANCE";
    SafetyAction["REQUIRE_PROFESSIONAL_BOUNDARY"] = "REQUIRE_PROFESSIONAL_BOUNDARY";
    SafetyAction["SUPPRESS_ASTROLOGY"] = "SUPPRESS_ASTROLOGY";
    SafetyAction["REDUCE_RESPONSE_DEPTH"] = "REDUCE_RESPONSE_DEPTH";
    SafetyAction["ESCALATE_CRITICAL"] = "ESCALATE_CRITICAL";
    SafetyAction["BLOCK_RESPONSE"] = "BLOCK_RESPONSE";
})(SafetyAction || (exports.SafetyAction = SafetyAction = {}));
var SafetyBlockedCapability;
(function (SafetyBlockedCapability) {
    SafetyBlockedCapability["GUARANTEED_LEGAL_OUTCOME"] = "GUARANTEED_LEGAL_OUTCOME";
    SafetyBlockedCapability["GUARANTEED_MEDICAL_OUTCOME"] = "GUARANTEED_MEDICAL_OUTCOME";
    SafetyBlockedCapability["GUARANTEED_FINANCIAL_OUTCOME"] = "GUARANTEED_FINANCIAL_OUTCOME";
    SafetyBlockedCapability["DETERMINISTIC_PREDICTION"] = "DETERMINISTIC_PREDICTION";
    SafetyBlockedCapability["ASTROLOGY_REMEDY"] = "ASTROLOGY_REMEDY";
    SafetyBlockedCapability["COMMERCIAL_UPSELL"] = "COMMERCIAL_UPSELL";
})(SafetyBlockedCapability || (exports.SafetyBlockedCapability = SafetyBlockedCapability = {}));
var SafetyViolation;
(function (SafetyViolation) {
    SafetyViolation["UNSUPPORTED_CERTAINTY"] = "UNSUPPORTED_CERTAINTY";
    SafetyViolation["FEAR_AMPLIFICATION"] = "FEAR_AMPLIFICATION";
    SafetyViolation["HARMFUL_ADVICE"] = "HARMFUL_ADVICE";
    SafetyViolation["UNSAFE_REMEDY"] = "UNSAFE_REMEDY";
    SafetyViolation["PROFESSIONAL_BOUNDARY_VIOLATION"] = "PROFESSIONAL_BOUNDARY_VIOLATION";
    SafetyViolation["PRIVACY_LEAKAGE"] = "PRIVACY_LEAKAGE";
    SafetyViolation["HYPOTHETICAL_CONTAMINATION"] = "HYPOTHETICAL_CONTAMINATION";
    SafetyViolation["CONTRADICTS_KNOWN_FACTS"] = "CONTRADICTS_KNOWN_FACTS";
    SafetyViolation["FATALISM"] = "FATALISM";
})(SafetyViolation || (exports.SafetyViolation = SafetyViolation = {}));
exports.ZUNO_SAFETY_POLICY_VERSION = '1.0';
//# sourceMappingURL=safety.enum.js.map