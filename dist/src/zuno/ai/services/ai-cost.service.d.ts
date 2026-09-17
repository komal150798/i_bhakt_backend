import { Repository } from 'typeorm';
import { ZunoAiGenerationRun } from '../entities/zuno-ai-generation-run.entity';
import { AiPricingService } from './ai-pricing.service';
export interface CostWindow {
    from: Date;
    to: Date;
}
export interface CostConfidence {
    unpricedRuns: number;
    totalRuns: number;
    unpricedRatio: number;
    pricingVersion: string;
    pricesVerifiedByOperator: boolean;
}
export interface WhatNowCostReport {
    window: {
        from: string;
        to: string;
    };
    whatNowCount: number;
    totalCostMicroUsd: number;
    meanCostMicroUsd: number;
    p50CostMicroUsd: number;
    p90CostMicroUsd: number;
    p95CostMicroUsd: number;
    maxCostMicroUsd: number;
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
export declare class AiCostService {
    private readonly runs;
    private readonly pricing;
    constructor(runs: Repository<ZunoAiGenerationRun>, pricing: AiPricingService);
    whatNowCost(window: CostWindow): Promise<WhatNowCostReport>;
    breakdownBy(dimension: 'operation_type' | 'model_name' | 'model_provider' | 'status', window: CostWindow, limit?: number): Promise<CostBreakdownRow[]>;
    dailySeries(window: CostWindow): Promise<DailyCostRow[]>;
    costForChallenge(challengeId: string): Promise<{
        challengeId: string;
        costMicroUsd: number;
        runs: number;
        unpricedRuns: number;
        totalTokens: number;
        byOperation: CostBreakdownRow[];
    }>;
    private confidence;
}
