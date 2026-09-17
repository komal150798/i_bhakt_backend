import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZunoAiGenerationRun } from '../entities/zuno-ai-generation-run.entity';
import { AiPricingService } from './ai-pricing.service';

/** Inclusive start, exclusive end. */
export interface CostWindow {
  from: Date;
  to: Date;
}

export interface CostConfidence {
  /** Runs in the window whose cost could not be determined. */
  unpricedRuns: number;
  totalRuns: number;
  /** 0..1. Anything above zero means the totals below are a LOWER BOUND. */
  unpricedRatio: number;
  /** Price list in force when this report was produced. */
  pricingVersion: string;
  /** False when built-in seed prices are in use, i.e. unverified. */
  pricesVerifiedByOperator: boolean;
}

export interface WhatNowCostReport {
  window: { from: string; to: string };
  /** Challenges that produced at least one model call in the window. */
  whatNowCount: number;
  totalCostMicroUsd: number;
  /** The headline number: mean cost of one WhatNow. */
  meanCostMicroUsd: number;
  p50CostMicroUsd: number;
  p90CostMicroUsd: number;
  p95CostMicroUsd: number;
  maxCostMicroUsd: number;
  /**
   * Mean model calls per WhatNow. Above 1.0 is retry and multi-step
   * amplification - the gap between this and 1.0 is money spent on attempts
   * that did not directly produce the user's answer.
   */
  meanRunsPerWhatNow: number;
  totalTokens: number;
  confidence: CostConfidence;
}

export interface CostBreakdownRow {
  key: string;
  runs: number;
  costMicroUsd: number;
  unpricedRuns: number;
  totalTokens: number;
}

export interface DailyCostRow {
  day: string;
  runs: number;
  costMicroUsd: number;
  whatNowCount: number;
}

/**
 * Cost reporting over AI provenance rows.
 *
 * Answers the question that decides whether ZUNO can be priced profitably:
 * what does one WhatNow actually cost to serve?
 *
 * Two decisions shape every query here.
 *
 * FAILED ATTEMPTS COUNT. Cost is summed over all runs for a challenge
 * regardless of status. A schema-invalid response that triggered a retry was
 * billed by the provider just like a successful one. Reporting only successful
 * calls would understate true cost by the retry rate, and the retry rate is
 * highest on the messiest, most distressed inputs - exactly the traffic that
 * matters most.
 *
 * UNPRICED RUNS ARE REPORTED, NOT HIDDEN. Runs with a null cost contribute
 * zero to the sums, so every total is a LOWER BOUND whenever `unpricedRuns`
 * is above zero. That count travels with the report rather than sitting in a
 * log, because a cost figure that looks authoritative but silently omits a
 * newly-deployed model is how a margin gets set wrong.
 *
 * Aggregation runs in PostgreSQL rather than in Node: these tables grow by one
 * row per model call, and pulling them into the process to sum them would stop
 * working at precisely the traffic level where the numbers start to matter.
 */
@Injectable()
export class AiCostService {
  constructor(
    @InjectRepository(ZunoAiGenerationRun)
    private readonly runs: Repository<ZunoAiGenerationRun>,
    private readonly pricing: AiPricingService,
  ) {}

  /**
   * Cost per WhatNow, with distribution.
   *
   * The mean alone is not enough to price against: a long tail of expensive
   * sessions is invisible in an average but is what a heavy user actually
   * costs. p90/p95 are what a per-seat price has to survive.
   */
  async whatNowCost(window: CostWindow): Promise<WhatNowCostReport> {
    const rows = await this.runs.query(
      `
      WITH per_challenge AS (
        SELECT
          challenge_id,
          SUM(COALESCE(cost_micro_usd, 0))                              AS cost_micros,
          COUNT(*)                                                      AS run_count,
          COUNT(*) FILTER (WHERE cost_micro_usd IS NULL)                AS unpriced_runs,
          SUM(COALESCE(NULLIF(token_usage->>'total_tokens', '')::bigint, 0)) AS total_tokens
        FROM zuno_ai_generation_runs
        WHERE challenge_id IS NOT NULL
          AND created_at >= $1
          AND created_at <  $2
        GROUP BY challenge_id
      )
      SELECT
        COUNT(*)                                                          AS whatnow_count,
        COALESCE(SUM(cost_micros), 0)                                     AS total_cost,
        COALESCE(AVG(cost_micros), 0)                                     AS mean_cost,
        COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY cost_micros), 0) AS p50,
        COALESCE(percentile_cont(0.90) WITHIN GROUP (ORDER BY cost_micros), 0) AS p90,
        COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY cost_micros), 0) AS p95,
        COALESCE(MAX(cost_micros), 0)                                     AS max_cost,
        COALESCE(AVG(run_count), 0)                                       AS mean_runs,
        COALESCE(SUM(run_count), 0)                                       AS total_runs,
        COALESCE(SUM(unpriced_runs), 0)                                   AS unpriced_runs,
        COALESCE(SUM(total_tokens), 0)                                    AS total_tokens
      FROM per_challenge
      `,
      [window.from, window.to],
    );

    const r = rows?.[0] ?? {};
    const totalRuns = int(r.total_runs);
    const unpricedRuns = int(r.unpriced_runs);

    return {
      window: { from: window.from.toISOString(), to: window.to.toISOString() },
      whatNowCount: int(r.whatnow_count),
      totalCostMicroUsd: int(r.total_cost),
      meanCostMicroUsd: Math.round(num(r.mean_cost)),
      p50CostMicroUsd: Math.round(num(r.p50)),
      p90CostMicroUsd: Math.round(num(r.p90)),
      p95CostMicroUsd: Math.round(num(r.p95)),
      maxCostMicroUsd: int(r.max_cost),
      meanRunsPerWhatNow: round2(num(r.mean_runs)),
      totalTokens: int(r.total_tokens),
      confidence: this.confidence(totalRuns, unpricedRuns),
    };
  }

