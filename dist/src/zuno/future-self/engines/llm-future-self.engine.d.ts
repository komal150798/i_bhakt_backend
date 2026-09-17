import { FutureSelfGenerationRequest, FutureSelfGenerationResult, IFutureSelfEngine } from './future-self.port';
import { ZunoAiGateway } from '../../ai/services/zuno-ai-gateway.service';
export declare const FUTURE_SELF_PROMPT_VERSION = "future-self-generate-v1.0.0";
export declare const FUTURE_SELF_ENGINE_VERSION = "future-self-llm-1.0.0";
export declare class LlmFutureSelfEngine implements IFutureSelfEngine {
    private readonly gateway;
    constructor(gateway: ZunoAiGateway);
    generate(request: FutureSelfGenerationRequest): Promise<FutureSelfGenerationResult>;
}
