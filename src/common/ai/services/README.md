# LLM Service - Common Utility for AI API Calls

This service provides a standardized way to call OpenAI, Gemini, and Claude APIs from anywhere in the backend.

## Features

- ✅ Support for multiple LLM providers (OpenAI, Gemini, Claude)
- ✅ Automatic retry logic for rate limits (429 errors)
- ✅ Response parsing and cleaning (handles JSON, markdown code blocks)
- ✅ Usage tracking (token counts)
- ✅ Error handling and logging
- ✅ Type-safe interfaces

## Setup

The service is already exported from `AIPromptModule`, so you just need to import `AIPromptModule` in your module:

```typescript
import { AIPromptModule } from '../../common/ai/ai-prompt.module';

@Module({
  imports: [
    AIPromptModule, // This exports LLMService
    // ... other imports
  ],
  // ...
})
export class YourModule {}
```

## Usage Examples

### Basic Usage - Simple Text Response

```typescript
import { LLMService } from '../../common/ai/services/llm.service';

@Injectable()
export class YourService {
  constructor(private readonly llmService: LLMService) {}

  async someMethod() {
    // Simple call with just user prompt
    const response = await this.llmService.quickCall(
      'Analyze this text: "I helped my neighbor today"'
    );
    console.log(response); // Text response
  }
}
```

### Advanced Usage - With System Prompt and Options

```typescript
import { LLMService, LLMProvider } from '../../common/ai/services/llm.service';

@Injectable()
export class YourService {
  constructor(private readonly llmService: LLMService) {}

  async analyzeText(text: string) {
    const response = await this.llmService.callLLM({
      systemPrompt: 'You are a helpful assistant that analyzes text.',
      userPrompt: `Analyze this text: "${text}"`,
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
      responseFormat: 'json_object',
      provider: LLMProvider.OPENAI, // Optional: defaults to LLM_PROVIDER env var
      timeout: 30000,
      maxRetries: 3,
    });

    console.log(response.content); // Cleaned response text
    console.log(response.provider); // 'openai' | 'gemini' | 'claude'
    console.log(response.model); // Model used
    console.log(response.usage); // Token usage info
  }
}
```

### JSON Response - Automatic Parsing

```typescript
import { LLMService } from '../../common/ai/services/llm.service';

interface ClassificationResult {
  type: 'good' | 'bad' | 'neutral';
  confidence: number;
  category: string;
}

@Injectable()
export class YourService {
  constructor(private readonly llmService: LLMService) {}

  async classifyAction(text: string): Promise<ClassificationResult> {
    const { data } = await this.llmService.callLLMJSON<ClassificationResult>({
      systemPrompt: 'You are a classification assistant.',
      userPrompt: `Classify this action: "${text}"`,
      maxTokens: 500,
    });

    // data is already parsed as ClassificationResult
    return data;
  }
}
```

### Using with PromptService (Database-driven Prompts)

```typescript
import { LLMService } from '../../common/ai/services/llm.service';
import { PromptService } from '../../common/ai/prompt.service';

@Injectable()
export class YourService {
  constructor(
    private readonly llmService: LLMService,
    private readonly promptService: PromptService,
  ) {}

  async analyzeWithDatabasePrompts(text: string) {
    // Get prompts from database
    const systemPrompt = await this.promptService.getPrompt(
      'your.prompt.key.system',
      {}
    );
    
    const userPrompt = await this.promptService.getPrompt(
      'your.prompt.key.user',
      { text }
    );

    // Use with LLM service
    const response = await this.llmService.callLLM({
      systemPrompt: systemPrompt.finalText,
      userPrompt: userPrompt.finalText,
      responseFormat: 'json_object',
    });

    return JSON.parse(response.content);
  }
}
```

## Configuration

The service reads configuration from environment variables:

```env
# Provider selection (default: openai)
LLM_PROVIDER=openai  # or 'gemini' or 'claude'

# OpenAI Configuration
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# Gemini Configuration
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent
# Note: Uses OPENAI_API_KEY for Gemini API key

# Claude Configuration
CLAUDE_BASE_URL=https://api.anthropic.com/v1/messages
# Note: Uses OPENAI_API_KEY for Claude API key
```

## API Reference

### `callLLM(options: LLMRequestOptions): Promise<LLMResponse>`

Main method for calling LLM APIs.

**Options:**
- `systemPrompt?: string` - System instruction prompt
- `userPrompt: string` - User request prompt (required)
- `model?: string` - Model name (defaults to OPENAI_MODEL env var)
- `temperature?: number` - Temperature (0-1, default: 0.7)
- `maxTokens?: number` - Max tokens (default: 2000)
- `responseFormat?: 'json_object' | 'text'` - Response format (default: 'json_object')
- `timeout?: number` - Request timeout in ms (default: 30000)
- `maxRetries?: number` - Max retry attempts (default: 3)
- `provider?: LLMProvider | string` - Provider override (default: LLM_PROVIDER env var)

**Returns:**
```typescript
{
  content: string;        // Cleaned response text
  provider: string;       // Provider used
  model: string;          // Model used
  usage?: {               // Token usage (if available)
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}
```

### `quickCall(userPrompt: string, options?: Partial<LLMRequestOptions>): Promise<string>`

Quick method for simple text responses.

**Returns:** Just the response content as a string.

### `callLLMJSON<T>(options: LLMRequestOptions): Promise<{ data: T; raw: LLMResponse }>`

Method for JSON responses with automatic parsing.

**Returns:**
- `data: T` - Parsed JSON response
- `raw: LLMResponse` - Full response object

## Error Handling

The service automatically:
- Retries on 429 (rate limit) errors with exponential backoff
- Cleans JSON responses (removes markdown code blocks, fixes incomplete JSON)
- Handles provider-specific response formats
- Logs errors and warnings

## Migration Guide

### Before (Direct HTTP calls):
```typescript
const response = await firstValueFrom(
  this.httpService.post(apiUrl, requestBody, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
    timeout: 30000,
  })
);
const content = response.data.choices[0]?.message?.content || '';
```

### After (Using LLM Service):
```typescript
const response = await this.llmService.callLLM({
  systemPrompt: 'Your system prompt',
  userPrompt: 'Your user prompt',
});
const content = response.content;
```

## Best Practices

1. **Use database-driven prompts**: Combine with `PromptService` for maintainable prompts
2. **Handle errors gracefully**: Wrap calls in try-catch blocks
3. **Use appropriate timeouts**: Adjust timeout based on expected response size
4. **Monitor usage**: Check `response.usage` for token consumption
5. **Choose the right provider**: Test different providers for your use case

## Support

For issues or questions, check the service logs or contact the backend team.



