import { IWhatNowEngine, WhatNowExtractionRequest, WhatNowExtractionResult } from './whatnow.port';
import { ZunoAiGateway } from '../../ai/services/zuno-ai-gateway.service';
export declare const WHATNOW_PROMPT_VERSION = "whatnow-extract-v1.0.0";
export declare const WHATNOW_ENGINE_VERSION = "whatnow-llm-1.0.0";
export declare class LlmWhatNowEngine implements IWhatNowEngine {
    private readonly gateway;
    private readonly logger;
    constructor(gateway: ZunoAiGateway);
    extract(request: WhatNowExtractionRequest): Promise<WhatNowExtractionResult>;
}
