/**
 * Life Signal contract enums. Step 13 Life Signal Engine Specification.
 *
 * WHY THESE LIVE HERE AND NOT IN `src/zuno/common/enums`
 * The canonical contract package is the right long-term home (Build Rule 180),
 * but `common/enums/index.ts` and `common/enums/event.enum.ts` are frozen for
 * this change. Everything below is re-exported from a single module barrel so a
 * later move is a file relocation, not a rewrite of call sites. WIRING.md
 * records the move.
 */

/**
 * Where a signal came from. Step 20 Data Model section 32 defines the storage
 * vocabulary; Step 13 section 6 lists the richer conceptual set. The two are
 * reconciled here: Step 20's values are the stored `source` column, and Step 13's
 * finer origins are carried on the signal-source rows as `origin`.
 *
 * Step 13 section 6: "For MVP, priority should remain on explicitly
 * user-provided and ZUNO-generated internal signals." EXTERNAL_SOURCE is
 * declared so the column vocabulary is complete, and is rejected at the service
 * boundary until consent and trust controls exist (Step 20 section 32).
 */
export enum LifeSignalSource {
  USER_EXPLICIT = 'USER_EXPLICIT',
  PLAN_EVENT = 'PLAN_EVENT',
  KARMA_LEDGER = 'KARMA_LEDGER',
  SYSTEM_DERIVED = 'SYSTEM_DERIVED',
  EXTERNAL_SOURCE = 'EXTERNAL_SOURCE',
  ADMIN = 'ADMIN',
}

/** Sources ZUNO will accept today. Roadmap section 61. */
export const ACCEPTED_LIFE_SIGNAL_SOURCES: readonly LifeSignalSource[] = [
  LifeSignalSource.USER_EXPLICIT,
  LifeSignalSource.PLAN_EVENT,
  LifeSignalSource.KARMA_LEDGER,
  LifeSignalSource.SYSTEM_DERIVED,
  LifeSignalSource.ADMIN,
];

/**
 * Finer provenance recorded on each contributing source row.
 * Step 13 section 6.
 */
export enum LifeSignalOrigin {
  USER_MESSAGE = 'USER_MESSAGE',
  USER_CHECK_IN = 'USER_CHECK_IN',
  USER_ACTION = 'USER_ACTION',
  PLAN_PROGRESS = 'PLAN_PROGRESS',
  KARMA_LEDGER = 'KARMA_LEDGER',
  SCENARIO_UPDATE = 'SCENARIO_UPDATE',
  PROFILE_CHANGE = 'PROFILE_CHANGE',
  TIME_EVENT = 'TIME_EVENT',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  NOTIFICATION_RESPONSE = 'NOTIFICATION_RESPONSE',
  CONNECTED_DATA_SOURCE = 'CONNECTED_DATA_SOURCE',
  ADMIN_CONFIG = 'ADMIN_CONFIG',
}

/** Step 13 section 11. Configurable taxonomy; this is the initial set. */
export enum LifeSignalType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  EXTERNAL_EVENT = 'EXTERNAL_EVENT',
  OPPORTUNITY = 'OPPORTUNITY',
  SETBACK = 'SETBACK',
  DECISION = 'DECISION',
  DEADLINE = 'DEADLINE',
  FINANCIAL_CHANGE = 'FINANCIAL_CHANGE',
  CAREER_EVENT = 'CAREER_EVENT',
  RELATIONSHIP_EVENT = 'RELATIONSHIP_EVENT',
  EDUCATION_EVENT = 'EDUCATION_EVENT',
  BUSINESS_EVENT = 'BUSINESS_EVENT',
  FAMILY_EVENT = 'FAMILY_EVENT',
  PROPERTY_EVENT = 'PROPERTY_EVENT',
  LEGAL_EVENT = 'LEGAL_EVENT',
  LOCATION_EVENT = 'LOCATION_EVENT',
  WELLBEING_SIGNAL = 'WELLBEING_SIGNAL',
  PLAN_PROGRESS = 'PLAN_PROGRESS',
  PLAN_BLOCKER = 'PLAN_BLOCKER',
  PREFERENCE_CHANGE = 'PREFERENCE_CHANGE',
  GOAL_CHANGE = 'GOAL_CHANGE',
  RISK_CHANGE = 'RISK_CHANGE',
  TIME_SIGNAL = 'TIME_SIGNAL',
  ASTRO_TIMING_CHANGE = 'ASTRO_TIMING_CHANGE',
  OTHER = 'OTHER',
}

