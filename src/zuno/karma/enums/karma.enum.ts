/**
 * Karma Ledger contract vocabulary.
 *
 * Source of truth: Step 17 Karma Ledger sections 4, 8, 24, 56, 74 and Step 20
 * Data Model sections 44-48.
 *
 * Declared inside the karma module rather than in `common/enums` because that
 * package is a shared contract surface owned by the platform phase and is
 * frozen for this work package. Every value below is the spelling the
 * specification uses, so promoting this file into `common/enums/karma.enum.ts`
 * later is a move, not a rename (Build Rule 180).
 *
 * NEUTRALITY NOTE (Step 17 sections 8-9, 103, Roadmap section 55):
 * nothing in this file names the *user*. Every enum describes an action, a
 * source, a category or a pattern. There is deliberately no value meaning
 * "good user", "bad user", "failure" or "penalty", and no ordering that would
 * let a caller treat one classification as morally above another.
 */

/** Step 17 section 4: where a ledger entry may originate. */
export enum KarmaEntrySource {
  USER_CREATED = 'USER_CREATED',
  PLAN_COMPLETION = 'PLAN_COMPLETION',
  MKA_COMPLETION = 'MKA_COMPLETION',
  USER_REFLECTION = 'USER_REFLECTION',
  CONSTRUCTIVE_HABIT = 'CONSTRUCTIVE_HABIT',
  SERVICE = 'SERVICE',
  GRATITUDE = 'GRATITUDE',
  RESPONSIBILITY = 'RESPONSIBILITY',
  RELATIONSHIP_ACTION = 'RELATIONSHIP_ACTION',
  CAREER_ACTION = 'CAREER_ACTION',
  LEARNING_ACTION = 'LEARNING_ACTION',
  SELF_DISCIPLINE = 'SELF_DISCIPLINE',
  REPAIR_ACTION = 'REPAIR_ACTION',
  OTHER = 'OTHER',
}

/** Sources ZUNO generates from an upstream completion rather than user input. */
export const SYSTEM_KARMA_SOURCES: readonly KarmaEntrySource[] = [
  KarmaEntrySource.PLAN_COMPLETION,
  KarmaEntrySource.MKA_COMPLETION,
];

/**
 * Step 17 section 8. Five values, not two.
 *
 * MIXED and UNCERTAIN exist because Step 17 sections 11-13 forbid collapsing a
 * nuanced action into a binary score and forbid fabricating moral certainty
 * when context is insufficient. Roadmap section 55 makes supporting
 * neutral/uncertain classification the Phase 8 acceptance criterion.
 */
export enum KarmaClassification {
  CONSTRUCTIVE = 'CONSTRUCTIVE',
  UNCONSTRUCTIVE = 'UNCONSTRUCTIVE',
  NEUTRAL = 'NEUTRAL',
  MIXED = 'MIXED',
  UNCERTAIN = 'UNCERTAIN',
}

export const KARMA_CLASSIFICATIONS: readonly KarmaClassification[] =
  Object.values(KarmaClassification);

/**
 * Classifications a *system-sourced* completion may carry.
 *
 * Step 17 Rule 4 and section 28: completing or missing a planned action must
 * never be turned into a judgement about the user. A Plan or MKA completion is
 * therefore never allowed to land on UNCONSTRUCTIVE - at worst it is NEUTRAL.
 * Only the user's own words can carry that label, and only when the user is
 * describing their own action (Step 17 section 5).
 */
export const SYSTEM_SOURCED_CLASSIFICATIONS: readonly KarmaClassification[] = [
  KarmaClassification.CONSTRUCTIVE,
  KarmaClassification.NEUTRAL,
  KarmaClassification.MIXED,
  KarmaClassification.UNCERTAIN,
];

/** Step 17 section 24. */
export enum KarmaCategory {
  SELF_DISCIPLINE = 'SELF_DISCIPLINE',
  SERVICE = 'SERVICE',
  GRATITUDE = 'GRATITUDE',
  RESPONSIBILITY = 'RESPONSIBILITY',
  CAREER = 'CAREER',
  LEARNING = 'LEARNING',
  RELATIONSHIP = 'RELATIONSHIP',
  FAMILY = 'FAMILY',
  FINANCIAL_RESPONSIBILITY = 'FINANCIAL_RESPONSIBILITY',
  HEALTH_SUPPORT = 'HEALTH_SUPPORT',
  COMMUNICATION = 'COMMUNICATION',
  REPAIR = 'REPAIR',
  COURAGE = 'COURAGE',
  CONSISTENCY = 'CONSISTENCY',
  MINDFULNESS = 'MINDFULNESS',
  OTHER = 'OTHER',
}

export const KARMA_CATEGORIES: readonly KarmaCategory[] =
  Object.values(KarmaCategory);

/**
 * Step 17 section 7 (`intent`) and section 27.
 *
 * INTENTIONAL_PRACTICE is the value Step 17 section 27 names for a completed
 * astrology-derived practice. It records that the person did the practice they
 * intended to do - it does not record that anything cosmic happened.
 */
export enum KarmaIntent {
  SUPPORT = 'SUPPORT',
  RESPONSIBILITY = 'RESPONSIBILITY',
  REPAIR = 'REPAIR',
  GROWTH = 'GROWTH',
  FOLLOW_THROUGH = 'FOLLOW_THROUGH',
  INTENTIONAL_PRACTICE = 'INTENTIONAL_PRACTICE',
  ROUTINE = 'ROUTINE',
  UNKNOWN = 'UNKNOWN',
}

