import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { AppConstant } from './entities/app-constant.entity';
import { AppConstants } from './app.constants';
export declare class ConstantsService {
    private readonly constantRepo;
    private cacheManager;
    private readonly logger;
    private readonly cachePrefix;
    private readonly cacheTtl;
    constructor(constantRepo: Repository<AppConstant>, cacheManager: Cache);
    getConstant(key: string): Promise<string[] | Record<string, any> | null>;
    getConstantsByCategory(category: string): Promise<AppConstant[]>;
    getAllConstants(filters?: {
        category?: string;
        is_active?: boolean;
    }): Promise<AppConstant[]>;
    clearConstantCache(key: string): Promise<void>;
    clearAllConstantCache(): Promise<void>;
    getPositiveManifestationWords(): Promise<string[]>;
    getNegativeManifestationWords(): Promise<string[]>;
    getPositiveKeywords(): Promise<string[]>;
    getNegativeKeywords(): Promise<string[]>;
    getCategoryPlanets(): Promise<Record<string, any>>;
    getEnergyStatePatterns(): Promise<Record<string, string[]>>;
    getIntensityWords(): Promise<string[]>;
    getFutureTenseWords(): Promise<string[]>;
    getPresentTenseWords(): Promise<string[]>;
    getPowerWords(): Promise<string[]>;
    getPositiveAfterIAm(): Promise<string[]>;
    getActionPhrases(): Promise<string[]>;
    getBeliefWords(): Promise<string[]>;
    getNegativeSelfTalk(): Promise<string[]>;
    getDoubtWords(): Promise<string[]>;
    getLimitingPatterns(): Promise<string[]>;
    getSpecificIndicators(): Promise<string[]>;
    getVagueWords(): Promise<string[]>;
    getJournalPositiveWords(): Promise<string[]>;
    getJournalNegativeWords(): Promise<string[]>;
    upsertConstant(key: string, category: string, name: string, value: string[] | Record<string, any>, description?: string): Promise<AppConstant>;
    getStaticConstant(category: keyof typeof AppConstants, key?: string): any;
    getAllStaticConstants(category: keyof typeof AppConstants): any[];
    hasStaticConstant(category: keyof typeof AppConstants, value: string, field?: string): boolean;
    getApiCategories(): Array<{
        api_type: string;
        category_name: string;
        description: string;
    }>;
    getManifestationEntryTypes(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
    getJournalEntryTypes(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
    getEnergyStates(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
    getManifestationCategories(): Array<{
        value: string;
        label: string;
        icon: string;
    }>;
    getKarmaActionTypes(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
    getUserRoles(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
    getSubscriptionStatus(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
    getLlmProviders(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
    getPromptTypes(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
    getConstantCategories(): Array<{
        value: string;
        label: string;
        description: string;
    }>;
}
