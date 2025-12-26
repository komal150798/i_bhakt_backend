import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ManifestCategory,
  ManifestSubcategory,
  ManifestKeyword,
  ManifestEnergyRule,
  ManifestRitualTemplate,
  ManifestToManifestTemplate,
  ManifestNotToManifestTemplate,
  ManifestAlignmentTemplate,
  ManifestInsightTemplate,
  ManifestSummaryTemplate,
  ManifestBackendCache,
} from '../entities';

/**
 * Database-driven Configuration Service for Manifestation Analysis
 * Loads all categories, subcategories, keywords, templates, and rules from database
 * This replaces static configuration with dynamic database-driven system
 */
@Injectable()
export class ManifestationDbConfigService {
  private readonly logger = new Logger(ManifestationDbConfigService.name);
  private cache: ManifestBackendCache | null = null;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  constructor(
    @InjectRepository(ManifestCategory)
    private readonly categoryRepo: Repository<ManifestCategory>,
    @InjectRepository(ManifestSubcategory)
    private readonly subcategoryRepo: Repository<ManifestSubcategory>,
    @InjectRepository(ManifestKeyword)
    private readonly keywordRepo: Repository<ManifestKeyword>,
    @InjectRepository(ManifestEnergyRule)
    private readonly energyRuleRepo: Repository<ManifestEnergyRule>,
    @InjectRepository(ManifestRitualTemplate)
    private readonly ritualTemplateRepo: Repository<ManifestRitualTemplate>,
    @InjectRepository(ManifestToManifestTemplate)
    private readonly toManifestTemplateRepo: Repository<ManifestToManifestTemplate>,
    @InjectRepository(ManifestNotToManifestTemplate)
    private readonly notToManifestTemplateRepo: Repository<ManifestNotToManifestTemplate>,
    @InjectRepository(ManifestAlignmentTemplate)
    private readonly alignmentTemplateRepo: Repository<ManifestAlignmentTemplate>,
    @InjectRepository(ManifestInsightTemplate)
    private readonly insightTemplateRepo: Repository<ManifestInsightTemplate>,
    @InjectRepository(ManifestSummaryTemplate)
    private readonly summaryTemplateRepo: Repository<ManifestSummaryTemplate>,
    @InjectRepository(ManifestBackendCache)
    private readonly cacheRepo: Repository<ManifestBackendCache>,
  ) {}

  /**
   * Get complete backend configuration from database
   * Uses caching for performance
   */
  async getBackendConfig(): Promise<any> {
    // Check cache first
    const now = Date.now();
    if (this.cache && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return this.cache.config_json;
    }

    try {
      // Try to load from cache table
      const cached = await this.cacheRepo.findOne({
        order: { updated_at: 'DESC' },
      });

      if (cached) {
        this.cache = cached;
        this.lastCacheUpdate = now;
        return cached.config_json;
      }
    } catch (error) {
      this.logger.warn('Cache table not available, loading from entities');
    }

    // Build config from database entities
    const config = await this.buildConfigFromDatabase();
    
    // Save to cache table
    try {
      await this.updateCache(config);
    } catch (error) {
      this.logger.warn('Failed to update cache table', error);
    }

    return config;
  }

  /**
   * Build configuration object from all database entities
   */
  private async buildConfigFromDatabase(): Promise<any> {
    // Load all active categories
    const categories = await this.categoryRepo.find({
      where: { is_active: true },
      order: { label: 'ASC' },
    });

    // Load all active subcategories
    const subcategories = await this.subcategoryRepo.find({
      where: { is_active: true },
      relations: ['category'],
      order: { label: 'ASC' },
    });

    // Load all keywords
    const keywords = await this.keywordRepo.find({
      relations: ['category', 'subcategory'],
    });

    // Load all energy rules
    const energyRules = await this.energyRuleRepo.find({
      order: { weight: 'DESC' },
    });

    // Load all templates
    const [
      ritualTemplates,
      toManifestTemplates,
      notToManifestTemplates,
      alignmentTemplates,
      insightTemplates,
      summaryTemplates,
    ] = await Promise.all([
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

    // Build category structure
    const categoryMap: Record<string, any> = {};
    const categoryKeywords: Record<string, string[]> = {};

    for (const category of categories) {
      const categorySubcategories = subcategories
        .filter((s) => s.category_id === category.id)
        .map((s) => s.slug);

      categoryMap[category.slug] = {
        id: category.slug,
        label: category.label,
        subcategories: categorySubcategories,
      };

      // Build keyword arrays
      const catKeywords = keywords
        .filter((k) => k.category_id === category.id)
        .map((k) => k.keyword.toLowerCase());
      categoryKeywords[category.slug] = catKeywords;
    }

    // Build energy rules structure
    const energyRulesMap: Record<string, any> = {};
    for (const rule of energyRules) {
      if (!energyRulesMap[rule.energy_state]) {
        energyRulesMap[rule.energy_state] = {
          patterns: [],
          description: rule.description || '',
        };
      }
      energyRulesMap[rule.energy_state].patterns.push(rule.pattern);
    }

    // Build templates structure
    const buildTemplatesByCategory = (templates: any[]) => {
      const result: any[] = [];
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

    // Find fallback category (usually 'other')
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

  /**
   * Update cache table with latest configuration
   */
  private async updateCache(config: any): Promise<void> {
    try {
      // Use find with take(1) and orderBy instead of findOne without where clause
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
      } else {
        const newCache = this.cacheRepo.create({
          config_json: config,
        });
        await this.cacheRepo.save(newCache);
        this.cache = newCache;
      }
      this.lastCacheUpdate = Date.now();
    } catch (error) {
      this.logger.error('Failed to update cache', error);
    }
  }

  /**
   * Invalidate cache (call this when categories/templates are updated)
   */
  async invalidateCache(): Promise<void> {
    this.cache = null;
    this.lastCacheUpdate = 0;
    // Optionally clear cache table
    try {
      await this.cacheRepo.clear();
    } catch (error) {
      this.logger.warn('Failed to clear cache table', error);
    }
  }

  /**
   * Get templates for a specific category
   */
  async getTemplatesForCategory(
    categorySlug: string,
    subcategorySlug?: string,
  ): Promise<{
    rituals: string[];
    toManifest: string[];
    notToManifest: string[];
    alignment: string[];
    insights: string[];
    summaries: string[];
  }> {
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

    const where: any = {
      is_active: true,
      category_id: category.id,
    };

    if (subcategory) {
      where.subcategory_id = subcategory.id;
    }

    const [
      rituals,
      toManifest,
      notToManifest,
      alignment,
      insights,
      summaries,
    ] = await Promise.all([
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

  /**
   * Get keywords for category detection
   */
  async getCategoryKeywords(): Promise<Record<string, string[]>> {
    const keywords = await this.keywordRepo.find({
      relations: ['category'],
    });

    const result: Record<string, string[]> = {};
    for (const keyword of keywords) {
      if (keyword.category) {
        const slug = keyword.category.slug;
        if (!result[slug]) {
          result[slug] = [];
        }
        // Add keyword multiple times based on weight
        for (let i = 0; i < keyword.weight; i++) {
          result[slug].push(keyword.keyword.toLowerCase());
        }
      }
    }

    return result;
  }

  /**
   * Get energy rules
   */
  async getEnergyRules(): Promise<Record<string, { patterns: string[]; description: string }>> {
    const rules = await this.energyRuleRepo.find({
      order: { weight: 'DESC' },
    });

    const result: Record<string, { patterns: string[]; description: string }> = {};
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
}