/** Step 17 section 7 (`impact_scope`). */
export enum KarmaImpactScope {
  SELF = 'SELF',
  OTHER_PERSON = 'OTHER_PERSON',
  FAMILY = 'FAMILY',
  COMMUNITY = 'COMMUNITY',
  WORK = 'WORK',
  UNKNOWN = 'UNKNOWN',
}

/** Step 17 section 56. */
export enum KarmaEntryStatus {
  ACTIVE = 'ACTIVE',
  EDITED = 'EDITED',
  DELETED = 'DELETED',
  SUPERSEDED = 'SUPERSEDED',
}

/**
 * Step 17 sections 3, 68-69 and Roadmap section 56.
 *
 * Only one value exists on purpose. The ledger is private to the user by
 * default and there is no approved sharing feature, so there is no state a
 * caller could move an entry into that would expose it. Adding a value here
 * without the explicit, granular, revocable sharing flow of Step 17 section 69
 * would be a silent privacy change.
 */
export enum KarmaVisibility {
  PRIVATE = 'PRIVATE',
}

/** Semantic effort label. Step 17 section 21 - the LLM may supply this. */
export enum KarmaEffort {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/** Semantic relevance to the user's active plan/values. Step 17 section 21. */
export enum KarmaRelevance {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * How an upstream action finished.
 *
 * Only COMPLETED can ever reach scoring. The other three exist so the ledger
 * can *recognise and ignore* them explicitly rather than by omission:
 *   MISSED                    Step 17 sections 28, 82 - never negative karma
 *   DEFERRED                  Step 17 section 49 - context matters, not a fault
 *   CANCELLED_BY_REALIGNMENT  Step 17 sections 48, 83 / Rule 5 - never a penalty
 */
export enum KarmaActionOutcome {
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  DEFERRED = 'DEFERRED',
  CANCELLED_BY_REALIGNMENT = 'CANCELLED_BY_REALIGNMENT',
}

/**
 * Outcomes that must never reduce points, consistency or standing.
 * Step 17 Rules 4 and 5 call this non-negotiable.
 */
export const NON_PENALISING_OUTCOMES: readonly KarmaActionOutcome[] = [
  KarmaActionOutcome.MISSED,
  KarmaActionOutcome.DEFERRED,
  KarmaActionOutcome.CANCELLED_BY_REALIGNMENT,
];

/**
 * Step 17 section 74. Behavioural observations, not spiritual judgements.
 *
 * AVOIDANCE_DECREASING is phrased as an improvement rather than
 * "AVOIDANCE_HIGH" deliberately: Step 17 section 77 requires an unhelpful
 * pattern to be surfaced as something to look at together, never as decline.
 */
export enum KarmaPatternType {
  FOLLOW_THROUGH_INCREASING = 'FOLLOW_THROUGH_INCREASING',
  SERVICE_CONSISTENT = 'SERVICE_CONSISTENT',
  AVOIDANCE_DECREASING = 'AVOIDANCE_DECREASING',
  REPAIR_BEHAVIOUR_INCREASING = 'REPAIR_BEHAVIOUR_INCREASING',
  STUDY_DISCIPLINE_IMPROVING = 'STUDY_DISCIPLINE_IMPROVING',
  CONSISTENCY_STEADY = 'CONSISTENCY_STEADY',
}

export enum KarmaPatternStatus {
  OBSERVED = 'OBSERVED',
  FADED = 'FADED',
}

/** Step 20 section 47: lifecycle of a versioned scoring configuration. */
export enum KarmaScoreConfigStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  RETIRED = 'RETIRED',
}

/**
 * Step 17 section 23: how a scoring-model change may touch existing rows.
 *
 * FUTURE_ONLY is the implemented default. The other two are declared so the
 * column has a contractual vocabulary, but no code path performs them - a
 * retroactive rescore needs the opt-in or audited migration Step 17 section 23
 * describes, not a silent sweep.
 */
export enum KarmaRescorePolicy {
  FUTURE_ONLY = 'FUTURE_ONLY',
  USER_OPT_IN_RECALCULATION = 'USER_OPT_IN_RECALCULATION',
  ADMIN_MIGRATION_WITH_AUDIT = 'ADMIN_MIGRATION_WITH_AUDIT',
}

/** Who made a change, for `karma_entry_revisions.changed_by`. */
export enum KarmaRevisionActor {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

/** Outcome of feeding an upstream completion into the ledger. */
export enum KarmaIngestResult {
  /** A ledger entry was created. */
  RECORDED = 'RECORDED',
  /** The same action is already in the ledger. Step 17 sections 57, 91. */
  DUPLICATE = 'DUPLICATE',
  /** Upstream did not mark the action ledger-eligible. Step 17 sections 6, 25. */
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  /**
   * The action did not complete. No entry, no points, no deduction.
   * Step 17 sections 28, 48, 49.
   */
  NO_PENALTY = 'NO_PENALTY',
  /**
   * An astrology-derived practice arrived while no approved Rulebook is
   * active. Fail closed: nothing is recorded, nothing is deducted.
   * Build Rules 51, 118, 130.
   */
  INTERPRETATION_UNAVAILABLE = 'INTERPRETATION_UNAVAILABLE',
  /** Safety took precedence over scoring. Step 17 sections 30-31, Rule 8. */
  SAFETY_ROUTED = 'SAFETY_ROUTED',
  /** The payload did not satisfy the event contract. */
  INVALID_EVENT = 'INVALID_EVENT',
}
