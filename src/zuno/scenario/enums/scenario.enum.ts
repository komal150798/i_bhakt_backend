/**
 * Scenario & What-If contract enums (Step 12 Scenario Engine Specification).
 *
 * These live under `scenario/` rather than in `common/enums` because
 * `common/enums/index.ts` is the shared canonical contract package and is owned
 * elsewhere; adding to it is a contract change that belongs in its own commit.
 * `WIRING.md` records the promotion that should happen when these values are
 * folded into the canonical package (Build Rule 180).
 *
 * SPEC_CONFLICT, resolved the same way `challenge.enum.ts` resolved its own:
 *   Step 12 section 4 lists scenario classes as
 *     CONTINUITY / CHANGE / TRANSITION / RECOVERY / OPPORTUNITY / DECISION /
 *     CONTINGENCY / USER_DEFINED_WHAT_IF
 *   Step 20 Data Model section 27 suggests
 *     BASE_CASE / POSITIVE_CASE / ADVERSE_CASE / USER_DEFINED / SYSTEM_GENERATED
 * Master Index section 27 gives the ENGINE-SPECIFIC specification precedence
 * over the data contract, so Step 12 is authoritative for the engine and is
 * what is persisted in `scenario_type`. The Step 20 vocabulary is retained as
 * `ScenarioCaseClass`, derived deterministically, because Step 21 section 37
 * shows it on the wire. Neither vocabulary is lost.
 */

/** Step 12 section 4. The path shape this scenario represents. */
export enum ScenarioType {
  CONTINUITY = 'CONTINUITY',
  CHANGE = 'CHANGE',
  TRANSITION = 'TRANSITION',
  RECOVERY = 'RECOVERY',
  OPPORTUNITY = 'OPPORTUNITY',
  DECISION = 'DECISION',
  CONTINGENCY = 'CONTINGENCY',
  USER_DEFINED_WHAT_IF = 'USER_DEFINED_WHAT_IF',
}

export const SCENARIO_TYPES: readonly ScenarioType[] = Object.values(ScenarioType);

/** Step 20 Data Model section 27, kept for the Step 21 section 37 wire shape. */
export enum ScenarioCaseClass {
  BASE_CASE = 'BASE_CASE',
  POSITIVE_CASE = 'POSITIVE_CASE',
  ADVERSE_CASE = 'ADVERSE_CASE',
  USER_DEFINED = 'USER_DEFINED',
  SYSTEM_GENERATED = 'SYSTEM_GENERATED',
}

/**
 * Deterministic mapping from the engine vocabulary to the data-model
 * vocabulary. Deliberately a table rather than a model decision - Step 12
 * section 56 puts enums firmly on the deterministic side of the line.
 */
export const SCENARIO_TYPE_CASE_CLASS: Readonly<
  Record<ScenarioType, ScenarioCaseClass>
> = {
  [ScenarioType.CONTINUITY]: ScenarioCaseClass.BASE_CASE,
  [ScenarioType.CHANGE]: ScenarioCaseClass.SYSTEM_GENERATED,
  [ScenarioType.TRANSITION]: ScenarioCaseClass.ADVERSE_CASE,
  [ScenarioType.RECOVERY]: ScenarioCaseClass.ADVERSE_CASE,
  [ScenarioType.OPPORTUNITY]: ScenarioCaseClass.POSITIVE_CASE,
  [ScenarioType.DECISION]: ScenarioCaseClass.SYSTEM_GENERATED,
  [ScenarioType.CONTINGENCY]: ScenarioCaseClass.ADVERSE_CASE,
  [ScenarioType.USER_DEFINED_WHAT_IF]: ScenarioCaseClass.USER_DEFINED,
};

/**
 * Step 12 sections 16-17.
 *
 * This is NOT the probability that the event will happen. It is how much
 * attention the scenario currently deserves. Step 12 section 97 and Step 08
 * section 23 both forbid numeric event probability without a validated
 * probabilistic model; there is no such model, so the type system refuses to
 * represent one.
 */
export enum ScenarioRelevance {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  CONTINGENCY = 'CONTINGENCY',
}

/** Ordering used when selecting the user-facing set (Step 12 section 31). */
export const SCENARIO_RELEVANCE_WEIGHT: Readonly<Record<ScenarioRelevance, number>> = {
  [ScenarioRelevance.HIGH]: 3,
  [ScenarioRelevance.MEDIUM]: 2,
  [ScenarioRelevance.CONTINGENCY]: 1,
  [ScenarioRelevance.LOW]: 0,
};

