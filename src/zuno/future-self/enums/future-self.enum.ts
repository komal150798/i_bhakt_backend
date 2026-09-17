/**
 * Future Self vocabulary. Step 18 sections 71-76, Step 20 section 56.
 *
 * Declared inside the future-self module for the same reason the memory enums
 * are: `src/zuno/common/enums` is the shared contract package and is off-limits
 * to this change. WIRING.md records the promotion.
 */

/** Step 18 section 71 / Step 20 section 56. */
export enum FutureSelfMode {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MILESTONE = 'MILESTONE',
  REALIGNMENT = 'REALIGNMENT',
  REFLECTION = 'REFLECTION',
}

export const FUTURE_SELF_MODES: readonly FutureSelfMode[] =
  Object.values(FutureSelfMode);

/**
 * Step 18 section 72: the daily mode "should be very light". Enforcing that as
 * a character ceiling rather than as a hint in the prompt means a model having
 * an expansive day cannot turn the daily nudge into an essay.
 */
export const MODE_MAX_SUMMARY_CHARS: Readonly<Record<FutureSelfMode, number>> = {
  [FutureSelfMode.DAILY]: 320,
  [FutureSelfMode.WEEKLY]: 900,
  [FutureSelfMode.MILESTONE]: 900,
  [FutureSelfMode.REALIGNMENT]: 900,
  [FutureSelfMode.REFLECTION]: 1100,
};

/** How far back each mode looks when gathering grounded evidence. */
export const MODE_LOOKBACK_DAYS: Readonly<Record<FutureSelfMode, number>> = {
  [FutureSelfMode.DAILY]: 2,
  [FutureSelfMode.WEEKLY]: 7,
  [FutureSelfMode.MILESTONE]: 90,
  [FutureSelfMode.REALIGNMENT]: 30,
  [FutureSelfMode.REFLECTION]: 30,
};

/**
 * Violations of the Step 18 section 40 / roadmap section 71 boundary.
 *
 * These are refusal reasons, not warnings. A narrative carrying any of them is
 * never persisted and never shown.
 */
export enum FutureSelfViolation {
  /** A named employer that appears nowhere in the user's own history. */
  INVENTED_EMPLOYER = 'INVENTED_EMPLOYER',
  /** A named partner or a future relationship the user never mentioned. */
  INVENTED_PARTNER = 'INVENTED_PARTNER',
  /** A salary, package or figure ZUNO has no basis for. */
  INVENTED_SALARY = 'INVENTED_SALARY',
  /** "You will get the job", "everything works out". */
  GUARANTEED_OUTCOME = 'GUARANTEED_OUTCOME',
  /** "I am you from December 2026", "I have seen your future". */
  LITERAL_FUTURE_KNOWLEDGE = 'LITERAL_FUTURE_KNOWLEDGE',
  /** A proper noun or figure with no source in the grounding set. */
  UNGROUNDED_ENTITY = 'UNGROUNDED_ENTITY',
  /** An emotional-growth claim with no observable evidence (section 107). */
  UNGROUNDED_EMOTIONAL_CLAIM = 'UNGROUNDED_EMOTIONAL_CLAIM',
  /** Karma or astrology presented as causing an outcome (section 42). */
  MYSTICAL_CAUSATION = 'MYSTICAL_CAUSATION',
  /** A fixed identity label rather than an observation (section 68/117). */
  IDENTITY_LABEL = 'IDENTITY_LABEL',
  /** Exceeds the mode's length ceiling (section 72). */
  MODE_LENGTH_EXCEEDED = 'MODE_LENGTH_EXCEEDED',
  /** Claimed a source entity that was not in the supplied grounding set. */
  UNVERIFIABLE_SOURCE = 'UNVERIFIABLE_SOURCE',
}
