import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ManifestCategory, ManifestSubcategory, ManifestKeyword, ManifestEnergyRule, ManifestRitualTemplate, ManifestToManifestTemplate, ManifestNotToManifestTemplate, ManifestAlignmentTemplate, ManifestInsightTemplate, ManifestSummaryTemplate } from '../entities';
export declare class SeedManifestationMasterDataService implements OnModuleInit {
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
    private readonly logger;
    constructor(categoryRepo: Repository<ManifestCategory>, subcategoryRepo: Repository<ManifestSubcategory>, keywordRepo: Repository<ManifestKeyword>, energyRuleRepo: Repository<ManifestEnergyRule>, ritualTemplateRepo: Repository<ManifestRitualTemplate>, toManifestTemplateRepo: Repository<ManifestToManifestTemplate>, notToManifestTemplateRepo: Repository<ManifestNotToManifestTemplate>, alignmentTemplateRepo: Repository<ManifestAlignmentTemplate>, insightTemplateRepo: Repository<ManifestInsightTemplate>, summaryTemplateRepo: Repository<ManifestSummaryTemplate>);
    onModuleInit(): Promise<void>;
    private seedCategories;
    private seedSubcategories;
    private seedKeywords;
    private seedEnergyRules;
    private seedTemplates;
    private seedRitualTemplates;
    private seedToManifestTemplates;
    private seedNotToManifestTemplates;
    private seedAlignmentTemplates;
    private seedInsightTemplates;
    private seedSummaryTemplates;
}
