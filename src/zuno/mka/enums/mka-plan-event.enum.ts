/**
 * Outbox event names and aggregate types owned by the MKA and Plan engines.
 *
 * WHY THESE LIVE HERE RATHER THAN IN `common/enums/event.enum.ts`
 *
 * `common/enums/event.enum.ts` is wired centrally and is not this module's to
 * edit. These values are declared here, in the module that emits them, and are
 * listed verbatim in `src/zuno/mka/WIRING.md` so they can be merged into
 * `ZunoEventType` / `ZunoAggregateType` in one deliberate change.
 *
 * They are written in exactly the style of that file - `zuno.<aggregate>.<verb>`
 * in past tense - so the merge is a copy, not a translation.
 *
 * Until the merge happens, `OutboxService.enqueue` is called with a narrowing
 * cast at a single helper (see `mka-plan-outbox.ts`). The cast is confined to
 * one place on purpose: after the merge, deleting the helper's cast is the only
 * change required.
 *
 * Sources: Step 15 section 91 (MKA events), Step 16 section 87 (Plan events),
 * Step 22 Event Architecture, Step 20 sections 105-106.
 */

export enum MkaPlanEventType {
  // --- MKA. Step 15 section 91. ---
  MKA_GENERATED = 'zuno.mka.generated',
  MKA_ACTIVATED = 'zuno.mka.activated',
  MKA_ITEM_COMPLETED = 'zuno.mka.item_completed',
  MKA_ITEM_SKIPPED = 'zuno.mka.item_skipped',
  MKA_EXPIRED = 'zuno.mka.expired',
  MKA_REFRESH_REQUESTED = 'zuno.mka.refresh_requested',
  MKA_REALIGNED = 'zuno.mka.realigned',
  MKA_COMPLETED = 'zuno.mka.completed',
  MKA_SUPERSEDED = 'zuno.mka.superseded',
  /**
   * Raised when a challenge repeatedly finds no approved rule coverage.
   * Step 15 section 52: the gap becomes an SME review candidate rather than
   * an invented remedy.
   */
  MKA_SME_REVIEW_CANDIDATE = 'zuno.mka.sme_review_candidate',

  // --- Plan. Step 16 section 87. ---
  PLAN_GENERATED = 'zuno.plan.generated',
  PLAN_ACTIVATED = 'zuno.plan.activated',
  PLAN_ITEM_STARTED = 'zuno.plan.item_started',
  PLAN_ITEM_COMPLETED = 'zuno.plan.item_completed',
  PLAN_ITEM_DEFERRED = 'zuno.plan.item_deferred',
  PLAN_ITEM_SKIPPED = 'zuno.plan.item_skipped',
  PLAN_ITEM_BLOCKED = 'zuno.plan.item_blocked',
  PLAN_REVIEW_DUE = 'zuno.plan.review_due',
  PLAN_PATCH_REQUESTED = 'zuno.plan.patch_requested',
  PLAN_PATCHED = 'zuno.plan.patched',
  PLAN_REALIGNMENT_REQUESTED = 'zuno.plan.realignment_requested',
  PLAN_SUPERSEDED = 'zuno.plan.superseded',
  PLAN_COMPLETED = 'zuno.plan.completed',
  /**
   * Repeated non-completion. Step 16 section 80 and Rule 8: this triggers a
   * plan-fit review, never a guilt notification.
   */
  PLAN_FIT_REVIEW = 'zuno.plan.fit_review',
}

/** New aggregate roots to merge into `ZunoAggregateType`. */
export enum MkaPlanAggregateType {
  MKA_PROGRAM = 'MKA_PROGRAM',
  MKA_ITEM = 'MKA_ITEM',
  PLAN = 'PLAN',
  PLAN_ITEM = 'PLAN_ITEM',
}

/**
 * Events the Karma Ledger (Step 17, built separately) consumes.
 *
 * Listed so the ledger team can subscribe from a declaration rather than by
 * grepping. Every one of these carries only ids and eligibility flags - Build
 * Rule 113 keeps sensitive payloads out of the queue, so a consumer re-reads
 * authorised state rather than trusting the serialised copy.
 */
export const KARMA_LEDGER_CONSUMED_EVENTS: readonly MkaPlanEventType[] = [
  MkaPlanEventType.MKA_ITEM_COMPLETED,
  MkaPlanEventType.PLAN_ITEM_COMPLETED,
];
