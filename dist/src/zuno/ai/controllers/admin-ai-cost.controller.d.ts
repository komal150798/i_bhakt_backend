import { ZunoPayload } from '../../common/interceptors/zuno-response.interceptor';
import { RulebookActorService } from '../../rulebook/services/rulebook-actor.service';
import { AiCostService } from '../services/ai-cost.service';
import { AiPricingService } from '../services/ai-pricing.service';
export declare class AdminAiCostController {
    private readonly cost;
    private readonly pricing;
    private readonly actors;
    constructor(cost: AiCostService, pricing: AiPricingService, actors: RulebookActorService);
    whatNow(req: any, from?: string, to?: string): Promise<ZunoPayload<import("../services/ai-cost.service").WhatNowCostReport>>;
    breakdown(req: any, by?: string, from?: string, to?: string): Promise<ZunoPayload<import("../services/ai-cost.service").CostBreakdownRow[]>>;
    daily(req: any, from?: string, to?: string): Promise<ZunoPayload<import("../services/ai-cost.service").DailyCostRow[]>>;
    challenge(req: any, id: string): Promise<ZunoPayload<{
        challengeId: string;
        costMicroUsd: number;
        runs: number;
        unpricedRuns: number;
        totalTokens: number;
        byOperation: import("../services/ai-cost.service").CostBreakdownRow[];
    }>>;
    pricingStatus(req: any): Promise<ZunoPayload<{
        pricingVersion: string;
        source: string;
        verifiedByOperator: boolean;
        warning: string;
    }>>;
    private requireAdmin;
}
