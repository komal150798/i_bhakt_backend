import { FutureSelfMode, FutureSelfViolation, MODE_MAX_SUMMARY_CHARS } from '../enums/future-self.enum';

/**
 * THE FUTURE SELF BOUNDARY.
 *
 * Roadmap section 71:
 *
 *     Never invent:
 *       future employer
 *       future partner
 *       future salary
 *       guaranteed outcome
 *
 * This file is that rule as executable output validation, not as prompt
 * wording. The distinction is the whole point. A prompt is a request; a model
 * that ignores it produces output that still reaches the user. Step 19 section
 * 51 and Step 21 section 69 make the same argument for safety - "critical
 * deterministic safety rules should also exist outside AI-only classification",
 * and a model asked to grade its own output is not a control. Step 18 section
 * 85 puts the decision on the software side: the model proposes, ZUNO decides.
 *
 * So the prompt asks, and this refuses. Anything failing here is discarded: not
 * softened, not regenerated silently into the response, not persisted.
 *
 * ================================================================
 * HOW INVENTION IS DETECTED
 * ================================================================
 *
 * Two independent mechanisms, because they catch different failures.
 *
 * (1) GROUNDING SET MEMBERSHIP - catches invented *things*.
 *
 *     Before the model is called, the service builds a GroundingSet from the
 *     only sources Step 18 section 38 permits a narrative statement to rest on:
 *     stored memory statements, the challenge's own text, completed actions,
 *     plan item titles and confirmed life signals. That produces a vocabulary
 *     of every word ZUNO can actually justify using.
 *
 *     The narrative is then scanned for proper nouns and for monetary figures.
 *     Any of either that does not appear in the grounding vocabulary is, by
 *     definition, something the model brought with it rather than something the
 *     user's history contains. "You will be at Infosys by March" fails not
 *     because a pattern matched the word Infosys, but because Infosys appears
 *     nowhere in this person's record.
 *
 *     This is what makes the check robust to paraphrase. A blocklist of
 *     employer names would be endless and would still miss the next one; a
 *     grounding set has the opposite property - it does not need to know what
 *     an employer is called to know that ZUNO has never heard of it.
 *
 *     The surrounding words then classify the miss, so the violation reported
 *     is INVENTED_EMPLOYER rather than a generic one: a miss after "at", "join",
 *     "offer from" is employer-shaped; a miss after "marry", "partner", "your
 *     wife" is partner-shaped; an ungrounded money figure is salary-shaped.
 *
 * (2) CERTAINTY CONSTRUCTIONS - catches invented *certainty*.
 *
 *     A guaranteed outcome needs no proper noun: "everything works out" invents
 *     nothing nameable and is still exactly what Step 18 section 40 prohibits.
 *     These are deterministic linguistic patterns over future-tense assurance,
 *     claimed knowledge of the future, mystical causation (section 42),
 *     unevidenced emotional growth (section 107 / Golden Test) and fixed
 *     identity labels (sections 68 and 117).
 *
 * Both run on every generation. Neither can be satisfied by the other.
 *
 * ================================================================
 * FALSE POSITIVES
 * ================================================================
 *
 * A false positive costs one refused narrative. A false negative tells a person
 * with a home loan and a layoff rumour that their job is safe. The checks are
 * tuned accordingly, and `COMMON_CAPITALISED` exists only to stop ordinary
 * sentence-initial words being read as proper nouns - it is not a way to let
 * entities through.
 */

export interface GroundingSet {
  /** Every word appearing in a permitted source, lowercased. */
  terms: ReadonlySet<string>;
  /** Monetary figures that actually appear in the user's own record. */
  figures: ReadonlySet<string>;
  /** `EntityType:id` pairs the narrative is allowed to cite. */
  sourceRefs: ReadonlySet<string>;
}

export interface GroundingSource {
  entityType: string;
  entityId: string;
  /** The grounded text this source contributes. */
  text: string;
}

/**
 * Builds the vocabulary a narrative is allowed to draw on.
 *
 * Only pass sources that are stored, user-supplied or system-confirmed. Passing
 * the model's own previous output would make the set self-certifying, and the
 * boundary would validate whatever it had already accepted once.
 */
export function buildGroundingSet(sources: GroundingSource[]): GroundingSet {
  const terms = new Set<string>();
  const figures = new Set<string>();
  const sourceRefs = new Set<string>();

  for (const source of sources) {
    sourceRefs.add(`${source.entityType}:${source.entityId}`);
    for (const token of tokenise(source.text)) terms.add(token);
    for (const figure of extractFigures(source.text)) {
      figures.add(normaliseFigure(figure));
    }
  }

  return { terms, figures, sourceRefs };
}

