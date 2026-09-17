import { ZunoDomain } from '../../common/enums';
import {
  PreparationClass,
  ScenarioEvidenceClass,
  ScenarioImpact,
  Reversibility,
} from '../enums/scenario.enum';

/**
 * Structured payloads persisted as JSONB on the scenario tables.
 *
 * Step 20 section 9 allows JSONB where a structure is read as one whole object
 * per row and is not independently queried. The fields that ARE queried -
 * scenario_type, status, relevance, impact - stay as real columns, exactly as
 * ZunoChallenge does with domain/status/urgency.
 */

/**
 * Why this scenario exists at all. Step 12 section 13.
 *
 * Kept on every scenario because section 89 requires ZUNO to be able to answer
 * internally "why did we include Transition Out as a scenario?", and Rule 3
 * requires every scenario to be traceable to the Challenge Context, current
 * reality, a dependency, a user choice or approved intelligence.
 */
export interface ScenarioBasis {
  type: ScenarioEvidenceClass;
  /** The thing being pointed at, in plain language. */
  reference: string;
}

/** Step 12 section 28. Follows Challenge Context dependencies, never invented. */
export interface ScenarioDependencyEdge {
  from: string;
  to: string;
  description?: string | null;
}

/**
 * Step 12 sections 24-27 and section 60.
 *
 * `classification` is what lets the Plan Engine prioritise. Note that this
 * engine only ever *proposes* - Step 12 section 57 and Rule 8 put execution,
 * scheduling and priority with the Plan Engine.
 */
export interface ScenarioPreparation {
  action: string;
  classification: PreparationClass;
}

/**
 * Step 12 section 48. Inputs, never guaranteed outcomes.
 *
 * Populated only from rules the governed Rulebook returned. When no Rulebook
 * version is active this is null, and the scenario is produced without
 * astrology rather than with invented astrology (Step 20 section 125).
 */
export interface ScenarioAstroContext {
  supportive_themes: string[];
  caution_themes: string[];
  timing_windows: string[];
  /** Provenance: which approved rules contributed. Step 20 section 70. */
  rule_keys: string[];
  rulebook_version_id: string | null;
}

/** The full scenario body. Step 12 section 6. */
export interface ScenarioPayload {
  basis: ScenarioBasis[];
  signals_for: string[];
  signals_against: string[];
  dependencies: ScenarioDependencyEdge[];
  risks: string[];
  opportunities: string[];
  controllable_factors: string[];
  /** Step 12 section 29: which life areas this path touches. */
  impact_areas: ZunoDomain[];
  /** Step 12 section 26. Shared preparation lives on the set, not here. */
  scenario_specific_preparation: ScenarioPreparation[];
  /** Step 12 sections 35-36, DECISION scenarios only. */
  benefits: string[];
  constraints: string[];
  reversibility: Reversibility | null;
  astro_context: ScenarioAstroContext | null;
}

export function emptyScenarioPayload(): ScenarioPayload {
  return {
    basis: [],
    signals_for: [],
    signals_against: [],
    dependencies: [],
    risks: [],
    opportunities: [],
    controllable_factors: [],
    impact_areas: [],
    scenario_specific_preparation: [],
    benefits: [],
    constraints: [],
    reversibility: null,
    astro_context: null,
  };
}

/**
 * Provenance recorded on every scenario set. Step 12 sections 87-88.
 *
 * This is what makes a set reproducible: the same challenge context version,
 * rulebook version, engine version and prompt version should produce a
 * comparable set, and an old set stays explainable against the rulebook that
 * produced it (Step 20 section 70).
 */
export interface ScenarioProvenance {
  challenge_context_version: number;
  rulebook_version_id: string | null;
  scenario_engine_version: string;
  prompt_version: string;
  /** Null when no Rulebook was active, i.e. the set carries no astrology. */
  astro_available: boolean;
}

/**
 * Step 12 section 66: the diff Realignment consumes.
 * Stored on the newer set so "what changed" is answerable without replaying
 * two full sets.
 */
export interface ScenarioSetDiffEntry {
  scenario_title: string;
  change: string;
  before?: string | null;
  after?: string | null;
}

/** Step 12 sections 45-46, held on the set rather than on any one scenario. */
export interface ScenarioComparison {
  dimension: string;
  /** scenario title -> qualitative value. Never a number. */
  values: Record<string, string>;
}

/**
 * The isolated result of a What-If exploration. Step 12 section 42.
 *
 * Deliberately a separate shape from ScenarioPayload: a What-If is not a
 * scenario in the active set, and giving it the same type would make it far too
 * easy for a later refactor to persist one as the other (Step 20 Rule 4).
 */
export interface WhatIfImplication {
  text: string;
  /** 1-based cascade layer. Bounded at WHAT_IF_MAX_CASCADE_DEPTH. */
  layer: number;
  basis: ScenarioEvidenceClass;
  /** The known dependency this follows from, when there is one. */
  dependency_reference: string | null;
}

export interface WhatIfResultPayload {
  implications: WhatIfImplication[];
  controllable_actions: string[];
  existing_preparation_that_helps: string[];
  preparation: ScenarioPreparation[];
  impact_areas: ZunoDomain[];
  impact: ScenarioImpact;
  reversibility: Reversibility | null;
  /**
   * Step 12 section 40: mandatory, verbatim, and asserted by the service
   * before anything is returned. The client must be able to render it without
   * composing its own wording.
   */
  hypothetical_notice: string;
}
