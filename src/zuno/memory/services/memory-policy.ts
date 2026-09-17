import {
  MemoryEvidenceType,
  MemoryFactuality,
  MemoryRejectionReason,
  MemoryRetentionClass,
  MemorySensitivity,
  MemorySource,
  MemoryType,
} from '../enums/memory.enum';

/**
 * The deterministic memory-write policy.
 *
 * Step 18 section 85 draws the line this module implements: an AI layer may
 * propose what matters, but retention, sensitivity, provenance, worthiness and
 * confirmation are decided here, in code, by rules that can be read and tested.
 *
 * Kept as pure functions rather than methods so the whole policy is testable
 * without a database, a model or a Nest container.
 */

export interface WorthinessInput {
  type: MemoryType;
  statement: string;
  evidenceType: MemoryEvidenceType;
  confidence: number;
  factuality: MemoryFactuality;
  /** Distinct evidence rows already backing this, for PATTERN. */
  evidenceCount?: number;
}

export type WorthinessVerdict =
  | { worth: true }
  | { worth: false; reason: MemoryRejectionReason };

/**
 * Explicit type guard.
 *
 * This project compiles with `strictNullChecks: false`, under which TypeScript
 * does not reliably narrow a discriminated union from `if (!verdict.worth)`.
 * The AI gateway carries the same guard (`isSchemaValid`) for the same reason -
 * narrowing correctly here without changing the compiler settings for every
 * existing module (Build Rule 152).
 */
export function isUnworthy(
  verdict: WorthinessVerdict,
): verdict is { worth: false; reason: MemoryRejectionReason } {
  return verdict.worth === false;
}

/**
 * Step 18 section 57 (worthiness test), 58 (avoid trivial memory), 69 (no
 * personality diagnosis), 70 (no sensitive attribute guessing), 106 (a single
 * event is not a pattern).
 *
 * Rule 1 is the headline: do not persist every conversation message as durable
 * memory. Golden test 105 - the user says "Okay." - has to produce nothing, and
 * it has to produce nothing because of a rule, not because a model felt it was
 * unimportant that day.
 */
export function assessWorthiness(input: WorthinessInput): WorthinessVerdict {
  const statement = (input.statement ?? '').trim();

  // Step 18 section 58 and Golden Test 105.
  if (statement.length < 8) {
    return { worth: false, reason: MemoryRejectionReason.TRIVIAL };
  }
  if (TRIVIAL_STATEMENT.test(statement)) {
    return { worth: false, reason: MemoryRejectionReason.TRIVIAL };
  }
  if (UI_TELEMETRY.test(statement)) {
    return { worth: false, reason: MemoryRejectionReason.NOT_WORTH_REMEMBERING };
  }

  // Step 18 section 69 / Rule 7 adjacent: behavioural observation must never
  // become a clinical or personality label.
  if (PERSONALITY_DIAGNOSIS.test(statement)) {
    return { worth: false, reason: MemoryRejectionReason.PERSONALITY_DIAGNOSIS };
  }

  // Step 18 section 70 / Rule 7: do not infer religion, politics, orientation
  // or medical diagnosis from indirect behaviour. An EXPLICIT statement the
  // user chose to make is different in kind from an inference, and is handled
  // by the sensitivity classifier instead of being refused here.
  if (
    input.evidenceType !== MemoryEvidenceType.EXPLICIT &&
    SENSITIVE_ATTRIBUTE.test(statement)
  ) {
    return {
      worth: false,
      reason: MemoryRejectionReason.SENSITIVE_ATTRIBUTE_INFERENCE,
    };
  }

  // Step 18 Rule 5 / section 47 / Golden Test 108: a prediction may be stored
  // as FORECAST_CONTEXT, never as a fact.
  if (
    input.factuality === MemoryFactuality.FACT &&
    PREDICTION_LANGUAGE.test(statement)
  ) {
    return { worth: false, reason: MemoryRejectionReason.PREDICTION_AS_FACT };
  }

  // Step 18 Rule 4 / sections 45 and 115 / Golden Test 103.
  if (
    input.factuality === MemoryFactuality.FACT &&
    HYPOTHETICAL_LANGUAGE.test(statement)
  ) {
    return { worth: false, reason: MemoryRejectionReason.HYPOTHETICAL_AS_FACT };
  }

  // Step 18 sections 18 and 106: a pattern needs repeated evidence. One
  // deferral is not an avoidance pattern, and section 68 warns that patterns
  // must stay observations rather than becoming identities.
  if (input.type === MemoryType.PATTERN) {
    if ((input.evidenceCount ?? 0) < MIN_PATTERN_EVIDENCE) {
      return {
        worth: false,
        reason: MemoryRejectionReason.INSUFFICIENT_PATTERN_EVIDENCE,
      };
    }
  }

  return { worth: true };
}

/** Step 18 section 18: a behavioural pattern needs at least this much evidence. */
export const MIN_PATTERN_EVIDENCE = 3;

