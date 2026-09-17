"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingState = exports.EngineRunStatus = exports.EngineType = exports.SectionEmphasis = exports.ResponseType = exports.ResponseSectionType = void 0;
var ResponseSectionType;
(function (ResponseSectionType) {
    ResponseSectionType["CONTEXT_VALIDATION"] = "CONTEXT_VALIDATION";
    ResponseSectionType["OUTLOOK"] = "OUTLOOK";
    ResponseSectionType["KEY_TAKEAWAY"] = "KEY_TAKEAWAY";
    ResponseSectionType["SCENARIO_PATHS"] = "SCENARIO_PATHS";
    ResponseSectionType["WHAT_IF"] = "WHAT_IF";
    ResponseSectionType["FOCUS_PRIORITIES"] = "FOCUS_PRIORITIES";
    ResponseSectionType["TIMELINE"] = "TIMELINE";
    ResponseSectionType["MKA"] = "MKA";
    ResponseSectionType["PLAN_SUMMARY"] = "PLAN_SUMMARY";
    ResponseSectionType["LIFE_SIGNAL"] = "LIFE_SIGNAL";
    ResponseSectionType["REALIGNMENT"] = "REALIGNMENT";
    ResponseSectionType["KARMA_REFLECTION"] = "KARMA_REFLECTION";
    ResponseSectionType["FUTURE_SELF"] = "FUTURE_SELF";
    ResponseSectionType["SAFETY_BOUNDARY"] = "SAFETY_BOUNDARY";
    ResponseSectionType["ASK_ZUNO"] = "ASK_ZUNO";
    ResponseSectionType["CLARIFICATION"] = "CLARIFICATION";
})(ResponseSectionType || (exports.ResponseSectionType = ResponseSectionType = {}));
var ResponseType;
(function (ResponseType) {
    ResponseType["CONTEXT_VALIDATION"] = "CONTEXT_VALIDATION";
    ResponseType["FORECAST"] = "FORECAST";
    ResponseType["SCENARIO"] = "SCENARIO";
    ResponseType["ACTION_PLAN"] = "ACTION_PLAN";
    ResponseType["MKA"] = "MKA";
    ResponseType["REALIGNMENT"] = "REALIGNMENT";
    ResponseType["FUTURE_SELF"] = "FUTURE_SELF";
    ResponseType["GENERAL"] = "GENERAL";
})(ResponseType || (exports.ResponseType = ResponseType = {}));
var SectionEmphasis;
(function (SectionEmphasis) {
    SectionEmphasis["PRIMARY"] = "PRIMARY";
    SectionEmphasis["SECONDARY"] = "SECONDARY";
    SectionEmphasis["SUPPORTING"] = "SUPPORTING";
})(SectionEmphasis || (exports.SectionEmphasis = SectionEmphasis = {}));
var EngineType;
(function (EngineType) {
    EngineType["WHATNOW"] = "WHATNOW";
    EngineType["ASTROLOGY"] = "ASTROLOGY";
    EngineType["SCENARIO"] = "SCENARIO";
    EngineType["LIFE_SIGNAL"] = "LIFE_SIGNAL";
    EngineType["REALIGNMENT"] = "REALIGNMENT";
    EngineType["MKA"] = "MKA";
    EngineType["PLAN"] = "PLAN";
    EngineType["KARMA"] = "KARMA";
    EngineType["MEMORY"] = "MEMORY";
    EngineType["FUTURE_SELF"] = "FUTURE_SELF";
    EngineType["SAFETY"] = "SAFETY";
})(EngineType || (exports.EngineType = EngineType = {}));
var EngineRunStatus;
(function (EngineRunStatus) {
    EngineRunStatus["PENDING"] = "PENDING";
    EngineRunStatus["RUNNING"] = "RUNNING";
    EngineRunStatus["COMPLETED"] = "COMPLETED";
    EngineRunStatus["FAILED"] = "FAILED";
    EngineRunStatus["NO_RESULT"] = "NO_RESULT";
})(EngineRunStatus || (exports.EngineRunStatus = EngineRunStatus = {}));
var ProcessingState;
(function (ProcessingState) {
    ProcessingState["PROCESSING"] = "PROCESSING";
    ProcessingState["PENDING"] = "PENDING";
    ProcessingState["COMPLETED"] = "COMPLETED";
    ProcessingState["FAILED"] = "FAILED";
})(ProcessingState || (exports.ProcessingState = ProcessingState = {}));
//# sourceMappingURL=response.enum.js.map