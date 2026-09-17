import { OnModuleInit } from '@nestjs/common';
import { ModelPrice } from '../pricing/model-pricing';
export interface TokenCounts {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
}
export interface CostResult {
    costMicroUsd: number | null;
    pricingVersion: string;
}
export declare class AiPricingService implements OnModuleInit {
    private readonly logger;
    private table;
    private version;
    private usingOverride;
    private readonly warnedKeys;
    onModuleInit(): void;
    load(): void;
    isUsingOverride(): boolean;
    getVersion(): string;
    findPrice(provider: string, model: string): ModelPrice | null;
    computeCost(provider: string, model: string, usage: TokenCounts | null | undefined): CostResult;
}
