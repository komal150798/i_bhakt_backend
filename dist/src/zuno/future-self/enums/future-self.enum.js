"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FutureSelfViolation = exports.MODE_LOOKBACK_DAYS = exports.MODE_MAX_SUMMARY_CHARS = exports.FUTURE_SELF_MODES = exports.FutureSelfMode = void 0;
var FutureSelfMode;
(function (FutureSelfMode) {
    FutureSelfMode["DAILY"] = "DAILY";
    FutureSelfMode["WEEKLY"] = "WEEKLY";
    FutureSelfMode["MILESTONE"] = "MILESTONE";
    FutureSelfMode["REALIGNMENT"] = "REALIGNMENT";
    FutureSelfMode["REFLECTION"] = "REFLECTION";
})(FutureSelfMode || (exports.FutureSelfMode = FutureSelfMode = {}));
exports.FUTURE_SELF_MODES = Object.values(FutureSelfMode);
exports.MODE_MAX_SUMMARY_CHARS = {
    [FutureSelfMode.DAILY]: 320,
    [FutureSelfMode.WEEKLY]: 900,
    [FutureSelfMode.MILESTONE]: 900,
    [FutureSelfMode.REALIGNMENT]: 900,
    [FutureSelfMode.REFLECTION]: 1100,
};
exports.MODE_LOOKBACK_DAYS = {
    [FutureSelfMode.DAILY]: 2,
    [FutureSelfMode.WEEKLY]: 7,
    [FutureSelfMode.MILESTONE]: 90,
    [FutureSelfMode.REALIGNMENT]: 30,
    [FutureSelfMode.REFLECTION]: 30,
};
var FutureSelfViolation;
(function (FutureSelfViolation) {
    FutureSelfViolation["INVENTED_EMPLOYER"] = "INVENTED_EMPLOYER";
    FutureSelfViolation["INVENTED_PARTNER"] = "INVENTED_PARTNER";
    FutureSelfViolation["INVENTED_SALARY"] = "INVENTED_SALARY";
    FutureSelfViolation["GUARANTEED_OUTCOME"] = "GUARANTEED_OUTCOME";
    FutureSelfViolation["LITERAL_FUTURE_KNOWLEDGE"] = "LITERAL_FUTURE_KNOWLEDGE";
    FutureSelfViolation["UNGROUNDED_ENTITY"] = "UNGROUNDED_ENTITY";
    FutureSelfViolation["UNGROUNDED_EMOTIONAL_CLAIM"] = "UNGROUNDED_EMOTIONAL_CLAIM";
    FutureSelfViolation["MYSTICAL_CAUSATION"] = "MYSTICAL_CAUSATION";
    FutureSelfViolation["IDENTITY_LABEL"] = "IDENTITY_LABEL";
    FutureSelfViolation["MODE_LENGTH_EXCEEDED"] = "MODE_LENGTH_EXCEEDED";
    FutureSelfViolation["UNVERIFIABLE_SOURCE"] = "UNVERIFIABLE_SOURCE";
})(FutureSelfViolation || (exports.FutureSelfViolation = FutureSelfViolation = {}));
//# sourceMappingURL=future-self.enum.js.map