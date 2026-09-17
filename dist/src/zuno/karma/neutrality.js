"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KARMA_COPY = exports.KARMA_NEUTRALITY_RULES = exports.KARMA_SCORE_FRAMING = exports.KARMA_POINTS_LABEL = exports.KARMA_APPROVED_POINT_LABELS = void 0;
exports.findNeutralityViolations = findNeutralityViolations;
exports.assertNeutralCopy = assertNeutralCopy;
exports.assertKarmaCopyIsNeutral = assertKarmaCopyIsNeutral;
const zuno_exception_1 = require("../common/errors/zuno.exception");
exports.KARMA_APPROVED_POINT_LABELS = [
    'Karma Progress',
    'Karma Practice Score',
    'Growth Points',
    'Karma Ledger Points',
];
exports.KARMA_POINTS_LABEL = 'Karma Ledger Points';
exports.KARMA_SCORE_FRAMING = 'A ZUNO progress indicator based on recorded actions.';
exports.KARMA_NEUTRALITY_RULES = [
    {
        id: 'COSMIC_ACCOUNTING',
        pattern: /\b(cosmic|divine|karmic)\s+(karma|balance|merit|credit|debt|protection|reward|account|alignment)\b/i,
        reason: 'Step 17 section 102: the ledger does not measure cosmic karma.',
    },
    {
        id: 'SPIRITUAL_MERIT',
        pattern: /\b(spiritual merit|karmic debt|cosmic currency|divine judgment|divine judgement)\b/i,
        reason: 'Step 17 section 15: points are not spiritual merit.',
    },
    {
        id: 'KARMA_AS_QUANTITY',
        pattern: /\b(your (actual|real|true) karma|karma (balance|is now|score is)|karma points? (lost|gained|deducted))\b/i,
        reason: 'Step 17 section 38: never state a quantity of karma itself.',
    },
    {
        id: 'PLANETARY_CLAIM',
        pattern: /\b(neutrali[sz]e[sd]?|cancel(led)?|offset)\b[^.]{0,40}\b(saturn|rahu|ketu|planet|dasha|transit|doshas?)\b/i,
        reason: 'Step 17 section 78: ledger results never claim a changed planetary outcome.',
    },
    {
        id: 'PERSON_JUDGEMENT',
        pattern: /\b(bad|good|better|worse|terrible|awful)\s+person\b/i,
        reason: 'Step 17 Rule 2: never equate a classification with the user\'s worth.',
    },
    {
        id: 'MORAL_LABEL',
        pattern: /\b(bad|good|negative|positive|poor|low)\s+karma\b/i,
        reason: 'Step 17 section 8: the product avoids moralizing karma labels.',
    },
    {
        id: 'SIN_LANGUAGE',
        pattern: /\b(sin|sins|sinful|sinner|immoral|unworthy|impure)\b/i,
        reason: 'Step 17 section 32: ZUNO is not a religious or moral authority.',
    },
    {
        id: 'PUNITIVE',
        pattern: /\b(punish|punished|punishment|punitive|penali[sz]ed?|penalty|penalties)\b/i,
        reason: 'Step 17 section 18: unconstructive action is a reflection point, not a punishment.',
    },
    {
        id: 'SHAMING',
        pattern: /\b(shame|shameful|ashamed|guilty|disgrace|you failed|you are failing)\b/i,
        reason: 'Build Rule 64: a missed action must never create shame.',
    },
    {
        id: 'DECLINE_FRAMING',
        pattern: /\byour karma is (low|declining|falling|dropping)\b/i,
        reason: 'Step 17 section 77: never frame a pattern as karma declining.',
    },
    {
        id: 'RANKING',
        pattern: /\b(leaderboard|rank(ed|ing)?|top \d+|#\d+|compared to other (users|people)|than other (users|people))\b/i,
        reason: 'Step 17 Rule 10: no public karma ranking exists in the core product.',
    },
    {
        id: 'PAY_TO_SCORE',
        pattern: /\b(premium|paid|subscription|donation)\b[^.]{0,40}\b(karma|points|double points|more points)\b/i,
        reason: 'Step 17 Rule 9: subscription level must never influence points.',
    },
    {
        id: 'FEAR_FRAMING',
        pattern: /\b(because your karma|if your karma)\b[^.]{0,60}\b(worse|suffer|danger|harm|misfortune)\b/i,
        reason: 'Step 17 section 107: the score must never be used to manufacture fear.',
    },
];
function findNeutralityViolations(text) {
    if (!text)
        return [];
    return exports.KARMA_NEUTRALITY_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => ({ ruleId: rule.id, reason: rule.reason }));
}
function assertNeutralCopy(text, where) {
    const violations = findNeutralityViolations(text);
    if (violations.length > 0) {
        throw zuno_exception_1.ZunoException.internal(`karma neutrality violation in ${where}: ${violations
            .map((violation) => violation.ruleId)
            .join(',')}`);
    }
}
exports.KARMA_COPY = {
    needsMoreContext: 'Would you like to add a little more context before we note this down?',
    classificationDisagreement: 'That is fair. You know the context better than I do. Would you like to mark it as Mixed, Neutral, or add more context?',
    actionNotCompleted: 'Nothing to record for this one. Carry on with the next step whenever you are ready.',
    cancelledByRealignment: 'This step was set aside when the plan was updated. Your progress is unchanged.',
    actionDeferred: 'This one moved to later. That is often the sensible call, and nothing changes here.',
    repairRecognised: 'Noted as a repair step. It sits alongside what came before rather than replacing it.',
    notLedgerEligible: 'Tracked as plan progress. Not everything needs to go in the ledger.',
    interpretationUnavailable: 'We have recorded that you did this. We are not adding any further reading to it right now.',
    alreadyRecorded: 'This one is already in your ledger.',
    safetyRouted: 'Thank you for telling me. I would rather talk about this directly than turn it into a number.',
};
function assertKarmaCopyIsNeutral() {
    for (const [key, value] of Object.entries(exports.KARMA_COPY)) {
        assertNeutralCopy(value, `KARMA_COPY.${key}`);
    }
    if (!exports.KARMA_APPROVED_POINT_LABELS.includes(exports.KARMA_POINTS_LABEL)) {
        throw zuno_exception_1.ZunoException.internal('karma points label is not one of the labels approved by Step 17 section 39');
    }
}
//# sourceMappingURL=neutrality.js.map