import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppConstant } from './entities/app-constant.entity';
import { AppConstants, getStaticConstant, getAllStaticConstants, hasStaticConstant } from './app.constants';

/**
 * Central Constants Service
 * Provides all keywords, words, sentences, and constants from database
 * NO hardcoded words anywhere - everything comes from here
 */
@Injectable()
export class ConstantsService {
  private readonly logger = new Logger(ConstantsService.name);
  private readonly cachePrefix = 'CONSTANTS:';
  private readonly cacheTtl = 3600; // 1 hour

  constructor(
    @InjectRepository(AppConstant)
    private readonly constantRepo: Repository<AppConstant>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get constant value by key
   * Cached for performance
   */
  async getConstant(key: string): Promise<string[] | Record<string, any> | null> {
    const cacheKey = `${this.cachePrefix}${key}`;

    try {
      // Check cache
      const cached = await this.cacheManager.get<string[] | Record<string, any>>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache read failed for constant ${key}`, error);
    }

    // Load from database
    const constant = await this.constantRepo.findOne({
      where: { key, is_active: true },
    });

    if (!constant) {
      this.logger.warn(`Constant not found: ${key}`);
      return null;
    }

    // Cache the value
    try {
      await this.cacheManager.set(cacheKey, constant.value, this.cacheTtl * 1000);
    } catch (error) {
      this.logger.warn(`Cache write failed for constant ${key}`, error);
    }

    return constant.value;
  }

  /**
   * Get constants by category
   */
  async getConstantsByCategory(category: string): Promise<AppConstant[]> {
    return this.constantRepo.find({
      where: { category, is_active: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get all constants (for admin)
   */
  async getAllConstants(filters?: {
    category?: string;
    is_active?: boolean;
  }): Promise<AppConstant[]> {
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.is_active !== undefined) where.is_active = filters.is_active;

    return this.constantRepo.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Clear cache for a constant
   */
  async clearConstantCache(key: string): Promise<void> {
    const cacheKey = `${this.cachePrefix}${key}`;
    try {
      await this.cacheManager.del(cacheKey);
    } catch (error) {
      this.logger.warn(`Failed to clear cache for constant ${key}`, error);
    }
  }

  /**
   * Clear all constant caches
   */
  async clearAllConstantCache(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      this.logger.warn('Failed to clear all constant caches', error);
    }
  }

  // Convenience methods for common constants

  /**
   * Get positive manifestation words
   */
  async getPositiveManifestationWords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.positive_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get negative manifestation words
   */
  async getNegativeManifestationWords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.negative_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get positive keywords (for resonance scoring)
   */
  async getPositiveKeywords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.positive_keywords');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get negative keywords (for blockage detection)
   */
  async getNegativeKeywords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.negative_keywords');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get category planets mapping
   */
  async getCategoryPlanets(): Promise<Record<string, any>> {
    const value = await this.getConstant('manifestation.category_planets');
    return value && typeof value === 'object' ? value : {};
  }

  /**
   * Get energy state patterns
   */
  async getEnergyStatePatterns(): Promise<Record<string, string[]>> {
    const value = await this.getConstant('manifestation.energy_state_patterns');
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, string[]>;
    }
    return {};
  }

  /**
   * Get intensity words
   */
  async getIntensityWords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.intensity_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get future tense words
   */
  async getFutureTenseWords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.future_tense_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get present tense words
   */
  async getPresentTenseWords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.present_tense_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get power words
   */
  async getPowerWords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.power_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get positive after I am words
   */
  async getPositiveAfterIAm(): Promise<string[]> {
    const value = await this.getConstant('manifestation.positive_after_i_am');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get action phrases
   */
  async getActionPhrases(): Promise<string[]> {
    const value = await this.getConstant('manifestation.action_phrases');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get belief words
   */
  async getBeliefWords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.belief_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get negative self talk patterns
   */
  async getNegativeSelfTalk(): Promise<string[]> {
    const value = await this.getConstant('manifestation.negative_self_talk');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get doubt words
   */
  async getDoubtWords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.doubt_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get limiting patterns
   */
  async getLimitingPatterns(): Promise<string[]> {
    const value = await this.getConstant('manifestation.limiting_patterns');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get specific indicators
   */
  async getSpecificIndicators(): Promise<string[]> {
    const value = await this.getConstant('manifestation.specific_indicators');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get vague words
   */
  async getVagueWords(): Promise<string[]> {
    const value = await this.getConstant('manifestation.vague_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get journal positive words
   */
  async getJournalPositiveWords(): Promise<string[]> {
    const value = await this.getConstant('journal.positive_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Get journal negative words
   */
  async getJournalNegativeWords(): Promise<string[]> {
    const value = await this.getConstant('journal.negative_words');
    return Array.isArray(value) ? value : [];
  }

  /**
   * Create or update a constant
   */
  async upsertConstant(
    key: string,
    category: string,
    name: string,
    value: string[] | Record<string, any>,
    description?: string,
  ): Promise<AppConstant> {
    let constant = await this.constantRepo.findOne({ where: { key } });

    if (constant) {
      constant.value = value;
      constant.name = name;
      constant.category = category;
      if (description) constant.description = description;
      constant.updated_at = new Date();
    } else {
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
    
    // Clear cache
    await this.clearConstantCache(key);

    return saved;
  }

  // ============================================================================
  // STATIC CONSTANTS (from app.constants.ts - not in database)
  // ============================================================================

  /**
   * Get static constant by category and optional key
   * These are defined in code, not database
   */
  getStaticConstant(category: keyof typeof AppConstants, key?: string): any {
    return getStaticConstant(category, key);
  }

  /**
   * Get all static constants in a category
   */
  getAllStaticConstants(category: keyof typeof AppConstants): any[] {
    return getAllStaticConstants(category);
  }

  /**
   * Check if a static constant exists
   */
  hasStaticConstant(
    category: keyof typeof AppConstants,
    value: string,
    field: string = 'value',
  ): boolean {
    return hasStaticConstant(category, value, field);
  }

  /**
   * Get API Categories (static constant)
   */
  getApiCategories(): Array<{ api_type: string; category_name: string; description: string }> {
    return AppConstants.API_CATEGORY;
  }

  /**
   * Get Manifestation Entry Types (static constant)
   */
  getManifestationEntryTypes(): Array<{ value: string; label: string; description: string }> {
    return AppConstants.MANIFESTATION_ENTRY_TYPES;
  }

  /**
   * Get Journal Entry Types (static constant)
   */
  getJournalEntryTypes(): Array<{ value: string; label: string; description: string }> {
    return AppConstants.JOURNAL_ENTRY_TYPES;
  }

  /**
   * Get Energy States (static constant - patterns in database)
   */
  getEnergyStates(): Array<{ value: string; label: string; description: string }> {
    return AppConstants.ENERGY_STATES;
  }

  /**
   * Get Manifestation Categories (static constant - keywords in database)
   */
  getManifestationCategories(): Array<{ value: string; label: string; icon: string }> {
    return AppConstants.MANIFESTATION_CATEGORIES;
  }

  /**
   * Get Karma Action Types (static constant)
   */
  getKarmaActionTypes(): Array<{ value: string; label: string; description: string }> {
    return AppConstants.KARMA_ACTION_TYPES;
  }

  /**
   * Get User Roles (static constant)
   */
  getUserRoles(): Array<{ value: string; label: string; description: string }> {
    return AppConstants.USER_ROLES;
  }

  /**
   * Get Subscription Status (static constant)
   */
  getSubscriptionStatus(): Array<{ value: string; label: string; description: string }> {
    return AppConstants.SUBSCRIPTION_STATUS;
  }

  /**
   * Get LLM Providers (static constant)
   */
  getLlmProviders(): Array<{ value: string; label: string; description: string }> {
    return AppConstants.LLM_PROVIDERS;
  }

  /**
   * Get Prompt Types (static constant)
   */
  getPromptTypes(): Array<{ value: string; label: string; description: string }> {
    return AppConstants.PROMPT_TYPES;
  }

  /**
   * Get Constant Categories (static constant)
   */
  getConstantCategories(): Array<{ value: string; label: string; description: string }> {
    return AppConstants.CONSTANT_CATEGORIES;
  }
}

