import { Repository } from 'typeorm';
import { ManifestCategory, ManifestSubcategory, ManifestKeyword, ManifestEnergyRule, ManifestRitualTemplate, ManifestToManifestTemplate, ManifestNotToManifestTemplate, ManifestAlignmentTemplate, ManifestInsightTemplate, ManifestSummaryTemplate, ManifestBackendCache } from '../entities';
export declare class ManifestationDbConfigService {
    private readonly categoryRepo;
    private readonly subcategoryRepo;
    private readonly keywordRepo;
    private readonly energyRuleRepo;
    private readonly ritualTemplateRepo;
    private readonly toManifestTemplateRepo;
    private readonly notToManifestTemplateRepo;
    private readonly alignmentTemplateRepo;
    private readonly insightTemplateRepo;
    private readonly summaryTemplateRepo;
    private readonly cacheRepo;
    private readonly logger;
    private cache;
    private cacheExpiry;
    private lastCacheUpdate;
    constructor(categoryRepo: Repository<ManifestCategory>, subcategoryRepo: Repository<ManifestSubcategory>, keywordRepo: Repository<ManifestKeyword>, energyRuleRepo: Repository<ManifestEnergyRule>, ritualTemplateRepo: Repository<ManifestRitualTemplate>, toManifestTemplateRepo: Repository<ManifestToManifestTemplate>, notToManifestTemplateRepo: Repository<ManifestNotToManifestTemplate>, alignmentTemplateRepo: Repository<ManifestAlignmentTemplate>, insightTemplateRepo: Repository<ManifestInsightTemplate>, summaryTemplateRepo: Repository<ManifestSummaryTemplate>, cacheRepo: Repository<ManifestBackendCache>);
    getBackendConfig(): Promise<any>;
    private buildConfigFromDatabase;
    private updateCache;
    invalidateCache(): Promise<void>;
    getTemplatesForCategory(categorySlug: string, subcategorySlug?: string): Promise<{
        rituals: string[];
        toManifest: string[];
        notToManifest: string[];
        alignment: string[];
        insights: string[];
        summaries: string[];
    }>;
    getCategoryKeywords(): Promise<Record<string, string[]>>;
    getEnergyRules(): Promise<Record<string, {
        patterns: string[];
        description: string;
    }>>;
}
