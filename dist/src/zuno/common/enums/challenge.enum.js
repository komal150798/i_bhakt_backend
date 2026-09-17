"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeLinkType = exports.ResponseDepth = exports.ChallengeTimeline = exports.GoalStatus = exports.ContextItemSource = exports.NON_FACTUAL_CONTEXT_ITEM_TYPES = exports.FACTUAL_CONTEXT_ITEM_TYPES = exports.ContextItemType = exports.EmotionalSignal = exports.EmotionalIntensity = exports.Urgency = exports.ChallengeMode = exports.CHALLENGE_STATUS_TRANSITIONS = exports.ChallengeStatus = void 0;
exports.canTransitionChallenge = canTransitionChallenge;
var ChallengeStatus;
(function (ChallengeStatus) {
    ChallengeStatus["NEW"] = "NEW";
    ChallengeStatus["UNDERSTANDING"] = "UNDERSTANDING";
    ChallengeStatus["ACTIVE"] = "ACTIVE";
    ChallengeStatus["MONITORING"] = "MONITORING";
    ChallengeStatus["CHANGED"] = "CHANGED";
    ChallengeStatus["REALIGNMENT_REQUIRED"] = "REALIGNMENT_REQUIRED";
    ChallengeStatus["RESOLVED"] = "RESOLVED";
    ChallengeStatus["PAUSED"] = "PAUSED";
    ChallengeStatus["ARCHIVED"] = "ARCHIVED";
})(ChallengeStatus || (exports.ChallengeStatus = ChallengeStatus = {}));
exports.CHALLENGE_STATUS_TRANSITIONS = {
    [ChallengeStatus.NEW]: [
        ChallengeStatus.UNDERSTANDING,
        ChallengeStatus.ACTIVE,
        ChallengeStatus.PAUSED,
        ChallengeStatus.ARCHIVED,
    ],
    [ChallengeStatus.UNDERSTANDING]: [
        ChallengeStatus.ACTIVE,
        ChallengeStatus.UNDERSTANDING,
        ChallengeStatus.PAUSED,
        ChallengeStatus.ARCHIVED,
    ],
    [ChallengeStatus.ACTIVE]: [
        ChallengeStatus.MONITORING,
        ChallengeStatus.CHANGED,
        ChallengeStatus.UNDERSTANDING,
        ChallengeStatus.RESOLVED,
        ChallengeStatus.PAUSED,
        ChallengeStatus.ARCHIVED,
    ],
    [ChallengeStatus.MONITORING]: [
        ChallengeStatus.ACTIVE,
        ChallengeStatus.CHANGED,
        ChallengeStatus.RESOLVED,
        ChallengeStatus.PAUSED,
        ChallengeStatus.ARCHIVED,
    ],
    [ChallengeStatus.CHANGED]: [
        ChallengeStatus.REALIGNMENT_REQUIRED,
        ChallengeStatus.ACTIVE,
        ChallengeStatus.MONITORING,
        ChallengeStatus.RESOLVED,
        ChallengeStatus.PAUSED,
        ChallengeStatus.ARCHIVED,
    ],
    [ChallengeStatus.REALIGNMENT_REQUIRED]: [
        ChallengeStatus.ACTIVE,
        ChallengeStatus.MONITORING,
        ChallengeStatus.RESOLVED,
        ChallengeStatus.PAUSED,
        ChallengeStatus.ARCHIVED,
    ],
    [ChallengeStatus.RESOLVED]: [ChallengeStatus.ACTIVE, ChallengeStatus.ARCHIVED],
    [ChallengeStatus.PAUSED]: [ChallengeStatus.ACTIVE, ChallengeStatus.ARCHIVED],
    [ChallengeStatus.ARCHIVED]: [],
};
function canTransitionChallenge(from, to) {
    return (exports.CHALLENGE_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
var ChallengeMode;
(function (ChallengeMode) {
    ChallengeMode["UNDERSTAND"] = "UNDERSTAND";
    ChallengeMode["PREPARE"] = "PREPARE";
    ChallengeMode["WATCH"] = "WATCH";
    ChallengeMode["ACT"] = "ACT";
    ChallengeMode["DECIDE"] = "DECIDE";
    ChallengeMode["TRANSITION"] = "TRANSITION";
    ChallengeMode["RECOVER"] = "RECOVER";
    ChallengeMode["STABILISE"] = "STABILISE";
    ChallengeMode["GROW"] = "GROW";
    ChallengeMode["CELEBRATE"] = "CELEBRATE";
})(ChallengeMode || (exports.ChallengeMode = ChallengeMode = {}));
var Urgency;
(function (Urgency) {
    Urgency["LOW"] = "LOW";
    Urgency["MEDIUM"] = "MEDIUM";
    Urgency["HIGH"] = "HIGH";
    Urgency["IMMEDIATE"] = "IMMEDIATE";
})(Urgency || (exports.Urgency = Urgency = {}));
var EmotionalIntensity;
(function (EmotionalIntensity) {
    EmotionalIntensity["LOW"] = "LOW";
    EmotionalIntensity["MODERATE"] = "MODERATE";
    EmotionalIntensity["HIGH"] = "HIGH";
    EmotionalIntensity["VERY_HIGH"] = "VERY_HIGH";
})(EmotionalIntensity || (exports.EmotionalIntensity = EmotionalIntensity = {}));
var EmotionalSignal;
(function (EmotionalSignal) {
    EmotionalSignal["CALM"] = "CALM";
    EmotionalSignal["UNCERTAIN"] = "UNCERTAIN";
    EmotionalSignal["WORRIED"] = "WORRIED";
    EmotionalSignal["ANXIOUS"] = "ANXIOUS";
    EmotionalSignal["FRUSTRATED"] = "FRUSTRATED";
    EmotionalSignal["OVERWHELMED"] = "OVERWHELMED";
    EmotionalSignal["HOPEFUL"] = "HOPEFUL";
    EmotionalSignal["CONFUSED"] = "CONFUSED";
    EmotionalSignal["URGENT"] = "URGENT";
})(EmotionalSignal || (exports.EmotionalSignal = EmotionalSignal = {}));
var ContextItemType;
(function (ContextItemType) {
    ContextItemType["FACT"] = "FACT";
    ContextItemType["USER_BELIEF"] = "USER_BELIEF";
    ContextItemType["FEAR"] = "FEAR";
    ContextItemType["ASSUMPTION"] = "ASSUMPTION";
    ContextItemType["DEPENDENCY"] = "DEPENDENCY";
    ContextItemType["CONSTRAINT"] = "CONSTRAINT";
    ContextItemType["DESIRED_OUTCOME"] = "DESIRED_OUTCOME";
    ContextItemType["DECISION"] = "DECISION";
    ContextItemType["PREFERENCE"] = "PREFERENCE";
    ContextItemType["EXTERNAL_EVENT"] = "EXTERNAL_EVENT";
    ContextItemType["UNKNOWN"] = "UNKNOWN";
})(ContextItemType || (exports.ContextItemType = ContextItemType = {}));
exports.FACTUAL_CONTEXT_ITEM_TYPES = [
    ContextItemType.FACT,
    ContextItemType.EXTERNAL_EVENT,
];
exports.NON_FACTUAL_CONTEXT_ITEM_TYPES = [
    ContextItemType.FEAR,
    ContextItemType.ASSUMPTION,
    ContextItemType.USER_BELIEF,
    ContextItemType.UNKNOWN,
];
var ContextItemSource;
(function (ContextItemSource) {
    ContextItemSource["USER_STATED"] = "USER_STATED";
    ContextItemSource["USER_CONFIRMED"] = "USER_CONFIRMED";
    ContextItemSource["INFERRED"] = "INFERRED";
    ContextItemSource["MEMORY"] = "MEMORY";
    ContextItemSource["LIFE_SIGNAL"] = "LIFE_SIGNAL";
    ContextItemSource["SYSTEM_DERIVED"] = "SYSTEM_DERIVED";
})(ContextItemSource || (exports.ContextItemSource = ContextItemSource = {}));
var GoalStatus;
(function (GoalStatus) {
    GoalStatus["USER_STATED"] = "USER_STATED";
    GoalStatus["INFERRED"] = "INFERRED";
    GoalStatus["CONFIRMED"] = "CONFIRMED";
    GoalStatus["REJECTED"] = "REJECTED";
})(GoalStatus || (exports.GoalStatus = GoalStatus = {}));
var ChallengeTimeline;
(function (ChallengeTimeline) {
    ChallengeTimeline["PAST"] = "PAST";
    ChallengeTimeline["CURRENT"] = "CURRENT";
    ChallengeTimeline["UPCOMING"] = "UPCOMING";
    ChallengeTimeline["ONGOING"] = "ONGOING";
    ChallengeTimeline["RECURRING"] = "RECURRING";
    ChallengeTimeline["LONG_TERM"] = "LONG_TERM";
    ChallengeTimeline["UNKNOWN"] = "UNKNOWN";
})(ChallengeTimeline || (exports.ChallengeTimeline = ChallengeTimeline = {}));
var ResponseDepth;
(function (ResponseDepth) {
    ResponseDepth["QUICK"] = "QUICK";
    ResponseDepth["STANDARD"] = "STANDARD";
    ResponseDepth["DEEP"] = "DEEP";
})(ResponseDepth || (exports.ResponseDepth = ResponseDepth = {}));
var ChallengeLinkType;
(function (ChallengeLinkType) {
    ChallengeLinkType["IMPACTS"] = "IMPACTS";
    ChallengeLinkType["CAUSED_BY"] = "CAUSED_BY";
    ChallengeLinkType["SUPERSEDES"] = "SUPERSEDES";
    ChallengeLinkType["SUPERSEDED_BY"] = "SUPERSEDED_BY";
    ChallengeLinkType["RELATED_TO"] = "RELATED_TO";
    ChallengeLinkType["SPAWNED_FROM"] = "SPAWNED_FROM";
})(ChallengeLinkType || (exports.ChallengeLinkType = ChallengeLinkType = {}));
//# sourceMappingURL=challenge.enum.js.map