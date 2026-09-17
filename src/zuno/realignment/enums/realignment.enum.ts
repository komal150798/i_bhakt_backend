/**
 * Realignment contract enums. Step 14 Realignment Engine Specification.
 *
 * Declared here rather than in `src/zuno/common/enums` for the same reason as
 * the Life Signal enums: the canonical package is frozen for this change.
 * WIRING.md records the move.
 */

/** Step 14 section 7. */
export enum RealignmentLevel {
  NONE = 'NONE',
  MICRO = 'MICRO',
  PARTIAL = 'PARTIAL',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL',
}

export const REALIGNMENT_LEVEL_RANK: Readonly<Record<RealignmentLevel, number>> =
  {
    [RealignmentLevel.NONE]: 0,
    [RealignmentLevel.MICRO]: 1,
    [RealignmentLevel.PARTIAL]: 2,
    [RealignmentLevel.MAJOR]: 3,
    [RealignmentLevel.CRITICAL]: 4,
  };

/** Step 14 section 18: the smallest scope that still reflects reality. */
export enum RealignmentScope {
  TASK = 'TASK',
  DAY = 'DAY',
  WEEK = 'WEEK',
  THIRTY_DAY_PLAN = 'THIRTY_DAY_PLAN',
  SCENARIO = 'SCENARIO',
  GOAL = 'GOAL',
  CHALLENGE = 'CHALLENGE',
  MULTI_CHALLENGE = 'MULTI_CHALLENGE',
}

/**
 * Lifecycle of a realignment record.
 *
 * EVALUATED and APPLIED are separate states because Step 14 section 83 makes
 * evaluation and application separate operations - a realignment that needs the
 * user's agreement (section 65) must be able to exist, fully decided, without
 * having touched anything.
 *
 * FAILED exists for completeness of the vocabulary but is never written by the
 * apply path: a failed apply rolls its whole transaction back, which by
 * definition cannot leave a FAILED row behind. Section 87 says to "retain
 * existing state, flag reassessment pending" - so a failed apply leaves the
 * realignment in EVALUATED, still pending, and safe to retry.
 */
export enum RealignmentStatus {
  PENDING = 'PENDING',
  EVALUATED = 'EVALUATED',
  AWAITING_USER_CONFIRMATION = 'AWAITING_USER_CONFIRMATION',
  APPLIED = 'APPLIED',
  SUPERSEDED = 'SUPERSEDED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export const REALIGNMENT_STATUS_TRANSITIONS: Readonly<
  Record<RealignmentStatus, readonly RealignmentStatus[]>
> = {
  [RealignmentStatus.PENDING]: [
    RealignmentStatus.EVALUATED,
    RealignmentStatus.SUPERSEDED,
    RealignmentStatus.CANCELLED,
    RealignmentStatus.FAILED,
  ],
  [RealignmentStatus.EVALUATED]: [
    RealignmentStatus.AWAITING_USER_CONFIRMATION,
    RealignmentStatus.APPLIED,
    RealignmentStatus.SUPERSEDED,
    RealignmentStatus.CANCELLED,
  ],
  [RealignmentStatus.AWAITING_USER_CONFIRMATION]: [
    RealignmentStatus.APPLIED,
    RealignmentStatus.CANCELLED,
    RealignmentStatus.SUPERSEDED,
  ],
  // Applied is terminal except for being superseded by a later realignment.
  // Step 14 section 57: every material realignment is a versioned record.
  [RealignmentStatus.APPLIED]: [RealignmentStatus.SUPERSEDED],
  [RealignmentStatus.SUPERSEDED]: [],
  [RealignmentStatus.CANCELLED]: [],
  [RealignmentStatus.FAILED]: [RealignmentStatus.EVALUATED],
};

export function canTransitionRealignment(
  from: RealignmentStatus,
  to: RealignmentStatus,
): boolean {
  return (REALIGNMENT_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Step 14 section 12: the Preserve / Modify / Remove / Add model, described in
 * the spec as "a foundational design principle".
 *
 * PRESERVE is a real, recorded change type even though it changes nothing.
 * Step 14 section 77 puts "what stays the same" in the user-facing explanation,
 * and Rule 2 requires realignment to preserve everything still useful - a
 * bucket that is only implied cannot be shown or audited.
 */
export enum RealignmentChangeType {
  PRESERVE = 'PRESERVE',
  MODIFY = 'MODIFY',
  REMOVE = 'REMOVE',
  ADD = 'ADD',
  /** Step 14 section 55: a new plan version replaced the previous one. */
  PLAN_REPLACED = 'PLAN_REPLACED',
  PLAN_PATCHED = 'PLAN_PATCHED',
  MKA_SUPERSEDED = 'MKA_SUPERSEDED',
  REMINDERS_SUPPRESSED = 'REMINDERS_SUPPRESSED',
  ITEMS_CANCELLED = 'ITEMS_CANCELLED',
}

/** What a realignment change points at. */
export enum RealignmentEntityType {
  PLAN = 'PLAN',
  PLAN_ITEM = 'PLAN_ITEM',
  MKA_PROGRAM = 'MKA_PROGRAM',
  REMINDER = 'REMINDER',
  SCENARIO = 'SCENARIO',
  CHALLENGE = 'CHALLENGE',
  ASSUMPTION = 'ASSUMPTION',
}

/** Step 14 section 5. */
export enum RealignmentTrigger {
  LIFE_SIGNAL = 'LIFE_SIGNAL',
  USER_REQUEST = 'USER_REQUEST',
  SCENARIO_TRIGGER = 'SCENARIO_TRIGGER',
  TIME_EVENT = 'TIME_EVENT',
  PLAN_FAILURE_PATTERN = 'PLAN_FAILURE_PATTERN',
  SAFETY_CHANGE = 'SAFETY_CHANGE',
  RULEBOOK_REASSESSMENT = 'RULEBOOK_REASSESSMENT',
  CHALLENGE_CONTEXT_UPDATE = 'CHALLENGE_CONTEXT_UPDATE',
}

/** Step 14 section 25. */
export enum AssumptionStatus {
  HOLDS = 'HOLDS',
  UNCERTAIN = 'UNCERTAIN',
  INVALIDATED = 'INVALIDATED',
}

/** Step 14 section 31. */
export enum PlanChangeMode {
  NONE = 'NONE',
  PATCH = 'PATCH',
  REGENERATE = 'REGENERATE',
}

/**
 * How many plan components may change before a patch stops being a patch.
 * Step 14 section 34 requires a configurable threshold and warns against
 * burying the rule inside a prompt.
 */
export const PLAN_PATCH_MAX_CHANGED_COMPONENTS = 3;

/** Outbox event types. Step 14 section 84. */
export const REALIGNMENT_EVENT_TYPES = {
  REALIGNMENT_REQUESTED: 'zuno.realignment.requested',
  REALIGNMENT_EVALUATED: 'zuno.realignment.evaluated',
  REALIGNMENT_CONFIRMATION_REQUIRED: 'zuno.realignment.confirmation_required',
  REALIGNMENT_APPLIED: 'zuno.realignment.applied',
  REALIGNMENT_COMPLETED: 'zuno.realignment.completed',
  REALIGNMENT_FAILED: 'zuno.realignment.failed',
} as const;

/** Aggregate type for realignment rows. Belongs in `ZunoAggregateType`. */
export const REALIGNMENT_AGGREGATE = 'REALIGNMENT';
