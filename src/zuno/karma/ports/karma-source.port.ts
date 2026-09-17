import {
  KarmaActionOutcome,
  KarmaCategory,
  KarmaEffort,
  KarmaEntrySource,
  KarmaRelevance,
} from '../enums/karma.enum';

/**
 * The Karma Ledger's inbound boundary.
 *
 * Step 17 section 47 puts the responsibility exactly here: "Plan completion may
 * create PLAN_ITEM_COMPLETED. Then eligibility logic determines whether a
 * Ledger entry should also be created. Avoid circular duplicate records."
 *
 * The Plan and MKA modules are built separately, so this module does not import
 * from them and never will. It declares the shape it expects, consumes it from
 * the transactional outbox, and re-reads authoritative detail through a port
 * that the Plan module binds an adapter to (Build Rules 113 and 173). Karma
 * therefore has no compile-time dependency on Plan, and Plan has no compile-time
 * dependency on Karma - they meet at an event name and this file.
 *
 * WIRING.md in this directory's parent records the exact binding.
 */

// ---------------------------------------------------------------------------
// The event contract
// ---------------------------------------------------------------------------

/**
 * Outbox `event_type` values the ledger consumes.
 *
 * These strings follow the `zuno.<aggregate>.<verb>` convention already used by
 * `common/enums/event.enum.ts`. They are declared here rather than there
 * because that enum is owned by the platform phase and frozen for this work
 * package; WIRING.md lists them as the values to add when it is next opened.
 *
 * Both event types carry the identical payload below. They are distinct names
 * only so that Plan and MKA can be routed, replayed and monitored separately.
 */
export const KARMA_ACTION_COMPLETED_EVENTS = {
  PLAN_ITEM_COMPLETED: 'zuno.plan_item.completed',
  MKA_ITEM_COMPLETED: 'zuno.mka_item.completed',
} as const;

export type KarmaActionCompletedEventType =
  (typeof KARMA_ACTION_COMPLETED_EVENTS)[keyof typeof KARMA_ACTION_COMPLETED_EVENTS];

export const KARMA_CONSUMED_EVENT_TYPES: readonly string[] = Object.values(
  KARMA_ACTION_COMPLETED_EVENTS,
);

/**
 * "An action was completed."
 *
 * snake_case because that is what the outbox stores and what the publisher on
 * the other side of the bus will serialise. The whole payload is deliberately
 * free of user text: Build Rule 113 says queue messages carry ids, and the
 * outbox writer actively strips keys such as `content` and `message`. The only
 * string that describes the action is `action_label`, and it is optional,
 * capped and expected to be the plan item's own short title - never the user's
 * private challenge statement or a reflection.
 *
 * Every field below is validated on arrival. Build Rule 21: a malformed payload
 * is rejected, not propagated as a loose dictionary.
 */
export interface KarmaActionCompletedPayload {
  /**
   * Stable, unique id for *this emission*. Step 17 section 91 and Build Rule 79:
   * the same id arriving twice must produce one ledger entry. The outbox row id
   * is a good value; a retry must reuse it rather than minting a new one.
   */
  event_id: string;

  /** Owner of the action. Ownership is re-checked, never trusted. */
  user_id: string;

  /** PLAN_COMPLETION or MKA_COMPLETION. */
  source: KarmaEntrySource.PLAN_COMPLETION | KarmaEntrySource.MKA_COMPLETION;

  /** Exactly one of these two is set, matching `source`. */
  plan_item_id?: string | null;
  mka_item_id?: string | null;

  /** The WhatNow this action belongs to, when it belongs to one. */
  challenge_id?: string | null;

  /** ISO-8601 UTC instant the action finished. */
  completed_at: string;

  /**
   * How it finished. Anything other than COMPLETED results in no entry and no
   * deduction - see NON_PENALISING_OUTCOMES.
   */
  outcome: KarmaActionOutcome;

  /**
   * Upstream eligibility decision. Step 17 sections 6, 25 and 26: eligibility
   * is explicit and "Open settings page" must never earn karma. The ledger
   * treats a missing or false value as not eligible, so a Plan module that has
   * not implemented the flag yet silently produces nothing rather than
   * silently producing everything.
   */
  karma_ledger_eligible: boolean;

  /**
   * True when the action originated from an astrological remedy.
   * Step 17 section 27 and Build Rule 51: with no approved Rulebook active, the
   * ledger fails closed on these rather than inventing a meaning for them.
   */
  astrology_derived?: boolean;

