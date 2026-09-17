import { ZunoAiGateway } from '../../ai/services/zuno-ai-gateway.service';
import { IWhatIfEngine, WhatIfExplorationRequest, WhatIfExplorationResult } from '../ports/what-if.port';
export declare const WHAT_IF_PROMPT_VERSION = "what-if-explore-v1.0.0";
export declare const WHAT_IF_ENGINE_VERSION = "what-if-llm-1.0.0";
export declare class LlmWhatIfEngine implements IWhatIfEngine {
    private readonly gateway;
    private readonly logger;
    constructor(gateway: ZunoAiGateway);
    explore(request: WhatIfExplorationRequest): Promise<WhatIfExplorationResult>;
}
