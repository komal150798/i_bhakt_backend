/**
 * The no-deterministic-claim boundary.
 *
 * WHY THIS IS CODE AND NOT A PROMPT LINE
 *
 * A scenario explores possibilities. It must never assert a determined outcome,
 * guarantee a result, or predict the future. That is not a stylistic preference
 * - it is the line between a preparedness product and a fortune-telling
 * product, and the specifications state it repeatedly:
 *
 *   Step 12 Rule 1     scenarios are possibilities, not predictions
 *   Step 12 Rule 2     never assign numerical event probability without a
 *                      validated probabilistic model
 *   Step 12 s.16/97    "72% chance of termination" is prohibited
 *   Step 12 s.21       the lifecycle must not contain the word PREDICTED
 *   Step 12 s.73       must not deterministically claim how a partner behaves
 *   Step 19 s.7        no deterministic certainty where none exists
 *   Step 19 s.10       no fatalism - nothing is "written" or unavoidable
 *   Step 29 Rule 41    scenarios are plausible possibilities, not predictions
 *
 * A prompt instruction is an request. This is a control: model output that
 * makes a deterministic claim is rejected by the schema validator, which causes
 * ZunoAiGateway to retry within its bounded budget and then fail honestly
 * rather than persist the claim (Master Index rule 11 - never let model output
 * silently become trusted business data).
 *
 * It runs a second time in ScenarioService and WhatIfService over the assembled
 * user-facing text, because text ZUNO composes itself never went through a
 * validator. Two layers, both deterministic, neither of them the model grading
 * its own work (Step 21 section 69).
 *
 * DESIGN NOTE ON FALSE POSITIVES
 *
 * The patterns are deliberately narrow. "Your employment continues while the
 * company completes restructuring" is a scenario description and must pass.
 * "We will want your CV ready" is preparation language and must pass. A blanket
 * ban on the word "will" would reject both and push the engine toward mush.
 * What is caught is an assertion *about the user's outcome*: a guarantee, a
 * numeric event probability, a prediction, fatalism, or a dated certainty.
 */

export enum DeterministicClaimKind {
  /** "is guaranteed to", "you will definitely", "without a doubt". */
  GUARANTEED_OUTCOME = 'GUARANTEED_OUTCOME',
  /** "72% chance", "probability of 0.8". Step 12 sections 16 and 97. */
  NUMERIC_PROBABILITY = 'NUMERIC_PROBABILITY',
  /** "you are going to lose your job", "I predict". Step 12 Rule 1. */
  PREDICTION = 'PREDICTION',
  /** "nothing can be done", "this cannot be avoided". Step 19 section 10. */
  FATALISM = 'FATALISM',
  /** "will happen on 18 October". Step 12 section 47. */
  CERTAIN_TIMING = 'CERTAIN_TIMING',
}

export interface DeterministicClaim {
  kind: DeterministicClaimKind;
  /** The matched text, for a log line and a test assertion. */
  excerpt: string;
  /** Where it was found, e.g. "scenarios[1].summary". */
  field: string;
}

interface Rule {
  kind: DeterministicClaimKind;
  pattern: RegExp;
}

/**
 * Applied to lowercased text. Each entry traces to a specification line.
 */