/**
 * Step 13 section 62: an EVENT happens, a STATE persists. The distinction has
 * to be in the data model, because it decides whether temporal decay applies
 * (section 60) or whether the row is a standing fact (section 61).
 */
export enum LifeSignalNature {
  EVENT = 'EVENT',
  STATE = 'STATE',
}

/**
 * Step 13 section 17. Reliability describes *where the signal came from*, not
 * whether it is true - the spec is explicit that these are different things.
 */
export enum LifeSignalReliability {
  USER_REPORTED = 'USER_REPORTED',
  USER_CONFIRMED = 'USER_CONFIRMED',
  SYSTEM_OBSERVED = 'SYSTEM_OBSERVED',
  CONNECTED_SOURCE = 'CONNECTED_SOURCE',
  ADMIN_CONFIRMED = 'ADMIN_CONFIRMED',
  INFERRED = 'INFERRED',
  UNVERIFIED = 'UNVERIFIED',
}

/**
 * Reliability classes that are an inference rather than a report of fact.
 * Step 13 Rule 3: "User fear must never be promoted to fact without evidence."
 */
export const INFERRED_RELIABILITIES: readonly LifeSignalReliability[] = [
  LifeSignalReliability.INFERRED,
  LifeSignalReliability.UNVERIFIED,
];

/** Step 13 section 14. */
export enum LifeSignalMateriality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export const MATERIALITY_RANK: Readonly<Record<LifeSignalMateriality, number>> = {
  [LifeSignalMateriality.LOW]: 0,
  [LifeSignalMateriality.MEDIUM]: 1,
  [LifeSignalMateriality.HIGH]: 2,
  [LifeSignalMateriality.CRITICAL]: 3,
};

/** Step 13 section 16. */
export enum LifeSignalRelevance {
  DIRECT = 'DIRECT',
  INDIRECT = 'INDIRECT',
  UNRELATED = 'UNRELATED',
  UNCERTAIN = 'UNCERTAIN',
}

/**
 * Lifecycle. Step 13 section 23 lists the conceptual states; Roadmap section 60
 * names the ones Phase 9 must implement (candidate, confirmation, rejection).
 *
 * The mapping used here, recorded so nobody has to guess later:
 *   DETECTED/VALIDATED  -> CANDIDATE   (not yet allowed to influence anything)
 *   ACTIVE/ACKNOWLEDGED -> ACTIVE      (confirmed and currently relevant)
 *   SUPERSEDED          -> SUPERSEDED  (section 21/22: a later signal replaced it)
 *   DISMISSED           -> DISMISSED   (the user rejected the candidate)
 *   RESOLVED            -> RESOLVED
 *   ARCHIVED            -> ARCHIVED
 * STALE is added because Step 13 section 60 requires temporal decay to be a real
 * state, not an implicit filter every reader has to remember to apply.
 */
