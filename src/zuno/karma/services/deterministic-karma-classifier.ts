import { Injectable } from '@nestjs/common';
import {
  KarmaClassificationRequest,
  KarmaClassificationResult,
  KarmaClassifierPort,
} from '../ports/karma-classifier.port';
import {
  KarmaCategory,
  KarmaClassification,
  KarmaEffort,
  KarmaImpactScope,
  KarmaIntent,
  KarmaRelevance,
} from '../enums/karma.enum';

/**
 * Version stamped onto every entry this classifier interprets.
 * Step 17 section 58: provenance must say *which* interpreter spoke.
 */
export const DETERMINISTIC_KARMA_CLASSIFIER_VERSION = 'karma-deterministic-1.0';

/**
 * The labelled deterministic fallback interpreter.
 *
 * Build Rule 92 ("where reliable deterministic logic exists, use it") and Build
 * Rule 129 (a fallback must be explicitly labelled, never passed off as
 * personalised AI) together describe what this is. Step 17 section 51 allows an
 * LLM to do this job, and the KARMA_CLASSIFIER token exists so one can be bound
 * later; until then the ledger still has to work, and it works honestly:
 * lexical evidence, a stated version, and UNCERTAIN whenever the evidence is
 * thin.
 *
 * Three design choices worth stating, because each of them is a specification
 * requirement rather than a preference:
 *
 *   1. It reaches UNCERTAIN readily. Step 17 sections 13 and 96 say that is a
 *      valid answer and that "I told him exactly what I thought" must not be
 *      forced into a verdict. Confidence stays low unless there is a clear,
 *      first-person, self-reported marker.
 *
 *   2. It is far more willing to say CONSTRUCTIVE than UNCONSTRUCTIVE, and it
 *      only reaches UNCONSTRUCTIVE on the user's own description of their own
 *      behaviour. Step 17 section 9: the ledger evaluates actions, and a
 *      false positive here would be ZUNO telling someone they behaved badly on
 *      the strength of a keyword.
 *
 *   3. It never reads a moral quality into the *person*. Every signal below is
 *      a verb about an action.
 *
 * This is ordinary behavioural text matching, not astrological interpretation.
 * Anything astrological is refused upstream in KarmaService and routed to the
 * Rulebook, per Build Rules 50-51.
 */
@Injectable()
export class DeterministicKarmaClassifier implements KarmaClassifierPort {
  async classify(
    request: KarmaClassificationRequest,
  ): Promise<KarmaClassificationResult> {
    const text = (request.text ?? '').toLowerCase();
    const evidence: string[] = [];

    const constructive = countMatches(CONSTRUCTIVE_SIGNALS, text);
    const unconstructive = countMatches(UNCONSTRUCTIVE_SIGNALS, text);
    const repair = countMatches(REPAIR_SIGNALS, text);

    if (constructive > 0) evidence.push('LEXICAL:CONSTRUCTIVE_ACTION');
    if (unconstructive > 0) evidence.push('LEXICAL:SELF_REPORTED_REGRET');
    if (repair > 0) evidence.push('LEXICAL:REPAIR');

    const category =
      request.suggestedCategory ?? detectCategory(text, repair > 0, evidence);
    const intent = detectIntent(text, category, repair > 0);
    const impactScope = detectImpactScope(text);
    const effort = request.effortHint ?? detectEffort(text, evidence);
    const relevance = request.relevanceHint ?? KarmaRelevance.MEDIUM;

    const { classification, confidence } = decide(
      constructive,
      unconstructive,
      repair,
      evidence,
    );

    return {
      classification,
      category,
      intent,
      impactScope,
      effort,
      relevance,
      confidence,
      evidence,
      modelVersion: DETERMINISTIC_KARMA_CLASSIFIER_VERSION,
    };
  }
}

/**
 * Turns signal counts into a classification and a confidence.
 *
 * MIXED exists here because Step 17 sections 11-12 require it: an entry that
 * reports both a supportive act and a regretted one ("I tried to help my
 * colleague, but I shared information I probably should not have") must not be
 * flattened into either pole.
 */
