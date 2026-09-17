/**
 * Plan Engine contract enums.
 * Step 16 Plan Engine Specification, Step 20 Data Model sections 39-43.
 */

/** Step 20 section 40, Step 16 section 3. */
export enum PlanType {
  TODAY = 'TODAY',
  WEEKLY = 'WEEKLY',
  THIRTY_DAY = 'THIRTY_DAY',
  LONG_TERM = 'LONG_TERM',
  CUSTOM = 'CUSTOM',
}

/** Step 16 section 16. */
export enum PlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  SUPERSEDED = 'SUPERSEDED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Legal plan transitions. Build Rule 46: "a replaced Plan must not continue
 * behaving as current", which only holds if SUPERSEDED is terminal.
 */
export const PLAN_STATUS_TRANSITIONS: Readonly<
  Record<PlanStatus, readonly PlanStatus[]>
> = {
  [PlanStatus.DRAFT]: [
    PlanStatus.ACTIVE,
    PlanStatus.CANCELLED,
    PlanStatus.SUPERSEDED,
  ],
  [PlanStatus.ACTIVE]: [
    PlanStatus.PAUSED,
    PlanStatus.COMPLETED,
    PlanStatus.SUPERSEDED,
    PlanStatus.CANCELLED,
  ],
  [PlanStatus.PAUSED]: [
    PlanStatus.ACTIVE,
    PlanStatus.SUPERSEDED,
    PlanStatus.CANCELLED,
    PlanStatus.ARCHIVED,
  ],
  [PlanStatus.COMPLETED]: [PlanStatus.ARCHIVED],
  [PlanStatus.SUPERSEDED]: [PlanStatus.ARCHIVED],
  [PlanStatus.CANCELLED]: [PlanStatus.ARCHIVED],
  [PlanStatus.ARCHIVED]: [],
};

