import { ZunoException } from '../../common/errors/zuno.exception';
import {
  KarmaCategory,
  KarmaClassification,
  KarmaEffort,
  KarmaIntent,
  KarmaRelevance,
} from '../enums/karma.enum';
import { KARMA_POINTS_LABEL } from '../neutrality';

/**
 * Deterministic karma scoring.
 *
 * Step 17 section 20 gives the shape:
 *
 *   Base Value x Intent Weight x Effort Weight x Relevance Weight
 *               x Consistency Modifier, with bounded output
 *
 * and section 20 also requires the formula to be "deterministic and versioned".
 * Step 17 section 21 and Rule 3 keep the arithmetic here rather than in a
 * prompt: an LLM may say an action took HIGH effort, but it never says how many
 * points that is worth.
 *
 * Everything in this file is pure. No repository, no clock, no request context -
 * the caller supplies the observations and receives a breakdown. That is what
 * makes Step 17 sections 59-60 ("explain why it was categorized, what factors
 * affected points, which scoring version was used") answerable without
 * re-running anything.
 */

export interface KarmaScoringConfiguration {
  /** Step 17 section 22: stamped onto every scored entry. */
  version: string;
  maxPointsPerEntry: number;
  minPointsPerEntry: number;
  /** Step 17 sections 63, 92: a soft cap, applied by trimming, never by debt. */
  dailySoftCap: number;
  /**
   * Step 17 sections 17-19. Locked false.
   *
   * Turning this on is not an implementation decision. Section 19 requires
   * Product, Safety, Behavioural Design and SME Governance approval and says it
   * "must not be introduced casually by Claude". `assertNonPunitive` below
   * refuses to score at all if it is ever flipped without that work, so the
   * failure is loud rather than a quietly negative ledger.
   */
  negativeScoringEnabled: false;
  baseValue: number;
  intentWeight: Readonly<Record<KarmaIntent, number>>;
  effortWeight: Readonly<Record<KarmaEffort, number>>;
  relevanceWeight: Readonly<Record<KarmaRelevance, number>>;
  /**
   * Step 17 sections 16 and 64: consistency counts, but a repeated identical
   * low-effort action must not mint unlimited points. Index n is the multiplier
   * for the (n+1)th entry in the same category inside the repetition window;
   * the last value repeats for everything beyond it.
   */
  repetitionCurve: readonly number[];
  repetitionWindowDays: number;
  /**
   * How a classification converts into progress.
   *
   * CONSTRUCTIVE earns. MIXED earns partially, because Step 17 section 12 says
   * a mixed action must not be collapsed into a binary verdict. NEUTRAL,
   * UNCERTAIN and UNCONSTRUCTIVE earn nothing - and, critically, lose nothing.
   * Step 17 section 18: an unconstructive action is a reflection opportunity,
   * not a deduction.
   */
  classificationFactor: Readonly<Record<KarmaClassification, number>>;
  /** Step 17 section 54: below this, the entry is offered for confirmation. */
  autoConfirmConfidence: number;
  /** Step 17 sections 13 and 54: below this, we say UNCERTAIN instead. */
  uncertainBelowConfidence: number;
}

/**
 * Scoring model 1.0.
 *
 * The numbers are illustrative-but-approved-shaped, exactly as Step 17
 * section 92 describes them ("values are illustrative and should be
 * product-approved"). They are configuration, not logic: changing them means a
 * new version string and a new row in `zuno_karma_score_configurations`, which
 * is what keeps Step 17 section 23 (no retroactive silent rescoring) true.
 */