function decide(
  constructive: number,
  unconstructive: number,
  repair: number,
  evidence: string[],
): { classification: KarmaClassification; confidence: number } {
  if (constructive > 0 && unconstructive > 0) {
    evidence.push('SIGNAL:BOTH_DIRECTIONS');
    return { classification: KarmaClassification.MIXED, confidence: 0.6 };
  }
  if (repair > 0) {
    return { classification: KarmaClassification.CONSTRUCTIVE, confidence: 0.8 };
  }
  if (constructive > 0) {
    // Two independent markers read more firmly than one, but never certainly -
    // Step 17 section 40 forbids implying precision we do not have.
    return {
      classification: KarmaClassification.CONSTRUCTIVE,
      confidence: constructive >= 2 ? 0.85 : 0.78,
    };
  }
  if (unconstructive > 0) {
    // Deliberately below autoConfirmConfidence, so the user is always asked
    // before this label settles (Step 17 sections 14, 54, 55).
    return {
      classification: KarmaClassification.UNCONSTRUCTIVE,
      confidence: 0.55,
    };
  }
  evidence.push('SIGNAL:INSUFFICIENT_CONTEXT');
  return { classification: KarmaClassification.UNCERTAIN, confidence: 0.3 };
}

function countMatches(patterns: readonly RegExp[], text: string): number {
  return patterns.reduce(
    (total, pattern) => (pattern.test(text) ? total + 1 : total),
    0,
  );
}

/**
 * First-person descriptions of constructive action.
 *
 * Anchored on verbs rather than nouns: "help" as a noun ("I need help") is not
 * an action the user took, and scoring it would be exactly the "every click
 * earns karma" anti-pattern of Step 17 section 108.
 */
const CONSTRUCTIVE_SIGNALS: readonly RegExp[] = [
  /\b(helped|assisted|supported|mentored|taught|tutored|guided)\b/,
  /\b(volunteered|donated my time|gave my time|fed (the )?(stray|strays|animals))\b/,
  /\b(completed|finished|submitted|delivered|sent off|handed in)\b/,
  /\b(followed through|kept my (word|promise|commitment)|showed up)\b/,
  /\b(prepared|revised|studied|practised|practiced|trained|exercised)\b/,
  /\b(reviewed|reconciled|budgeted|paid off|paid back|saved)\b/,
  /\b(listened|checked in on|thanked|appreciated|encouraged)\b/,
  /\b(spoke to|called|reached out to|had the conversation)\b/,
  /\b(paused before|held back from) (react|respond)/,
];

/**
 * First-person descriptions of something the user themselves regretted.
 *
 * Every pattern requires the user to be the subject. "He shouted at me" is not
 * the user's action, and reading it as one would turn a description of being
 * harmed into a mark against the person harmed.
 */
const UNCONSTRUCTIVE_SIGNALS: readonly RegExp[] = [
  /\bi (lost my temper|shouted|yelled|snapped)\b/,
  /\bi (lied|misled|hid the truth)\b/,
  /\bi (broke my (word|promise)|let (them|him|her) down)\b/,
  /\bi (was|got) (harsh|rude|dismissive|unfair)\b/,
  /\bi (avoided|put off|postponed) (it|the|this|that)\b/,
  /\bi should not have\b/,
  /\bi (hurt|upset) (him|her|them|someone)\b/,
];

/** Step 17 section 33: repair is recognised as its own constructive act. */
const REPAIR_SIGNALS: readonly RegExp[] = [
  /\b(apologi[sz]ed|said sorry|made amends|put it right|made it right)\b/,
  /\b(owned up|took responsibility|admitted)\b/,
];

