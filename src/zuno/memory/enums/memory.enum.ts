/**
 * Memory vocabulary for Step 18 (Memory & Future Self) and Step 20 sections
 * 49-53.
 *
 * Declared here rather than in `src/zuno/common/enums` because that package is
 * the cross-service contract surface and is owned by another change in flight.
 * Everything below is internal to the memory domain and to the two route roots
 * it serves; WIRING.md records the promotion that should happen when the common
 * enum package can be edited.
 */

/** Step 18 section 8 / Step 20 section 49 `memory_type`. */
export enum MemoryType {
  PROFILE = 'PROFILE',
  PREFERENCE = 'PREFERENCE',
  GOAL = 'GOAL',
  CHALLENGE = 'CHALLENGE',
  CONSTRAINT = 'CONSTRAINT',
  DECISION = 'DECISION',
  COMMITMENT = 'COMMITMENT',
  PLAN_CONTEXT = 'PLAN_CONTEXT',
  PROGRESS = 'PROGRESS',
  LIFE_EVENT = 'LIFE_EVENT',
  PATTERN = 'PATTERN',
  USER_CORRECTION = 'USER_CORRECTION',
  ASTRO_CONTEXT_REFERENCE = 'ASTRO_CONTEXT_REFERENCE',
  FUTURE_SELF_NARRATIVE = 'FUTURE_SELF_NARRATIVE',
  TEMPORARY_CONTEXT = 'TEMPORARY_CONTEXT',
}

export const MEMORY_TYPES: readonly MemoryType[] = Object.values(MemoryType);

export function isMemoryType(value: string): value is MemoryType {
  return (MEMORY_TYPES as readonly string[]).includes(value);
}

/** Step 20 section 51. */
export enum MemoryStatus {
  /** Waiting for a confirmation the policy insists on before it becomes durable. */
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED',
}

/**
 * The only statuses that may ever influence retrieval.
 *
 * Build Rule 38 / Step 24 section 165: deleted memory must stop influencing
 * retrieval, AI context, Future Self and Plans. Expressing that as an allow-list
 * rather than a deny-list means a status added later is excluded by default,
 * which is the correct direction for this particular mistake to fail in.
 */
export const RETRIEVABLE_MEMORY_STATUSES: readonly MemoryStatus[] = [
  MemoryStatus.ACTIVE,
];

/** Step 18 section 24 / Step 20 section 50. */
export enum MemoryEvidenceType {
  EXPLICIT = 'EXPLICIT',
  INFERRED = 'INFERRED',
  DERIVED = 'DERIVED',
}

/** Step 18 section 23. */
export enum MemorySource {
  USER_EXPLICIT = 'USER_EXPLICIT',
  USER_CORRECTION = 'USER_CORRECTION',
  WHATNOW_ENGINE = 'WHATNOW_ENGINE',
  PLAN_ENGINE = 'PLAN_ENGINE',
  MKA_ENGINE = 'MKA_ENGINE',
  KARMA_LEDGER = 'KARMA_LEDGER',
  LIFE_SIGNAL_ENGINE = 'LIFE_SIGNAL_ENGINE',
  REALIGNMENT_ENGINE = 'REALIGNMENT_ENGINE',
  SYSTEM_DERIVED = 'SYSTEM_DERIVED',
}

/**
 * Step 18 section 31 - source authority precedence, as a number so retrieval
 * and contradiction resolution can compare two memories without a switch.
 *
 * The ordering is the specification's, not an invention:
 *   current explicit user correction
 *   > current explicit user statement
 *   > confirmed structured event
 *   > high-confidence derived memory
 *   > older inferred memory
 */
export const MEMORY_SOURCE_AUTHORITY: Readonly<Record<MemorySource, number>> = {
  [MemorySource.USER_CORRECTION]: 100,
  [MemorySource.USER_EXPLICIT]: 90,
  [MemorySource.WHATNOW_ENGINE]: 70,
  [MemorySource.PLAN_ENGINE]: 70,
  [MemorySource.REALIGNMENT_ENGINE]: 70,
  [MemorySource.MKA_ENGINE]: 65,
  [MemorySource.KARMA_LEDGER]: 65,
  [MemorySource.LIFE_SIGNAL_ENGINE]: 65,
  [MemorySource.SYSTEM_DERIVED]: 40,
};

/** Step 18 section 26. */
export enum MemoryRetentionClass {
  SESSION = 'SESSION',
  SHORT_TERM = 'SHORT_TERM',
  CHALLENGE_LIFETIME = 'CHALLENGE_LIFETIME',
  LONG_TERM = 'LONG_TERM',
  UNTIL_SUPERSEDED = 'UNTIL_SUPERSEDED',
  USER_PINNED = 'USER_PINNED',
}

/**
 * How much standing importance a retention class implies.
 *
 * Step 18 section 62: a newer trivial event must not displace an older
 * important fact. Retention class is the durable, deterministic importance
 * signal ZUNO already assigns at write time, so retrieval reuses it rather than
 * asking a model how important something feels.
 */
export const RETENTION_IMPORTANCE: Readonly<Record<MemoryRetentionClass, number>> = {
  [MemoryRetentionClass.USER_PINNED]: 1.0,
  [MemoryRetentionClass.LONG_TERM]: 0.85,
  [MemoryRetentionClass.UNTIL_SUPERSEDED]: 0.8,
  [MemoryRetentionClass.CHALLENGE_LIFETIME]: 0.7,
  [MemoryRetentionClass.SHORT_TERM]: 0.45,
  [MemoryRetentionClass.SESSION]: 0.3,
};

