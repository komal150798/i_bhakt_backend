import { SafetyFlag, ZunoDomain, ChallengeMode } from '../../common/enums';
import {
  DecisionReadiness,
  PreparationClass,
  Reversibility,
  ScenarioEvidenceClass,
  ScenarioHorizon,
  ScenarioImpact,
  ScenarioRelevance,
  ScenarioType,
} from '../enums/scenario.enum';
import { ScenarioAstroContext } from '../entities/scenario.types';

/**
 * The Scenario intelligence port.
 *
 * Architecture note, following the decision already recorded for
 * `WHATNOW_ENGINE`: Step 21 places engine intelligence in a Python service, and
 * no such service exists in this repository yet, so Build Rule 173 applies -
 * isolate the interface, use a controlled implementation for now, keep the
 * integration requirement. Swapping `LlmScenarioEngine` for an HTTP adapter
 * must require no change in `ScenarioService`, the controller, or any future
 * consumer. That is the entire purpose of this file.
 *
 * What crosses this boundary is deliberately the *unvalidated* shape. Step 12
 * section 56 draws the line: the LLM may assist with candidate generation,
 * distinctness, summaries, implications and preparation ideation, while the
 * deterministic system controls IDs, state, enums, maximum counts, persistence,
 * lifecycle, What-If isolation, impact and relevance rules, downstream triggers,
 * plan-mutation permission and safety routing. Everything on the right of that
 * line happens in ScenarioService, after this interface returns.
 */

/** Step 12 section 13. */
export interface ScenarioBasisDraft {
  type: ScenarioEvidenceClass;
  reference: string;
}

/** Step 12 sections 26-27. */
export interface ScenarioPreparationDraft {
  action: string;
  classification: PreparationClass;
}

/**
 * One candidate path as the model proposed it.
 *
 * Note what is absent: no id, no status, no display order, no persistence
 * concern. Step 12 section 56 keeps all of those deterministic.
 */
export interface ScenarioCandidate {
  title: string;
  summary: string;
  scenario_type: ScenarioType;
  horizon: ScenarioHorizon;
  /** Step 12 section 30. Advisory - the service may raise it, never silently. */
  impact: ScenarioImpact;
  /** Step 12 section 17. Attention deserved, NOT event probability. */
  relevance: ScenarioRelevance;
  /**
   * Step 12 section 50: confidence that this is a reasonable scenario worth
   * modelling. Explicitly not the probability that the event occurs.
   */
  confidence: number;
  basis: ScenarioBasisDraft[];
  /** Step 12 sections 19-20. */
  signals_for: string[];
  signals_against: string[];
  /** Step 12 section 28. Only edges supported by the challenge context. */
  dependencies: { from: string; to: string; description?: string | null }[];
  risks: string[];
  opportunities: string[];
  controllable_factors: string[];
  impact_areas: ZunoDomain[];
  scenario_specific_preparation: ScenarioPreparationDraft[];
  /** Step 12 sections 33-35, DECISION scenarios only. */
  benefits: string[];
  constraints: string[];
  reversibility: Reversibility | null;
  option_ref: string | null;
}

/** Step 12 sections 45-46. Qualitative dimensions only. */
export interface ScenarioComparisonDraft {
  dimension: string;
  values: Record<string, string>;
}

export interface ScenarioGeneration {
  /** Step 12 section 9: seeds before consolidation, retained for audit. */
  seeds: string[];
  scenarios: ScenarioCandidate[];
  /** Step 12 sections 24-25: the differentiator. Spans the whole set. */
  shared_preparation: ScenarioPreparationDraft[];
  /** Step 12 sections 19, 58: becomes Life Signal watch classes. */
  watch_signals: string[];
  comparison: ScenarioComparisonDraft[];
  /** Step 12 section 37. */
  decision_readiness: DecisionReadiness;
  /**
   * Advisory only, exactly as on WhatNowExtraction. SafetyService unions these
   * in and can only escalate; a model can never talk the policy down
   * (Step 19 section 55).
   */
  safety_flags: SafetyFlag[];
}

/**
 * What the engine is given.
 *
 * Step 12 section 7 lists the permitted inputs and says "only relevant inputs
 * should be passed". Build Rule 93 and Step 21 Anti-Pattern 139 forbid sending
 * the user's entire history to every call, so this is a projection of the
 * challenge context, not the context itself.
 *
 * Two inputs are deliberately typed as nullable and handled as absent rather
 * than as empty:
 *   `astro` is null when no Rulebook version is active. Step 20 section 125
 *   requires failing closed for astrology while continuing safe non-astrology
 *   functionality, and Step 12 section 100 forbids asking the model to invent
 *   astrological reasoning. Null means "no astrology in this set", never
 *   "astrology found nothing".
 *   `plan_summary` is a placeholder for the Plan Engine, which is being built
 *   separately; this module does not import from it.
 */
export interface ScenarioGenerationRequest {
  /** Plain-language understanding from the current Challenge Context. */
  summary: string;
  /** Step 12 section 14: only what the user stated or confirmed. */
  facts: string[];
  /** Step 12 section 8: the user's own concern is a legitimate seed source. */
  concerns: string[];
  dependencies: { from: string; to: string; description?: string | null }[];
  decisions: { question: string; options: string[] }[];
  controllable: string[];
  external: string[];
  temporal_anchors: { raw: string; normalized_date: string | null }[];
  domains: ZunoDomain[];
  mode: ChallengeMode | null;
  /** Approved themes only, or null when no Rulebook is active. */
  astro: ScenarioAstroContext | null;
  /** Step 12 sections 69-70: paths the user has ruled out. */
  rejected_paths: string[];
  /** Step 12 section 5. The deterministic cap, passed in rather than assumed. */
  max_scenarios: number;
}

export interface ScenarioGenerationResult {
  generation: ScenarioGeneration;
  /** Provenance, carried onto the persisted scenario set. */
  engineVersion: string;
  promptVersion: string;
  aiGenerationRunId: string | null;
}

export interface IScenarioEngine {
  generate(request: ScenarioGenerationRequest): Promise<ScenarioGenerationResult>;
}

/** Nest DI token. Consumers inject the interface, never a concrete class. */
export const SCENARIO_ENGINE = Symbol('SCENARIO_ENGINE');
