import { EmotionalIntensity, MkaDimension } from '../../common/enums';
import { MkaFrequency, MkaPriority, MkaSourceType } from '../enums/mka.enum';

/**
 * ZUNO's own behavioural practice library.
 *
 * WHAT THIS IS NOT
 * This file contains no astrology. Every astrological practice ZUNO ever
 * suggests comes from the SME Rulebook through `RulebookRepositoryService` -
 * Step 15 Rule 1, Rule 2 and Anti-Pattern 110, and Build Rule 50.
 *
 * WHAT THIS IS
 * Step 15 section 51 states that when no approved rule exists, "ZUNO can still
 * provide safe Mind and practical Action guidance", and Golden Test 103 makes
 * that the *required* behaviour rather than a fallback: Mind allowed, Karma as
 * a safe non-astrology constructive practice, Action allowed, astrological
 * remedy NONE. That is only possible if the safe practices exist somewhere
 * deterministic.
 *
 * A fixed table rather than generated text, for three reasons:
 *   - Step 15 section 54 gives the deterministic system control of the
 *     practice boundaries; an LLM may reword, never originate.
 *   - Step 15 sections 22-23 forbid fear-based framing and guaranteed
 *     outcomes. Wording that is reviewed once and then reused cannot drift
 *     into either.
 *   - Step 15 section 116 warns against changing practices daily just to look
 *     responsive. Consistency is therapeutic.
 *
 * Every entry below is deliberately phrased with no promise of an external
 * result, no clinical claim (section 12) and no religious assumption
 * (section 43).
 */
export interface MkaPracticeTemplate {
  key: string;
  dimension: MkaDimension;
  title: string;
  description: string;
  purpose: string;
  frequency: MkaFrequency;
  durationMinutes: number | null;
  priority: MkaPriority;
  sourceType: MkaSourceType;
  karmaEligible: boolean;
}

/**
 * Mind practices, selected on emotional intensity.
 *
 * Step 15 section 11 lists these shapes as examples, not mandatory templates,
 * and section 10 names what the Mind pillar supports. Selection is by observed
 * emotional signal because that is the only input available here that is both
 * user-derived and non-clinical.
 */
export const MIND_PRACTICES: Readonly<
  Record<EmotionalIntensity, MkaPracticeTemplate>
> = {
  [EmotionalIntensity.VERY_HIGH]: {
    key: 'MIND_FACTS_VS_FEARS',
    dimension: MkaDimension.MIND,
    title: 'Stay with facts, not fear',
    description:
      'Take five quiet minutes before checking messages. Write down three things: what you actually know, what you are assuming, and what you can do today.',
    purpose:
      'Create a little space between what has happened and what you are afraid might happen, so the day starts from facts.',
    frequency: MkaFrequency.DAILY,
    durationMinutes: 5,
    priority: MkaPriority.ESSENTIAL,
    sourceType: MkaSourceType.ZUNO_BEHAVIOURAL_GUIDANCE,
    karmaEligible: false,
  },
  [EmotionalIntensity.HIGH]: {
    key: 'MIND_MORNING_GROUNDING',
    dimension: MkaDimension.MIND,
    title: 'Steady the mind before reacting',
    description:
      'Begin the day with five slow, unhurried minutes before you open work messages. Notice what you are carrying, then choose the first thing you will do.',
    purpose:
      'Start the day deliberately rather than reacting to whatever arrives first.',
    frequency: MkaFrequency.DAILY,
    durationMinutes: 5,
    priority: MkaPriority.ESSENTIAL,
    sourceType: MkaSourceType.ZUNO_BEHAVIOURAL_GUIDANCE,
    karmaEligible: false,
  },
  [EmotionalIntensity.MODERATE]: {
    key: 'MIND_PAUSE_BEFORE_RESPONSE',
    dimension: MkaDimension.MIND,
    title: 'Pause before you respond',
    description:
      'When something lands that pulls a quick reaction from you, wait until you have read it twice before replying.',
    purpose:
      'Keep the decisions that matter out of the first, most reactive minute.',
    frequency: MkaFrequency.DAILY,
    durationMinutes: 3,
    priority: MkaPriority.IMPORTANT,
    sourceType: MkaSourceType.ZUNO_BEHAVIOURAL_GUIDANCE,
    karmaEligible: false,
  },
  [EmotionalIntensity.LOW]: {
    key: 'MIND_EVENING_REVIEW',
    dimension: MkaDimension.MIND,
    title: 'Close the day honestly',
    description:
      'At the end of the day, note one thing that moved forward and one thing you would like to pick up tomorrow.',
    purpose: 'Keep a clear view of progress without carrying the day into the night.',
    frequency: MkaFrequency.DAILY,
    durationMinutes: 3,
    priority: MkaPriority.IMPORTANT,
    sourceType: MkaSourceType.ZUNO_BEHAVIOURAL_GUIDANCE,
    karmaEligible: false,
  },
};