export interface BoundaryCheckInput {
  mode: FutureSelfMode;
  /** The full user-facing text: summary plus every list item. */
  candidateText: string;
  /** Just the summary, for the per-mode length ceiling. */
  summary: string;
  grounding: GroundingSet;
  /** `EntityType:id` pairs the model claimed as sources. */
  claimedSourceRefs?: readonly string[];
}

export interface BoundaryCheckResult {
  allowed: boolean;
  violations: FutureSelfViolation[];
  /**
   * The specific fragments that failed, for developer diagnostics and tests.
   * Callers must not log these - they are drawn from a private narrative about
   * the user (Build Rule 34, Step 24 section 43).
   */
  offending: string[];
}

/**
 * The gate. Returns every violation rather than stopping at the first, so a
 * developer sees the whole problem and a quality metric can count categories
 * (Step 18 section 83, "unsupported claim rate").
 */
export function checkFutureSelfBoundary(
  input: BoundaryCheckInput,
): BoundaryCheckResult {
  const violations = new Set<FutureSelfViolation>();
  const offending: string[] = [];
  const text = input.candidateText ?? '';
  const lower = text.toLowerCase();

  const flag = (violation: FutureSelfViolation, fragment: string): void => {
    violations.add(violation);
    if (offending.length < 20) offending.push(fragment);
  };

  // -----------------------------------------------------------------
  // (2a) Guaranteed outcomes. Step 18 section 40, roadmap section 71.
  // -----------------------------------------------------------------
  for (const pattern of GUARANTEE_PATTERNS) {
    const match = lower.match(pattern);
    if (match) flag(FutureSelfViolation.GUARANTEED_OUTCOME, match[0]);
  }

  // -----------------------------------------------------------------
  // (2b) Claimed literal knowledge of the future.
  // Step 18 sections 5, 40 and 112 - "I am you in December 2026".
  // -----------------------------------------------------------------
  for (const pattern of FUTURE_KNOWLEDGE_PATTERNS) {
    const match = lower.match(pattern);
    if (match) flag(FutureSelfViolation.LITERAL_FUTURE_KNOWLEDGE, match[0]);
  }

  // -----------------------------------------------------------------
  // (2c) Mystical causation. Step 18 sections 41-42.
  // -----------------------------------------------------------------
  for (const pattern of MYSTICAL_PATTERNS) {
    const match = lower.match(pattern);
    if (match) flag(FutureSelfViolation.MYSTICAL_CAUSATION, match[0]);
  }

  // -----------------------------------------------------------------
  // (2d) Unevidenced emotional growth. Step 18 section 107.
  // Allowed only when the growth word itself appears in the grounding set,
  // i.e. the user said it about themselves.
  // -----------------------------------------------------------------
  for (const pattern of EMOTIONAL_CLAIM_PATTERNS) {
    const match = lower.match(pattern);
    if (!match) continue;
    const claimWord = match[match.length - 1] ?? match[0];
    if (!input.grounding.terms.has(claimWord.toLowerCase())) {
      flag(FutureSelfViolation.UNGROUNDED_EMOTIONAL_CLAIM, match[0]);
    }
  }

  // -----------------------------------------------------------------
  // (2e) Identity labels. Step 18 sections 68 and 117.
  // -----------------------------------------------------------------
  for (const pattern of IDENTITY_LABEL_PATTERNS) {
    const match = lower.match(pattern);
    if (match) flag(FutureSelfViolation.IDENTITY_LABEL, match[0]);
  }

  // -----------------------------------------------------------------
  // (1a) Ungrounded monetary figures -> invented salary.
  //
  // Any figure ZUNO cannot point at a source for is refused, whether or not it
  // sits next to the word "salary". A Future Self that quotes a number nobody
  // gave it is inventing regardless of the noun it attaches to.
  // -----------------------------------------------------------------
  for (const figure of extractFigures(text)) {
    if (!input.grounding.figures.has(normaliseFigure(figure))) {
      flag(FutureSelfViolation.INVENTED_SALARY, figure);
    }
  }

  // -----------------------------------------------------------------
  // (1b) Ungrounded proper nouns -> invented employer / partner / entity.
  // -----------------------------------------------------------------
  for (const candidate of extractProperNouns(text)) {
    if (isGroundedPhrase(candidate.phrase, input.grounding)) continue;
    const kind = classifyEntity(text, candidate.index, candidate.phrase);
    flag(kind, candidate.phrase);
  }

  // -----------------------------------------------------------------
  // Claimed sources must be sources we actually supplied.
  // Step 18 section 38: every statement traceable to stored facts.
  // -----------------------------------------------------------------
  for (const ref of input.claimedSourceRefs ?? []) {
    if (!input.grounding.sourceRefs.has(ref)) {
      flag(FutureSelfViolation.UNVERIFIABLE_SOURCE, ref);
    }
  }

  // -----------------------------------------------------------------
  // Mode length ceiling. Step 18 section 72.
  // -----------------------------------------------------------------
  const ceiling = MODE_MAX_SUMMARY_CHARS[input.mode] ?? 900;
  if ((input.summary ?? '').length > ceiling) {
    flag(
      FutureSelfViolation.MODE_LENGTH_EXCEEDED,
      `${input.summary.length}>${ceiling}`,
    );
  }

  return {
    allowed: violations.size === 0,
    violations: Array.from(violations),
    offending,
  };
}

