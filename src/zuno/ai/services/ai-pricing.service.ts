import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  DEFAULT_MODEL_PRICING,
  ModelPrice,
  PRICING_VERSION,
  PriceTable,
  UNPRICED_VERSION,
  parsePricingOverride,
} from '../pricing/model-pricing';

export interface TokenCounts {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface CostResult {
  /** Integer micro-USD (1e-6 USD), or null when the model has no price. */
  costMicroUsd: number | null;
  /** PRICING_VERSION, the override's version, or UNPRICED. */
  pricingVersion: string;
}

/**
 * Turns token counts into money.
 *
 * Kept separate from the gateway so that pricing can be corrected, overridden
 * or re-versioned without touching the code path that talks to a provider -
 * the gateway's job is provenance and validation, not arithmetic about money.
 *
 * The single most important behaviour here is what happens when a model is not
 * in the table: `costMicroUsd` is null and the version is UNPRICED. It is never
 * zero. Zero would silently mean "this call was free", which would understate
 * cost-per-WhatNow exactly when a new model is rolled out and attention is
 * lowest.
 */
@Injectable()
export class AiPricingService implements OnModuleInit {
  private readonly logger = new Logger(AiPricingService.name);

  private table: PriceTable = DEFAULT_MODEL_PRICING;
  private version: string = PRICING_VERSION;
  private usingOverride = false;

  /** Models already reported as unpriced, so the warning fires once each. */
  private readonly warnedKeys = new Set<string>();

  onModuleInit(): void {
    this.load();
  }

  /** Exposed for tests and for a future admin "reload pricing" action. */
  load(): void {
    const override = parsePricingOverride(process.env.ZUNO_AI_PRICING_JSON);

    if (override) {
      // An override replaces the table rather than merging into it. Merging
      // would leave stale built-in prices silently in effect for models the
      // operator believed they had just re-priced.
      this.table = override.prices;
      this.version = override.version;
      this.usingOverride = true;
      this.logger.log(
        `AI pricing loaded from ZUNO_AI_PRICING_JSON (version "${this.version}", ${Object.keys(this.table).length} models).`,
      );
    } else {
      this.table = DEFAULT_MODEL_PRICING;
      this.version = PRICING_VERSION;
      this.usingOverride = false;

      if (process.env.ZUNO_AI_PRICING_JSON?.trim()) {
        this.logger.error(
          'ZUNO_AI_PRICING_JSON is set but malformed; falling back to built-in seed prices. Cost figures may be wrong.',
        );
      } else {
        this.logger.warn(
          `AI pricing is using built-in SEED list prices (version "${this.version}"). These are unverified - confirm against your provider invoice and set ZUNO_AI_PRICING_JSON before using cost figures for pricing decisions.`,
        );
      }
    }

    this.warnedKeys.clear();
  }

  isUsingOverride(): boolean {
    return this.usingOverride;
  }

  getVersion(): string {
    return this.version;
  }

  /**
   * Looks up a price by `provider:model`.
   *
   * Matching is longest-prefix on the model name so that dated snapshots
   * (`gpt-4o-mini-2024-07-18`) and regional suffixes resolve to their family
   * without a row per release. Longest-prefix rather than first-match matters:
   * `gpt-4o-mini` must not be priced as `gpt-4o`, which is ~17x more expensive.
   */
  findPrice(provider: string, model: string): ModelPrice | null {
    const p = (provider ?? '').trim().toLowerCase();
    const m = (model ?? '').trim().toLowerCase();
    if (!p || !m) return null;

    const exact = this.table[`${p}:${m}`];
    if (exact) return exact;

    let best: ModelPrice | null = null;
    let bestLength = -1;
    for (const [key, price] of Object.entries(this.table)) {
      const separator = key.indexOf(':');
      if (separator < 0) continue;
      if (key.slice(0, separator) !== p) continue;

      const family = key.slice(separator + 1);
      if (m.startsWith(family) && family.length > bestLength) {
        best = price;
        bestLength = family.length;
      }
    }
    return best;
  }

  /**
   * Computes the cost of one model call.
   *
   * When the provider reports only `total_tokens` the split between input and
   * output is unknown. Rather than assume a ratio - which would bias the
   * headline number by up to the input/output price gap, ~4x on most models -
   * the total is priced at the OUTPUT rate, the more expensive side. A cost
   * estimate that errs high is a safe input to a pricing decision; one that
   * errs low is not.
   */
  computeCost(
    provider: string,
    model: string,
    usage: TokenCounts | null | undefined,
  ): CostResult {
    const price = this.findPrice(provider, model);

    if (!price) {
      const key = `${provider}:${model}`;
      if (!this.warnedKeys.has(key)) {
        this.warnedKeys.add(key);
        this.logger.warn(
          `No price configured for "${key}". Its runs are recorded UNPRICED and excluded from cost totals.`,
        );
      }
      return { costMicroUsd: null, pricingVersion: UNPRICED_VERSION };
    }

    if (!usage) {
      // The call happened and cost money, but the provider reported no usage.
      // Null, not zero - see the class comment.
      return { costMicroUsd: null, pricingVersion: UNPRICED_VERSION };
    }

    const prompt = nonNegative(usage.prompt_tokens);
    const completion = nonNegative(usage.completion_tokens);

    if (prompt === null && completion === null) {
      const total = nonNegative(usage.total_tokens);
      if (total === null) {
        return { costMicroUsd: null, pricingVersion: UNPRICED_VERSION };
      }
      return {
        costMicroUsd: Math.round((total * price.outputMicrosPerMillion) / 1_000_000),
        pricingVersion: this.version,
      };
    }

    const micros =
      ((prompt ?? 0) * price.inputMicrosPerMillion +
        (completion ?? 0) * price.outputMicrosPerMillion) /
      1_000_000;

    return { costMicroUsd: Math.round(micros), pricingVersion: this.version };
  }
}

/** Rejects negatives, NaN and non-numbers; returns null when unusable. */
function nonNegative(value: number | undefined): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}
