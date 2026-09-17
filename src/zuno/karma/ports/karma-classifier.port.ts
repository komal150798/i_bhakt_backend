import {
  KarmaCategory,
  KarmaClassification,
  KarmaEffort,
  KarmaImpactScope,
  KarmaIntent,
  KarmaRelevance,
} from '../enums/karma.enum';

/**
 * The semantic-interpretation boundary.
 *
 * Step 17 section 21 and Rule 3 draw the line this port exists to keep:
 *
 *   the model         "this reads as CONSTRUCTIVE, SERVICE, effort MEDIUM"
 *   the backend       "therefore 8 points, under scoring model 1.0"
 *
 * Nothing behind this port is allowed to return a number of points, and
 * KarmaScoring never asks it for one. That separation is what makes historical
 * scores explainable when the interpretation model changes (Step 17 section 22).
 *
 * Step 21 section 56 exposes the same contract over HTTP as
 * `POST /internal/v1/karma/classify`, so a Python intelligence service can be
 * bound to this token later without any consumer changing.
 */

export interface KarmaClassificationRequest {
  /**
   * The text to interpret. For a user entry this is what the user wrote; for a
   * completed plan action it is the action's short label.
   */
  text: string;
  /** PLAN_COMPLETION / MKA_COMPLETION / USER_CREATED, as context. */
  source: string;
  /** Hints the upstream module already knows, when it knows them. */
  suggestedCategory?: KarmaCategory;
  effortHint?: KarmaEffort;
  relevanceHint?: KarmaRelevance;
}

/**
 * Structured evidence labels, never chain-of-thought.
 *
 * Step 21 section 56 is explicit: "structured classification evidence labels,
 * not private chain-of-thought", and Build Rule 87 forbids persisting hidden
 * reasoning. `evidence` is a short list of stable tags such as
 * `LEXICAL:SERVICE` that an explanation can be built from.
 */
export interface KarmaClassificationResult {
  classification: KarmaClassification;
  category: KarmaCategory;
  intent: KarmaIntent;
  impactScope: KarmaImpactScope;
  effort: KarmaEffort;
  relevance: KarmaRelevance;
  /** 0..1. Step 17 section 53: stored, and it changes how firmly we speak. */
  confidence: number;
  evidence: string[];
  /** Step 17 section 58: retained on every entry for provenance. */
  modelVersion: string;
}

export interface KarmaClassifierPort {
  classify(
    request: KarmaClassificationRequest,
  ): Promise<KarmaClassificationResult>;
}

/** Nest DI token. */
export const KARMA_CLASSIFIER = Symbol('KARMA_CLASSIFIER');