/**
 * Confidence at or above which an inference is allowed to become durable
 * without asking. Step 18 section 24: do not present inferred preferences as
 * facts without sufficient confidence.
 */
export const INFERENCE_AUTO_ACCEPT_CONFIDENCE = 0.85;

export type ConfirmationReason =
  | 'LOW_CONFIDENCE_INFERENCE'
  | 'SENSITIVE_CLASSIFICATION'
  | 'CONTRADICTS_ACTIVE_MEMORY'
  | 'DERIVED_PATTERN';

/**
 * Step 18 sections 24, 30 and 50, and roadmap section 68's "confirmation where
 * the spec requires it".
 *
 * The four cases where ZUNO asks instead of assuming. Everything else - an
 * explicit statement, a confirmed structured event - becomes durable at once,
 * because forcing a confirmation dialogue on "I prefer short answers" would
 * make the memory system feel like paperwork (section 51).
 */
export function confirmationRequirement(input: {
  evidenceType: MemoryEvidenceType;
  confidence: number;
  sensitivity: MemorySensitivity;
  type: MemoryType;
  conflictsWithActive: boolean;
  source: MemorySource;
}): ConfirmationReason | null {
  // Step 18 section 30: on contradiction, resolve or ask. A current explicit
  // user correction resolves it by authority and never needs to ask; anything
  // weaker does.
  if (input.conflictsWithActive && input.source !== MemorySource.USER_CORRECTION) {
    if (input.source !== MemorySource.USER_EXPLICIT) {
      return 'CONTRADICTS_ACTIVE_MEMORY';
    }
  }

  if (input.sensitivity !== MemorySensitivity.STANDARD) {
    return 'SENSITIVE_CLASSIFICATION';
  }

  if (
    input.evidenceType === MemoryEvidenceType.INFERRED &&
    input.confidence < INFERENCE_AUTO_ACCEPT_CONFIDENCE
  ) {
    return 'LOW_CONFIDENCE_INFERENCE';
  }

  if (
    input.evidenceType === MemoryEvidenceType.DERIVED &&
    input.type === MemoryType.PATTERN
  ) {
    return 'DERIVED_PATTERN';
  }

  return null;
}

/**
 * Sensitivity classification. Step 18 sections 49-50, Step 24 section 39.
 *
 * Errs upward on purpose. A memory wrongly marked SENSITIVE is retrieved less
 * often than it could be; a memory wrongly marked STANDARD is put into prompts
 * and notifications it should never have reached.
 */
export function classifySensitivity(
  type: MemoryType,
  statement: string,
): MemorySensitivity {
  const text = (statement ?? '').toLowerCase();

  // Step 18 section 49: birth details are special-category data and must not be
  // casually surfaced in prompts, notifications or summaries.
  if (BIRTH_DETAIL.test(text)) return MemorySensitivity.RESTRICTED;
  if (SENSITIVE_ATTRIBUTE.test(text)) return MemorySensitivity.RESTRICTED;

  // Step 18 sections 101-102: relationship and financial detail need stronger
  // controls than a guidance-style preference.
  if (SENSITIVE_CONTENT.test(text)) return MemorySensitivity.SENSITIVE;

  if (type === MemoryType.ASTRO_CONTEXT_REFERENCE) {
    return MemorySensitivity.SENSITIVE;
  }

  return MemorySensitivity.STANDARD;
}

/**
 * Default retention per memory type. Step 18 sections 26-28.
 *
 * Section 27 is the principle: do not store information longer merely because
 * storage is technically possible. So TEMPORARY_CONTEXT is SHORT_TERM and gets
 * a clock, while a stated preference is UNTIL_SUPERSEDED - it stops being true
 * when the user says otherwise, not on a date.
 */
export function defaultRetention(
  type: MemoryType,
  factuality: MemoryFactuality,
): MemoryRetentionClass {
  if (factuality === MemoryFactuality.HYPOTHETICAL) {
    return MemoryRetentionClass.SHORT_TERM;
  }
  if (factuality === MemoryFactuality.FORECAST_CONTEXT) {
    return MemoryRetentionClass.SHORT_TERM;
  }

  switch (type) {
    case MemoryType.TEMPORARY_CONTEXT:
      return MemoryRetentionClass.SHORT_TERM;
    case MemoryType.PROFILE:
    case MemoryType.PREFERENCE:
      return MemoryRetentionClass.UNTIL_SUPERSEDED;
    case MemoryType.GOAL:
    case MemoryType.DECISION:
    case MemoryType.CONSTRAINT:
    case MemoryType.USER_CORRECTION:
      return MemoryRetentionClass.UNTIL_SUPERSEDED;
    case MemoryType.CHALLENGE:
    case MemoryType.COMMITMENT:
    case MemoryType.PLAN_CONTEXT:
    case MemoryType.PROGRESS:
      return MemoryRetentionClass.CHALLENGE_LIFETIME;
    case MemoryType.LIFE_EVENT:
    case MemoryType.PATTERN:
    case MemoryType.FUTURE_SELF_NARRATIVE:
      return MemoryRetentionClass.LONG_TERM;
    case MemoryType.ASTRO_CONTEXT_REFERENCE:
      return MemoryRetentionClass.CHALLENGE_LIFETIME;
    default:
      return MemoryRetentionClass.SHORT_TERM;
  }
}

