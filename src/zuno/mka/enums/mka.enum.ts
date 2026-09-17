/**
 * Mind Karma Action contract enums. Step 15 MKA Specification, Step 20 Data
 * Model sections 36-38.
 *
 * `MkaDimension` (MIND / KARMA / ACTION) is deliberately NOT redeclared here -
 * it already exists in `common/enums/rulebook.enum.ts` because the SME Rulebook
 * authors remedies against it. Two spellings of the same concept is exactly the
 * drift Build Rule 180 forbids, so this module imports the canonical one.
 */
import { MkaDimension } from '../../common/enums';

export { MkaDimension };

/**
 * Lifecycle of an MKA programme. Step 15 sections 76-78.
 *
 * The three states the roadmap names explicitly are ACTIVE, COMPLETED and
 * SUPERSEDED. DRAFT exists because generation and activation are separable
 * (Step 15 section 102 lists quality gates "before activation"), EXPIRED
 * because Step 15 section 75 requires a review at the end of a bounded period
 * rather than silent continuation, and CANCELLED for a programme abandoned
 * before it ever ran.
 */
export enum MkaProgramStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  /** The period ended and a review is due. Step 15 section 75. */
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
  /** Replaced by a newer version after realignment. Step 15 section 76. */
  SUPERSEDED = 'SUPERSEDED',
  CANCELLED = 'CANCELLED',
}

/**
 * Legal programme transitions. Build Rule 179: a governed lifecycle is an
 * explicit map, not scattered booleans.
 *
 * COMPLETED and SUPERSEDED are terminal. Step 15 section 76 keeps historical
 * versions available for audit and continuity, which only holds if a finished
 * programme can never be re-opened and edited in place.
 */
export const MKA_PROGRAM_TRANSITIONS: Readonly<
  Record<MkaProgramStatus, readonly MkaProgramStatus[]>
> = {
  [MkaProgramStatus.DRAFT]: [
    MkaProgramStatus.ACTIVE,
    MkaProgramStatus.CANCELLED,
    MkaProgramStatus.SUPERSEDED,
  ],
  [MkaProgramStatus.ACTIVE]: [
    MkaProgramStatus.EXPIRED,
    MkaProgramStatus.COMPLETED,
    MkaProgramStatus.SUPERSEDED,
    MkaProgramStatus.CANCELLED,
  ],
  // Step 15 section 75: at expiry the options are STOP, CONTINUE or REPLACE.
  [MkaProgramStatus.EXPIRED]: [
    MkaProgramStatus.COMPLETED,
    MkaProgramStatus.SUPERSEDED,
    MkaProgramStatus.ACTIVE,
  ],
  [MkaProgramStatus.COMPLETED]: [],
  [MkaProgramStatus.SUPERSEDED]: [],
  [MkaProgramStatus.CANCELLED]: [],
};

export function canTransitionMkaProgram(
  from: MkaProgramStatus,
  to: MkaProgramStatus,
): boolean {
  return (MKA_PROGRAM_TRANSITIONS[from] ?? []).includes(to);
}

/** Step 20 section 36: the window an MKA programme covers. */
export enum MkaPeriodType {
  WEEK = 'WEEK',
  FORTNIGHT = 'FORTNIGHT',
  MONTH = 'MONTH',
  CUSTOM = 'CUSTOM',
}

/** Days covered by each period type. Step 15 section 8 defaults to WEEK. */
export const MKA_PERIOD_DAYS: Readonly<Record<MkaPeriodType, number>> = {
  [MkaPeriodType.WEEK]: 7,
  [MkaPeriodType.FORTNIGHT]: 14,
  [MkaPeriodType.MONTH]: 30,
  [MkaPeriodType.CUSTOM]: 7,
};

/** Step 15 section 14 and section 25. */
export enum MkaSourceType {
  /** Traced to an active, approved SME Rulebook remedy. Step 15 Rule 1. */
  APPROVED_ASTRO_REMEDY = 'APPROVED_ASTRO_REMEDY',
  /** ZUNO's own behavioural guidance - no astrology involved. */
  ZUNO_BEHAVIOURAL_GUIDANCE = 'ZUNO_BEHAVIOURAL_GUIDANCE',
  SERVICE = 'SERVICE',
  GRATITUDE = 'GRATITUDE',
  DISCIPLINE = 'DISCIPLINE',
  GENEROSITY = 'GENEROSITY',
  REFLECTION = 'REFLECTION',
  RELATIONSHIP_REPAIR = 'RELATIONSHIP_REPAIR',
  RESPONSIBILITY = 'RESPONSIBILITY',
  CONSTRUCTIVE_HABIT = 'CONSTRUCTIVE_HABIT',
  SME_APPROVED_PRACTICE = 'SME_APPROVED_PRACTICE',
  WHATNOW = 'WHATNOW',
  SCENARIO_PREPARATION = 'SCENARIO_PREPARATION',
  REALIGNMENT = 'REALIGNMENT',
  USER_GOAL = 'USER_GOAL',
  PLAN_REQUIREMENT = 'PLAN_REQUIREMENT',
  EXPERT_SAFE_GENERAL_GUIDANCE = 'EXPERT_SAFE_GENERAL_GUIDANCE',
}

/**
 * Source types that assert astrological provenance.
 *
 * An item carrying one of these MUST have a rulebook version and a rule/remedy
 * key, or it is a hallucinated remedy (Step 15 Rule 1, Anti-Pattern 110). The
 * service asserts this and the migration adds a CHECK constraint for it.
 */
export const ASTRO_DERIVED_SOURCE_TYPES: readonly MkaSourceType[] = [
  MkaSourceType.APPROVED_ASTRO_REMEDY,
  MkaSourceType.SME_APPROVED_PRACTICE,
];