/**
 * Non-astrological Karma practices.
 *
 * Step 15 section 13 defines Karma inside ZUNO as intentional constructive
 * practice - explicitly NOT a supernatural reward-and-punishment mechanism -
 * and section 14 lists these sources. Step 15 section 100 is the guardrail
 * this table respects: if there is no approved alternative, leave the slot
 * empty; never invent one merely to fill it. So this table holds only
 * practices that are constructive on their own terms, with no astrological
 * claim attached.
 *
 * These are Karma-Ledger eligible where the practice is an outward,
 * constructive act (Step 15 section 65); reflection alone is not.
 */
export const NEUTRAL_KARMA_PRACTICES: readonly MkaPracticeTemplate[] = [
  {
    key: 'KARMA_CONSISTENCY',
    dimension: MkaDimension.KARMA,
    title: 'One small commitment, kept',
    description:
      'Choose one small thing you will do every day this week - the same thing, at roughly the same time - and keep it, however the week goes.',
    purpose:
      'Build the sense that something is steady and within your control while other things are not.',
    frequency: MkaFrequency.DAILY,
    durationMinutes: 10,
    priority: MkaPriority.IMPORTANT,
    sourceType: MkaSourceType.DISCIPLINE,
    karmaEligible: true,
  },
  {
    key: 'KARMA_GRATITUDE',
    dimension: MkaDimension.KARMA,
    title: 'Acknowledge one person',
    description:
      'Once this week, tell one person plainly that something they did helped you.',
    purpose:
      'Keep the relationships that support you active rather than letting a difficult period narrow your world.',
    frequency: MkaFrequency.WEEKLY,
    durationMinutes: 10,
    priority: MkaPriority.OPTIONAL,
    sourceType: MkaSourceType.GRATITUDE,
    karmaEligible: true,
  },
  {
    key: 'KARMA_SERVICE',
    dimension: MkaDimension.KARMA,
    title: 'Be useful to someone else once',
    description:
      'Do one thing this week that helps someone else with no expectation of anything back. It does not need to be large.',
    purpose:
      'Step outside your own situation for a moment; it tends to restore some perspective.',
    frequency: MkaFrequency.WEEKLY,
    durationMinutes: 20,
    priority: MkaPriority.OPTIONAL,
    sourceType: MkaSourceType.SERVICE,
    karmaEligible: true,
  },
];

/**
 * The last-resort Action.
 *
 * Step 15 section 26 and Rule 3: for a real-world challenge, practical Action
 * is essential - an MKA set of "3 remedies, 0 practical actions" is invalid.
 * When the challenge context has not yet produced anything concrete enough to
 * act on, this preparation step is used so the ACTION pillar is never empty.
 *
 * It is written to be true and useful regardless of domain, and it asks the
 * user to establish facts rather than implying ZUNO knows any.
 */
export const FALLBACK_ACTION: MkaPracticeTemplate = {
  key: 'ACTION_CLARIFY_ONE_FACT',
  dimension: MkaDimension.ACTION,
  title: 'Establish one fact you are currently guessing at',
  description:
    'Pick the single thing you are most unsure about, and find out what is actually true - by asking, reading the document, or making one call.',
  purpose:
    'Most of the weight in an uncertain situation sits on things nobody has checked yet.',
  frequency: MkaFrequency.ONCE,
  durationMinutes: 30,
  priority: MkaPriority.ESSENTIAL,
  sourceType: MkaSourceType.WHATNOW,
  karmaEligible: true,
};