export const KARMA_SCORING_V1: KarmaScoringConfiguration = {
  version: '1.0',
  maxPointsPerEntry: 10,
  minPointsPerEntry: 0,
  dailySoftCap: 30,
  negativeScoringEnabled: false,
  baseValue: 5,
  intentWeight: {
    [KarmaIntent.SUPPORT]: 1.1,
    [KarmaIntent.RESPONSIBILITY]: 1.1,
    // Step 17 section 33: repair is recognised generously, because doing it is
    // harder than the action that made it necessary.
    [KarmaIntent.REPAIR]: 1.2,
    [KarmaIntent.GROWTH]: 1.05,
    [KarmaIntent.FOLLOW_THROUGH]: 1.15,
    [KarmaIntent.INTENTIONAL_PRACTICE]: 1.0,
    [KarmaIntent.ROUTINE]: 0.9,
    [KarmaIntent.UNKNOWN]: 1.0,
  },
  effortWeight: {
    [KarmaEffort.LOW]: 0.7,
    [KarmaEffort.MEDIUM]: 1.0,
    // Step 17 section 65: a difficult one-time action reasonably carries more.
    [KarmaEffort.HIGH]: 1.4,
  },
  relevanceWeight: {
    [KarmaRelevance.LOW]: 0.8,
    [KarmaRelevance.MEDIUM]: 1.0,
    [KarmaRelevance.HIGH]: 1.2,
  },
  repetitionCurve: [1.0, 1.0, 0.85, 0.7, 0.6, 0.5],
  repetitionWindowDays: 7,
  classificationFactor: {
    [KarmaClassification.CONSTRUCTIVE]: 1.0,
    [KarmaClassification.MIXED]: 0.5,
    [KarmaClassification.NEUTRAL]: 0,
    [KarmaClassification.UNCERTAIN]: 0,
    [KarmaClassification.UNCONSTRUCTIVE]: 0,
  },
  autoConfirmConfidence: 0.75,
  uncertainBelowConfidence: 0.45,
};

export interface KarmaScoreObservation {
  classification: KarmaClassification;
  category: KarmaCategory;
  intent: KarmaIntent;
  effort: KarmaEffort;
  relevance: KarmaRelevance;
  /**
   * How many entries the user already has in this category inside the
   * repetition window. Zero for the first one.
   */
  priorInCategoryInWindow: number;
  /** Points already recorded today, for the soft cap. */
  pointsRecordedToday: number;
}

export interface KarmaScoreFactor {
  /** Stable label, safe to show and safe to log. */
  factor: string;
  value: number;
}

export interface KarmaScoreBreakdown {
  points: number;
  scoringModelVersion: string;
  factors: KarmaScoreFactor[];
  /** True when the daily soft cap trimmed the result. */
  softCapApplied: boolean;
  /** Ready-to-render, neutrality-checked explanation. Step 17 section 60. */
  explanation: string;
}

/**
 * Guards the one invariant this module exists to protect.
 *
 * Step 17 Rules 4 and 5 make "no negative karma" non-negotiable, and sections
 * 28 and 48 name the two cases most likely to erode it. Rather than trusting
 * every call site to remember, the arithmetic itself refuses.
 */
export function assertNonPunitive(
  config: KarmaScoringConfiguration,
  points: number,
): void {
  if (config.negativeScoringEnabled as boolean) {
    throw ZunoException.internal(
      'karma negative scoring is disabled by Step 17 section 19 and requires Product, Safety, Behavioural Design and SME Governance approval',
    );
  }
  if (points < 0) {
    throw ZunoException.internal(
      'karma scoring produced a negative value, which Step 17 Rule 4 forbids',
    );
  }
}

/**
 * Calculates bounded points for one entry.
 *
 * Deterministic: the same observation and the same configuration always give
 * the same number, which is what lets an old entry stay explainable after the
 * formula moves on.
 */
export function calculateKarmaPoints(
  observation: KarmaScoreObservation,
  config: KarmaScoringConfiguration = KARMA_SCORING_V1,
): KarmaScoreBreakdown {
  assertNonPunitive(config, 0);

  const classificationFactor =
    config.classificationFactor[observation.classification] ?? 0;
  const intent = config.intentWeight[observation.intent] ?? 1;
  const effort = config.effortWeight[observation.effort] ?? 1;
  const relevance = config.relevanceWeight[observation.relevance] ?? 1;
  const repetition = repetitionMultiplier(
    observation.priorInCategoryInWindow,
    config,
  );

  const raw =
    config.baseValue * intent * effort * relevance * repetition * classificationFactor;

  // Round before bounding so the bound is on the value the user will see.
  let points = Math.round(raw);
  points = Math.min(config.maxPointsPerEntry, Math.max(config.minPointsPerEntry, points));

  // Step 17 sections 63 and 92: the daily cap trims today's award. It never
  // reaches backwards to take points off entries already recorded, and it never
  // goes below zero.
  const remainingToday = Math.max(
    0,
    config.dailySoftCap - observation.pointsRecordedToday,
  );
  const softCapApplied = points > remainingToday;
  if (softCapApplied) {
    points = remainingToday;
  }

  assertNonPunitive(config, points);

  const factors: KarmaScoreFactor[] = [
    { factor: 'BASE', value: config.baseValue },
    { factor: `CLASSIFICATION:${observation.classification}`, value: classificationFactor },
    { factor: `INTENT:${observation.intent}`, value: intent },
    { factor: `EFFORT:${observation.effort}`, value: effort },
    { factor: `RELEVANCE:${observation.relevance}`, value: relevance },
    { factor: 'CONSISTENCY', value: repetition },
  ];
  if (softCapApplied) {
    factors.push({ factor: 'DAILY_SOFT_CAP', value: config.dailySoftCap });
  }

  return {
    points,
    scoringModelVersion: config.version,
    factors,
    softCapApplied,
    explanation: explain(points, observation, softCapApplied),
  };
}

