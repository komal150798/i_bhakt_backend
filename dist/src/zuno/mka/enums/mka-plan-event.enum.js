"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KARMA_LEDGER_CONSUMED_EVENTS = exports.MkaPlanAggregateType = exports.MkaPlanEventType = void 0;
var MkaPlanEventType;
(function (MkaPlanEventType) {
    MkaPlanEventType["MKA_GENERATED"] = "zuno.mka.generated";
    MkaPlanEventType["MKA_ACTIVATED"] = "zuno.mka.activated";
    MkaPlanEventType["MKA_ITEM_COMPLETED"] = "zuno.mka.item_completed";
    MkaPlanEventType["MKA_ITEM_SKIPPED"] = "zuno.mka.item_skipped";
    MkaPlanEventType["MKA_EXPIRED"] = "zuno.mka.expired";
    MkaPlanEventType["MKA_REFRESH_REQUESTED"] = "zuno.mka.refresh_requested";
    MkaPlanEventType["MKA_REALIGNED"] = "zuno.mka.realigned";
    MkaPlanEventType["MKA_COMPLETED"] = "zuno.mka.completed";
    MkaPlanEventType["MKA_SUPERSEDED"] = "zuno.mka.superseded";
    MkaPlanEventType["MKA_SME_REVIEW_CANDIDATE"] = "zuno.mka.sme_review_candidate";
    MkaPlanEventType["PLAN_GENERATED"] = "zuno.plan.generated";
    MkaPlanEventType["PLAN_ACTIVATED"] = "zuno.plan.activated";
    MkaPlanEventType["PLAN_ITEM_STARTED"] = "zuno.plan.item_started";
    MkaPlanEventType["PLAN_ITEM_COMPLETED"] = "zuno.plan.item_completed";
    MkaPlanEventType["PLAN_ITEM_DEFERRED"] = "zuno.plan.item_deferred";
    MkaPlanEventType["PLAN_ITEM_SKIPPED"] = "zuno.plan.item_skipped";
    MkaPlanEventType["PLAN_ITEM_BLOCKED"] = "zuno.plan.item_blocked";
    MkaPlanEventType["PLAN_REVIEW_DUE"] = "zuno.plan.review_due";
    MkaPlanEventType["PLAN_PATCH_REQUESTED"] = "zuno.plan.patch_requested";
    MkaPlanEventType["PLAN_PATCHED"] = "zuno.plan.patched";
    MkaPlanEventType["PLAN_REALIGNMENT_REQUESTED"] = "zuno.plan.realignment_requested";
    MkaPlanEventType["PLAN_SUPERSEDED"] = "zuno.plan.superseded";
    MkaPlanEventType["PLAN_COMPLETED"] = "zuno.plan.completed";
    MkaPlanEventType["PLAN_FIT_REVIEW"] = "zuno.plan.fit_review";
})(MkaPlanEventType || (exports.MkaPlanEventType = MkaPlanEventType = {}));
var MkaPlanAggregateType;
(function (MkaPlanAggregateType) {
    MkaPlanAggregateType["MKA_PROGRAM"] = "MKA_PROGRAM";
    MkaPlanAggregateType["MKA_ITEM"] = "MKA_ITEM";
    MkaPlanAggregateType["PLAN"] = "PLAN";
    MkaPlanAggregateType["PLAN_ITEM"] = "PLAN_ITEM";
})(MkaPlanAggregateType || (exports.MkaPlanAggregateType = MkaPlanAggregateType = {}));
exports.KARMA_LEDGER_CONSUMED_EVENTS = [
    MkaPlanEventType.MKA_ITEM_COMPLETED,
    MkaPlanEventType.PLAN_ITEM_COMPLETED,
];
//# sourceMappingURL=mka-plan-event.enum.js.map