/** Step 15 section 30. The Plan Engine owns final scheduling. */
export enum MkaFrequency {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  WEEKDAYS = 'WEEKDAYS',
  SPECIFIC_DAY = 'SPECIFIC_DAY',
  WEEKLY = 'WEEKLY',
  CUSTOM = 'CUSTOM',
  EVENT_TRIGGERED = 'EVENT_TRIGGERED',
}

/** Step 15 section 29. Do not make every item essential. */
export enum MkaPriority {
  ESSENTIAL = 'ESSENTIAL',
  IMPORTANT = 'IMPORTANT',
  OPTIONAL = 'OPTIONAL',
}

/** Step 15 section 67 / Step 20 section 38. */
export enum MkaItemStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  /** Timing-sensitive remedy past its valid_to. Step 15 section 74. */
  EXPIRED = 'EXPIRED',
  /** The user declined this practice. Step 15 section 99. */
  DECLINED = 'DECLINED',
  NO_LONGER_RELEVANT = 'NO_LONGER_RELEVANT',
  CANCELLED_BY_REALIGNMENT = 'CANCELLED_BY_REALIGNMENT',
}

/**
 * Legal item transitions.
 *
 * COMPLETED is terminal and can never be cancelled: Step 16 section 109 ("a
 * realignment must never erase valid completed work") applies to MKA the same
 * way it applies to the Plan.
 */
export const MKA_ITEM_TRANSITIONS: Readonly<
  Record<MkaItemStatus, readonly MkaItemStatus[]>
> = {
  [MkaItemStatus.ACTIVE]: [
    MkaItemStatus.COMPLETED,
    MkaItemStatus.EXPIRED,
    MkaItemStatus.DECLINED,
    MkaItemStatus.NO_LONGER_RELEVANT,
    MkaItemStatus.CANCELLED_BY_REALIGNMENT,
  ],
  [MkaItemStatus.COMPLETED]: [],
  [MkaItemStatus.EXPIRED]: [
    MkaItemStatus.NO_LONGER_RELEVANT,
    MkaItemStatus.CANCELLED_BY_REALIGNMENT,
  ],
  [MkaItemStatus.DECLINED]: [MkaItemStatus.NO_LONGER_RELEVANT],
  [MkaItemStatus.NO_LONGER_RELEVANT]: [],
  [MkaItemStatus.CANCELLED_BY_REALIGNMENT]: [],
};

export function canTransitionMkaItem(
  from: MkaItemStatus,
  to: MkaItemStatus,
): boolean {
  return (MKA_ITEM_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Step 20 section 38 / Step 15 section 67: how a single occurrence went.
 *
 * MISSED and NOT_DONE are recorded but carry no penalty anywhere in this
 * module. Step 15 sections 66-68 and Build Rule 64 forbid turning a missed
 * practice into shame, negative Karma or punitive messaging.
 */
export enum MkaCompletionStatus {
  DONE = 'DONE',
  NOT_DONE = 'NOT_DONE',
  MISSED = 'MISSED',
  SKIPPED = 'SKIPPED',
  DEFERRED = 'DEFERRED',
  NO_LONGER_RELEVANT = 'NO_LONGER_RELEVANT',
  CANCELLED_BY_REALIGNMENT = 'CANCELLED_BY_REALIGNMENT',
}

/** Who recorded the completion. */
export enum MkaCompletionSource {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  PLAN = 'PLAN',
  REALIGNMENT = 'REALIGNMENT',
}

/** Step 15 section 32: every programme carries a review condition. */
export enum MkaReviewTrigger {
  END_OF_PERIOD = 'END_OF_PERIOD',
  LIFE_SIGNAL = 'LIFE_SIGNAL',
  MAJOR_REALIGNMENT = 'MAJOR_REALIGNMENT',
  TIMING_WINDOW_CHANGE = 'TIMING_WINDOW_CHANGE',
  USER_REQUEST = 'USER_REQUEST',
}

/**
 * Whether astrology contributed to this programme.
 *
 * Step 15 section 51 names the value to store when there is no approved rule.
 * Recording it explicitly is what stops a later reader assuming the programme
 * was astrologically informed when it simply could not be.
 */
export enum MkaRemedyStatus {
  APPROVED_RULE_APPLIED = 'APPROVED_RULE_APPLIED',
  NO_APPROVED_RULE_AVAILABLE = 'NO_APPROVED_RULE_AVAILABLE',
  /** A rulebook exists but safety suppressed astrology for this user. */
  SUPPRESSED_BY_SAFETY = 'SUPPRESSED_BY_SAFETY',
  /** The user asked for no remedy-style practices. Step 15 sections 38/99. */
  DECLINED_BY_USER_PREFERENCE = 'DECLINED_BY_USER_PREFERENCE',
}

/**
 * Cognitive-load ceiling for one programme. Step 15 sections 26-28.
 *
 * The spec's preferred default is 1 Mind, 1 Karma (plus an optional secondary)
 * and 1-3 Actions. Sections 27 and 112 make exceeding it a product failure, so
 * this is enforced in code rather than left to prompt wording.
 */
export const MKA_DIMENSION_LIMITS: Readonly<Record<MkaDimension, number>> = {
  [MkaDimension.MIND]: 1,
  [MkaDimension.KARMA]: 2,
  [MkaDimension.ACTION]: 3,
};

/** Ceiling on astrology-derived items specifically. Step 15 section 27/112. */
export const MKA_MAX_ASTRO_REMEDIES = 1;

/** Engine version, stored on every programme for provenance (section 79). */
export const MKA_ENGINE_VERSION = 'mka-engine-1.0.0';