/** Days after which a retention class expires, or null for no clock. */
export function defaultExpiryDays(
  retention: MemoryRetentionClass,
): number | null {
  switch (retention) {
    case MemoryRetentionClass.SESSION:
      return 1;
    case MemoryRetentionClass.SHORT_TERM:
      return 14;
    case MemoryRetentionClass.CHALLENGE_LIFETIME:
    case MemoryRetentionClass.LONG_TERM:
    case MemoryRetentionClass.UNTIL_SUPERSEDED:
    case MemoryRetentionClass.USER_PINNED:
      // Step 18 section 28: these end by supersession or by the challenge
      // closing, not on a calendar.
      return null;
    default:
      return null;
  }
}

/**
 * Whether a new memory contradicts an incumbent one.
 *
 * Deliberately narrow and structural: same user, same scope, same key, both
 * asserting something factual. Step 18 section 30 asks for conflict detection,
 * and doing it on identity of key rather than on semantic disagreement keeps it
 * deterministic - a semantic judgement here would need a model, and a model
 * that decides what contradicts what has quietly become the thing that decides
 * what ZUNO believes.
 *
 * Semantic contradiction detection is on the AI side of section 84 and should
 * arrive as a *candidate* flagged `conflictsWithActive`, still adjudicated
 * here by authority.
 */
export function contradicts(
  incumbent: { memory_key: string; factuality: MemoryFactuality },
  incoming: { memory_key: string; factuality: MemoryFactuality },
): boolean {
  if (incumbent.memory_key !== incoming.memory_key) return false;
  const assertive = [
    MemoryFactuality.FACT,
    MemoryFactuality.DECISION,
    MemoryFactuality.PLAN,
    MemoryFactuality.PREFERENCE,
  ];
  return (
    assertive.includes(incumbent.factuality) &&
    assertive.includes(incoming.factuality)
  );
}

// ---------------------------------------------------------------------------
// Pattern vocabulary.
//
// These are deterministic linguistic checks, not a classifier. They exist to
// catch the specification's named failure modes at the point of writing, and
// they are intentionally conservative: a false negative here is caught later by
// confirmation or by the user's own correction, while a false positive silently
// throws away something the user told us.
// ---------------------------------------------------------------------------

const TRIVIAL_STATEMENT =
  /^(ok(ay)?|sure|thanks?|thank you|yes|no|yeah|nope|hmm+|got it|fine|alright|cool|k)\b[.!]?$/i;

const UI_TELEMETRY =
  /\b(opened screen|clicked|tapped|scrolled|skipped .*card|viewed page|pressed continue)\b/i;

// Step 18 section 69.
const PERSONALITY_DIAGNOSIS =
  /\b(is|has|suffers from|seems to be)\s+(a\s+)?(narcissis\w*|bipolar|borderline|sociopath\w*|psychopath\w*|adhd|autis\w*|ocd|ptsd|depress(ed|ion)|anxious personality|avoidant personality|neurotic)\b/i;

// Step 18 section 70 and Step 24: religion, politics, orientation, health.
const SENSITIVE_ATTRIBUTE =
  /\b(hindu|muslim|christian|sikh|jain|buddhist|jewish|atheist|religion is|votes? for|political(ly)? (left|right|conservative|liberal)|bjp|congress party|gay|lesbian|bisexual|transgender|queer|hiv|cancer diagnosis|diagnosed with)\b/i;

// Step 18 section 47 / Rule 5.
const PREDICTION_LANGUAGE =
  /\b(will (likely |probably )?(get|lose|receive|change|marry|move)|is going to|predicted to|forecast(ed)? to|destined to|expected to (get|lose|receive))\b/i;

// Step 18 sections 45 and 115 / Rule 4.
const HYPOTHETICAL_LANGUAGE =
  /\b(what if|if i (were|was|decide|choose|resign|move|quit)|might (resign|move|quit|leave)|considering whether|thinking about whether|hypothetical)\b/i;

// Step 18 section 49.
const BIRTH_DETAIL =
  /\b(born (on|at|in)|birth (date|time|place|details)|date of birth|time of birth|natal chart|nakshatra|rashi|lagna|ascendant)\b/i;

// Step 18 sections 101-102.
const SENSITIVE_CONTENT =
  /\b(salary|income|debt|loan|emi|mortgage|bankrupt|savings|therapy|medication|counsell?ing|divorce|affair|abuse|miscarriage|fertility|infidelity)\b/i;
