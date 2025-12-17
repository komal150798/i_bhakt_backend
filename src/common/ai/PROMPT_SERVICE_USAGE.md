# PromptService Usage Guide

## Overview

The `PromptService` provides a centralized, database-driven system for managing all AI prompts across the application. All prompts are stored in the `ai_prompts` table and cached in Redis for performance.

## Key Features

- ✅ **Database-driven**: All prompts stored in `ai_prompts` table
- ✅ **Redis caching**: Prompts cached for 1 hour for fast access
- ✅ **Variable replacement**: Support for `{{variable}}` placeholders
- ✅ **Admin management**: Full CRUD via `/admin/ai-prompts` endpoints
- ✅ **Auto cache clearing**: Cache automatically cleared when prompts updated
- ✅ **Model-agnostic**: Works with ChatGPT, Gemini, Claude, etc.

## Basic Usage

### 1. Import PromptService

```typescript
import { PromptService, PromptContext } from '../common/ai/prompt.service';

@Injectable()
export class YourAIService {
  constructor(private readonly promptService: PromptService) {}
}
```

### 2. Get a Prompt

```typescript
// Simple usage
const systemPrompt = await this.promptService.getPrompt('karma.classification.system');
console.log(systemPrompt.finalText); // Ready to use

// With variables
const userPrompt = await this.promptService.getPrompt(
  'manifestation.analysis.user',
  {
    manifestation_title: 'Find my soulmate',
    manifestation_text: 'I want to find true love...',
    category_label: 'Love & Relationships',
    language: 'en',
  }
);
```

### 3. Use in LLM Calls

```typescript
async classifyKarmaAction(text: string, userName?: string) {
  // Get prompts from database
  const systemPrompt = await this.promptService.getPrompt(
    'karma.classification.system',
    {
      user_name: userName || 'User',
      current_date: new Date().toISOString().split('T')[0],
    }
  );

  const userPrompt = await this.promptService.getPrompt(
    'karma.classification.user',
    {
      action_text: text,
    }
  );

  // Build messages for LLM
  const messages = [
    { role: 'system', content: systemPrompt.finalText },
    { role: 'user', content: userPrompt.finalText },
  ];

  // Call your LLM client
  const response = await this.llmClient.chat(messages);
  return this.parseResponse(response);
}
```

## Migration Example: Manifestation LLM Analyzer

### Before (Hardcoded Prompts)

```typescript
private buildUniversalPrompt(...): string {
  return `You are the "I-Bhakt Universal AI Engine"...
  
  IMPORTANT:
  - Do NOT use static or hardcoded texts.
  ...
  `;
}
```

### After (Using PromptService)

```typescript
async analyzeManifestation(
  title: string,
  description: string,
  backendConfig: ManifestationBackendConfig,
  categoryHint?: string,
): Promise<...> {
  // Get prompts from database
  const systemPrompt = await this.promptService.getPrompt(
    'manifestation.analysis.system',
    {
      backend_rules_json: JSON.stringify(backendConfig, null, 2),
      language: backendConfig.language_rules.default,
    }
  );

  const userPrompt = await this.promptService.getPrompt(
    'manifestation.analysis.user',
    {
      manifestation_title: title,
      manifestation_text: description,
      user_category_hint: categoryHint || 'null',
      current_date: new Date().toISOString().split('T')[0],
    }
  );

  // Build messages
  const messages = [
    { role: 'system', content: systemPrompt.finalText },
    { role: 'user', content: userPrompt.finalText },
  ];

  // Call LLM
  const response = await this.callLLM(messages);
  return this.parseLLMResponse(response, backendConfig);
}
```

## Prompt Key Naming Convention

Use dot notation: `{scope}.{function}.{type}`

Examples:
- `karma.classification.system`
- `karma.classification.user`
- `manifestation.analysis.system`
- `manifestation.analysis.user`
- `manifestation.dashboard.summary`
- `habit.plan.generator.system`
- `user_profile.insight.system`

## Variable Placeholders

Use `{{variable_name}}` in templates:

```typescript
// Template in database:
"Hello {{user_name}}, your manifestation '{{manifestation_title}}' is in the category {{category_label}}."

// Usage:
const prompt = await this.promptService.getPrompt('example.prompt', {
  user_name: 'John',
  manifestation_title: 'Find love',
  category_label: 'Love & Relationships',
});

// Result:
// "Hello John, your manifestation 'Find love' is in the category Love & Relationships."
```

## Special Variables

These are automatically replaced if not provided:
- `{{current_date}}` - Today's date (YYYY-MM-DD)
- `{{current_time}}` - Current timestamp (ISO)

## Admin Endpoints

### List Prompts
```bash
GET /admin/ai-prompts?scope=karma&type=system
```

### Get Prompt
```bash
GET /admin/ai-prompts/:id
```

### Create Prompt
```bash
POST /admin/ai-prompts
{
  "key": "karma.classification.system",
  "scope": "karma",
  "type": "system",
  "template": "You are a Karma Engine...",
  "description": "System prompt for karma classification"
}
```

### Update Prompt
```bash
PATCH /admin/ai-prompts/:id
{
  "template": "Updated prompt text...",
  "description": "Updated description"
}
```

### Delete Prompt (Soft Delete)
```bash
DELETE /admin/ai-prompts/:id
```

### Clear Cache
```bash
POST /admin/ai-prompts/:id/clear-cache
POST /admin/ai-prompts/clear-all-cache
```

## Best Practices

1. **Always use PromptService**: Never hardcode prompts in services
2. **Use descriptive keys**: Follow naming convention `scope.function.type`
3. **Document variables**: Add description explaining what variables are needed
4. **Version tracking**: Service automatically increments version on update
5. **Cache management**: Cache clears automatically on update, but you can manually clear if needed
6. **Fallback handling**: If prompt not found, service throws error - handle gracefully

## Error Handling

```typescript
try {
  const prompt = await this.promptService.getPrompt('some.key');
} catch (error) {
  if (error.message.includes('not found')) {
    // Use fallback prompt or log error
    this.logger.error('Prompt not found, using fallback');
    return this.getFallbackPrompt();
  }
  throw error;
}
```

## Testing

When testing, you can:
1. Create test prompts in database
2. Use `clearPromptCacheByKey()` to force reload
3. Mock PromptService in unit tests
