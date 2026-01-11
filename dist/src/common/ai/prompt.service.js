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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PromptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const ai_prompt_entity_1 = require("./entities/ai-prompt.entity");
const redis_config_service_1 = require("../../cache/redis-config.service");
let PromptService = PromptService_1 = class PromptService {
    constructor(promptRepo, cacheManager, redisConfig) {
        this.promptRepo = promptRepo;
        this.cacheManager = cacheManager;
        this.redisConfig = redisConfig;
        this.logger = new common_1.Logger(PromptService_1.name);
        this.cachePrefix = 'PROMPT:';
        this.cacheTtl = 3600;
    }
    async getPrompt(key, context) {
        const cacheKey = this.getCacheKey(key);
        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                const promptData = JSON.parse(cached);
                this.logger.log(`📦 Found cached prompt ${key} v${promptData.version}, verifying against database...`);
                const dbVersionResult = await this.promptRepo
                    .createQueryBuilder('prompt')
                    .select('prompt.version', 'version')
                    .where('prompt.key = :key', { key })
                    .andWhere('prompt.is_active = :isActive', { isActive: true })
                    .getRawOne();
                const dbVersion = dbVersionResult?.version;
                if (!dbVersion) {
                    this.logger.warn(`❌ Prompt ${key} not found in database, clearing cache`);
                    await this.cacheManager.del(cacheKey);
                }
                else if (dbVersion !== promptData.version) {
                    this.logger.warn(`⚠️ Cache version mismatch for ${key}: cached v${promptData.version} vs DB v${dbVersion}. Clearing cache and reloading.`);
                    await this.cacheManager.del(cacheKey);
                }
                else {
                    this.logger.log(`✅ Using cached prompt ${key} v${promptData.version} (matches DB v${dbVersion})`);
                    const finalText = this.replaceVariables(promptData.template, context);
                    return {
                        ...promptData,
                        finalText,
                    };
                }
            }
            else {
                this.logger.log(`📭 No cache found for ${key}, loading from database...`);
            }
        }
        catch (error) {
            this.logger.warn(`Cache read failed for key ${key}, loading from DB`, error);
        }
        const prompt = await this.promptRepo.findOne({
            where: { key, is_active: true },
        });
        if (!prompt) {
            this.logger.error(`Prompt not found: ${key}`);
            throw new Error(`Prompt not found: ${key}`);
        }
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
            await this.cacheManager.set(cacheKey, JSON.stringify(promptData), this.cacheTtl * 1000);
            this.logger.debug(`Cached prompt ${key} v${prompt.version}`);
        }
        catch (error) {
            this.logger.warn(`Cache write failed for key ${key}`, error);
        }
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
    async getPromptsByScope(scope, context) {
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
    async getPromptsByScopeAndType(scope, type, context) {
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
    async clearPromptCacheByKey(key) {
        const cacheKey = this.getCacheKey(key);
        try {
            await this.cacheManager.del(cacheKey);
            this.logger.log(`Cleared cache for prompt: ${key}`);
        }
        catch (error) {
            this.logger.error(`Failed to clear cache for key ${key}`, error);
        }
    }
    async clearAllPromptCache() {
        try {
            await this.cacheManager.reset();
            this.logger.log('Cleared all prompt caches');
        }
        catch (error) {
            this.logger.error('Failed to clear all prompt caches', error);
        }
    }
    replaceVariables(template, context) {
        if (!context || Object.keys(context).length === 0) {
            return template;
        }
        let result = template;
        const variablePattern = /\{\{(\w+)\}\}/g;
        const matches = template.matchAll(variablePattern);
        for (const match of matches) {
            const fullMatch = match[0];
            const variableName = match[1];
            const value = context[variableName];
            if (value !== undefined && value !== null) {
                result = result.replace(fullMatch, String(value));
            }
            else {
                result = result.replace(fullMatch, '');
                this.logger.warn(`Variable ${variableName} not found in context, replaced with empty string`);
            }
        }
        if (context.current_date === undefined) {
            result = result.replace(/\{\{current_date\}\}/g, new Date().toISOString().split('T')[0]);
        }
        if (context.current_time === undefined) {
            result = result.replace(/\{\{current_time\}\}/g, new Date().toISOString());
        }
        return result;
    }
    getCacheKey(key) {
        return `${this.redisConfig.keyPrefix}${this.cachePrefix}${key}`;
    }
    async getAllPrompts(filters) {
        const where = {};
        if (filters?.scope)
            where.scope = filters.scope;
        if (filters?.type)
            where.type = filters.type;
        if (filters?.language)
            where.language = filters.language;
        if (filters?.is_active !== undefined)
            where.is_active = filters.is_active;
        return this.promptRepo.find({
            where,
            order: { scope: 'ASC', key: 'ASC' },
        });
    }
    async getPromptById(id) {
        return this.promptRepo.findOne({ where: { id } });
    }
    async createPrompt(promptData) {
        const prompt = this.promptRepo.create(promptData);
        return this.promptRepo.save(prompt);
    }
    async updatePrompt(id, updateData) {
        const prompt = await this.promptRepo.findOne({ where: { id } });
        if (!prompt) {
            throw new Error(`Prompt not found: ${id}`);
        }
        updateData.version = (prompt.version || 1) + 1;
        updateData.updated_at = new Date();
        await this.promptRepo.update(id, updateData);
        await this.clearPromptCacheByKey(prompt.key);
        return this.promptRepo.findOne({ where: { id } });
    }
    async deletePrompt(id) {
        const prompt = await this.promptRepo.findOne({ where: { id } });
        if (!prompt) {
            throw new Error(`Prompt not found: ${id}`);
        }
        await this.promptRepo.update(id, { is_active: false, updated_at: new Date() });
        await this.clearPromptCacheByKey(prompt.key);
    }
};
exports.PromptService = PromptService;
exports.PromptService = PromptService = PromptService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ai_prompt_entity_1.AIPrompt)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object, redis_config_service_1.RedisConfigService])
], PromptService);
//# sourceMappingURL=prompt.service.js.map