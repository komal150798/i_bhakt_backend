/**
 * Model price table for AI cost attribution.
 *
 * Build Rule 91 requires usage and cost telemetry. Cost is the one number that
 * decides whether ZUNO can be sold profitably, because unlike storage-based
 * SaaS the marginal cost of a WhatNow is paid at the moment of use: the most
 * engaged user is the most expensive one.
 *
 * Three rules govern this file:
 *
 *  1. MONEY IS NEVER A FLOAT. Every amount here is an integer count of
 *     micro-USD (1 micro-USD = 0.000001 USD) per 1,000,000 tokens. Floating
 *     point accumulates error over millions of rows and is the classic way a
 *     billing figure quietly stops reconciling.
 *
 *  2. AN UNKNOWN MODEL IS NEVER GUESSED. If a provider/model pair is not in
 *     this table the run is recorded as UNPRICED with a null cost, and every
 *     aggregate reports how many runs were unpriced. A cost report that
 *     silently treats unknown models as free is worse than no report, because
 *     it reads as authoritative. This mirrors the rule the rest of ZUNO
 *     follows: refuse rather than fabricate (Build Rule 129).
 *
 *  3. PRICES ARE VERSIONED. `PRICING_VERSION` is stamped onto every run so a
 *     row written last quarter stays interpretable after a price change.
 *     Re-pricing history is then an explicit migration, not an accident.
 *
 * ---------------------------------------------------------------------------
 * THESE FIGURES ARE SEEDED LIST PRICES AND MUST BE VERIFIED BEFORE THEY ARE
 * USED FOR ANY PRICING OR MARGIN DECISION.
 *
 * Provider list prices change without notice, negotiated and committed-use
 * rates differ from list, and batch/cached-token tiers are not modelled here.
 * Confirm each line against your own provider invoice, then either correct
 * this table or override it without a deploy via ZUNO_AI_PRICING_JSON.
 * ---------------------------------------------------------------------------
 */

/** Bump whenever any figure below changes. Stamped onto every priced run. */
export const PRICING_VERSION = 'seed-2026-09';

/** Marker written to runs whose provider/model had no price entry. */
export const UNPRICED_VERSION = 'UNPRICED';

export interface ModelPrice {
  /** Micro-USD per 1,000,000 input tokens. */
  inputMicrosPerMillion: number;
  /** Micro-USD per 1,000,000 output tokens. */
  outputMicrosPerMillion: number;
}

/**
 * Keyed `provider:model`, both lower-cased.
 *
 * Model names are matched by longest prefix (see AiPricingService), so a dated
 * release such as `gpt-4o-mini-2024-07-18` resolves against `gpt-4o-mini`
 * without needing a row per snapshot.
 */
export type PriceTable = Record<string, ModelPrice>;

/** Convenience: dollars-per-million-tokens to the integer unit stored. */
const usdPerMillion = (input: number, output: number): ModelPrice => ({
  inputMicrosPerMillion: Math.round(input * 1_000_000),
  outputMicrosPerMillion: Math.round(output * 1_000_000),
});

/**
 * Seeded list prices, USD per million tokens. VERIFY BEFORE RELYING ON THESE.
 *
 * Only providers this codebase can actually call are listed, because
 * LLMService abstracts OpenAI, Gemini and Claude and nothing else.
 */
export const DEFAULT_MODEL_PRICING: PriceTable = {
  // --- OpenAI ---
  'openai:gpt-4o': usdPerMillion(2.5, 10),
  'openai:gpt-4o-mini': usdPerMillion(0.15, 0.6),
  'openai:gpt-4.1': usdPerMillion(2, 8),
  'openai:gpt-4.1-mini': usdPerMillion(0.4, 1.6),
  'openai:gpt-4.1-nano': usdPerMillion(0.1, 0.4),
  'openai:gpt-4-turbo': usdPerMillion(10, 30),
  'openai:gpt-3.5-turbo': usdPerMillion(0.5, 1.5),
  'openai:o3-mini': usdPerMillion(1.1, 4.4),

  // --- Anthropic ---
  'claude:claude-3-5-haiku': usdPerMillion(0.8, 4),
  'claude:claude-3-5-sonnet': usdPerMillion(3, 15),
  'claude:claude-3-7-sonnet': usdPerMillion(3, 15),
  'claude:claude-3-haiku': usdPerMillion(0.25, 1.25),
  'claude:claude-3-opus': usdPerMillion(15, 75),

  // --- Google ---
  'gemini:gemini-1.5-flash': usdPerMillion(0.075, 0.3),
  'gemini:gemini-1.5-pro': usdPerMillion(1.25, 5),
  'gemini:gemini-2.0-flash': usdPerMillion(0.1, 0.4),
};

/**
 * Parses a ZUNO_AI_PRICING_JSON override.
 *
 * Shape (USD per million tokens, the unit a provider's price page uses, so an
 * operator transcribes rather than converts):
 *
 *   {"version":"invoice-2026-Q3",
 *    "prices":{"openai:gpt-4o":{"input":2.5,"output":10}}}
 *
 * Returns null on anything malformed rather than throwing: a typo in an env
 * var must not stop the application from serving requests. It downgrades cost
 * reporting to the built-in table, which the caller logs loudly.
 */
export function parsePricingOverride(
  raw: string | undefined,
): { version: string; prices: PriceTable } | null {
  if (!raw || !raw.trim()) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const candidate = parsed as { version?: unknown; prices?: unknown };
  if (typeof candidate.version !== 'string' || !candidate.version.trim()) return null;
  if (!candidate.prices || typeof candidate.prices !== 'object') return null;

  const prices: PriceTable = {};
  for (const [key, value] of Object.entries(candidate.prices as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') return null;
    const entry = value as { input?: unknown; output?: unknown };
    if (typeof entry.input !== 'number' || typeof entry.output !== 'number') return null;
    if (!Number.isFinite(entry.input) || !Number.isFinite(entry.output)) return null;
    if (entry.input < 0 || entry.output < 0) return null;
    prices[key.trim().toLowerCase()] = usdPerMillion(entry.input, entry.output);
  }

  if (Object.keys(prices).length === 0) return null;
  return { version: candidate.version.trim(), prices };
}
