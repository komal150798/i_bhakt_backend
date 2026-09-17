/**
 * WhatNow / Challenge contract enums.
 *
 * SPEC_CONFLICT resolved by human decision (recorded in ZUNO_DECISION_LOG.md):
 * Step 20 Data Model section 19 lists challenge status as
 *   DRAFT / ACTIVE / MONITORING / PAUSED / RESOLVED / ARCHIVED
 * while Step 11 WhatNow section 33 lists
 *   NEW / UNDERSTANDING / ACTIVE / MONITORING / CHANGED / REALIGNMENT_REQUIRED /
 *   RESOLVED / PAUSED / ARCHIVED
 * and Step 02 Response Framework section 4 lists a third variant.
 *
 * Per Master Index section 27 the ENGINE-SPECIFIC specification outranks the
 * data contract, so the Step 11 lifecycle is authoritative. DRAFT from Step 20
 * is retained as an alias of NEW so the data-model vocabulary is not lost.
 */
export enum ChallengeStatus {
  /** Created, not yet understood. Step 20 calls this DRAFT. */
  NEW = 'NEW',
  /** WhatNow extraction in progress or awaiting clarification. */
  UNDERSTANDING = 'UNDERSTANDING',
  /** Understood and being worked. */
  ACTIVE = 'ACTIVE',
  /** Understood, low current activity, watching for Life Signals. */
  MONITORING = 'MONITORING',
  /** A material Life Signal has landed but has not yet been realigned. */
  CHANGED = 'CHANGED',
  /** Realignment has been evaluated as necessary and is pending. */
  REALIGNMENT_REQUIRED = 'REALIGNMENT_REQUIRED',
  RESOLVED = 'RESOLVED',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Legal status transitions. Build Rule 179 forbids expressing a governed
 * lifecycle as scattered booleans, so every move is checked against this map.
 */
export const CHALLENGE_STATUS_TRANSITIONS: Readonly<
  Record<ChallengeStatus, readonly ChallengeStatus[]>
> = {
  [ChallengeStatus.NEW]: [
    ChallengeStatus.UNDERSTANDING,
    ChallengeStatus.ACTIVE,
    ChallengeStatus.PAUSED,
    ChallengeStatus.ARCHIVED,
  ],
  [ChallengeStatus.UNDERSTANDING]: [
    ChallengeStatus.ACTIVE,
    ChallengeStatus.UNDERSTANDING,
    ChallengeStatus.PAUSED,
    ChallengeStatus.ARCHIVED,
  ],
  [ChallengeStatus.ACTIVE]: [
    ChallengeStatus.MONITORING,
    ChallengeStatus.CHANGED,
    ChallengeStatus.UNDERSTANDING,
    ChallengeStatus.RESOLVED,
    ChallengeStatus.PAUSED,
    ChallengeStatus.ARCHIVED,
  ],
  [ChallengeStatus.MONITORING]: [
    ChallengeStatus.ACTIVE,
    ChallengeStatus.CHANGED,
    ChallengeStatus.RESOLVED,
    ChallengeStatus.PAUSED,
    ChallengeStatus.ARCHIVED,
  ],
  [ChallengeStatus.CHANGED]: [
    ChallengeStatus.REALIGNMENT_REQUIRED,
    ChallengeStatus.ACTIVE,
    ChallengeStatus.MONITORING,
    ChallengeStatus.RESOLVED,
    ChallengeStatus.PAUSED,
    ChallengeStatus.ARCHIVED,
  ],
  [ChallengeStatus.REALIGNMENT_REQUIRED]: [
    ChallengeStatus.ACTIVE,
    ChallengeStatus.MONITORING,
    ChallengeStatus.RESOLVED,
    ChallengeStatus.PAUSED,
    ChallengeStatus.ARCHIVED,
  ],
  // Step 20 section 114: a resolved challenge may be reopened, but history is
  // never silently mutated - reopening is an explicit transition back to ACTIVE.
  [ChallengeStatus.RESOLVED]: [ChallengeStatus.ACTIVE, ChallengeStatus.ARCHIVED],
  [ChallengeStatus.PAUSED]: [ChallengeStatus.ACTIVE, ChallengeStatus.ARCHIVED],
  [ChallengeStatus.ARCHIVED]: [],
};

export function canTransitionChallenge(
  from: ChallengeStatus,
  to: ChallengeStatus,
): boolean {
  return (CHALLENGE_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Operating mode of an active WhatNow. Step 00 Master Index section 13.
 * Affects recommendations, urgency, tone, plan structure and notifications.
 */
export enum ChallengeMode {
  UNDERSTAND = 'UNDERSTAND',
  PREPARE = 'PREPARE',
  WATCH = 'WATCH',
  ACT = 'ACT',
  DECIDE = 'DECIDE',
  TRANSITION = 'TRANSITION',
  RECOVER = 'RECOVER',
  STABILISE = 'STABILISE',
  GROW = 'GROW',
  CELEBRATE = 'CELEBRATE',
}

/** Step 11 section 26. Deliberately separate from emotional intensity. */
export enum Urgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  IMMEDIATE = 'IMMEDIATE',
}

/** Step 11 sections 24-25. An emotional signal, never a clinical diagnosis. */
export enum EmotionalIntensity {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

/** Step 11 section 24: allowed emotional signals. Do not diagnose conditions. */
export enum EmotionalSignal {
  CALM = 'CALM',
  UNCERTAIN = 'UNCERTAIN',
  WORRIED = 'WORRIED',
  ANXIOUS = 'ANXIOUS',
  FRUSTRATED = 'FRUSTRATED',
  OVERWHELMED = 'OVERWHELMED',
  HOPEFUL = 'HOPEFUL',
  CONFUSED = 'CONFUSED',
  URGENT = 'URGENT',
}

/**
 * Step 11 section 9: every extracted statement carries a type.
 * Step 20 section 21 forbids flattening these into one text summary.
 *
 * This is the single most important enum in the WhatNow engine: it is what
 * stops "I am afraid I will lose my job" becoming "you will lose your job"
 * (Step 11 section 8 and Non-Negotiable Rule 1).
 */
export enum ContextItemType {
  FACT = 'FACT',
  USER_BELIEF = 'USER_BELIEF',
  FEAR = 'FEAR',
  ASSUMPTION = 'ASSUMPTION',
  DEPENDENCY = 'DEPENDENCY',
  CONSTRAINT = 'CONSTRAINT',
  DESIRED_OUTCOME = 'DESIRED_OUTCOME',
  DECISION = 'DECISION',
  PREFERENCE = 'PREFERENCE',
  EXTERNAL_EVENT = 'EXTERNAL_EVENT',
  UNKNOWN = 'UNKNOWN',
}

/** Types that assert something is true of the world right now. */
export const FACTUAL_CONTEXT_ITEM_TYPES: readonly ContextItemType[] = [
  ContextItemType.FACT,
  ContextItemType.EXTERNAL_EVENT,
];

/**
 * Types that must never be presented to the user as established reality.
 * Enforced by SafetyService.assertNoFearAsFact.
 */
export const NON_FACTUAL_CONTEXT_ITEM_TYPES: readonly ContextItemType[] = [
  ContextItemType.FEAR,
  ContextItemType.ASSUMPTION,
  ContextItemType.USER_BELIEF,
  ContextItemType.UNKNOWN,
];

/** Step 11 section 57: provenance of an extracted item. */
export enum ContextItemSource {
  USER_STATED = 'USER_STATED',
  USER_CONFIRMED = 'USER_CONFIRMED',
  INFERRED = 'INFERRED',
  MEMORY = 'MEMORY',
  LIFE_SIGNAL = 'LIFE_SIGNAL',
  SYSTEM_DERIVED = 'SYSTEM_DERIVED',
}

/** Step 11 section 20: desired outcomes carry a goal status. */
export enum GoalStatus {
  USER_STATED = 'USER_STATED',
  INFERRED = 'INFERRED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

/** Step 11 section 15: how the challenge sits in time. */
export enum ChallengeTimeline {
  PAST = 'PAST',
  CURRENT = 'CURRENT',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  RECURRING = 'RECURRING',
  LONG_TERM = 'LONG_TERM',
  UNKNOWN = 'UNKNOWN',
}

/** Step 11 section 41: how much to say on the first pass. */
export enum ResponseDepth {
  QUICK = 'QUICK',
  STANDARD = 'STANDARD',
  DEEP = 'DEEP',
}

/** Step 20 section 119: typed relationships between challenges. */
export enum ChallengeLinkType {
  IMPACTS = 'IMPACTS',
  CAUSED_BY = 'CAUSED_BY',
  SUPERSEDES = 'SUPERSEDES',
  SUPERSEDED_BY = 'SUPERSEDED_BY',
  RELATED_TO = 'RELATED_TO',
  SPAWNED_FROM = 'SPAWNED_FROM',
}
