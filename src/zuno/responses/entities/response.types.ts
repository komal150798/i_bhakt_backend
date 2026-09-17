import { ResponseSectionType, SectionEmphasis } from '../../common/enums';

/**
 * One renderable section of a ZUNO response.
 * Step 21 API Contracts sections 29-31, Step 20 section 61.
 *
 * The backend sends content structure and semantic emphasis; the client owns
 * layout, theme, animation and accessibility (Step 21 section 30). Nothing here
 * describes pixels, colours or widget names.
 */
export interface ZunoResponseSection<TPayload = unknown> {
  /** Stable within the response, so a client can preserve scroll/expansion. */
  id: string;
  type: ResponseSectionType;
  order: number;
  /** Short heading. Optional: some section types render without one. */
  title?: string;
  emphasis: SectionEmphasis;
  payload: TPayload;
}

/**
 * Step 20 section 61: the adaptive payload.
 *
 * Build Rule 15 and Step 21 Rule 19 both forbid hard-coding eight screens -
 * `sections` is whatever this particular WhatNow warranted. A low-confidence
 * first message may produce two sections; a fully analysed challenge may
 * produce seven.
 */
export interface ZunoResponsePayload {
  title: string;
  sections: ZunoResponseSection[];
}

/** Payload for CONTEXT_VALIDATION - "here is what I understand". */
export interface ContextValidationPayload {
  summary: string;
  /** Confirmed facts only. Fears are shown separately and labelled as such. */
  understood: string[];
  /**
   * Things the user is worried about, kept visually and semantically distinct
   * from `understood`. Step 11 section 8: a fear must never be rendered as an
   * established fact.
   */
  concerns: string[];
  /** Step 03/Step 30 Phase 3 section 26: the user can correct us. */
  correction_invited: boolean;
}

/** Payload for CLARIFICATION - at most a couple of high-gain questions. */
export interface ClarificationPayload {
  /** Step 11 section 29: understand enough, give value, ask ONE good question. */
  questions: { id: string; question: string }[];
  reason: string;
}

/** Payload for KEY_TAKEAWAY - the single most useful next thought. */
export interface KeyTakeawayPayload {
  headline: string;
  detail?: string;
}

/** Payload for FOCUS_PRIORITIES - Step 02 section 18 caps this at 3-4. */
export interface FocusPrioritiesPayload {
  priorities: { id: string; title: string; why: string }[];
}

/** Payload for SAFETY_BOUNDARY - Step 21 section 70. */
export interface SafetyBoundaryPayload {
  message: string;
  disposition: string;
  domain?: string;
  /** Kind of professional to consider, never a named provider. */
  suggested_support?: string;
}