export enum LifeSignalStatus {
  CANDIDATE = 'CANDIDATE',
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
  STALE = 'STALE',
  DISMISSED = 'DISMISSED',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Legal lifecycle moves. Build Rule 179: a governed lifecycle is an explicit
 * transition table, never scattered booleans.
 */
export const LIFE_SIGNAL_STATUS_TRANSITIONS: Readonly<
  Record<LifeSignalStatus, readonly LifeSignalStatus[]>
> = {
  [LifeSignalStatus.CANDIDATE]: [
    LifeSignalStatus.ACTIVE,
    LifeSignalStatus.DISMISSED,
    LifeSignalStatus.STALE,
    LifeSignalStatus.ARCHIVED,
  ],
  [LifeSignalStatus.ACTIVE]: [
    LifeSignalStatus.SUPERSEDED,
    LifeSignalStatus.STALE,
    LifeSignalStatus.RESOLVED,
    LifeSignalStatus.DISMISSED,
    LifeSignalStatus.ARCHIVED,
  ],
  // A superseded signal is history. Step 13 section 21: "Maintain history while
  // updating current state." It never comes back.
  [LifeSignalStatus.SUPERSEDED]: [LifeSignalStatus.ARCHIVED],
  // Step 13 section 60: decay is reversible when later evidence revives it, so
  // a stale signal the user re-confirms becomes ACTIVE again.
  [LifeSignalStatus.STALE]: [LifeSignalStatus.ACTIVE, LifeSignalStatus.ARCHIVED],
  [LifeSignalStatus.DISMISSED]: [LifeSignalStatus.ARCHIVED],
  [LifeSignalStatus.RESOLVED]: [LifeSignalStatus.ARCHIVED],
  [LifeSignalStatus.ARCHIVED]: [],
};

export function canTransitionLifeSignal(
  from: LifeSignalStatus,
  to: LifeSignalStatus,
): boolean {
  return (LIFE_SIGNAL_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Confirmation state, held separately from lifecycle status.
 *
 * Step 21 section 43 puts `confirmationStatus: "CONFIRMED_USER_REPORTED"` on
 * the wire, so that spelling is contractual. The axis is separate from
 * lifecycle because the two answer different questions: status asks "is this
 * signal currently in play", confirmation asks "do we actually know this".
 */
export enum SignalConfirmationStatus {
  /** Detected, nothing has vouched for it yet. */
  UNCONFIRMED = 'UNCONFIRMED',
  /** High impact but ambiguous - Step 13 section 82 requires asking first. */
  AWAITING_USER_CONFIRMATION = 'AWAITING_USER_CONFIRMATION',
  /** The user stated it explicitly. Step 21 section 42. */
  CONFIRMED_USER_REPORTED = 'CONFIRMED_USER_REPORTED',
  /** ZUNO observed it in its own state (a plan item completing, say). */
  CONFIRMED_SYSTEM_OBSERVED = 'CONFIRMED_SYSTEM_OBSERVED',
  CONFIRMED_ADMIN = 'CONFIRMED_ADMIN',
  /** The user said no. Roadmap section 66: "user can reject candidate signal". */
  REJECTED = 'REJECTED',
}

/**
 * The single predicate the rest of the system must use before treating a signal
 * as something that happened.
 *
 * Step 13 Rule 3 and section 19: a fear stays a fear until evidence promotes
 * it. Anything not in this list is an inference and must be presented as one.
 */
export const CONFIRMED_SIGNAL_STATUSES: readonly SignalConfirmationStatus[] = [
  SignalConfirmationStatus.CONFIRMED_USER_REPORTED,
  SignalConfirmationStatus.CONFIRMED_SYSTEM_OBSERVED,
  SignalConfirmationStatus.CONFIRMED_ADMIN,
];

export function isConfirmedSignal(status: SignalConfirmationStatus): boolean {
  return CONFIRMED_SIGNAL_STATUSES.includes(status);
}

/** What produced a confirmation-state row. Kept for the audit trail. */
export enum SignalConfirmationActor {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  ADMIN = 'ADMIN',
}

/** Step 13 section 38. */
export enum SignalPatternType {
  SINGLE_EVENT = 'SINGLE_EVENT',
  REPEATED_PATTERN = 'REPEATED_PATTERN',
  TREND = 'TREND',
  REVERSAL = 'REVERSAL',
  MILESTONE = 'MILESTONE',
}

/**
 * Direction of a category trend, for the My Journey screen.
 * Step 13 sections 39-40.
 *
 * INSUFFICIENT_EVIDENCE exists deliberately. Step 13 section 78 forbids
 * overreacting to thin evidence, and rendering "declining" off one data point
 * would be exactly that.
 */
export enum SignalTrendDirection {
  IMPROVING = 'IMPROVING',
  STEADY = 'STEADY',
  DECLINING = 'DECLINING',
  MIXED = 'MIXED',
  INSUFFICIENT_EVIDENCE = 'INSUFFICIENT_EVIDENCE',
}

/** How a signal changes urgency, if at all. Step 13 section 10. */
export enum UrgencyChange {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
  NONE = 'NONE',
}

/** Step 13 section 52. Also consumed by the Realignment Engine. */
export enum RealignmentReasonCode {
  NEW_FACT = 'NEW_FACT',
  FACT_CORRECTED = 'FACT_CORRECTED',
  SCENARIO_TRIGGERED = 'SCENARIO_TRIGGERED',
  SCENARIO_RELEVANCE_CHANGED = 'SCENARIO_RELEVANCE_CHANGED',
  NEW_SCENARIO = 'NEW_SCENARIO',
  SCENARIO_DISMISSED = 'SCENARIO_DISMISSED',
  DEPENDENCY_CHANGED = 'DEPENDENCY_CHANGED',
  CONSTRAINT_CHANGED = 'CONSTRAINT_CHANGED',
  GOAL_CHANGED = 'GOAL_CHANGED',
  PREFERENCE_CHANGED = 'PREFERENCE_CHANGED',
  PLAN_BLOCKED = 'PLAN_BLOCKED',
  PLAN_INEFFECTIVE = 'PLAN_INEFFECTIVE',
  PLAN_TOO_COMPLEX = 'PLAN_TOO_COMPLEX',
  PLAN_COMPLETED = 'PLAN_COMPLETED',
  URGENCY_INCREASED = 'URGENCY_INCREASED',
  URGENCY_DECREASED = 'URGENCY_DECREASED',
  RISK_CHANGED = 'RISK_CHANGED',
  OPPORTUNITY_APPEARED = 'OPPORTUNITY_APPEARED',
  OPPORTUNITY_DISAPPEARED = 'OPPORTUNITY_DISAPPEARED',
  TIME_WINDOW_CHANGED = 'TIME_WINDOW_CHANGED',
  ASTRO_TIMING_CHANGED = 'ASTRO_TIMING_CHANGED',
  SAFETY_CHANGED = 'SAFETY_CHANGED',
  USER_REQUESTED_REASSESSMENT = 'USER_REQUESTED_REASSESSMENT',
  RULEBOOK_REASSESSMENT = 'RULEBOOK_REASSESSMENT',
  PRIMARY_STRATEGY_INVALIDATED = 'PRIMARY_STRATEGY_INVALIDATED',
}

/** Step 20 section 33: what a signal is asserted to affect. */
export enum SignalImpactType {
  SUPPORTS = 'SUPPORTS',
  CONTRADICTS = 'CONTRADICTS',
  INVALIDATES = 'INVALIDATES',
  INTRODUCES = 'INTRODUCES',
  PROGRESSES = 'PROGRESSES',
  BLOCKS = 'BLOCKS',
}

/** The entity kinds a signal impact may point at. */
export enum SignalImpactEntityType {
  CHALLENGE = 'CHALLENGE',
  CHALLENGE_CONTEXT = 'CHALLENGE_CONTEXT',
  SCENARIO = 'SCENARIO',
  PLAN = 'PLAN',
  PLAN_ITEM = 'PLAN_ITEM',
  MKA_PROGRAM = 'MKA_PROGRAM',
  ASSUMPTION = 'ASSUMPTION',
}

/**
 * Signal types that assert a standing state rather than a moment in time.
 * Step 13 section 61: "These are state facts until explicitly changed" - they
 * must not silently decay.
 */
export const NON_DECAYING_SIGNAL_TYPES: readonly LifeSignalType[] = [
  LifeSignalType.STATUS_CHANGE,
  LifeSignalType.DECISION,
  LifeSignalType.GOAL_CHANGE,
  LifeSignalType.PREFERENCE_CHANGE,
  LifeSignalType.LOCATION_EVENT,
  LifeSignalType.LEGAL_EVENT,
];

/**
 * How long an ordinary signal stays current before it is considered stale.
 *
 * Step 13 section 60 requires decay but does not fix a number, and Step 13
 * section 26 says thresholds "should be configurable". 45 days is the default
 * chosen here: long enough to cover a 30-day plan window plus a review cycle,
 * short enough that "one negative manager interaction six months ago" (the
 * spec's own example) cannot dominate.
 */
export const DEFAULT_SIGNAL_FRESHNESS_DAYS = 45;

/**
 * Minimum confirmed, non-stale signals in a category before a direction other
 * than INSUFFICIENT_EVIDENCE is reported. Step 13 section 37: a pattern needs
 * repetition to mean anything.
 */
export const TREND_MIN_OBSERVATIONS = 3;

/**
 * Outbox event types emitted by this module. Step 13 section 87.
 *
 * These are strings rather than members of `ZunoEventType` because
 * `common/enums/event.enum.ts` is frozen for this change. They are the exact
 * values that belong in that enum; WIRING.md lists them for the move. The cast
 * happens in exactly one place (`asZunoEventType`) so the debt is greppable.
 */
export const SIGNAL_EVENT_TYPES = {
  LIFE_SIGNAL_DETECTED: 'zuno.life_signal.detected',
  LIFE_SIGNAL_VALIDATED: 'zuno.life_signal.validated',
  LIFE_SIGNAL_MATERIAL: 'zuno.life_signal.material',
  LIFE_SIGNAL_CONFIRMED: 'zuno.life_signal.confirmed',
  LIFE_SIGNAL_REJECTED: 'zuno.life_signal.rejected',
  LIFE_SIGNAL_SUPERSEDED: 'zuno.life_signal.superseded',
  LIFE_SIGNAL_STALE: 'zuno.life_signal.stale',
  REALIGNMENT_REQUESTED: 'zuno.realignment.requested',
} as const;

/** Aggregate type for signal rows. Belongs in `ZunoAggregateType`. */
export const LIFE_SIGNAL_AGGREGATE = 'LIFE_SIGNAL';
