import {
  ChallengeTimeline,
  ContextItemSource,
  ContextItemType,
  EmotionalIntensity,
  EmotionalSignal,
  GoalStatus,
  SafetyFlag,
  Urgency,
  ZunoDomain,
} from '../../common/enums';

/**
 * Raw structured understanding returned by a WhatNow intelligence provider.
 *
 * This is the Node <-> intelligence contract from Step 21 section 27
 * (`POST /internal/v1/whatnow/classify`). It is deliberately the *unvalidated*
 * shape: confidence values, enum membership, and the fact/fear distinction are
 * all re-checked by WhatNowService before anything is persisted, because
 * Step 11 section 55 puts deterministic control of "valid domain enums,
 * required fields, confidence thresholds, routing" on the ZUNO side, not the
 * model's.
 */
export interface WhatNowExtraction {
  summary: string;
  primary_domain: ZunoDomain;
  secondary_domains: { domain: ZunoDomain; confidence: number }[];
  theme: string | null;
  subthemes: string[];
  items: {
    text: string;
    type: ContextItemType;
    source: ContextItemSource;
    confidence: number;
  }[];
  dependencies: { from: string; to: string; description?: string }[];
  desired_outcomes: { goal: string; status: GoalStatus; confidence: number }[];
  decisions: { question: string; options: string[]; confidence: number }[];
  controllable: string[];
  external: string[];
  temporal_anchors: {
    raw: string;
    normalized_date: string | null;
    timeline: ChallengeTimeline;
  }[];
  missing_information: {
    question: string;
    information_gain: number;
    rationale: string;
  }[];
  emotional_signals: EmotionalSignal[];
  emotional_intensity: EmotionalIntensity;
  urgency: Urgency;
  /** Advisory only. SafetyService may add to these but never removes them. */
  safety_flags: SafetyFlag[];
  /** Overall extraction confidence, 0..1 (Step 11 section 30). */
  confidence: number;
}

export interface WhatNowExtractionRequest {
  statement: string;
  /**
   * Minimal known context. Step 21 section 27 sends `knownContext`, and
   * Step 29 Anti-Pattern 139 / Build Rule 93 forbid sending the user's entire
   * history - only what this operation needs.
   */
  knownContext?: {
    countryCode?: string | null;
    preferredName?: string | null;
    /** Prior summary when re-analysing an evolving challenge. */
    previousSummary?: string | null;
  };
}

export interface WhatNowExtractionResult {
  extraction: WhatNowExtraction;
  /** Provenance, carried onto the persisted context version. */
  extractorVersion: string;
  aiGenerationRunId: string | null;
}

/**
 * The WhatNow intelligence port.
 *
 * Architecture note (decision recorded in ZUNO_DECISION_LOG.md):
 * Step 21 places WhatNow classification in a Python intelligence service behind
 * `/internal/v1/whatnow/classify`. No Python service exists in this repository
 * yet, so Build Rule 173 applies - "isolate interface, use controlled mock for
 * development, document blocker, retain integration test requirement".
 *
 * This interface is that isolation. The current binding is an LLM-backed
 * implementation running in Node; swapping it for an HTTP adapter that calls
 * the Python service requires no change to WhatNowService or anything
 * downstream of it.
 */
export interface IWhatNowEngine {
  extract(request: WhatNowExtractionRequest): Promise<WhatNowExtractionResult>;
}

/** Nest DI token. Consumers inject the interface, never a concrete class. */
export const WHATNOW_ENGINE = Symbol('WHATNOW_ENGINE');