/**
 * Recency half-life in days per retention class. Step 18 section 61:
 * inferred behavioural memory loses relevance; an explicit stable preference
 * decays more slowly. A pinned memory does not decay at all.
 */
export const RETENTION_RECENCY_HALF_LIFE_DAYS: Readonly<
  Record<MemoryRetentionClass, number>
> = {
  [MemoryRetentionClass.USER_PINNED]: Number.POSITIVE_INFINITY,
  [MemoryRetentionClass.LONG_TERM]: 365,
  [MemoryRetentionClass.UNTIL_SUPERSEDED]: 240,
  [MemoryRetentionClass.CHALLENGE_LIFETIME]: 90,
  [MemoryRetentionClass.SHORT_TERM]: 14,
  [MemoryRetentionClass.SESSION]: 1,
};

/** Step 18 sections 49-50, Step 24 section 39. */
export enum MemorySensitivity {
  STANDARD = 'STANDARD',
  /** Financial detail, health context, relationship detail. */
  SENSITIVE = 'SENSITIVE',
  /** Birth details and anything Step 24 treats as a special category. */
  RESTRICTED = 'RESTRICTED',
}

export const SENSITIVITY_RANK: Readonly<Record<MemorySensitivity, number>> = {
  [MemorySensitivity.STANDARD]: 0,
  [MemorySensitivity.SENSITIVE]: 1,
  [MemorySensitivity.RESTRICTED]: 2,
};

/**
 * Step 18 section 46 - hypothetical isolation.
 *
 * This is the column that stops "what if I resign?" becoming "the user
 * resigned" (Rule 4) and stops an astrological possibility becoming a future
 * fact (Rule 5). It is deliberately separate from `memory_type`, because a
 * DECISION and a HYPOTHETICAL exploration of the same decision are the same
 * kind of thing said with very different force.
 */
export enum MemoryFactuality {
  FACT = 'FACT',
  PLAN = 'PLAN',
  DECISION = 'DECISION',
  PREFERENCE = 'PREFERENCE',
  HYPOTHETICAL = 'HYPOTHETICAL',
  /** Step 18 section 47: an astrological possibility, never a future event. */
  FORECAST_CONTEXT = 'FORECAST_CONTEXT',
}

/**
 * Factualities that may never be presented as something the user did or
 * decided. Retrieval excludes them unless a caller asks for them by name.
 */
export const NON_FACTUAL_FACTUALITIES: readonly MemoryFactuality[] = [
  MemoryFactuality.HYPOTHETICAL,
  MemoryFactuality.FORECAST_CONTEXT,
];

/** Step 18 section 63: challenge-scoped versus global. */
export enum MemoryScope {
  GLOBAL = 'GLOBAL',
  CHALLENGE = 'CHALLENGE',
}

/** Candidate lifecycle, Build Rule 37. */
export enum MemoryCandidateStatus {
  PENDING = 'PENDING',
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  /** Folded into an existing memory instead of creating a new row (s.59). */
  MERGED = 'MERGED',
}

/** Why a candidate was refused. Kept as labels, never as free text. */
export enum MemoryRejectionReason {
  NOT_WORTH_REMEMBERING = 'NOT_WORTH_REMEMBERING',
  TRIVIAL = 'TRIVIAL',
  SENSITIVE_ATTRIBUTE_INFERENCE = 'SENSITIVE_ATTRIBUTE_INFERENCE',
  PERSONALITY_DIAGNOSIS = 'PERSONALITY_DIAGNOSIS',
  INSUFFICIENT_PATTERN_EVIDENCE = 'INSUFFICIENT_PATTERN_EVIDENCE',
  PREDICTION_AS_FACT = 'PREDICTION_AS_FACT',
  HYPOTHETICAL_AS_FACT = 'HYPOTHETICAL_AS_FACT',
  DUPLICATE = 'DUPLICATE',
  USER_REJECTED = 'USER_REJECTED',
  SAFETY_BLOCKED = 'SAFETY_BLOCKED',
}

/** Step 20 section 53 `resolution_status`. */
export enum MemoryConflictResolution {
  UNRESOLVED = 'UNRESOLVED',
  RESOLVED_BY_SUPERSESSION = 'RESOLVED_BY_SUPERSESSION',
  RESOLVED_BY_USER = 'RESOLVED_BY_USER',
  DISMISSED = 'DISMISSED',
}

/** Step 20 section 52 `evidence_role`. */
export enum MemoryEvidenceRole {
  SUPPORTS = 'SUPPORTS',
  CONTRADICTS = 'CONTRADICTS',
  ORIGIN = 'ORIGIN',
  CONFIRMATION = 'CONFIRMATION',
}

/**
 * The purpose a retrieval is being performed for. Step 18 section 88 calls this
 * `request_context`; it is the input that turns "retrieve only what is
 * relevant" (Rule 6) into a computable rule rather than a wish.
 */
export enum MemoryRequestContext {
  CAREER_WEEKLY_REVIEW = 'CAREER_WEEKLY_REVIEW',
  CHALLENGE_GUIDANCE = 'CHALLENGE_GUIDANCE',
  FUTURE_SELF_DAILY = 'FUTURE_SELF_DAILY',
  FUTURE_SELF_WEEKLY = 'FUTURE_SELF_WEEKLY',
  FUTURE_SELF_MILESTONE = 'FUTURE_SELF_MILESTONE',
  FUTURE_SELF_REALIGNMENT = 'FUTURE_SELF_REALIGNMENT',
  FUTURE_SELF_REFLECTION = 'FUTURE_SELF_REFLECTION',
  PLAN_GENERATION = 'PLAN_GENERATION',
  USER_MEMORY_VIEW = 'USER_MEMORY_VIEW',
}
