import { FutureSelfMode } from '../enums/future-self.enum';

/**
 * Raw structured Future Self output from an intelligence provider.
 *
 * Deliberately the *unvalidated* shape, exactly as `WhatNowExtraction` is.
 * Nothing here is trusted: the schema validator checks shape and the boundary
 * validator checks meaning, both before any of it is persisted or shown.
 * Step 18 section 85 - the model proposes, ZUNO decides.
 */
export interface FutureSelfNarrative {
  /** The message the user reads. Step 21 section 62 calls it `message`. */
  summary: string;
  /** Step 18 section 37. Themes observed in what actually happened. */
  progress_themes: string[];
  /** Commitments still outstanding. */
  open_loops: string[];
  /** Strengths evidenced by completed actions, never flattery. */
  strengths_observed: string[];
  /** What matters next. Not a prediction of what will happen. */
  next_focus: string[];
  /**
   * `EntityType:id` pairs backing the narrative. Step 18 section 38: every
   * statement traceable to stored facts. The boundary validator rejects any
   * reference that was not in the grounding set it was given.
   */
  source_refs: string[];
}

export interface FutureSelfGenerationRequest {
  mode: FutureSelfMode;
  /**
   * The minimum relevant context, assembled by FutureSelfService.
   *
   * Step 18 section 87 and Build Rule 93: the orchestration layer provides only
   * what this operation needs. The engine never reads the memory store itself -
   * if it could, "retrieve only relevant memory" would be unenforceable.
   */
  context: {
    challengeTitle: string | null;
    challengeSummary: string | null;
    /** Already relevance-filtered and bounded by MemoryService.retrieve(). */
    relevantMemory: string[];
    planTitle: string | null;
    openPlanItems: string[];
    completedActions: string[];
    openLoops: string[];
    observedPatterns: string[];
    /**
     * Approved timing language from the Rulebook, or null when no rulebook
     * version is active. Step 18 section 41: astrology may supply interpretive
     * context but must never be converted into certainty.
     */
    timingContext: string | null;
    periodStart: string | null;
    periodEnd: string | null;
  };
}

export interface FutureSelfGenerationResult {
  narrative: FutureSelfNarrative;
  /** Provenance carried onto the persisted narrative row. */
  engineVersion: string;
  modelVersion: string | null;
  aiGenerationRunId: string | null;
}

/**
 * The Future Self intelligence port.
 *
 * Mirrors `WHATNOW_ENGINE` exactly, and for the same reason: Step 21 places
 * generation in a Python intelligence service that does not exist in this
 * repository yet, so Build Rule 173 applies - isolate the interface, bind a
 * controlled implementation, document the blocker. Swapping the LLM engine for
 * an HTTP adapter requires no change to FutureSelfService or to anything
 * downstream.
 *
 * It also makes the boundary testable. Adversarial cases are driven by binding
 * an engine that returns exactly the output ZUNO must refuse, which is not
 * something a real provider can be asked to do reliably.
 */
export interface IFutureSelfEngine {
  generate(
    request: FutureSelfGenerationRequest,
  ): Promise<FutureSelfGenerationResult>;
}

/** Nest DI token. Consumers inject the interface, never a concrete class. */
export const FUTURE_SELF_ENGINE = Symbol('FUTURE_SELF_ENGINE');
