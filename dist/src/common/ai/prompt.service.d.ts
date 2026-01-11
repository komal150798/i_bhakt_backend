import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { AIPrompt } from './entities/ai-prompt.entity';
import { RedisConfigService } from '../../cache/redis-config.service';
export interface PromptContext {
    [key: string]: any;
}
export interface ResolvedPrompt {
    key: string;
    scope: string;
    type: string;
    language: string;
    template: string;
    finalText: string;
    modelHint?: string;
    version: number;
}
export declare class PromptService {
    private readonly promptRepo;
    private cacheManager;
    private readonly redisConfig;
    private readonly logger;
    private readonly cachePrefix;
    private readonly cacheTtl;
    constructor(promptRepo: Repository<AIPrompt>, cacheManager: Cache, redisConfig: RedisConfigService);
    getPrompt(key: string, context?: PromptContext): Promise<ResolvedPrompt>;
    getPromptsByScope(scope: string, context?: PromptContext): Promise<ResolvedPrompt[]>;
    getPromptsByScopeAndType(scope: string, type: string, context?: PromptContext): Promise<ResolvedPrompt[]>;
    clearPromptCacheByKey(key: string): Promise<void>;
    clearAllPromptCache(): Promise<void>;
    private replaceVariables;
    private getCacheKey;
    getAllPrompts(filters?: {
        scope?: string;
        type?: string;
        language?: string;
        is_active?: boolean;
    }): Promise<AIPrompt[]>;
    getPromptById(id: string): Promise<AIPrompt | null>;
    createPrompt(promptData: Partial<AIPrompt>): Promise<AIPrompt>;
    updatePrompt(id: string, updateData: Partial<AIPrompt>): Promise<AIPrompt>;
    deletePrompt(id: string): Promise<void>;
}