/** Step 12 section 30. Separate dimension from relevance (Step 19 section 43). */
export enum ScenarioImpact {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export const SCENARIO_IMPACT_WEIGHT: Readonly<Record<ScenarioImpact, number>> = {
  [ScenarioImpact.LOW]: 0,
  [ScenarioImpact.MODERATE]: 1,
  [ScenarioImpact.HIGH]: 2,
  [ScenarioImpact.CRITICAL]: 3,
};

/** Step 12 section 18. */
export enum ScenarioHorizon {
  IMMEDIATE = 'IMMEDIATE',
  NEAR_TERM = 'NEAR_TERM',
  MEDIUM_TERM = 'MEDIUM_TERM',
  LONG_TERM = 'LONG_TERM',
  UNSPECIFIED = 'UNSPECIFIED',
}

/**
 * Step 12 section 21. `PREDICTED` is deliberately absent - the specification
 * names it as the one word this lifecycle must not contain.
 *
 * USER_ADOPTED / USER_REJECTED come from sections 68-69: adoption and rejection
 * are user decisions, and a rejected path must not keep resurfacing.
 */
export enum ScenarioStatus {
  ACTIVE_CANDIDATE = 'ACTIVE_CANDIDATE',
  INCREASING = 'INCREASING',
  DECREASING = 'DECREASING',
  LIKELY_PATH = 'LIKELY_PATH',
  TRIGGERED = 'TRIGGERED',
  DISMISSED = 'DISMISSED',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
  USER_ADOPTED = 'USER_ADOPTED',
  USER_REJECTED = 'USER_REJECTED',
}

/**
 * Legal scenario lifecycle moves (Step 12 sections 21-23).
 * Build Rule 179: a governed lifecycle is an explicit transition map, never
 * a scatter of booleans.
 *
 * TRIGGERED is terminal in this table on purpose. Step 12 section 23: once a
 * scenario becomes fact it stops being a scenario and becomes current reality;
 * the Life Signal / Realignment flow owns what happens next, not this engine.
 */
export const SCENARIO_STATUS_TRANSITIONS: Readonly<
  Record<ScenarioStatus, readonly ScenarioStatus[]>
> = {
  [ScenarioStatus.ACTIVE_CANDIDATE]: [
    ScenarioStatus.INCREASING,
    ScenarioStatus.DECREASING,
    ScenarioStatus.LIKELY_PATH,
    ScenarioStatus.TRIGGERED,
    ScenarioStatus.DISMISSED,
    ScenarioStatus.RESOLVED,
    ScenarioStatus.ARCHIVED,
    ScenarioStatus.USER_ADOPTED,
    ScenarioStatus.USER_REJECTED,
  ],
  [ScenarioStatus.INCREASING]: [
    ScenarioStatus.LIKELY_PATH,
    ScenarioStatus.DECREASING,
    ScenarioStatus.ACTIVE_CANDIDATE,
    ScenarioStatus.TRIGGERED,
    ScenarioStatus.DISMISSED,
    ScenarioStatus.RESOLVED,
    ScenarioStatus.ARCHIVED,
    ScenarioStatus.USER_ADOPTED,
    ScenarioStatus.USER_REJECTED,
  ],
  [ScenarioStatus.DECREASING]: [
    ScenarioStatus.ACTIVE_CANDIDATE,
    ScenarioStatus.INCREASING,
    ScenarioStatus.DISMISSED,
    ScenarioStatus.RESOLVED,
    ScenarioStatus.ARCHIVED,
    ScenarioStatus.USER_REJECTED,
  ],
  [ScenarioStatus.LIKELY_PATH]: [
    ScenarioStatus.TRIGGERED,
    ScenarioStatus.INCREASING,
    ScenarioStatus.DECREASING,
    ScenarioStatus.RESOLVED,
    ScenarioStatus.ARCHIVED,
    ScenarioStatus.USER_ADOPTED,
    ScenarioStatus.USER_REJECTED,
  ],
  // Step 12 section 23: a triggered scenario is now reality. It is not walked
  // back into candidacy here.
  [ScenarioStatus.TRIGGERED]: [ScenarioStatus.RESOLVED, ScenarioStatus.ARCHIVED],
  [ScenarioStatus.DISMISSED]: [ScenarioStatus.ARCHIVED, ScenarioStatus.ACTIVE_CANDIDATE],
  [ScenarioStatus.RESOLVED]: [ScenarioStatus.ARCHIVED],
  [ScenarioStatus.ARCHIVED]: [],
  [ScenarioStatus.USER_ADOPTED]: [
    ScenarioStatus.TRIGGERED,
    ScenarioStatus.RESOLVED,
    ScenarioStatus.ARCHIVED,
    ScenarioStatus.USER_REJECTED,
  ],
  // Step 12 section 69 / Rule 9: a rejected path may only come back as a fresh
  // candidate, and only when circumstances materially change.
  [ScenarioStatus.USER_REJECTED]: [
    ScenarioStatus.ARCHIVED,
    ScenarioStatus.ACTIVE_CANDIDATE,
  ],
};

export function canTransitionScenario(
  from: ScenarioStatus,
  to: ScenarioStatus,
): boolean {
  return (SCENARIO_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/** Step 12 section 14. Where a scenario's support comes from. */
export enum ScenarioEvidenceClass {
  USER_STATED = 'USER_STATED',
  USER_CONFIRMED = 'USER_CONFIRMED',
  CURRENT_REALITY = 'CURRENT_REALITY',
  LIFE_SIGNAL = 'LIFE_SIGNAL',
  ASTRO_THEME = 'ASTRO_THEME',
  TIMING_WINDOW = 'TIMING_WINDOW',
  DEPENDENCY = 'DEPENDENCY',
  MEMORY = 'MEMORY',
  SYSTEM_INFERENCE = 'SYSTEM_INFERENCE',
  /** Step 12 section 8: the user's own concern is a first-class source. */
  USER_CONCERN = 'USER_CONCERN',
  EXTERNAL_EVENT = 'EXTERNAL_EVENT',
}

/**
 * Step 12 section 14: "No scenario should depend entirely on unsupported
 * system inference." This is the set that does not count as support on its own.
 */
export const UNSUPPORTED_EVIDENCE_CLASSES: readonly ScenarioEvidenceClass[] = [
  ScenarioEvidenceClass.SYSTEM_INFERENCE,
];

/** Step 12 section 27. Tells the Plan Engine how to prioritise. */
export enum PreparationClass {
  COMMON = 'COMMON',
  SCENARIO_SPECIFIC = 'SCENARIO_SPECIFIC',
  CONTINGENCY_ONLY = 'CONTINGENCY_ONLY',
}

/** Step 20 Data Model section 28: `scenario_conditions.condition_type`. */
export enum ScenarioConditionType {
  /** Step 12 section 19: makes the scenario more relevant. */
  SIGNAL_FOR = 'SIGNAL_FOR',
  /** Step 12 section 20: weakens the scenario. */
  SIGNAL_AGAINST = 'SIGNAL_AGAINST',
  /** Step 12 section 28: a dependency the consequence follows. */
  DEPENDENCY = 'DEPENDENCY',
}

/** Step 12 section 36. Irreversible decisions are treated more cautiously. */
export enum Reversibility {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/** Step 12 section 37. */
export enum DecisionReadiness {
  READY = 'READY',
  PARTIALLY_READY = 'PARTIALLY_READY',
  INSUFFICIENT_INFORMATION = 'INSUFFICIENT_INFORMATION',
}

/** Step 12 section 65. A scenario set is versioned, never silently overwritten. */
export enum ScenarioSetStatus {
  CURRENT = 'CURRENT',
  SUPERSEDED = 'SUPERSEDED',
}

/** Step 20 Data Model section 29: `what_if_sessions.status`. */
export enum WhatIfSessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  /** The user closed the exploration. Step 12 section 39: nothing persists. */
  DISCARDED = 'DISCARDED',
}

/** Step 20 Data Model section 30: `what_if_assumptions.assumption_type`. */
export enum WhatIfAssumptionType {
  /** The hypothetical the user actually asked about. */
  USER_STATED = 'USER_STATED',
  /** Follows from a dependency already recorded in the Challenge Context. */
  DERIVED_DEPENDENCY = 'DERIVED_DEPENDENCY',
  /** A fact carried forward unchanged from current reality. */
  CONTEXT_CARRIED = 'CONTEXT_CARRIED',
}

/** Step 12 section 66: what Realignment needs to know changed. */
export enum ScenarioChangeType {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
  RELEVANCE_INCREASED = 'RELEVANCE_INCREASED',
  RELEVANCE_DECREASED = 'RELEVANCE_DECREASED',
  IMPACT_CHANGED = 'IMPACT_CHANGED',
  TRIGGERED = 'TRIGGERED',
  RESOLVED = 'RESOLVED',
}

/**
 * Step 12 section 5: 2-4 scenarios, preferring 3, never more than four in the
 * primary journey. Step 12 section 103 names 15 possible futures as the
 * anti-pattern. Deterministic system control (section 56), not a prompt hint.
 */
export const SCENARIO_MIN_USER_FACING = 2;
export const SCENARIO_PREFERRED_USER_FACING = 3;
export const SCENARIO_MAX_USER_FACING = 4;

/**
 * Step 12 section 43: What-If cascades use bounded depth, 2-3 consequential
 * layers. Section 44 forbids speculative cascades beyond known dependencies.
 */
export const WHAT_IF_MAX_CASCADE_DEPTH = 3;

/**
 * Step 12 section 51: low confidence + low impact is dropped; low confidence
 * with very high impact becomes a contingency rather than a headline.
 */
export const SCENARIO_LOW_CONFIDENCE_THRESHOLD = 0.4;
