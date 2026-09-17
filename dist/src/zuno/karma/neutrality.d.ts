export declare const KARMA_APPROVED_POINT_LABELS: readonly string[];
export declare const KARMA_POINTS_LABEL = "Karma Ledger Points";
export declare const KARMA_SCORE_FRAMING = "A ZUNO progress indicator based on recorded actions.";
export interface NeutralityRule {
    id: string;
    pattern: RegExp;
    reason: string;
}
export declare const KARMA_NEUTRALITY_RULES: readonly NeutralityRule[];
export interface NeutralityViolation {
    ruleId: string;
    reason: string;
}
export declare function findNeutralityViolations(text: string): NeutralityViolation[];
export declare function assertNeutralCopy(text: string, where: string): void;
export declare const KARMA_COPY: {
    readonly needsMoreContext: "Would you like to add a little more context before we note this down?";
    readonly classificationDisagreement: "That is fair. You know the context better than I do. Would you like to mark it as Mixed, Neutral, or add more context?";
    readonly actionNotCompleted: "Nothing to record for this one. Carry on with the next step whenever you are ready.";
    readonly cancelledByRealignment: "This step was set aside when the plan was updated. Your progress is unchanged.";
    readonly actionDeferred: "This one moved to later. That is often the sensible call, and nothing changes here.";
    readonly repairRecognised: "Noted as a repair step. It sits alongside what came before rather than replacing it.";
    readonly notLedgerEligible: "Tracked as plan progress. Not everything needs to go in the ledger.";
    readonly interpretationUnavailable: "We have recorded that you did this. We are not adding any further reading to it right now.";
    readonly alreadyRecorded: "This one is already in your ledger.";
    readonly safetyRouted: "Thank you for telling me. I would rather talk about this directly than turn it into a number.";
};
export declare function assertKarmaCopyIsNeutral(): void;
