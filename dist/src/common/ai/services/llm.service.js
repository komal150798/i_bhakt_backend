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
var LLMService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = exports.LLMProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
var LLMProvider;
(function (LLMProvider) {
    LLMProvider["OPENAI"] = "openai";
    LLMProvider["GEMINI"] = "gemini";
    LLMProvider["CLAUDE"] = "claude";
})(LLMProvider || (exports.LLMProvider = LLMProvider = {}));
let LLMService = LLMService_1 = class LLMService {
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.logger = new common_1.Logger(LLMService_1.name);
        this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
        this.openaiBaseUrl = this.configService.get('OPENAI_BASE_URL') || '';
        this.geminiBaseUrl = this.configService.get('GEMINI_BASE_URL') || '';
        this.claudeBaseUrl = this.configService.get('CLAUDE_BASE_URL') || '';
        this.logger.log(`🔧 LLM Service initialized - OpenAI: ${this.openaiBaseUrl ? '✅' : '❌'}, Gemini: ${this.geminiBaseUrl ? '✅' : '❌'}, Claude: ${this.claudeBaseUrl ? '✅' : '❌'}`);
    }
    async callLLM(options) {
        const { systemPrompt = '', userPrompt, model, temperature = 0.7, maxTokens = 2000, responseFormat = 'json_object', timeout = 30000, maxRetries = 3, provider, } = options;
        const selectedProvider = provider ||
            this.configService.get('LLM_PROVIDER') ||
            LLMProvider.OPENAI;
        const selectedModel = model || this.configService.get('OPENAI_MODEL') || 'gpt-4o-mini';
        this.logger.log(`📤 LLM Request - Provider: ${selectedProvider}, Model: ${selectedModel}`);
        const { apiUrl, requestBody, headers } = this.prepareRequest(selectedProvider, selectedModel, systemPrompt, userPrompt, temperature, maxTokens, responseFormat);
        let lastError = null;
        const baseDelay = 2000;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    this.logger.log(`🔄 Retry attempt ${attempt}/${maxRetries}...`);
                }
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(apiUrl, requestBody, {
                    headers,
                    timeout,
                }));
                this.logger.log(`📥 LLM API response status: ${response.status}`);
                const content = this.extractContent(response.data, selectedProvider);
                if (!content) {
                    this.logger.error('❌ No content in LLM response', JSON.stringify(response.data, null, 2));
                    throw new Error('No content in LLM response');
                }
                this.logger.log(`📥 LLM response content length: ${content.length} chars`);
                const cleanedContent = this.cleanContent(content, selectedProvider);
                const usage = this.extractUsage(response.data, selectedProvider);
                return {
                    content: cleanedContent,
                    provider: selectedProvider,
                    model: selectedModel,
                    usage,
                };
            }
            catch (error) {
                lastError = error;
                if (error.response?.status === 429 && attempt < maxRetries) {
                    const retryAfter = error.response?.headers?.['retry-after'] ||
                        error.response?.headers?.['x-ratelimit-reset-requests'];
                    const delay = retryAfter
                        ? parseInt(retryAfter) * 1000
                        : baseDelay * Math.pow(2, attempt);
                    this.logger.warn(`⚠️ Rate limit (429) - Attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delay / 1000}s...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
                if (attempt === maxRetries) {
                    this.logger.error(`❌ LLM API call failed after ${maxRetries} retries: ${error.message}`);
                    throw error;
                }
            }
        }
        if (lastError) {
            throw lastError;
        }
        throw new Error('LLM API call failed after retries');
    }
    prepareRequest(provider, model, systemPrompt, userPrompt, temperature, maxTokens, responseFormat) {
        let apiUrl;
        let requestBody;
        const headers = {
            'Content-Type': 'application/json',
        };
        if (provider === LLMProvider.GEMINI) {
            if (!this.geminiBaseUrl) {
                throw new Error('GEMINI_BASE_URL is required in .env file. Example: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent');
            }
            if (!this.openaiApiKey) {
                throw new Error('OPENAI_API_KEY (Gemini API key) is required in .env file');
            }
            const separator = this.geminiBaseUrl.includes('?') ? '&' : '?';
            apiUrl = `${this.geminiBaseUrl}${separator}key=${this.openaiApiKey}`;
            const combinedPrompt = systemPrompt
                ? `System Instructions:\n${systemPrompt}\n\nUser Request:\n${userPrompt}`
                : userPrompt;
            requestBody = {
                contents: [
                    {
                        parts: [{ text: combinedPrompt }],
                    },
                ],
                generationConfig: {
                    temperature,
                    maxOutputTokens: maxTokens,
                    responseMimeType: responseFormat === 'json_object' ? 'application/json' : 'text/plain',
                },
            };
        }
        else if (provider === LLMProvider.CLAUDE) {
            if (!this.claudeBaseUrl) {
                throw new Error('CLAUDE_BASE_URL is required in .env file. Example: https://api.anthropic.com/v1/messages');
            }
            if (!this.openaiApiKey) {
                throw new Error('OPENAI_API_KEY (Claude API key) is required in .env file');
            }
            apiUrl = this.claudeBaseUrl;
            headers['x-api-key'] = this.openaiApiKey;
            headers['anthropic-version'] = '2023-06-01';
            requestBody = {
                model: model || 'claude-3-sonnet-20240229',
                max_tokens: maxTokens,
                system: systemPrompt || undefined,
                messages: [
                    {
                        role: 'user',
                        content: userPrompt,
                    },
                ],
            };
        }
        else {
            if (!this.openaiBaseUrl) {
                throw new Error('OPENAI_BASE_URL is required in .env file. Example: https://api.openai.com/v1');
            }
            if (!this.openaiApiKey) {
                throw new Error('OPENAI_API_KEY is required in .env file');
            }
            apiUrl = `${this.openaiBaseUrl}/chat/completions`;
            headers['Authorization'] = `Bearer ${this.openaiApiKey}`;
            const messages = [];
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt,
                });
            }
            messages.push({
                role: 'user',
                content: userPrompt,
            });
            requestBody = {
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
            };
            if (responseFormat === 'json_object') {
                requestBody.response_format = { type: 'json_object' };
            }
        }
        return { apiUrl, requestBody, headers };
    }
    extractContent(responseData, provider) {
        if (provider === LLMProvider.GEMINI) {
            const candidate = responseData?.candidates?.[0];
            if (candidate?.finishReason) {
                if (candidate.finishReason === 'MAX_TOKENS') {
                    this.logger.warn('⚠️ Gemini response truncated due to MAX_TOKENS limit - consider increasing maxOutputTokens');
                }
                else if (candidate.finishReason === 'SAFETY') {
                    this.logger.warn('⚠️ Gemini response blocked due to safety filters');
                    throw new Error('Gemini response blocked by safety filters');
                }
                else if (candidate.finishReason === 'RECITATION') {
                    this.logger.warn('⚠️ Gemini response blocked due to recitation policy');
                    throw new Error('Gemini response blocked by recitation policy');
                }
            }
            return candidate?.content?.parts?.[0]?.text || '';
        }
        else if (provider === LLMProvider.CLAUDE) {
            return responseData?.content?.[0]?.text || '';
        }
        else {
            return responseData?.choices?.[0]?.message?.content || '';
        }
    }
    extractUsage(responseData, provider) {
        if (provider === LLMProvider.GEMINI) {
            const usageMetadata = responseData?.usageMetadata;
            if (usageMetadata) {
                return {
                    promptTokens: usageMetadata.promptTokenCount,
                    completionTokens: usageMetadata.candidatesTokenCount,
                    totalTokens: usageMetadata.totalTokenCount,
                };
            }
        }
        else if (provider === LLMProvider.CLAUDE) {
            const usage = responseData?.usage;
            if (usage) {
                return {
                    promptTokens: usage.input_tokens,
                    completionTokens: usage.output_tokens,
                    totalTokens: usage.input_tokens + usage.output_tokens,
                };
            }
        }
        else {
            const usage = responseData?.usage;
            if (usage) {
                return {
                    promptTokens: usage.prompt_tokens,
                    completionTokens: usage.completion_tokens,
                    totalTokens: usage.total_tokens,
                };
            }
        }
        return undefined;
    }
    cleanContent(content, provider) {
        let cleanedContent = content.trim();
        if (cleanedContent.startsWith('```json')) {
            cleanedContent = cleanedContent
                .replace(/^```json\s*/, '')
                .replace(/\s*```$/, '');
        }
        else if (cleanedContent.startsWith('```')) {
            cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        if (provider === LLMProvider.GEMINI) {
            cleanedContent = cleanedContent.replace(/[\x00-\x1F\x7F]/g, '');
            const openBraces = (cleanedContent.match(/{/g) || []).length;
            const closeBraces = (cleanedContent.match(/}/g) || []).length;
            if (openBraces > closeBraces) {
                this.logger.warn(`⚠️ JSON appears incomplete (${openBraces} open, ${closeBraces} close braces)`);
                const missingBraces = openBraces - closeBraces;
                cleanedContent += '\n' + '}'.repeat(missingBraces);
                this.logger.log(`🔧 Attempting to fix JSON by adding ${missingBraces} closing braces`);
            }
        }
        return cleanedContent;
    }
    async quickCall(userPrompt, options) {
        const response = await this.callLLM({
            userPrompt,
            ...options,
        });
        return response.content;
    }
    async callLLMJSON(options) {
        const response = await this.callLLM({
            ...options,
            responseFormat: 'json_object',
        });
        try {
            const parsed = JSON.parse(response.content);
            return { data: parsed, raw: response };
        }
        catch (error) {
            this.logger.error('Failed to parse JSON response', response.content);
            throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
exports.LLMService = LLMService;
exports.LLMService = LLMService = LLMService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], LLMService);
//# sourceMappingURL=llm.service.js.map