export function canTransitionPlan(from: PlanStatus, to: PlanStatus): boolean {
  return (PLAN_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * THE ACTION LIFECYCLE.
 *
 * Union of Step 16 section 17 and Step 20 section 42, plus CONDITIONAL from
 * Step 16 section 24 (an item that stays dormant until a trigger fires).
 *
 * Each value carries a distinct meaning that downstream systems rely on:
 *
 *   MISSED                     the user did not do it and the window passed
 *   NOT_DONE                   explicitly reported as not done
 *   SKIPPED                    the user chose to skip it
 *   DEFERRED                   moved to a later date, still wanted
 *   BLOCKED                    something external prevents it (section 79)
 *   CANCELLED_BY_USER          the user removed it
 *   CANCELLED_BY_REALIGNMENT   reality changed; NOT a failure (section 47)
 *   NO_LONGER_RELEVANT         the item stopped mattering
 *
 * Step 16 sections 17-18 and Golden Test 100 are explicit that collapsing these
 * into "done / not done" would make the Karma Ledger and analytics wrong, and
 * would let an item invalidated by a realignment be reported as a user failure.
 */
export enum PlanItemStatus {
  /** Dormant until a Life Signal confirms its trigger. Step 16 section 24. */
  CONDITIONAL = 'CONDITIONAL',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  NOT_DONE = 'NOT_DONE',
  MISSED = 'MISSED',
  SKIPPED = 'SKIPPED',
  DEFERRED = 'DEFERRED',
  BLOCKED = 'BLOCKED',
  CANCELLED_BY_USER = 'CANCELLED_BY_USER',
  CANCELLED_BY_REALIGNMENT = 'CANCELLED_BY_REALIGNMENT',
  NO_LONGER_RELEVANT = 'NO_LONGER_RELEVANT',
}

/**
 * Legal action transitions. Build Rule 179.
 *
 * Three decisions here are load-bearing, and each traces to a specific rule:
 *
 * 1. DONE IS TERMINAL.
 *    Step 16 Rule 6 ("preserve completed work across Plan versions") and
 *    section 109 ("a realignment must never erase valid completed work"). If
 *    DONE -> CANCELLED_BY_REALIGNMENT were legal, a realignment could delete
 *    evidence the Karma Ledger has already scored.
 *
 * 2. CANCELLED_BY_REALIGNMENT CANNOT BECOME MISSED.
 *    Golden Test 100 and Rule 5. An item withdrawn because reality moved on is
 *    not something the user failed to do. Making the cancellation terminal is
 *    what stops a nightly "mark overdue items MISSED" job from quietly
 *    reclassifying it.
 *
 * 3. CONDITIONAL CANNOT JUMP STRAIGHT TO DONE.
 *    Step 16 section 24: a triggered action is dormant until the Life Signal
 *    Engine confirms the trigger, at which point Realignment activates it to
 *    PENDING. Completing a contingency that never became relevant would record
 *    work against a scenario that did not happen.
 *
 * Recovery paths are deliberately generous in the other direction: MISSED,
 * NOT_DONE, SKIPPED, DEFERRED and BLOCKED can all return to PENDING, because
 * Step 16 section 18 treats them as states requiring context, not verdicts.
 */
export const PLAN_ITEM_STATUS_TRANSITIONS: Readonly<
  Record<PlanItemStatus, readonly PlanItemStatus[]>
> = {
  [PlanItemStatus.CONDITIONAL]: [
    PlanItemStatus.PENDING,
    PlanItemStatus.CANCELLED_BY_USER,
    PlanItemStatus.CANCELLED_BY_REALIGNMENT,
    PlanItemStatus.NO_LONGER_RELEVANT,
  ],
  [PlanItemStatus.PENDING]: [
    PlanItemStatus.IN_PROGRESS,
    PlanItemStatus.DONE,
    PlanItemStatus.NOT_DONE,
    PlanItemStatus.MISSED,
    PlanItemStatus.SKIPPED,
    PlanItemStatus.DEFERRED,
    PlanItemStatus.BLOCKED,
    PlanItemStatus.CANCELLED_BY_USER,
    PlanItemStatus.CANCELLED_BY_REALIGNMENT,
    PlanItemStatus.NO_LONGER_RELEVANT,
  ],
  [PlanItemStatus.IN_PROGRESS]: [
    PlanItemStatus.DONE,
    PlanItemStatus.PENDING,
    PlanItemStatus.NOT_DONE,
    PlanItemStatus.MISSED,
    PlanItemStatus.SKIPPED,
    PlanItemStatus.DEFERRED,
    PlanItemStatus.BLOCKED,
    PlanItemStatus.CANCELLED_BY_USER,
    PlanItemStatus.CANCELLED_BY_REALIGNMENT,
    PlanItemStatus.NO_LONGER_RELEVANT,
  ],
  [PlanItemStatus.DEFERRED]: [
    PlanItemStatus.PENDING,
    PlanItemStatus.IN_PROGRESS,
    PlanItemStatus.DONE,
    PlanItemStatus.MISSED,
    PlanItemStatus.SKIPPED,
    PlanItemStatus.BLOCKED,
    PlanItemStatus.CANCELLED_BY_USER,
    PlanItemStatus.CANCELLED_BY_REALIGNMENT,
    PlanItemStatus.NO_LONGER_RELEVANT,
  ],
  [PlanItemStatus.BLOCKED]: [
    PlanItemStatus.PENDING,
    PlanItemStatus.IN_PROGRESS,
    PlanItemStatus.DONE,
    PlanItemStatus.DEFERRED,
    PlanItemStatus.SKIPPED,
    PlanItemStatus.CANCELLED_BY_USER,
    PlanItemStatus.CANCELLED_BY_REALIGNMENT,
    PlanItemStatus.NO_LONGER_RELEVANT,
  ],
  [PlanItemStatus.SKIPPED]: [
    PlanItemStatus.PENDING,
    PlanItemStatus.CANCELLED_BY_REALIGNMENT,
    PlanItemStatus.NO_LONGER_RELEVANT,
  ],
  [PlanItemStatus.MISSED]: [
    PlanItemStatus.PENDING,
    PlanItemStatus.DEFERRED,
    PlanItemStatus.DONE,
    PlanItemStatus.CANCELLED_BY_REALIGNMENT,
    PlanItemStatus.NO_LONGER_RELEVANT,
  ],
  [PlanItemStatus.NOT_DONE]: [
    PlanItemStatus.PENDING,
    PlanItemStatus.DEFERRED,
    PlanItemStatus.DONE,
    PlanItemStatus.CANCELLED_BY_REALIGNMENT,
    PlanItemStatus.NO_LONGER_RELEVANT,
  ],
  // Terminal. See notes 1 and 2 above.
  [PlanItemStatus.DONE]: [],
  [PlanItemStatus.CANCELLED_BY_USER]: [],
  [PlanItemStatus.CANCELLED_BY_REALIGNMENT]: [],
  [PlanItemStatus.NO_LONGER_RELEVANT]: [],
};

export function canTransitionPlanItem(
  from: PlanItemStatus,
  to: PlanItemStatus,
): boolean {
  return (PLAN_ITEM_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Statuses that consume capacity.
 *
 * The guardrail in Step 16 section 27 is about what is asked of the user *now*,
 * so it counts what is actually on the list: PENDING, IN_PROGRESS and BLOCKED
 * (still waiting on them, just stuck).
 *
 * DEFERRED is excluded on purpose. Deferral means "not in this horizon", and it
 * is also where capacity overflow is parked - counting it would make the
 * overflow itself a capacity breach, and a plan could never be topped up as
 * items completed. SKIPPED, MISSED, DONE and every cancellation are likewise
 * no longer competing for attention.
 */
export const CAPACITY_CONSUMING_STATUSES: readonly PlanItemStatus[] = [
  PlanItemStatus.PENDING,
  PlanItemStatus.IN_PROGRESS,
  PlanItemStatus.BLOCKED,
];

/** Step 16 section 12. Deliberately extensible. */
export enum PlanItemCategory {
  MIND = 'MIND',
  KARMA = 'KARMA',
  CAREER = 'CAREER',
  FINANCE = 'FINANCE',
  EDUCATION = 'EDUCATION',
  RELATIONSHIP = 'RELATIONSHIP',
  BUSINESS = 'BUSINESS',
  FAMILY = 'FAMILY',
  HEALTH_SUPPORT = 'HEALTH_SUPPORT',
  LEGAL_SUPPORT = 'LEGAL_SUPPORT',
  PROPERTY = 'PROPERTY',
  NETWORKING = 'NETWORKING',
  DECISION = 'DECISION',
  PREPARATION = 'PREPARATION',
  REVIEW = 'REVIEW',
  OTHER = 'OTHER',
}

/** Step 16 section 13: every item retains provenance. */
export enum PlanItemSource {
  WHATNOW = 'WHATNOW',
  SCENARIO_SHARED_PREPARATION = 'SCENARIO_SHARED_PREPARATION',
  SCENARIO_SPECIFIC = 'SCENARIO_SPECIFIC',
  REALIGNMENT = 'REALIGNMENT',
  MKA_MIND = 'MKA_MIND',
  MKA_KARMA = 'MKA_KARMA',
  MKA_ACTION = 'MKA_ACTION',
  USER_CREATED = 'USER_CREATED',
  USER_COMMITMENT = 'USER_COMMITMENT',
  SYSTEM_REVIEW = 'SYSTEM_REVIEW',
  EXPERT_SAFE_GUIDANCE = 'EXPERT_SAFE_GUIDANCE',
}

/** Step 16 sections 14-15. Only a small number of items may be ESSENTIAL. */
export enum PlanItemPriority {
  ESSENTIAL = 'ESSENTIAL',
  IMPORTANT = 'IMPORTANT',
  OPTIONAL = 'OPTIONAL',
}

/**
 * Numeric rank for the wire contract and for ordering.
 *
 * SPEC_CONFLICT, resolved the same way `challenge.enum.ts` resolves its own:
 * Step 20 section 41 types `plan_items.priority` as INTEGER, Step 16 section 14
 * names ESSENTIAL / IMPORTANT / OPTIONAL, and Step 21 section 51 shows
 * `"priority": 1` on the wire. Master Index section 27 makes the engine
 * specification authoritative, so the label is stored as the source of truth and
 * this rank is derived for the API field and for sorting. Storing only the
 * integer would lose the meaning; storing only the label would break the
 * published contract.
 */
export const PLAN_ITEM_PRIORITY_RANK: Readonly<Record<PlanItemPriority, number>> =
  {
    [PlanItemPriority.ESSENTIAL]: 1,
    [PlanItemPriority.IMPORTANT]: 2,
    [PlanItemPriority.OPTIONAL]: 3,
  };

/** Step 16 section 21: how widely useful an action is across scenarios. */
export enum PlanItemScenarioScope {
  /** Useful whatever happens. Step 16 sections 22 and 34; ranked highest. */
  SHARED_ACROSS_SCENARIOS = 'SHARED_ACROSS_SCENARIOS',
  SCENARIO_SPECIFIC = 'SCENARIO_SPECIFIC',
  TRIGGERED_ONLY = 'TRIGGERED_ONLY',
}

/** Step 16 section 11: what a realignment may do to this item. */
export enum PlanItemRealignmentPolicy {
  PRESERVE_IF_RELEVANT = 'PRESERVE_IF_RELEVANT',
  ALWAYS_PRESERVE = 'ALWAYS_PRESERVE',
  REPLACEABLE = 'REPLACEABLE',
}

/** Step 20 section 43: immutable history of meaningful item changes. */
export enum PlanItemEventType {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  RESCHEDULED = 'RESCHEDULED',
  EDITED = 'EDITED',
  DEPENDENCY_BLOCKED = 'DEPENDENCY_BLOCKED',
  CAPACITY_DEFERRED = 'CAPACITY_DEFERRED',
}

export enum PlanItemEventSource {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  PLAN_ENGINE = 'PLAN_ENGINE',
  REALIGNMENT = 'REALIGNMENT',
  MKA = 'MKA',
}

/** Step 16 section 51: plans carry explicit reassessment points. */
export enum PlanReviewTrigger {
  END_OF_HORIZON = 'END_OF_HORIZON',
  END_OF_WEEK = 'END_OF_WEEK',
  LIFE_SIGNAL = 'LIFE_SIGNAL',
  MAJOR_REALIGNMENT = 'MAJOR_REALIGNMENT',
  USER_REQUEST = 'USER_REQUEST',
}

/** Engine version, stored on every plan for provenance (Step 16 section 93). */
export const PLAN_ENGINE_VERSION = 'plan-engine-1.0.0';
