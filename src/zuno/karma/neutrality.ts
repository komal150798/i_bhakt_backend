import { ZunoException } from '../common/errors/zuno.exception';

/**
 * The neutrality guard.
 *
 * Roadmap section 55 ("introduce reflective action tracking without moralizing
 * the user") and Step 17 sections 9, 38-40, 102-107 and Rules 1, 2 and 12 are
 * the requirement. This file turns them into something the code can actually
 * enforce and a test can actually fail on, instead of a comment asking future
 * authors to be careful.
 *
 * Three mechanisms live here:
 *
 *   1. An allow-list for the headline score label (Step 17 section 39).
 *   2. A deny-list of phrases that must never appear in ZUNO-authored ledger
 *      copy, checked with word boundaries.
 *   3. `assertNeutralCopy`, called on every system-generated string before it
 *      can reach a user.
 *
 * IMPORTANT SCOPE LIMIT - this never touches the user's own words.
 * Step 17 section 5 gives the examples: a user may legitimately write "Lost my
 * temper with my family", and section 129 requires nuance to be preserved.
 * Rewriting or rejecting that would be ZUNO editing a person's private diary.
 * The guard applies only to text ZUNO authors *about* the user.
 */

/**
 * Step 17 section 39: the only labels approved for a headline figure.
 *
 * Every one of them names a product measure. None of them claims to measure
 * karma itself, which Step 17 section 38 forbids ("Never: Your actual Karma is
 * 742").
 */
export const KARMA_APPROVED_POINT_LABELS: readonly string[] = [
  'Karma Progress',
  'Karma Practice Score',
  'Growth Points',
  'Karma Ledger Points',
];

/** The label this build emits. Changing it requires the list above. */
export const KARMA_POINTS_LABEL = 'Karma Ledger Points';

/**
 * A stable, non-mystical framing for the headline figure.
 * Step 17 section 38: "A ZUNO progress indicator based on recorded actions."
 */
export const KARMA_SCORE_FRAMING =
  'A ZUNO progress indicator based on recorded actions.';

export interface NeutralityRule {
  /** Stable id so a violation can be reported without quoting the copy. */
  id: string;
  pattern: RegExp;
  /** Why this phrase is refused, citing the specification. */
  reason: string;
}

/**
 * Phrases ZUNO must never write about a person's ledger.
 *
 * Grouped by the anti-pattern each one defends against, so that adding a rule
 * forces the author to say which requirement it serves.
 *
 * All patterns are case-insensitive and anchored on word boundaries, because a
 * naive substring match would reject "since" for containing "sin" and
 * "interest" for containing "rest" - a guard that cries wolf gets disabled.
 */
