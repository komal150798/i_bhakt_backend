import { SafetyFlag, ZunoDomain } from '../../common/enums';
import {
  Reversibility,
  ScenarioEvidenceClass,
  ScenarioImpact,
  WhatIfAssumptionType,
} from '../enums/scenario.enum';
import { ScenarioAstroContext } from '../entities/scenario.types';
import { ScenarioPreparationDraft } from './scenario.port';

/**
 * The What-If intelligence port.
 *
 * Separate from `SCENARIO_ENGINE` rather than a mode flag on it, because the
 * two have different obligations. Step 12 section 39 gives What-If a hard
 * isolation contract - no plan change, no priority change, no WhatNow state
 * change, no Life Signal, no operating-mode change, no persistence as reality,
 * no notification. A boolean parameter on a shared method would put the most
 * important rule in this module one truthy value away from being lost.
 *
 * Bound through a token for the same reason as the Scenario engine: the Python
 * intelligence service may replace the implementation and no consumer should
 * change (Build Rule 173).
 */

export interface WhatIfAssumptionDraft {
  text: string;
  type: WhatIfAssumptionType;
  /** The dependency edge this followed from, when it followed from one. */
  dependency_reference?: string | null;
}

export interface WhatIfImplicationDraft {
  text: string;
  /**
   * 1-based cascade layer. Step 12 section 43 bounds this at 2-3 consequential
   * layers; the service truncates rather than trusting the model to stop.
   */
  layer: number;
  basis: ScenarioEvidenceClass;
  dependency_reference: string | null;
}

export interface WhatIfExploration {
  /** Step 12 section 42: the hypothetical, restated plainly. */
  assumption: string;
  /** Step 12 section 41: assumptions created by propagating dependencies. */
  assumptions: WhatIfAssumptionDraft[];
  implications: WhatIfImplicationDraft[];
  /** Step 12 section 41: what remains in the user's control. */
  controllable_actions: string[];
  /** Step 12 section 42: preparation the user already has that would help. */
  existing_preparation_that_helps: string[];
  preparation: ScenarioPreparationDraft[];
  impact_areas: ZunoDomain[];
  impact: ScenarioImpact;
  reversibility: Reversibility | null;
  /** Advisory only. The policy escalates, never de-escalates (Step 19 s.55). */
  safety_flags: SafetyFlag[];
  confidence: number;
}

export interface WhatIfExplorationRequest {
  /** The user's question, verbatim. */
  question: string;
  /** Current factual state to branch from. Step 12 section 41. */
  summary: string;
  facts: string[];
  dependencies: { from: string; to: string; description?: string | null }[];
  controllable: string[];
  external: string[];
  /**
   * Preparation already in flight, so section 42's
   * `existing_preparation_that_helps` is grounded in something real rather
   * than invented. Sourced from the current scenario set's shared preparation -
   * NOT from the Plan Engine, which this module does not import from.
   */
  existing_preparation: string[];
  domains: ZunoDomain[];
  astro: ScenarioAstroContext | null;
  /** Step 12 section 43. Passed in so the bound is not a prompt-side constant. */
  max_cascade_depth: number;
}

export interface WhatIfExplorationResult {
  exploration: WhatIfExploration;
  engineVersion: string;
  promptVersion: string;
  aiGenerationRunId: string | null;
}

export interface IWhatIfEngine {
  explore(request: WhatIfExplorationRequest): Promise<WhatIfExplorationResult>;
}

/** Nest DI token. Consumers inject the interface, never a concrete class. */
export const WHAT_IF_ENGINE = Symbol('WHAT_IF_ENGINE');
