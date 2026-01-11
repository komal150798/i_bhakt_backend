import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare enum LLMProvider {
    OPENAI = "openai",
    GEMINI = "gemini",
    CLAUDE = "claude"
}
export interface LLMRequestOptions {
    systemPrompt?: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json_object' | 'text';
    timeout?: number;
    maxRetries?: number;
    provider?: LLMProvider | string;
}
export interface LLMResponse {
    content: string;
    provider: string;
    model: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
}
export declare class LLMService {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly openaiApiKey;
    private readonly openaiBaseUrl;
    private readonly geminiBaseUrl;
    private readonly claudeBaseUrl;
    constructor(configService: ConfigService, httpService: HttpService);
    callLLM(options: LLMRequestOptions): Promise<LLMResponse>;
    private prepareRequest;
    private extractContent;
    private extractUsage;
    private cleanContent;
    quickCall(userPrompt: string, options?: Partial<LLMRequestOptions>): Promise<string>;
    callLLMJSON<T = any>(options: LLMRequestOptions): Promise<{
        data: T;
        raw: LLMResponse;
    }>;
}