// ===========================================================================
// Entity extraction
// ===========================================================================

interface ProperNounCandidate {
  phrase: string;
  index: number;
}

/**
 * Pulls capitalised runs out of the text as proper-noun candidates.
 *
 * Sentence-initial words are the awkward case: "Since you clarified the loan"
 * starts with a capital and is not a name. They are admitted as candidates only
 * when they are not ordinary English words, because the alternative - skipping
 * sentence-initial tokens entirely - would let "Infosys will call you next
 * week." through as the first word of a sentence.
 */
export function extractProperNouns(text: string): ProperNounCandidate[] {
  const candidates: ProperNounCandidate[] = [];
  const pattern = /\b([A-Z][A-Za-z'&.-]*(?:\s+[A-Z][A-Za-z'&.-]*)*)\b/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const phrase = match[1].trim();
    if (phrase.length < 2) continue;

    const words = phrase.split(/\s+/).filter((word) => word.length > 1);
    if (words.length === 0) continue;

    // Drop runs made entirely of ordinary words - "Since", "We", "This Week".
    const meaningful = words.filter(
      (word) => !COMMON_CAPITALISED.has(word.toLowerCase().replace(/[.'&-]/g, '')),
    );
    if (meaningful.length === 0) continue;

    candidates.push({ phrase: meaningful.join(' '), index: match.index });
  }
  return candidates;
}

/** A phrase is grounded when every one of its words is. */
function isGroundedPhrase(phrase: string, grounding: GroundingSet): boolean {
  const words = tokenise(phrase);
  if (words.length === 0) return true;
  return words.every((word) => grounding.terms.has(word));
}

/**
 * Decides which section 71 category an ungrounded entity falls into, from the
 * 40 characters of text preceding it.
 *
 * The window is short on purpose: "at", "join", "marry" bind tightly to what
 * follows them, and a wider window would start matching an employer verb from a
 * previous clause.
 */
function classifyEntity(
  text: string,
  index: number,
  phrase: string,
): FutureSelfViolation {
  const before = text.slice(Math.max(0, index - 40), index).toLowerCase();
  const after = text
    .slice(index + phrase.length, index + phrase.length + 40)
    .toLowerCase();

  if (EMPLOYER_CONTEXT.test(before) || EMPLOYER_SUFFIX.test(after)) {
    return FutureSelfViolation.INVENTED_EMPLOYER;
  }
  if (PARTNER_CONTEXT.test(before) || PARTNER_SUFFIX.test(after)) {
    return FutureSelfViolation.INVENTED_PARTNER;
  }
  return FutureSelfViolation.UNGROUNDED_ENTITY;
}

/** Currency amounts and pay-shaped numbers. */
export function extractFigures(text: string): string[] {
  const found: string[] = [];
  for (const pattern of FIGURE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) found.push(...matches);
  }
  return found;
}

function normaliseFigure(figure: string): string {
  return figure.toLowerCase().replace(/[\s,]/g, '');
}