function repetitionMultiplier(
  prior: number,
  config: KarmaScoringConfiguration,
): number {
  const curve = config.repetitionCurve;
  if (curve.length === 0) return 1;
  const index = Math.max(0, Math.min(prior, curve.length - 1));
  return curve[index];
}

/**
 * Plain-language explanation of a score.
 *
 * Step 17 section 60's example is the target: "You received 8 Growth Points
 * because this was a meaningful action you had committed to, it required
 * effort, and you completed it." Step 17 section 60 also forbids pseudo-
 * spiritual explanation, and section 53 says a low-confidence classification
 * should not be spoken about firmly - so this describes the *inputs*, not a
 * verdict about the person.
 *
 * Built from fixed fragments so the neutrality suite can enumerate every
 * sentence this function can produce.
 */
function explain(
  points: number,
  observation: KarmaScoreObservation,
  softCapApplied: boolean,
): string {
  if (points === 0) {
    if (softCapApplied) {
      return 'Recorded in your ledger. You have already logged a full day of progress, so no further points were added.';
    }
    if (observation.classification === KarmaClassification.UNCERTAIN) {
      return 'Recorded in your ledger. There was not enough context to read it either way, so it is noted without points.';
    }
    if (observation.classification === KarmaClassification.UNCONSTRUCTIVE) {
      // Step 17 sections 9 and 18: a reflection point, addressed to the action.
      return 'Recorded in your ledger as something to reflect on. Nothing was added or taken away.';
    }
    return 'Recorded in your ledger. This one is noted without points.';
  }

  const reasons: string[] = [];
  if (observation.effort === KarmaEffort.HIGH) {
    reasons.push('it took real effort');
  }
  if (observation.relevance === KarmaRelevance.HIGH) {
    reasons.push('it moved something you said matters to you');
  }
  if (observation.intent === KarmaIntent.REPAIR) {
    reasons.push('it was a step towards putting something right');
  }
  if (observation.intent === KarmaIntent.FOLLOW_THROUGH) {
    reasons.push('you followed through on something you had committed to');
  }
  if (reasons.length === 0) {
    reasons.push('you recorded it and completed it');
  }

  const tail = observation.priorInCategoryInWindow >= 2
    ? ' You have been steady on this one recently, so repeats count for a little less.'
    : '';

  return `${points} ${KARMA_POINTS_LABEL} because ${joinReasons(reasons)}.${tail}`;
}

function joinReasons(reasons: string[]): string {
  if (reasons.length === 1) return reasons[0];
  return `${reasons.slice(0, -1).join(', ')} and ${reasons[reasons.length - 1]}`;
}

/**
 * Step 17 section 54: whether the entry can stand without asking the user.
 *
 * Low confidence does not mean "guess harder" - section 13 says UNCERTAIN is a
 * valid answer and section 54 says to ask. This returns that decision so the
 * API can surface `confirmationRequired` (Step 17 section 87).
 */
export function requiresUserConfirmation(
  confidence: number,
  config: KarmaScoringConfiguration = KARMA_SCORING_V1,
): boolean {
  return confidence < config.autoConfirmConfidence;
}

/**
 * Step 17 section 13: too little context to classify honestly.
 *
 * Applied *after* the interpreter has spoken, so a low-confidence
 * CONSTRUCTIVE or UNCONSTRUCTIVE reading is downgraded to UNCERTAIN rather
 * than being asserted. Golden Test 96 ("I told him exactly what I thought")
 * is exactly this case.
 */
export function withConfidenceFloor(
  classification: KarmaClassification,
  confidence: number,
  config: KarmaScoringConfiguration = KARMA_SCORING_V1,
): KarmaClassification {
  if (confidence < config.uncertainBelowConfidence) {
    return KarmaClassification.UNCERTAIN;
  }
  return classification;
}