const RULES: readonly Rule[] = [
  // --- GUARANTEED_OUTCOME (Step 19 section 7) ---------------------------
  { kind: DeterministicClaimKind.GUARANTEED_OUTCOME, pattern: /\bis\s+guaranteed\b/ },
  {
    kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
    pattern: /\bguarantee(s|d)?\s+(that|you|your|a|an|the)\b/,
  },
  {
    kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
    pattern: /\byou\s+will\s+(definitely|certainly|surely|undoubtedly)\b/,
  },
  {
    kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
    pattern: /\b(will|shall)\s+definitely\s+(happen|occur|be|come)\b/,
  },
  {
    kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
    pattern: /\bthere\s+is\s+no\s+doubt\b/,
  },
  {
    kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
    pattern: /\bwithout\s+(a\s+)?doubt\b/,
  },
  {
    kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
    pattern: /\b(is|are)\s+certain\s+to\s+(happen|occur|fail|succeed|end|come)\b/,
  },
  {
    kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
    pattern: /\b(is|are)\s+bound\s+to\s+(happen|occur|fail|end|be)\b/,
  },
  { kind: DeterministicClaimKind.GUARANTEED_OUTCOME, pattern: /\binevitabl[ey]\b/ },
  {
    kind: DeterministicClaimKind.GUARANTEED_OUTCOME,
    pattern: /\b100\s*(%|percent)\s*(certain|sure|chance|guaranteed|likely)\b/,
  },

  // --- NUMERIC_PROBABILITY (Step 12 sections 16, 97, Rule 2) -----------
  // Note the adjacency requirement: "a 30% pay cut" is a magnitude and passes,
  // "a 30% chance of a pay cut" is a fabricated probability and does not.
  {
    kind: DeterministicClaimKind.NUMERIC_PROBABILITY,
    pattern: /\b\d{1,3}(\.\d+)?\s*(%|percent)\s*(chance|probability|likelihood|likely|risk|odds|certain)\b/,
  },
  {
    kind: DeterministicClaimKind.NUMERIC_PROBABILITY,
    // No trailing \b: a string ending in "%" has no word boundary after it,
    // which silently let "chance of 20%" through until a test caught it.
    pattern: /\b(chance|probability|likelihood|odds|risk)\s+(of|is|are|at|:)?\s*\d{1,3}(\.\d+)?\s*(%|percent)/,
  },
  {
    kind: DeterministicClaimKind.NUMERIC_PROBABILITY,
    pattern: /\b(probability|likelihood|odds)\s*(of|is|are|:)?\s*0?\.\d+/,
  },
  {
    kind: DeterministicClaimKind.NUMERIC_PROBABILITY,
    pattern: /\b\d{1,2}\s+(in|out\s+of)\s+\d{1,3}\s+(chance|likelihood|odds)\b/,
  },

  // --- PREDICTION (Step 12 Rule 1, sections 21 and 73) ------------------
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\b(i|we|zuno)\s+(predict|forecast|foresee)\b/,
  },
  { kind: DeterministicClaimKind.PREDICTION, pattern: /\bwe\s+can\s+predict\b/ },
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\byou\s+(are|is)\s+going\s+to\s+(lose|fail|be\s+fired|get\s+fired|be\s+terminated|be\s+laid\s+off|divorce)\b/,
  },
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\byou\s+will\s+(lose|fail|be\s+fired|get\s+fired|be\s+terminated|be\s+laid\s+off|be\s+rejected|get\s+divorced)\b/,
  },
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\byour\s+(job|role|employment|marriage|relationship|business|visa)\s+will\s+(end|be\s+terminated|fail|be\s+lost|collapse)\b/,
  },
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\b(this|that|it)\s+will\s+happen\b/,
  },
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\bthe\s+outcome\s+will\s+be\b/,
  },
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\b(destined|fated)\s+to\b/,
  },
  // Step 12 section 21 names this word specifically as the one to avoid.
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\bpredicted\s+(outcome|event|result|scenario)\b/,
  },
  // Step 12 section 73, and section 3's boundary against inventing user facts:
  // ZUNO must never state what another person or institution will decide. This
  // is the failure mode a relationship or employment What-If invites most -
  // "your partner will leave you" reads as analysis and lands as a verdict.
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\byour\s+(partner|spouse|husband|wife|employer|manager|boss|company|landlord|bank|lender|family|parents)\s+will\s+(leave|divorce|fire|terminate|dismiss|reject|refuse|deny|approve|agree|accept|end|cut|remove|keep|retain|promote|forgive|support)\b/,
  },
  {
    kind: DeterministicClaimKind.PREDICTION,
    pattern: /\b(he|she|they)\s+will\s+(leave|divorce|fire|reject|refuse|deny|approve|agree|accept)\b/,
  },

  // --- FATALISM (Step 19 section 10) -----------------------------------
  {
    kind: DeterministicClaimKind.FATALISM,
    pattern: /\bnothing\s+(you\s+)?can\s+(be\s+)?do(ne)?\b/,
  },
  {
    kind: DeterministicClaimKind.FATALISM,
    pattern: /\bcannot\s+be\s+(avoided|changed|escaped|prevented)\b/,
  },
  {
    kind: DeterministicClaimKind.FATALISM,
    pattern: /\bno\s+way\s+(out|to\s+avoid|to\s+change)\b/,
  },
  {
    kind: DeterministicClaimKind.FATALISM,
    pattern: /\b(it|this)\s+is\s+(your\s+)?(fate|destiny|written)\b/,
  },
  {
    kind: DeterministicClaimKind.FATALISM,
    pattern: /\bthere\s+is\s+nothing\s+(you|we)\s+can\s+do\b/,
  },

  // --- CERTAIN_TIMING (Step 12 section 47) ------------------------------
  // "Your manager will fire you on 18 October" is the specification's own
  // example of what astrology must never be used to produce.
  {
    kind: DeterministicClaimKind.CERTAIN_TIMING,
    pattern: /\bwill\s+(happen|occur|end|begin|start)\s+(on|in|by|within)\s+\S/,
  },
  {
    kind: DeterministicClaimKind.CERTAIN_TIMING,
    pattern: /\bwill\s+(be\s+)?(fired|terminated|laid\s+off|rejected|approved|dismissed)\b/,
  },
  // Active voice. "Your manager will fire you on 18 October" is Step 12
  // section 47's own example of what must never be produced, and the passive
  // pattern above does not reach it.
  {
    kind: DeterministicClaimKind.CERTAIN_TIMING,
    pattern: /\bwill\s+(fire|terminate|dismiss|reject|lay\s+off)\s+(you|him|her|them)\b/,
  },
  {
    kind: DeterministicClaimKind.CERTAIN_TIMING,
    pattern: /\bby\s+(next\s+)?(week|month|year)\s+you\s+will\b/,
  },
];