const CATEGORY_SIGNALS: readonly {
  category: KarmaCategory;
  patterns: readonly RegExp[];
}[] = [
  {
    category: KarmaCategory.SERVICE,
    patterns: [
      /\b(helped|assisted|mentored|taught|tutored|volunteered|donated my time|fed (the )?(stray|strays|animals))\b/,
    ],
  },
  {
    category: KarmaCategory.CAREER,
    patterns: [/\b(cv|resume|interview|job|role|manager|client|colleague|work)\b/],
  },
  {
    category: KarmaCategory.FINANCIAL_RESPONSIBILITY,
    patterns: [/\b(budget|loan|bank|savings|invest|bill|debt|repayment|finances)\b/],
  },
  {
    category: KarmaCategory.LEARNING,
    patterns: [/\b(studied|revision|revised|exam|course|mock|learn|read a)\b/],
  },
  {
    category: KarmaCategory.HEALTH_SUPPORT,
    patterns: [/\b(exercised|walked|slept|doctor|appointment|physio|checkup)\b/],
  },
  {
    category: KarmaCategory.FAMILY,
    patterns: [/\b(parents|mother|father|mum|dad|son|daughter|sibling|brother|sister)\b/],
  },
  {
    category: KarmaCategory.RELATIONSHIP,
    patterns: [/\b(wife|husband|partner|spouse|friend|relationship)\b/],
  },
  {
    category: KarmaCategory.COMMUNICATION,
    patterns: [/\b(conversation|talked|spoke|call|message|explained|listened)\b/],
  },
  {
    category: KarmaCategory.MINDFULNESS,
    patterns: [/\b(breathing|meditat|grounding|journal|paused|reflected)\b/],
  },
  {
    category: KarmaCategory.SELF_DISCIPLINE,
    patterns: [/\b(routine|habit|discipline|stuck to|on time|woke up early)\b/],
  },
  {
    category: KarmaCategory.COURAGE,
    patterns: [/\b(difficult|had been avoiding|finally|nervous|afraid but)\b/],
  },
];

function detectCategory(
  text: string,
  isRepair: boolean,
  evidence: string[],
): KarmaCategory {
  if (isRepair) {
    evidence.push('CATEGORY:REPAIR');
    return KarmaCategory.REPAIR;
  }
  for (const entry of CATEGORY_SIGNALS) {
    if (countMatches(entry.patterns, text) > 0) {
      evidence.push(`CATEGORY:${entry.category}`);
      return entry.category;
    }
  }
  return KarmaCategory.OTHER;
}

function detectIntent(
  text: string,
  category: KarmaCategory,
  isRepair: boolean,
): KarmaIntent {
  if (isRepair) return KarmaIntent.REPAIR;
  if (/\b(had been avoiding|finally|followed through|kept my)\b/.test(text)) {
    return KarmaIntent.FOLLOW_THROUGH;
  }
  if (category === KarmaCategory.SERVICE) return KarmaIntent.SUPPORT;
  if (
    category === KarmaCategory.RESPONSIBILITY ||
    category === KarmaCategory.FINANCIAL_RESPONSIBILITY
  ) {
    return KarmaIntent.RESPONSIBILITY;
  }
  if (
    category === KarmaCategory.LEARNING ||
    category === KarmaCategory.MINDFULNESS
  ) {
    return KarmaIntent.GROWTH;
  }
  return KarmaIntent.UNKNOWN;
}

function detectImpactScope(text: string): KarmaImpactScope {
  if (/\b(colleague|client|team|manager|boss|customer)\b/.test(text)) {
    return KarmaImpactScope.WORK;
  }
  if (/\b(parents|mother|father|mum|dad|family|son|daughter|wife|husband)\b/.test(text)) {
    return KarmaImpactScope.FAMILY;
  }
  if (/\b(neighbour|neighbor|community|stranger|strays?|someone)\b/.test(text)) {
    return KarmaImpactScope.COMMUNITY;
  }
  if (/\b(friend|him|her|them|classmate)\b/.test(text)) {
    return KarmaImpactScope.OTHER_PERSON;
  }
  return KarmaImpactScope.SELF;
}

/** Step 17 section 65: some one-time actions reasonably carry more weight. */
function detectEffort(text: string, evidence: string[]): KarmaEffort {
  if (
    /\b(difficult|hard|had been avoiding|finally|for hours|all day|dreading|put it off for)\b/.test(
      text,
    )
  ) {
    evidence.push('EFFORT:HIGH_MARKER');
    return KarmaEffort.HIGH;
  }
  if (/\b(quick|quickly|briefly|a minute|small|just)\b/.test(text)) {
    evidence.push('EFFORT:LOW_MARKER');
    return KarmaEffort.LOW;
  }
  return KarmaEffort.MEDIUM;
}
