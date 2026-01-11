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
var ConstantsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstantsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_2 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const app_constant_entity_1 = require("./entities/app-constant.entity");
const app_constants_1 = require("./app.constants");
let ConstantsService = ConstantsService_1 = class ConstantsService {
    constructor(constantRepo, cacheManager) {
        this.constantRepo = constantRepo;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(ConstantsService_1.name);
        this.cachePrefix = 'CONSTANTS:';
        this.cacheTtl = 3600;
    }
    async getConstant(key) {
        const cacheKey = `${this.cachePrefix}${key}`;
        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        catch (error) {
            this.logger.warn(`Cache read failed for constant ${key}`, error);
        }
        const constant = await this.constantRepo.findOne({
            where: { key, is_active: true },
        });
        if (!constant) {
            this.logger.warn(`Constant not found: ${key}`);
            return null;
        }
        try {
            await this.cacheManager.set(cacheKey, constant.value, this.cacheTtl * 1000);
        }
        catch (error) {
            this.logger.warn(`Cache write failed for constant ${key}`, error);
        }
        return constant.value;
    }
    async getConstantsByCategory(category) {
        return this.constantRepo.find({
            where: { category, is_active: true },
            order: { name: 'ASC' },
        });
    }
    async getAllConstants(filters) {
        const where = {};
        if (filters?.category)
            where.category = filters.category;
        if (filters?.is_active !== undefined)
            where.is_active = filters.is_active;
        return this.constantRepo.find({
            where,
            order: { category: 'ASC', name: 'ASC' },
        });
    }
    async clearConstantCache(key) {
        const cacheKey = `${this.cachePrefix}${key}`;
        try {
            await this.cacheManager.del(cacheKey);
        }
        catch (error) {
            this.logger.warn(`Failed to clear cache for constant ${key}`, error);
        }
    }
    async clearAllConstantCache() {
        try {
            await this.cacheManager.reset();
        }
        catch (error) {
            this.logger.warn('Failed to clear all constant caches', error);
        }
    }
    async getPositiveManifestationWords() {
        const value = await this.getConstant('manifestation.positive_words');
        return Array.isArray(value) ? value : [];
    }
    async getNegativeManifestationWords() {
        const value = await this.getConstant('manifestation.negative_words');
        return Array.isArray(value) ? value : [];
    }
    async getPositiveKeywords() {
        const value = await this.getConstant('manifestation.positive_keywords');
        return Array.isArray(value) ? value : [];
    }
    async getNegativeKeywords() {
        const value = await this.getConstant('manifestation.negative_keywords');
        return Array.isArray(value) ? value : [];
    }
    async getCategoryPlanets() {
        const value = await this.getConstant('manifestation.category_planets');
        return value && typeof value === 'object' ? value : {};
    }
    async getEnergyStatePatterns() {
        const value = await this.getConstant('manifestation.energy_state_patterns');
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value;
        }
        return {};
    }
    async getIntensityWords() {
        const value = await this.getConstant('manifestation.intensity_words');
        return Array.isArray(value) ? value : [];
    }
    async getFutureTenseWords() {
        const value = await this.getConstant('manifestation.future_tense_words');
        return Array.isArray(value) ? value : [];
    }
    async getPresentTenseWords() {
        const value = await this.getConstant('manifestation.present_tense_words');
        return Array.isArray(value) ? value : [];
    }
    async getPowerWords() {
        const value = await this.getConstant('manifestation.power_words');
        return Array.isArray(value) ? value : [];
    }
    async getPositiveAfterIAm() {
        const value = await this.getConstant('manifestation.positive_after_i_am');
        return Array.isArray(value) ? value : [];
    }
    async getActionPhrases() {
        const value = await this.getConstant('manifestation.action_phrases');
        return Array.isArray(value) ? value : [];
    }
    async getBeliefWords() {
        const value = await this.getConstant('manifestation.belief_words');
        return Array.isArray(value) ? value : [];
    }
    async getNegativeSelfTalk() {
        const value = await this.getConstant('manifestation.negative_self_talk');
        return Array.isArray(value) ? value : [];
    }
    async getDoubtWords() {
        const value = await this.getConstant('manifestation.doubt_words');
        return Array.isArray(value) ? value : [];
    }
    async getLimitingPatterns() {
        const value = await this.getConstant('manifestation.limiting_patterns');
        return Array.isArray(value) ? value : [];
    }
    async getSpecificIndicators() {
        const value = await this.getConstant('manifestation.specific_indicators');
        return Array.isArray(value) ? value : [];
    }
    async getVagueWords() {
        const value = await this.getConstant('manifestation.vague_words');
        return Array.isArray(value) ? value : [];
    }
    async getJournalPositiveWords() {
        const value = await this.getConstant('journal.positive_words');
        return Array.isArray(value) ? value : [];
    }
    async getJournalNegativeWords() {
        const value = await this.getConstant('journal.negative_words');
        return Array.isArray(value) ? value : [];
    }
    async upsertConstant(key, category, name, value, description) {
        let constant = await this.constantRepo.findOne({ where: { key } });
        if (constant) {
            constant.value = value;
            constant.name = name;
            constant.category = category;
            if (description)
                constant.description = description;
            constant.updated_at = new Date();
        }
        else {
            constant = this.constantRepo.create({
                key,
                category,
                name,
                value,
                description: description || null,
                is_active: true,
            });
        }
        const saved = await this.constantRepo.save(constant);
        await this.clearConstantCache(key);
        return saved;
    }
    getStaticConstant(category, key) {
        return (0, app_constants_1.getStaticConstant)(category, key);
    }
    getAllStaticConstants(category) {
        return (0, app_constants_1.getAllStaticConstants)(category);
    }
    hasStaticConstant(category, value, field = 'value') {
        return (0, app_constants_1.hasStaticConstant)(category, value, field);
    }
    getApiCategories() {
        return app_constants_1.AppConstants.API_CATEGORY;
    }
    getManifestationEntryTypes() {
        return app_constants_1.AppConstants.MANIFESTATION_ENTRY_TYPES;
    }
    getJournalEntryTypes() {
        return app_constants_1.AppConstants.JOURNAL_ENTRY_TYPES;
    }
    getEnergyStates() {
        return app_constants_1.AppConstants.ENERGY_STATES;
    }
    getManifestationCategories() {
        return app_constants_1.AppConstants.MANIFESTATION_CATEGORIES;
    }
    getKarmaActionTypes() {
        return app_constants_1.AppConstants.KARMA_ACTION_TYPES;
    }
    getUserRoles() {
        return app_constants_1.AppConstants.USER_ROLES;
    }
    getSubscriptionStatus() {
        return app_constants_1.AppConstants.SUBSCRIPTION_STATUS;
    }
    getLlmProviders() {
        return app_constants_1.AppConstants.LLM_PROVIDERS;
    }
    getPromptTypes() {
        return app_constants_1.AppConstants.PROMPT_TYPES;
    }
    getConstantCategories() {
        return app_constants_1.AppConstants.CONSTANT_CATEGORIES;
    }
};
exports.ConstantsService = ConstantsService;
exports.ConstantsService = ConstantsService = ConstantsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(app_constant_entity_1.AppConstant)),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], ConstantsService);
//# sourceMappingURL=constants.service.js.map