  /**
   * Optional semantic hints. Step 17 section 21: an upstream classifier may
   * supply these labels; the *points* are still calculated here.
   */
  effort?: KarmaEffort;
  relevance?: KarmaRelevance;
  suggested_category?: KarmaCategory;

  /**
   * Short non-sensitive label for the action, e.g. "Update CV". Optional.
   * Max 200 characters; anything longer is truncated rather than rejected,
   * because losing an eligible action over a label is the worse failure.
   */
  action_label?: string | null;

  /** Event schema version. Absent is treated as "1". */
  event_version?: string;
}

// ---------------------------------------------------------------------------
// The lookup port
// ---------------------------------------------------------------------------

/**
 * Authoritative detail about a completed action, re-read from its owner module.
 *
 * The event says *that* something happened. This says *what*, and it is read
 * after the fact from the module that owns the row, so a stale or replayed
 * event cannot inject state that the Plan module would disagree with.
 */
export interface KarmaSourceAction {
  /** Must match the event's user_id, or the action is refused. */
  userId: string;
  challengeId: string | null;
  /** Current eligibility, which overrides whatever the event carried. */
  karmaLedgerEligible: boolean;
  /** Current outcome, which overrides whatever the event carried. */
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

/**
 * Implemented by the Plan/MKA side, consumed here.
 *
 * Returning `null` means "I do not recognise this action", and the ledger
 * treats that as a reason to record nothing - never as a reason to guess.
 */
export interface KarmaSourcePort {
  describeCompletedAction(
    userId: string,
    reference: KarmaSourceReference,
  ): Promise<KarmaSourceAction | null>;
}

/** Nest DI token. Consumers inject the interface, never a concrete class. */
export const KARMA_SOURCE_PORT = Symbol('KARMA_SOURCE_PORT');

/**
 * The default binding, and the one in force until the Plan module ships an
 * adapter.
 *
 * It answers "I cannot confirm this action" to everything. That is the correct
 * failure mode: with no confirmation, the ledger falls back to the event's own
 * assertions and records only what the event explicitly marked eligible. It
 * never fabricates an action, and it never deducts anything.
 *
 * Build Rule 173: an unavailable dependency is isolated behind an interface
 * with a controlled implementation, and the integration requirement is
 * retained rather than quietly dropped.
 */
export class NullKarmaSourceAdapter implements KarmaSourcePort {
  async describeCompletedAction(): Promise<KarmaSourceAction | null> {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const KARMA_ACTION_LABEL_MAX_LENGTH = 200;

/**
 * Structural validation of an inbound payload.
 *
 * Returns the reasons it is unusable, so the caller can log a label rather than
 * the payload. An empty array means the payload satisfies the contract.
 */
export function validateActionCompletedPayload(
  payload: unknown,
): string[] {
  const problems: string[] = [];
  if (!payload || typeof payload !== 'object') {
    return ['payload is not an object'];
  }
  const value = payload as Partial<KarmaActionCompletedPayload>;

  if (typeof value.event_id !== 'string' || value.event_id.length === 0) {
    problems.push('event_id');
  }
  if (typeof value.user_id !== 'string' || !UUID_PATTERN.test(value.user_id)) {
    problems.push('user_id');
  }
  if (
    value.source !== KarmaEntrySource.PLAN_COMPLETION &&
    value.source !== KarmaEntrySource.MKA_COMPLETION
  ) {
    problems.push('source');
  }
  if (
    typeof value.outcome !== 'string' ||
    !Object.values(KarmaActionOutcome).includes(
      value.outcome as KarmaActionOutcome,
    )
  ) {
    problems.push('outcome');
  }
  if (
    typeof value.completed_at !== 'string' ||
    Number.isNaN(Date.parse(value.completed_at))
  ) {
    problems.push('completed_at');
  }
  if (typeof value.karma_ledger_eligible !== 'boolean') {
    problems.push('karma_ledger_eligible');
  }

  // The reference must identify exactly one upstream row, matching the source.
  // Step 17 section 62: one action, one entry - an ambiguous reference could
  // not be de-duplicated, which is how double-scoring starts.
  const hasPlan = typeof value.plan_item_id === 'string';
  const hasMka = typeof value.mka_item_id === 'string';
  if (hasPlan === hasMka) {
    problems.push('plan_item_id|mka_item_id');
  } else if (
    (value.source === KarmaEntrySource.PLAN_COMPLETION && !hasPlan) ||
    (value.source === KarmaEntrySource.MKA_COMPLETION && !hasMka)
  ) {
    problems.push('source/reference mismatch');
  }

  return problems;
}