function tokenise(text: string): string[] {
  return (text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9'&]+/)
    .map((token) => token.replace(/^'+|'+$/g, ''))
    .filter((token) => token.length > 1);
}

// ===========================================================================
// Pattern vocabulary
// ===========================================================================

const FIGURE_PATTERNS: RegExp[] = [
  // AED 25,000 / $120k / ₹18 lakh / Rs. 90,000
  /(?:AED|USD|INR|SAR|GBP|EUR|Rs\.?|₹|\$|£|€)\s?\d[\d,]*(?:\.\d+)?\s?(?:k|lakh|lakhs|crore|cr|million|mn|m|bn)?/gi,
  // 18 lakh / 25k / 12 LPA
  /\b\d[\d,]*(?:\.\d+)?\s?(?:k|lakh|lakhs|crore|cr|lpa|million)\b/gi,
  // 90,000 per month
  /\b\d[\d,]{2,}(?:\.\d+)?\s?(?:per|a|each)\s?(?:month|year|annum|week)\b/gi,
  // a 30% raise
  /\b\d{1,3}\s?%\s?(?:raise|increase|hike|increment)\b/gi,
];

// Step 18 section 40 and roadmap section 71.
const GUARANTEE_PATTERNS: RegExp[] = [
  /\b(?:you|we)\s+will\s+(?:definitely|certainly|surely|absolutely|for sure)\b/,
  /\b(?:you|we)\s+(?:are|'re)\s+going\s+to\s+(?:get|land|receive|keep|secure|win)\b/,
  /\b(?:you|we)\s+will\s+(?:get|land|receive|secure|be\s+offered|be\s+given|keep|win)\s+(?:the|a|an|your|another)\s+\w+/,
  /\bis\s+guaranteed\b/,
  /\bi\s+guarantee\b/,
  /\bguaranteed\s+to\s+(?:happen|work|succeed|come\s+through)\b/,
  /\bthere\s+is\s+no\s+doubt\s+(?:that\s+)?(?:you|we)\b/,
  /\bwithout\s+(?:a\s+)?doubt,?\s+(?:you|we)\b/,
  /\beverything\s+(?:will\s+)?(?:works?|work)\s+out\b/,
  /\bit\s+(?:will\s+)?all\s+works?\s+out\b/,
  /\btrust\s+me\b/,
  /\bi\s+(?:can\s+)?promise\s+(?:you|that|this)\b/,
  /\brest\s+assured\b/,
  /\byour\s+job\s+is\s+safe\b/,
  /\byou\s+(?:are|'re)\s+not\s+going\s+to\s+(?:lose|be\s+laid\s+off)\b/,
  /\bby\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+(?:you|we)\s+will\s+(?:have|be)\b/,
];

// Step 18 sections 5, 40, 112.
const FUTURE_KNOWLEDGE_PATTERNS: RegExp[] = [
  /\bi\s+(?:am|'m)\s+(?:you|your\s+\w+)\s+(?:from|in)\s+(?:the\s+future|\w+\s+\d{4}|\d{4})\b/,
  /\bi\s+(?:am|'m)\s+speaking\s+to\s+you\s+from\s+(?:the\s+future|\d{4})\b/,
  /\bi\s+(?:have\s+)?seen\s+your\s+future\b/,
  /\bi\s+know\s+(?:exactly\s+)?(?:what\s+happens|how\s+this\s+ends|what\s+will\s+happen)\b/,
  /\bi\s+know\s+that\s+you\s+will\b/,
  /\bhaving\s+lived\s+(?:through\s+)?(?:this|your\s+future)\b/,
  /\bfrom\s+where\s+i\s+(?:am|stand)\s+in\s+\d{4}\b/,
  /\bi\s+remember\s+how\s+this\s+turns\s+out\b/,
];

// Step 18 sections 41-42.
const MYSTICAL_PATTERNS: RegExp[] = [
  /\bbecause\s+(?:your|our)\s+(?:karma|chart|planets?|stars?|dasha|transit)\b/,
  /\b(?:your|our)\s+(?:karma|cosmic\s+\w+)\s+(?:has\s+)?(?:improved|changed|shifted)\b/,
  /\bthe\s+(?:planets?|stars?|universe)\s+(?:will\s+)?(?:bring|give|protect|reward|favour|favor)\b/,
  /\b(?:destiny|fate)\s+(?:will|has)\s+\w+/,
  /\b(?:this|it)\s+is\s+(?:written|meant\s+to\s+be|your\s+destiny)\b/,
];

// Step 18 section 107 - the capture group is the claimed quality.
const EMOTIONAL_CLAIM_PATTERNS: RegExp[] = [
  /\b(?:you|we)\s+(?:are|'re|have\s+become|became)\s+(?:so\s+|much\s+|far\s+|clearly\s+|a\s+lot\s+)?(calmer|calm|stronger|happier|healed|transformed|fearless|confident|resilient|peaceful)\b/,
  /\b(?:you|we)\s+(?:have\s+)?(?:grown|matured)\s+(?:so\s+much|a\s+lot|enormously)\b/,
];

// Step 18 sections 68 and 117.
const IDENTITY_LABEL_PATTERNS: RegExp[] = [
  /\byou\s+(?:always|never)\s+\w+/,
  /\byou\s+are\s+(?:a|an)\s+(?:procrastinator|avoider|perfectionist|pessimist|quitter|overthinker|worrier)\b/,
  /\byou\s+are\s+the\s+(?:kind|type)\s+of\s+person\s+who\b/,
  /\bthat\s+is\s+(?:just\s+)?who\s+you\s+are\b/,
];

const EMPLOYER_CONTEXT =
  /\b(?:at|join|joining|joined|offer\s+from|offers?\s+at|work(?:ing)?\s+(?:for|at|with)|hired\s+by|recruited\s+by|role\s+at|position\s+at|job\s+at|interview\s+(?:with|at)|company\s+called|employer|move\s+to|land\s+(?:a\s+)?(?:job|role)\s+at)\s+$/;

const EMPLOYER_SUFFIX =
  /^\s*(?:will\s+(?:hire|offer|call|reach\s+out)|is\s+hiring|has\s+an\s+opening|are\s+hiring)\b/;

const PARTNER_CONTEXT =
  /\b(?:marry|marrying|married\s+to|engaged\s+to|partner(?:\s+called)?|wife|husband|fianc[ée]e?|spouse|dating|meet(?:ing)?\s+someone\s+(?:called|named))\s+$/;

const PARTNER_SUFFIX =
  /^\s*(?:will\s+(?:be\s+)?(?:your|the)\s+(?:wife|husband|partner)|is\s+(?:your|the)\s+(?:wife|husband|partner))\b/;

/**
 * Ordinary words that carry a capital for reasons other than being a name:
 * sentence starts, pronouns, weekdays, months and the product's own nouns.
 *
 * Kept to genuinely common vocabulary. It must never grow to contain nouns that
 * could name an employer, a person or a place - that would be a hole in the
 * boundary rather than a convenience.
 */
const COMMON_CAPITALISED: ReadonlySet<string> = new Set([
  // pronouns and determiners
  'i', 'we', 'our', 'ours', 'us', 'you', 'your', 'yours', 'it', 'its', 'they',
  'them', 'their', 'this', 'that', 'these', 'those', 'a', 'an', 'the', 'my',
  // frequent sentence openers and connectives
  'and', 'but', 'or', 'so', 'if', 'as', 'at', 'by', 'for', 'from', 'in', 'into',
  'of', 'on', 'to', 'with', 'without', 'when', 'where', 'while', 'since',
  'because', 'although', 'though', 'after', 'before', 'until', 'unless',
  'however', 'still', 'then', 'there', 'here', 'now', 'today', 'tomorrow',
  'yesterday', 'once', 'again', 'also', 'even', 'just', 'only', 'not', 'no',
  'yes', 'both', 'each', 'every', 'either', 'neither', 'some', 'any', 'all',
  'more', 'most', 'less', 'least', 'much', 'many', 'few', 'one', 'two', 'three',
  'first', 'second', 'third', 'next', 'last', 'other', 'another', 'same',
  'what', 'which', 'who', 'whom', 'whose', 'why', 'how',
  // frequent verbs at sentence start
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'can', 'could', 'will', 'would', 'shall', 'should',
  'may', 'might', 'must', 'let', 'keep', 'keeping', 'kept', 'make', 'making',
  'take', 'taking', 'get', 'getting', 'go', 'going', 'come', 'coming', 'see',
  'seeing', 'know', 'knowing', 'think', 'thinking', 'look', 'looking', 'want',
  'need', 'try', 'trying', 'start', 'starting', 'stay', 'staying', 'move',
  'work', 'working', 'put', 'give', 'giving', 'find', 'finding', 'use',
  'using', 'ask', 'asking', 'tell', 'telling', 'say', 'saying', 'feel',
  'feeling', 'seem', 'become', 'becoming', 'remain', 'remaining',
  // weekdays and months - dates, not names
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  // product vocabulary the narrative legitimately uses
  'zuno', 'whatnow', 'plan', 'memory', 'future', 'self', 'option', 'step',
  'week', 'weekly', 'daily', 'month', 'monthly', 'year', 'progress',
]);