  /** Spend grouped by a column, biggest first. Includes runs with no challenge. */
  async breakdownBy(
    dimension: 'operation_type' | 'model_name' | 'model_provider' | 'status',
    window: CostWindow,
    limit = 25,
  ): Promise<CostBreakdownRow[]> {
    // `dimension` is a closed union, never caller-supplied text, so there is no
    // injection surface here - but it is still interpolated only after being
    // narrowed by the type, never passed through from a request body.
    const rows = await this.runs.query(
      `
      SELECT
        ${dimension}                                                      AS key,
        COUNT(*)                                                          AS runs,
        COALESCE(SUM(cost_micro_usd), 0)                                  AS cost_micros,
        COUNT(*) FILTER (WHERE cost_micro_usd IS NULL)                    AS unpriced_runs,
        COALESCE(SUM(NULLIF(token_usage->>'total_tokens', '')::bigint), 0) AS total_tokens
      FROM zuno_ai_generation_runs
      WHERE created_at >= $1 AND created_at < $2
      GROUP BY ${dimension}
      ORDER BY cost_micros DESC, runs DESC
      LIMIT $3
      `,
      [window.from, window.to, limit],
    );

    return (rows ?? []).map((r: Record<string, unknown>) => ({
      key: String(r.key ?? 'unknown'),
      runs: int(r.runs),
      costMicroUsd: int(r.cost_micros),
      unpricedRuns: int(r.unpriced_runs),
      totalTokens: int(r.total_tokens),
    }));
  }

  /** Daily spend and WhatNow volume, for a burn-rate chart. */
  async dailySeries(window: CostWindow): Promise<DailyCostRow[]> {
    const rows = await this.runs.query(
      `
      SELECT
        to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
        COUNT(*)                                         AS runs,
        COALESCE(SUM(cost_micro_usd), 0)                 AS cost_micros,
        COUNT(DISTINCT challenge_id)                     AS whatnow_count
      FROM zuno_ai_generation_runs
      WHERE created_at >= $1 AND created_at < $2
      GROUP BY 1
      ORDER BY 1
      `,
      [window.from, window.to],
    );

    return (rows ?? []).map((r: Record<string, unknown>) => ({
      day: String(r.day),
      runs: int(r.runs),
      costMicroUsd: int(r.cost_micros),
      whatNowCount: int(r.whatnow_count),
    }));
  }

  /**
   * Everything spent on one challenge.
   *
   * The per-user support answer to "why is this account expensive", and the
   * unit that `whatNowCost` aggregates over.
   */
  async costForChallenge(challengeId: string): Promise<{
    challengeId: string;
    costMicroUsd: number;
    runs: number;
    unpricedRuns: number;
    totalTokens: number;
    byOperation: CostBreakdownRow[];
  }> {
    const rows = await this.runs.query(
      `
      SELECT
        operation_type                                                    AS key,
        COUNT(*)                                                          AS runs,
        COALESCE(SUM(cost_micro_usd), 0)                                  AS cost_micros,
        COUNT(*) FILTER (WHERE cost_micro_usd IS NULL)                    AS unpriced_runs,
        COALESCE(SUM(NULLIF(token_usage->>'total_tokens', '')::bigint), 0) AS total_tokens
      FROM zuno_ai_generation_runs
      WHERE challenge_id = $1
      GROUP BY operation_type
      ORDER BY cost_micros DESC
      `,
      [challengeId],
    );

    const byOperation: CostBreakdownRow[] = (rows ?? []).map(
      (r: Record<string, unknown>) => ({
        key: String(r.key ?? 'unknown'),
        runs: int(r.runs),
        costMicroUsd: int(r.cost_micros),
        unpricedRuns: int(r.unpriced_runs),
        totalTokens: int(r.total_tokens),
      }),
    );

    return {
      challengeId,
      costMicroUsd: byOperation.reduce((t, r) => t + r.costMicroUsd, 0),
      runs: byOperation.reduce((t, r) => t + r.runs, 0),
      unpricedRuns: byOperation.reduce((t, r) => t + r.unpricedRuns, 0),
      totalTokens: byOperation.reduce((t, r) => t + r.totalTokens, 0),
      byOperation,
    };
  }

  private confidence(totalRuns: number, unpricedRuns: number): CostConfidence {
    return {
      unpricedRuns,
      totalRuns,
      unpricedRatio: totalRuns > 0 ? round4(unpricedRuns / totalRuns) : 0,
      pricingVersion: this.pricing.getVersion(),
      pricesVerifiedByOperator: this.pricing.isUsingOverride(),
    };
  }
}

/**
 * PostgreSQL returns bigint and numeric as strings through node-postgres, to
 * avoid silent precision loss. Everything here is well inside Number.MAX_SAFE_INTEGER
 * (one million dollars is 1e12 micro-USD), so converting is safe - but it has
 * to be explicit, or `SUM(...) + SUM(...)` would concatenate two strings.
 */
function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function int(value: unknown): number {
  return Math.round(num(value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
