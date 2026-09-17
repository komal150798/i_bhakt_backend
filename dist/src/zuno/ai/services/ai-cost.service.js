"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiCostService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_ai_generation_run_entity_1 = require("../entities/zuno-ai-generation-run.entity");
const ai_pricing_service_1 = require("./ai-pricing.service");
let AiCostService = class AiCostService {
    constructor(runs, pricing) {
        this.runs = runs;
        this.pricing = pricing;
    }
    async whatNowCost(window) {
        const rows = await this.runs.query(`
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
      `, [window.from, window.to]);
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
    async breakdownBy(dimension, window, limit = 25) {
        const rows = await this.runs.query(`
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
      `, [window.from, window.to, limit]);
        return (rows ?? []).map((r) => ({
            key: String(r.key ?? 'unknown'),
            runs: int(r.runs),
            costMicroUsd: int(r.cost_micros),
            unpricedRuns: int(r.unpriced_runs),
            totalTokens: int(r.total_tokens),
        }));
    }
    async dailySeries(window) {
        const rows = await this.runs.query(`
      SELECT
        to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
        COUNT(*)                                         AS runs,
        COALESCE(SUM(cost_micro_usd), 0)                 AS cost_micros,
        COUNT(DISTINCT challenge_id)                     AS whatnow_count
      FROM zuno_ai_generation_runs
      WHERE created_at >= $1 AND created_at < $2
      GROUP BY 1
      ORDER BY 1
      `, [window.from, window.to]);
        return (rows ?? []).map((r) => ({
            day: String(r.day),
            runs: int(r.runs),
            costMicroUsd: int(r.cost_micros),
            whatNowCount: int(r.whatnow_count),
        }));
    }
    async costForChallenge(challengeId) {
        const rows = await this.runs.query(`
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
      `, [challengeId]);
        const byOperation = (rows ?? []).map((r) => ({
            key: String(r.key ?? 'unknown'),
            runs: int(r.runs),
            costMicroUsd: int(r.cost_micros),
            unpricedRuns: int(r.unpriced_runs),
            totalTokens: int(r.total_tokens),
        }));
        return {
            challengeId,
            costMicroUsd: byOperation.reduce((t, r) => t + r.costMicroUsd, 0),
            runs: byOperation.reduce((t, r) => t + r.runs, 0),
            unpricedRuns: byOperation.reduce((t, r) => t + r.unpricedRuns, 0),
            totalTokens: byOperation.reduce((t, r) => t + r.totalTokens, 0),
            byOperation,
        };
    }
    confidence(totalRuns, unpricedRuns) {
        return {
            unpricedRuns,
            totalRuns,
            unpricedRatio: totalRuns > 0 ? round4(unpricedRuns / totalRuns) : 0,
            pricingVersion: this.pricing.getVersion(),
            pricesVerifiedByOperator: this.pricing.isUsingOverride(),
        };
    }
};
exports.AiCostService = AiCostService;
exports.AiCostService = AiCostService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_ai_generation_run_entity_1.ZunoAiGenerationRun)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        ai_pricing_service_1.AiPricingService])
], AiCostService);
function num(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}
function int(value) {
    return Math.round(num(value));
}
function round2(value) {
    return Math.round(value * 100) / 100;
}
function round4(value) {
    return Math.round(value * 10000) / 10000;
}
//# sourceMappingURL=ai-cost.service.js.map