/**
 * Finds every deterministic claim in a single piece of text.
 * Returns an empty array when the text is possibility-safe.
 */
export function findDeterministicClaims(
  text: string | null | undefined,
  field = 'text',
): DeterministicClaim[] {
  if (!text) return [];
  const lowered = text.toLowerCase();
  const found: DeterministicClaim[] = [];
  for (const rule of RULES) {
    const match = lowered.match(rule.pattern);
    if (match) {
      found.push({ kind: rule.kind, excerpt: match[0], field });
    }
  }
  return found;
}

/** Convenience predicate for call sites that only need a yes/no. */
export function hasDeterministicClaim(text: string | null | undefined): boolean {
  return findDeterministicClaims(text).length > 0;
}

/**
 * Scans an arbitrary nested structure of strings.
 *
 * Used by the schema validators over the whole model response, so a claim
 * hidden in `scenarios[2].risks[0]` is caught just as reliably as one in a
 * title. Walking the object rather than listing fields means a field added
 * later is covered without anyone having to remember to add it here.
 */
export function scanForDeterministicClaims(
  value: unknown,
  path = '$',
): DeterministicClaim[] {
  if (typeof value === 'string') {
    return findDeterministicClaims(value, path);
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      scanForDeterministicClaims(entry, `${path}[${index}]`),
    );
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, entry]) => scanForDeterministicClaims(entry, `${path}.${key}`),
    );
  }
  return [];
}

/**
 * Formats claims as validator errors.
 *
 * The wording matters: these strings go into the AI generation-run provenance
 * row as `validation_errors`, and into the retry prompt path. Naming the rule
 * that was broken makes a failure legible six months later.
 */
export function claimsToValidationErrors(
  claims: DeterministicClaim[],
): string[] {
  return claims.map(
    (claim) =>
      `deterministic claim (${claim.kind}) at ${claim.field}: "${claim.excerpt}" - ` +
      'a scenario explores possibilities and must not assert a determined outcome ' +
      '(Step 12 Rules 1-2, Step 19 sections 7 and 10)',
  );
}

/**
 * Qualitative relevance labels permitted on the wire. Step 12 section 16.
 *
 * Exposed here rather than in the enum file because it is a language rule, not
 * a state machine: this is the vocabulary that replaces a percentage.
 */
export const QUALITATIVE_RELEVANCE_LABELS: readonly string[] = [
  'PRIMARY',
  'PLAUSIBLE',
  'SECONDARY',
  'CONTINGENCY',
];

/**
 * True when a probability label is safe to persist.
 *
 * Any digit at all disqualifies it. The same rule is enforced by
 * `chk_zuno_scenarios_probability_label_not_numeric` in the migration, because
 * a constraint in one layer is a convention and a constraint in two is a rule.
 */
export function isQualitativeProbabilityLabel(
  label: string | null | undefined,
): boolean {
  if (label === null || label === undefined) return true;
  if (/\d/.test(label)) return false;
  return QUALITATIVE_RELEVANCE_LABELS.includes(label.toUpperCase());
}
