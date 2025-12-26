import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export enum LLMProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  CLAUDE = 'claude',
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

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;
  private readonly geminiBaseUrl: string;
  private readonly claudeBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || '';
    this.geminiBaseUrl = this.configService.get<string>('GEMINI_BASE_URL') || '';
    this.claudeBaseUrl = this.configService.get<string>('CLAUDE_BASE_URL') || '';

    this.logger.log(
      `🔧 LLM Service initialized - OpenAI: ${this.openaiBaseUrl ? '✅' : '❌'}, Gemini: ${this.geminiBaseUrl ? '✅' : '❌'}, Claude: ${this.claudeBaseUrl ? '✅' : '❌'}`,
    );
  }

  /**
   * Call LLM API with support for OpenAI, Gemini, and Claude
   * This is the main method to use for all LLM API calls
   */
  async callLLM(options: LLMRequestOptions): Promise<LLMResponse> {
    const {
      systemPrompt = '',
      userPrompt,
      model,
      temperature = 0.7,
      maxTokens = 2000,
      responseFormat = 'json_object',
      timeout = 30000,
      maxRetries = 3,
      provider,
    } = options;

    // Determine provider
    const selectedProvider =
      (provider as LLMProvider) ||
      (this.configService.get<string>('LLM_PROVIDER') as LLMProvider) ||
      LLMProvider.OPENAI;

    // Get model from options or config
    const selectedModel =
      model || this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

    this.logger.log(
      `📤 LLM Request - Provider: ${selectedProvider}, Model: ${selectedModel}`,
    );

    // Prepare request based on provider
    const { apiUrl, requestBody, headers } = this.prepareRequest(
      selectedProvider,
      selectedModel,
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      responseFormat,
    );

    // Retry logic for rate limit errors (429)
    let lastError: any = null;
    const baseDelay = 2000; // 2 seconds

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.log(`🔄 Retry attempt ${attempt}/${maxRetries}...`);
        }

        const response = await firstValueFrom(
          this.httpService.post(apiUrl, requestBody, {
            headers,
            timeout,
          }),
        );

        // Success - process response
        this.logger.log(`📥 LLM API response status: ${response.status}`);

        const content = this.extractContent(response.data, selectedProvider);

        if (!content) {
          this.logger.error(
            '❌ No content in LLM response',
            JSON.stringify(response.data, null, 2),
          );
          throw new Error('No content in LLM response');
        }

        this.logger.log(`📥 LLM response content length: ${content.length} chars`);

        // Clean and return content
        const cleanedContent = this.cleanContent(content, selectedProvider);

        // Extract usage information if available
        const usage = this.extractUsage(response.data, selectedProvider);

        return {
          content: cleanedContent,
          provider: selectedProvider,
          model: selectedModel,
          usage,
        };
      } catch (error: any) {
        lastError = error;

        // Check if it's a 429 rate limit error
        if (error.response?.status === 429 && attempt < maxRetries) {
          const retryAfter =
            error.response?.headers?.['retry-after'] ||
            error.response?.headers?.['x-ratelimit-reset-requests'];
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : baseDelay * Math.pow(2, attempt);

          this.logger.warn(
            `⚠️ Rate limit (429) - Attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delay / 1000}s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        // Not a 429 or max retries reached - throw error
        if (attempt === maxRetries) {
          this.logger.error(
            `❌ LLM API call failed after ${maxRetries} retries: ${error.message}`,
          );
          throw error;
        }
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      throw lastError;
    }

    throw new Error('LLM API call failed after retries');
  }

  /**
   * Prepare request URL, body, and headers based on provider
   */
  private prepareRequest(
    provider: LLMProvider | string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number,
    responseFormat: 'json_object' | 'text',
  ): { apiUrl: string; requestBody: any; headers: Record<string, string> } {
    let apiUrl: string;
    let requestBody: any;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider === LLMProvider.GEMINI) {
      if (!this.geminiBaseUrl) {
        throw new Error(
          'GEMINI_BASE_URL is required in .env file. Example: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
        );
      }
      if (!this.openaiApiKey) {
        throw new Error('OPENAI_API_KEY (Gemini API key) is required in .env file');
      }

      // Gemini API requires API key as query parameter, not header
      const separator = this.geminiBaseUrl.includes('?') ? '&' : '?';
      apiUrl = `${this.geminiBaseUrl}${separator}key=${this.openaiApiKey}`;

      // Combine prompts for Gemini (doesn't support system messages)
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
          responseMimeType:
            responseFormat === 'json_object' ? 'application/json' : 'text/plain',
        },
      };
    } else if (provider === LLMProvider.CLAUDE) {
      if (!this.claudeBaseUrl) {
        throw new Error(
          'CLAUDE_BASE_URL is required in .env file. Example: https://api.anthropic.com/v1/messages',
        );
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
    } else {
      // Default: OpenAI
      if (!this.openaiBaseUrl) {
        throw new Error(
          'OPENAI_BASE_URL is required in .env file. Example: https://api.openai.com/v1',
        );
      }
      if (!this.openaiApiKey) {
        throw new Error('OPENAI_API_KEY is required in .env file');
      }

      apiUrl = `${this.openaiBaseUrl}/chat/completions`;
      headers['Authorization'] = `Bearer ${this.openaiApiKey}`;

      const messages: any[] = [];
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

  /**
   * Extract content from response based on provider
   */
  private extractContent(responseData: any, provider: LLMProvider | string): string {
    if (provider === LLMProvider.GEMINI) {
      const candidate = responseData?.candidates?.[0];

      // Check if response was blocked or incomplete
      if (candidate?.finishReason) {
        if (candidate.finishReason === 'MAX_TOKENS') {
          this.logger.warn(
            '⚠️ Gemini response truncated due to MAX_TOKENS limit - consider increasing maxOutputTokens',
          );
        } else if (candidate.finishReason === 'SAFETY') {
          this.logger.warn('⚠️ Gemini response blocked due to safety filters');
          throw new Error('Gemini response blocked by safety filters');
        } else if (candidate.finishReason === 'RECITATION') {
          this.logger.warn('⚠️ Gemini response blocked due to recitation policy');
          throw new Error('Gemini response blocked by recitation policy');
        }
      }

      return candidate?.content?.parts?.[0]?.text || '';
    } else if (provider === LLMProvider.CLAUDE) {
      return responseData?.content?.[0]?.text || '';
    } else {
      // OpenAI
      return responseData?.choices?.[0]?.message?.content || '';
    }
  }

  /**
   * Extract usage information from response
   */
  private extractUsage(
    responseData: any,
    provider: LLMProvider | string,
  ): LLMResponse['usage'] | undefined {
    if (provider === LLMProvider.GEMINI) {
      const usageMetadata = responseData?.usageMetadata;
      if (usageMetadata) {
        return {
          promptTokens: usageMetadata.promptTokenCount,
          completionTokens: usageMetadata.candidatesTokenCount,
          totalTokens: usageMetadata.totalTokenCount,
        };
      }
    } else if (provider === LLMProvider.CLAUDE) {
      const usage = responseData?.usage;
      if (usage) {
        return {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
        };
      }
    } else {
      // OpenAI
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

  /**
   * Clean content - remove markdown code blocks, fix JSON issues
   */
  private cleanContent(
    content: string,
    provider: LLMProvider | string,
  ): string {
    let cleanedContent = content.trim();

    // Remove markdown code blocks
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Gemini-specific JSON fixes
    if (provider === LLMProvider.GEMINI) {
      // Remove control characters that break JSON parsing
      cleanedContent = cleanedContent.replace(/[\x00-\x1F\x7F]/g, '');

      // Check if JSON appears incomplete
      const openBraces = (cleanedContent.match(/{/g) || []).length;
      const closeBraces = (cleanedContent.match(/}/g) || []).length;

      if (openBraces > closeBraces) {
        this.logger.warn(
          `⚠️ JSON appears incomplete (${openBraces} open, ${closeBraces} close braces)`,
        );

        // Try to fix incomplete JSON
        const missingBraces = openBraces - closeBraces;
        cleanedContent += '\n' + '}'.repeat(missingBraces);
        this.logger.log(
          `🔧 Attempting to fix JSON by adding ${missingBraces} closing braces`,
        );
      }
    }

    return cleanedContent;
  }

  /**
   * Simple method for quick LLM calls with just a user prompt
   */
  async quickCall(
    userPrompt: string,
    options?: Partial<LLMRequestOptions>,
  ): Promise<string> {
    const response = await this.callLLM({
      userPrompt,
      ...options,
    });
    return response.content;
  }

  /**
   * Method for JSON responses - automatically parses JSON
   */
  async callLLMJSON<T = any>(
    options: LLMRequestOptions,
  ): Promise<{ data: T; raw: LLMResponse }> {
    const response = await this.callLLM({
      ...options,
      responseFormat: 'json_object',
    });

    try {
      const parsed = JSON.parse(response.content);
      return { data: parsed, raw: response };
    } catch (error) {
      this.logger.error('Failed to parse JSON response', response.content);
      throw new Error(
        `Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}



