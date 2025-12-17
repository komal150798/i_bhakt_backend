import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AIPrompt } from './entities/ai-prompt.entity';
import { RedisConfigService } from '../../cache/redis-config.service';

/**
 * Context variables for prompt template replacement
 */
export interface PromptContext {
  [key: string]: any; // dynamic values: category, user name, scores, etc.
}

/**
 * Resolved prompt with both template and final text
 */
export interface ResolvedPrompt {
  key: string;
  scope: string;
  type: string; // system/user
  language: string;
  template: string; // original template
  finalText: string; // template after variable replacement
  modelHint?: string;
  version: number;
}

/**
 * PromptService - Central service for managing all AI prompts
 * 
 * Features:
 * - Fetches prompts from database
 * - Caches prompts in Redis for performance
 * - Handles variable replacement in templates
 * - Provides clean API for any module to request prompts
 */
@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly cachePrefix = 'PROMPT:';
  private readonly cacheTtl = 3600; // 1 hour in seconds

  constructor(
    @InjectRepository(AIPrompt)
    private readonly promptRepo: Repository<AIPrompt>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redisConfig: RedisConfigService,
  ) {}

  /**
   * Get a prompt by key with variable replacement
   * 
   * @param key - Unique prompt key (e.g., 'karma.classification.system')
   * @param context - Variables to replace in template (e.g., { user_name: 'John' })
   * @returns Resolved prompt with finalText ready to use
   */
  async getPrompt(key: string, context?: PromptContext): Promise<ResolvedPrompt> {
    const cacheKey = this.getCacheKey(key);

    try {
      // 1. Check Redis cache
      const cached = await this.cacheManager.get<string>(cacheKey);
      if (cached) {
        const promptData = JSON.parse(cached);
        const finalText = this.replaceVariables(promptData.template, context);
        return {
          ...promptData,
          finalText,
        };
      }
    } catch (error) {
      this.logger.warn(`Cache read failed for key ${key}, loading from DB`, error);
    }

    // 2. Load from database
    const prompt = await this.promptRepo.findOne({
      where: { key, is_active: true },
    });

    if (!prompt) {
      this.logger.error(`Prompt not found: ${key}`);
      throw new Error(`Prompt not found: ${key}`);
    }

    // 3. Store in cache
    try {
      const promptData = {
        key: prompt.key,
        scope: prompt.scope,
        type: prompt.type,
        language: prompt.language,
        template: prompt.template,
        modelHint: prompt.model_hint,
        version: prompt.version,
      };
      await this.cacheManager.set(
        cacheKey,
        JSON.stringify(promptData),
        this.cacheTtl * 1000, // Convert to milliseconds
      );
    } catch (error) {
      this.logger.warn(`Cache write failed for key ${key}`, error);
    }

    // 4. Apply variable replacement
    const finalText = this.replaceVariables(prompt.template, context);

    return {
      key: prompt.key,
      scope: prompt.scope,
      type: prompt.type,
      language: prompt.language,
      template: prompt.template,
      finalText,
      modelHint: prompt.model_hint || undefined,
      version: prompt.version,
    };
  }

  /**
   * Get multiple prompts by scope
   * Useful when multiple prompts needed together (e.g. one system + one user prompt)
   * 
   * @param scope - Scope to filter by (e.g., 'karma', 'manifestation')
   * @param context - Variables to replace in templates
   * @returns Array of resolved prompts
   */
  async getPromptsByScope(scope: string, context?: PromptContext): Promise<ResolvedPrompt[]> {
    const prompts = await this.promptRepo.find({
      where: { scope, is_active: true },
      order: { type: 'ASC', key: 'ASC' },
    });

    return prompts.map((prompt) => {
      const finalText = this.replaceVariables(prompt.template, context);
      return {
        key: prompt.key,
        scope: prompt.scope,
        type: prompt.type,
        language: prompt.language,
        template: prompt.template,
        finalText,
        modelHint: prompt.model_hint || undefined,
        version: prompt.version,
      };
    });
  }

  /**
   * Get prompts by scope and type
   * 
   * @param scope - Scope to filter by
   * @param type - Type to filter by ('system', 'user', etc.)
   * @param context - Variables to replace in templates
   * @returns Array of resolved prompts
   */
  async getPromptsByScopeAndType(
    scope: string,
    type: string,
    context?: PromptContext,
  ): Promise<ResolvedPrompt[]> {
    const prompts = await this.promptRepo.find({
      where: { scope, type, is_active: true },
      order: { key: 'ASC' },
    });

    return prompts.map((prompt) => {
      const finalText = this.replaceVariables(prompt.template, context);
      return {
        key: prompt.key,
        scope: prompt.scope,
        type: prompt.type,
        language: prompt.language,
        template: prompt.template,
        finalText,
        modelHint: prompt.model_hint || undefined,
        version: prompt.version,
      };
    });
  }

  /**
   * Clear cache for a specific prompt key
   * Call this when a prompt is updated via admin
   * 
   * @param key - Prompt key to clear from cache
   */
  async clearPromptCacheByKey(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    try {
      await this.cacheManager.del(cacheKey);
      this.logger.log(`Cleared cache for prompt: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to clear cache for key ${key}`, error);
    }
  }

  /**
   * Clear all prompt caches
   * Use this for bulk updates or when you want to force reload all prompts
   */
  async clearAllPromptCache(): Promise<void> {
    try {
      // Note: cache-manager doesn't have a direct way to delete by pattern
      // We'll need to reset the entire cache or track keys separately
      // For now, we'll reset the cache manager
      await this.cacheManager.reset();
      this.logger.log('Cleared all prompt caches');
    } catch (error) {
      this.logger.error('Failed to clear all prompt caches', error);
    }
  }

  /**
   * Replace variables in template using context
   * 
   * Format: {{variable_name}}
   * 
   * @param template - Template string with placeholders
   * @param context - Context object with variable values
   * @returns Template with variables replaced
   */
  private replaceVariables(template: string, context?: PromptContext): string {
    if (!context || Object.keys(context).length === 0) {
      return template;
    }

    let result = template;

    // Find all {{variable}} patterns
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = template.matchAll(variablePattern);

    for (const match of matches) {
      const fullMatch = match[0]; // e.g., '{{user_name}}'
      const variableName = match[1]; // e.g., 'user_name'

      // Get value from context
      const value = context[variableName];

      // Replace with value or empty string if not found
      if (value !== undefined && value !== null) {
        result = result.replace(fullMatch, String(value));
      } else {
        // Option: leave as is or replace with empty string
        // For now, we'll replace with empty string
        result = result.replace(fullMatch, '');
        this.logger.warn(`Variable ${variableName} not found in context, replaced with empty string`);
      }
    }

    // Handle special variables
    if (context.current_date === undefined) {
      result = result.replace(/\{\{current_date\}\}/g, new Date().toISOString().split('T')[0]);
    }
    if (context.current_time === undefined) {
      result = result.replace(/\{\{current_time\}\}/g, new Date().toISOString());
    }

    return result;
  }

  /**
   * Get cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${this.redisConfig.keyPrefix}${this.cachePrefix}${key}`;
  }

  /**
   * Get all active prompts (for admin listing)
   */
  async getAllPrompts(filters?: {
    scope?: string;
    type?: string;
    language?: string;
    is_active?: boolean;
  }): Promise<AIPrompt[]> {
    const where: any = {};
    if (filters?.scope) where.scope = filters.scope;
    if (filters?.type) where.type = filters.type;
    if (filters?.language) where.language = filters.language;
    if (filters?.is_active !== undefined) where.is_active = filters.is_active;

    return this.promptRepo.find({
      where,
      order: { scope: 'ASC', key: 'ASC' },
    });
  }

  /**
   * Get prompt by ID (for admin editing)
   */
  async getPromptById(id: string): Promise<AIPrompt | null> {
    return this.promptRepo.findOne({ where: { id } });
  }

  /**
   * Create a new prompt
   */
  async createPrompt(promptData: Partial<AIPrompt>): Promise<AIPrompt> {
    const prompt = this.promptRepo.create(promptData);
    return this.promptRepo.save(prompt);
  }

  /**
   * Update a prompt
   * Automatically increments version and clears cache
   */
  async updatePrompt(id: string, updateData: Partial<AIPrompt>): Promise<AIPrompt> {
    const prompt = await this.promptRepo.findOne({ where: { id } });
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }

    // Increment version
    updateData.version = (prompt.version || 1) + 1;
    updateData.updated_at = new Date();

    await this.promptRepo.update(id, updateData);

    // Clear cache for this prompt
    await this.clearPromptCacheByKey(prompt.key);

    return this.promptRepo.findOne({ where: { id } }) as Promise<AIPrompt>;
  }

  /**
   * Delete a prompt (soft delete by setting is_active = false)
   */
  async deletePrompt(id: string): Promise<void> {
    const prompt = await this.promptRepo.findOne({ where: { id } });
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }

    // Soft delete
    await this.promptRepo.update(id, { is_active: false, updated_at: new Date() });

    // Clear cache
    await this.clearPromptCacheByKey(prompt.key);
  }
}
