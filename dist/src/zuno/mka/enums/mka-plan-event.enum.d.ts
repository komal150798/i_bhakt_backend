export declare enum MkaPlanEventType {
    MKA_GENERATED = "zuno.mka.generated",
    MKA_ACTIVATED = "zuno.mka.activated",
    MKA_ITEM_COMPLETED = "zuno.mka.item_completed",
    MKA_ITEM_SKIPPED = "zuno.mka.item_skipped",
    MKA_EXPIRED = "zuno.mka.expired",
    MKA_REFRESH_REQUESTED = "zuno.mka.refresh_requested",
    MKA_REALIGNED = "zuno.mka.realigned",
    MKA_COMPLETED = "zuno.mka.completed",
    MKA_SUPERSEDED = "zuno.mka.superseded",
    MKA_SME_REVIEW_CANDIDATE = "zuno.mka.sme_review_candidate",
    PLAN_GENERATED = "zuno.plan.generated",
    PLAN_ACTIVATED = "zuno.plan.activated",
    PLAN_ITEM_STARTED = "zuno.plan.item_started",
    PLAN_ITEM_COMPLETED = "zuno.plan.item_completed",
    PLAN_ITEM_DEFERRED = "zuno.plan.item_deferred",
    PLAN_ITEM_SKIPPED = "zuno.plan.item_skipped",
    PLAN_ITEM_BLOCKED = "zuno.plan.item_blocked",
    PLAN_REVIEW_DUE = "zuno.plan.review_due",
    PLAN_PATCH_REQUESTED = "zuno.plan.patch_requested",
    PLAN_PATCHED = "zuno.plan.patched",
    PLAN_REALIGNMENT_REQUESTED = "zuno.plan.realignment_requested",
    PLAN_SUPERSEDED = "zuno.plan.superseded",
    PLAN_COMPLETED = "zuno.plan.completed",
    PLAN_FIT_REVIEW = "zuno.plan.fit_review"
}
export declare enum MkaPlanAggregateType {
    MKA_PROGRAM = "MKA_PROGRAM",
    MKA_ITEM = "MKA_ITEM",
    PLAN = "PLAN",
    PLAN_ITEM = "PLAN_ITEM"
}
export declare const KARMA_LEDGER_CONSUMED_EVENTS: readonly MkaPlanEventType[];