export const KARMA_NEUTRALITY_RULES: readonly NeutralityRule[] = [
  // Step 17 sections 102, 78, 40 - cosmic accounting and spiritual precision.
  {
    id: 'COSMIC_ACCOUNTING',
    pattern: /\b(cosmic|divine|karmic)\s+(karma|balance|merit|credit|debt|protection|reward|account|alignment)\b/i,
    reason: 'Step 17 section 102: the ledger does not measure cosmic karma.',
  },
  {
    id: 'SPIRITUAL_MERIT',
    pattern: /\b(spiritual merit|karmic debt|cosmic currency|divine judgment|divine judgement)\b/i,
    reason: 'Step 17 section 15: points are not spiritual merit.',
  },
  {
    id: 'KARMA_AS_QUANTITY',
    pattern: /\b(your (actual|real|true) karma|karma (balance|is now|score is)|karma points? (lost|gained|deducted))\b/i,
    reason: 'Step 17 section 38: never state a quantity of karma itself.',
  },
  {
    id: 'PLANETARY_CLAIM',
    pattern: /\b(neutrali[sz]e[sd]?|cancel(led)?|offset)\b[^.]{0,40}\b(saturn|rahu|ketu|planet|dasha|transit|doshas?)\b/i,
    reason:
      'Step 17 section 78: ledger results never claim a changed planetary outcome.',
  },

  // Step 17 sections 9, 103 and Rule 2 - judging the person, not the action.
  {
    id: 'PERSON_JUDGEMENT',
    pattern: /\b(bad|good|better|worse|terrible|awful)\s+person\b/i,
    reason: 'Step 17 Rule 2: never equate a classification with the user\'s worth.',
  },
  {
    id: 'MORAL_LABEL',
    pattern: /\b(bad|good|negative|positive|poor|low)\s+karma\b/i,
    reason: 'Step 17 section 8: the product avoids moralizing karma labels.',
  },
  {
    id: 'SIN_LANGUAGE',
    pattern: /\b(sin|sins|sinful|sinner|immoral|unworthy|impure)\b/i,
    reason: 'Step 17 section 32: ZUNO is not a religious or moral authority.',
  },

  // Step 17 sections 18, 62, 104 and Build Rule 64 - guilt, shame, punishment.
  {
    id: 'PUNITIVE',
    pattern: /\b(punish|punished|punishment|punitive|penali[sz]ed?|penalty|penalties)\b/i,
    reason: 'Step 17 section 18: unconstructive action is a reflection point, not a punishment.',
  },
  {
    id: 'SHAMING',
    pattern: /\b(shame|shameful|ashamed|guilty|disgrace|you failed|you are failing)\b/i,
    reason: 'Build Rule 64: a missed action must never create shame.',
  },
  {
    id: 'DECLINE_FRAMING',
    pattern: /\byour karma is (low|declining|falling|dropping)\b/i,
    reason: 'Step 17 section 77: never frame a pattern as karma declining.',
  },

  // Step 17 sections 68, 106 - ranking and comparison against other people.
  {
    id: 'RANKING',
    pattern: /\b(leaderboard|rank(ed|ing)?|top \d+|#\d+|compared to other (users|people)|than other (users|people))\b/i,
    reason: 'Step 17 Rule 10: no public karma ranking exists in the core product.',
  },

  // Step 17 sections 66-67, 105 and Rule 9 - money and tier buying progress.
  {
    id: 'PAY_TO_SCORE',
    pattern: /\b(premium|paid|subscription|donation)\b[^.]{0,40}\b(karma|points|double points|more points)\b/i,
    reason: 'Step 17 Rule 9: subscription level must never influence points.',
  },

  // Step 17 section 107 - fear-based framing.
  {
    id: 'FEAR_FRAMING',
    pattern: /\b(because your karma|if your karma)\b[^.]{0,60}\b(worse|suffer|danger|harm|misfortune)\b/i,
    reason: 'Step 17 section 107: the score must never be used to manufacture fear.',
  },
];

export interface NeutralityViolation {
  ruleId: string;
  reason: string;
}

/**
 * Returns every neutrality rule the given ZUNO-authored text breaks.
 *
 * Pure and synchronous so it can be used as an assertion inside tests as well
 * as a runtime guard.
 */
export function findNeutralityViolations(text: string): NeutralityViolation[] {
  if (!text) return [];
  return KARMA_NEUTRALITY_RULES.filter((rule) => rule.pattern.test(text)).map(
    (rule) => ({ ruleId: rule.id, reason: rule.reason }),
  );
}

/**
 * Refuses to emit ZUNO-authored ledger copy that breaks neutrality.
 *
 * Throws INTERNAL_ERROR rather than quietly scrubbing the string. Build Rule
 * 128 forbids fabricated success, and a silently rewritten sentence is exactly
 * that - the caller would believe it had said something it did not. The
 * internal detail names the rule id, never the offending copy, so nothing
 * sensitive reaches a log (Build Rule 34).
 */
export function assertNeutralCopy(text: string, where: string): void {
  const violations = findNeutralityViolations(text);
  if (violations.length > 0) {
    throw ZunoException.internal(
      `karma neutrality violation in ${where}: ${violations
        .map((violation) => violation.ruleId)
        .join(',')}`,
    );
  }
}

/**
 * Every user-facing string the ledger can produce, in one auditable table.
 *
 * Build Rule 88 keeps production copy out of scattered string literals, and
 * having them together is what makes the neutrality suite meaningful: the test
 * asserts over this whole object, so a new message cannot be added without
 * being checked.
 *
 * Tone follows Build Rule 185 (calm, human, clear, supportive, non-fatalistic,
 * non-judgemental) and Step 17 sections 13, 55, 77 and 82 for the specific
 * situations.
 */
export const KARMA_COPY = {
  /** Step 17 section 13: insufficient context, offered as a question. */
  needsMoreContext:
    'Would you like to add a little more context before we note this down?',

  /** Step 17 section 55: the user knows their own context better than we do. */
  classificationDisagreement:
    'That is fair. You know the context better than I do. Would you like to mark it as Mixed, Neutral, or add more context?',

  /** Step 17 section 82: a missed practice, with no catch-up pressure. */
  actionNotCompleted:
    'Nothing to record for this one. Carry on with the next step whenever you are ready.',

  /** Step 17 sections 48 and 83: the plan changed because life changed. */
  cancelledByRealignment:
    'This step was set aside when the plan was updated. Your progress is unchanged.',

  /** Step 17 section 49: deferring is context, not a fault. */
  actionDeferred:
    'This one moved to later. That is often the sensible call, and nothing changes here.',

  /** Step 17 section 33: repair is recognised without erasing what came before. */
  repairRecognised:
    'Noted as a repair step. It sits alongside what came before rather than replacing it.',

  /** Step 17 section 6: not every completed step belongs in the ledger. */
  notLedgerEligible:
    'Tracked as plan progress. Not everything needs to go in the ledger.',

  /** Build Rule 118 / 51: no approved interpretation available, said plainly. */
  interpretationUnavailable:
    'We have recorded that you did this. We are not adding any further reading to it right now.',

  /** Step 17 section 57: the same action arriving twice. */
  alreadyRecorded: 'This one is already in your ledger.',

  /** Step 17 sections 30-31: safety takes precedence over any scoring. */
  safetyRouted:
    'Thank you for telling me. I would rather talk about this directly than turn it into a number.',
} as const;

/**
 * Validates the copy table above. Called by the spec, and cheap enough to call
 * at start-up if a future phase wants a hard boot-time gate.
 */
export function assertKarmaCopyIsNeutral(): void {
  for (const [key, value] of Object.entries(KARMA_COPY)) {
    assertNeutralCopy(value, `KARMA_COPY.${key}`);
  }
  if (!KARMA_APPROVED_POINT_LABELS.includes(KARMA_POINTS_LABEL)) {
    throw ZunoException.internal(
      'karma points label is not one of the labels approved by Step 17 section 39',
    );
  }
}
