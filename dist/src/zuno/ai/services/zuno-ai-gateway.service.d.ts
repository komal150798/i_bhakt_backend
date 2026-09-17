import { Repository } from 'typeorm';
import { LLMService } from '../../../common/ai/services/llm.service';
import { ZunoAiGenerationRun } from '../entities/zuno-ai-generation-run.entity';
import { AiPricingService } from './ai-pricing.service';
export type SchemaValidationOk<T> = {
    ok: true;
    value: T;
};
export type SchemaValidationError = {
    ok: false;
    errors: string[];
};
export type SchemaValidation<T> = SchemaValidationOk<T> | SchemaValidationError;
export declare function isSchemaValid<T>(validation: SchemaValidation<T>): validation is SchemaValidationOk<T>;
export interface StructuredCallOptions<T> {
    operationType: string;
    systemPrompt: string;
    userPrompt: string;
    promptTemplateVersion: string;
    validate: (raw: unknown) => SchemaValidation<T>;
    userId?: string | null;
    challengeId?: string | null;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    maxAttempts?: number;
}
export interface StructuredCallResult<T> {
    value: T;
    runId: string;
    modelProvider: string;
    modelName: string;
    promptTemplateVersion: string;
}
export declare class ZunoAiGateway {
    private readonly llm;
    private readonly runs;
    private readonly pricing;
    private readonly logger;
    constructor(llm: LLMService, runs: Repository<ZunoAiGenerationRun>, pricing: AiPricingService);
    callStructured<T>(options: StructuredCallOptions<T>): Promise<StructuredCallResult<T>>;
    isConfigured(): boolean;
    private recordRun;
}
