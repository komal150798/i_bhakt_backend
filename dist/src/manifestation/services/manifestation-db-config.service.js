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
var ManifestationDbConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestationDbConfigService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let ManifestationDbConfigService = ManifestationDbConfigService_1 = class ManifestationDbConfigService {
    constructor(categoryRepo, subcategoryRepo, keywordRepo, energyRuleRepo, ritualTemplateRepo, toManifestTemplateRepo, notToManifestTemplateRepo, alignmentTemplateRepo, insightTemplateRepo, summaryTemplateRepo, cacheRepo) {
        this.categoryRepo = categoryRepo;
        this.subcategoryRepo = subcategoryRepo;
        this.keywordRepo = keywordRepo;
        this.energyRuleRepo = energyRuleRepo;
        this.ritualTemplateRepo = ritualTemplateRepo;
        this.toManifestTemplateRepo = toManifestTemplateRepo;
        this.notToManifestTemplateRepo = notToManifestTemplateRepo;
        this.alignmentTemplateRepo = alignmentTemplateRepo;
        this.insightTemplateRepo = insightTemplateRepo;
        this.summaryTemplateRepo = summaryTemplateRepo;
        this.cacheRepo = cacheRepo;
        this.logger = new common_1.Logger(ManifestationDbConfigService_1.name);
        this.cache = null;
        this.cacheExpiry = 5 * 60 * 1000;
        this.lastCacheUpdate = 0;
    }
    async getBackendConfig() {
        const now = Date.now();
        if (this.cache && (now - this.lastCacheUpdate) < this.cacheExpiry) {
            return this.cache.config_json;
        }
        try {
            const cached = await this.cacheRepo.findOne({
                order: { updated_at: 'DESC' },
            });
            if (cached) {
                this.cache = cached;
                this.lastCacheUpdate = now;
                return cached.config_json;
            }
        }
        catch (error) {
            this.logger.warn('Cache table not available, loading from entities');
        }
        const config = await this.buildConfigFromDatabase();
        try {
            await this.updateCache(config);
        }
        catch (error) {
            this.logger.warn('Failed to update cache table', error);
        }
        return config;
    }
    async buildConfigFromDatabase() {
        const categories = await this.categoryRepo.find({
            where: { is_active: true },
            order: { label: 'ASC' },
        });
        const subcategories = await this.subcategoryRepo.find({
            where: { is_active: true },
            relations: ['category'],
            order: { label: 'ASC' },
        });
        const keywords = await this.keywordRepo.find({
            relations: ['category', 'subcategory'],
        });
        const energyRules = await this.energyRuleRepo.find({
            order: { weight: 'DESC' },
        });
        const [ritualTemplates, toManifestTemplates, notToManifestTemplates, alignmentTemplates, insightTemplates, summaryTemplates,] = await Promise.all([
            this.ritualTemplateRepo.find({
                where: { is_active: true },
                relations: ['category', 'subcategory'],
                order: { priority: 'ASC', created_at: 'ASC' },
            }),
            this.toManifestTemplateRepo.find({
                where: { is_active: true },
                relations: ['category', 'subcategory'],
                order: { priority: 'ASC', created_at: 'ASC' },
            }),
            this.notToManifestTemplateRepo.find({
                where: { is_active: true },
                relations: ['category', 'subcategory'],
                order: { priority: 'ASC', created_at: 'ASC' },
            }),
            this.alignmentTemplateRepo.find({
                where: { is_active: true },
                relations: ['category', 'subcategory'],
                order: { priority: 'ASC', created_at: 'ASC' },
            }),
            this.insightTemplateRepo.find({
                where: { is_active: true },
                relations: ['category'],
                order: { priority: 'ASC', created_at: 'ASC' },
            }),
            this.summaryTemplateRepo.find({
                where: { is_active: true },
                relations: ['category'],
                order: { priority: 'ASC', created_at: 'ASC' },
            }),
        ]);
        const categoryMap = {};
        const categoryKeywords = {};
        for (const category of categories) {
            const categorySubcategories = subcategories
                .filter((s) => s.category_id === category.id)
                .map((s) => s.slug);
            categoryMap[category.slug] = {
                id: category.slug,
                label: category.label,
                subcategories: categorySubcategories,
            };
            const catKeywords = keywords
                .filter((k) => k.category_id === category.id)
                .map((k) => k.keyword.toLowerCase());
            categoryKeywords[category.slug] = catKeywords;
        }
        const energyRulesMap = {};
        for (const rule of energyRules) {
            if (!energyRulesMap[rule.energy_state]) {
                energyRulesMap[rule.energy_state] = {
                    patterns: [],
                    description: rule.description || '',
                };
            }
            energyRulesMap[rule.energy_state].patterns.push(rule.pattern);
        }
        const buildTemplatesByCategory = (templates) => {
            const result = [];
            for (const template of templates) {
                result.push({
                    pattern: template.template_text,
                    category: template.category?.slug || 'all',
                    subcategory: template.subcategory?.slug || null,
                    priority: template.priority,
                });
            }
            return result;
        };
        const fallbackCategory = categories.find((c) => c.slug === 'other')?.slug || categories[0]?.slug || 'other';
        return {
            categories: Object.values(categoryMap),
            fallback_category: fallbackCategory,
            category_keywords: categoryKeywords,
            energy_rules: energyRulesMap,
            ritual_templates: buildTemplatesByCategory(ritualTemplates),
            to_manifest_templates: buildTemplatesByCategory(toManifestTemplates),
            not_to_manifest_templates: buildTemplatesByCategory(notToManifestTemplates),
            alignment_templates: buildTemplatesByCategory(alignmentTemplates),
            insight_templates: buildTemplatesByCategory(insightTemplates),
            summary_templates: buildTemplatesByCategory(summaryTemplates),
        };
    }
    async updateCache(config) {
        try {
            const existingRecords = await this.cacheRepo.find({
                take: 1,
                order: { updated_at: 'DESC' },
            });
            const existing = existingRecords.length > 0 ? existingRecords[0] : null;
            if (existing) {
                existing.config_json = config;
                existing.updated_at = new Date();
                await this.cacheRepo.save(existing);
                this.cache = existing;
            }
            else {
                const newCache = this.cacheRepo.create({
                    config_json: config,
                });
                await this.cacheRepo.save(newCache);
                this.cache = newCache;
            }
            this.lastCacheUpdate = Date.now();
        }
        catch (error) {
            this.logger.error('Failed to update cache', error);
        }
    }
    async invalidateCache() {
        this.cache = null;
        this.lastCacheUpdate = 0;
        try {
            await this.cacheRepo.clear();
        }
        catch (error) {
            this.logger.warn('Failed to clear cache table', error);
        }
    }
    async getTemplatesForCategory(categorySlug, subcategorySlug) {
        const category = await this.categoryRepo.findOne({
            where: { slug: categorySlug, is_active: true },
        });
        if (!category) {
            return {
                rituals: [],
                toManifest: [],
                notToManifest: [],
                alignment: [],
                insights: [],
                summaries: [],
            };
        }
        const subcategory = subcategorySlug
            ? await this.subcategoryRepo.findOne({
                where: { slug: subcategorySlug, category_id: category.id, is_active: true },
            })
            : null;
        const where = {
            is_active: true,
            category_id: category.id,
        };
        if (subcategory) {
            where.subcategory_id = subcategory.id;
        }
        const [rituals, toManifest, notToManifest, alignment, insights, summaries,] = await Promise.all([
            this.ritualTemplateRepo.find({
                where: subcategory ? { ...where, subcategory_id: subcategory.id } : { category_id: category.id, is_active: true, subcategory_id: null },
                order: { priority: 'ASC' },
            }),
            this.toManifestTemplateRepo.find({
                where: subcategory ? { ...where, subcategory_id: subcategory.id } : { category_id: category.id, is_active: true, subcategory_id: null },
                order: { priority: 'ASC' },
            }),
            this.notToManifestTemplateRepo.find({
                where: subcategory ? { ...where, subcategory_id: subcategory.id } : { category_id: category.id, is_active: true, subcategory_id: null },
                order: { priority: 'ASC' },
            }),
            this.alignmentTemplateRepo.find({
                where: subcategory ? { ...where, subcategory_id: subcategory.id } : { category_id: category.id, is_active: true, subcategory_id: null },
                order: { priority: 'ASC' },
            }),
            this.insightTemplateRepo.find({
                where: { category_id: category.id, is_active: true },
                order: { priority: 'ASC' },
            }),
            this.summaryTemplateRepo.find({
                where: { category_id: category.id, is_active: true },
                order: { priority: 'ASC' },
            }),
        ]);
        return {
            rituals: rituals.map((t) => t.template_text),
            toManifest: toManifest.map((t) => t.template_text),
            notToManifest: notToManifest.map((t) => t.template_text),
            alignment: alignment.map((t) => t.template_text),
            insights: insights.map((t) => t.template_text),
            summaries: summaries.map((t) => t.template_text),
        };
    }
    async getCategoryKeywords() {
        const keywords = await this.keywordRepo.find({
            relations: ['category'],
        });
        const result = {};
        for (const keyword of keywords) {
            if (keyword.category) {
                const slug = keyword.category.slug;
                if (!result[slug]) {
                    result[slug] = [];
                }
                for (let i = 0; i < keyword.weight; i++) {
                    result[slug].push(keyword.keyword.toLowerCase());
                }
            }
        }
        return result;
    }
    async getEnergyRules() {
        const rules = await this.energyRuleRepo.find({
            order: { weight: 'DESC' },
        });
        const result = {};
        for (const rule of rules) {
            if (!result[rule.energy_state]) {
                result[rule.energy_state] = {
                    patterns: [],
                    description: rule.description || '',
                };
            }
            result[rule.energy_state].patterns.push(rule.pattern);
        }
        return result;
    }
};
exports.ManifestationDbConfigService = ManifestationDbConfigService;
exports.ManifestationDbConfigService = ManifestationDbConfigService = ManifestationDbConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ManifestCategory)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ManifestSubcategory)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.ManifestKeyword)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.ManifestEnergyRule)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.ManifestRitualTemplate)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.ManifestToManifestTemplate)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.ManifestNotToManifestTemplate)),
    __param(7, (0, typeorm_1.InjectRepository)(entities_1.ManifestAlignmentTemplate)),
    __param(8, (0, typeorm_1.InjectRepository)(entities_1.ManifestInsightTemplate)),
    __param(9, (0, typeorm_1.InjectRepository)(entities_1.ManifestSummaryTemplate)),
    __param(10, (0, typeorm_1.InjectRepository)(entities_1.ManifestBackendCache)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ManifestationDbConfigService);
//# sourceMappingURL=manifestation-db-config.service.js.map