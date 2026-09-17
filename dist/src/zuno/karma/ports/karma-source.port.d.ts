import { KarmaActionOutcome, KarmaCategory, KarmaEffort, KarmaEntrySource, KarmaRelevance } from '../enums/karma.enum';
export declare const KARMA_ACTION_COMPLETED_EVENTS: {
    readonly PLAN_ITEM_COMPLETED: "zuno.plan_item.completed";
    readonly MKA_ITEM_COMPLETED: "zuno.mka_item.completed";
};
export type KarmaActionCompletedEventType = (typeof KARMA_ACTION_COMPLETED_EVENTS)[keyof typeof KARMA_ACTION_COMPLETED_EVENTS];
export declare const KARMA_CONSUMED_EVENT_TYPES: readonly string[];
export interface KarmaActionCompletedPayload {
    event_id: string;
    user_id: string;
    source: KarmaEntrySource.PLAN_COMPLETION | KarmaEntrySource.MKA_COMPLETION;
    plan_item_id?: string | null;
    mka_item_id?: string | null;
    challenge_id?: string | null;
    completed_at: string;
    outcome: KarmaActionOutcome;
    karma_ledger_eligible: boolean;
    astrology_derived?: boolean;
    effort?: KarmaEffort;
    relevance?: KarmaRelevance;
    suggested_category?: KarmaCategory;
    action_label?: string | null;
    event_version?: string;
}
export interface KarmaSourceAction {
    userId: string;
    challengeId: string | null;
    karmaLedgerEligible: boolean;
    outcome: KarmaActionOutcome;
    astrologyDerived: boolean;
    effort?: KarmaEffort;
    relevance?: KarmaRelevance;
    suggestedCategory?: KarmaCategory;
    actionLabel?: string | null;
}
export interface KarmaSourceReference {
    source: KarmaEntrySource.PLAN_COMPLETION | KarmaEntrySource.MKA_COMPLETION;
    planItemId?: string | null;
    mkaItemId?: string | null;
}
export interface KarmaSourcePort {
    describeCompletedAction(userId: string, reference: KarmaSourceReference): Promise<KarmaSourceAction | null>;
}
export declare const KARMA_SOURCE_PORT: unique symbol;
export declare class NullKarmaSourceAdapter implements KarmaSourcePort {
    describeCompletedAction(): Promise<KarmaSourceAction | null>;
}
export declare const KARMA_ACTION_LABEL_MAX_LENGTH = 200;
export declare function validateActionCompletedPayload(payload: unknown): string[];
