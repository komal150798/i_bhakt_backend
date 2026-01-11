import { ConfigService } from '@nestjs/config';
import { ManifestationDbConfigService } from './manifestation-db-config.service';
export declare class ManifestationBackendConfigService {
    private readonly configService;
    private readonly dbConfigService?;
    private readonly logger;
    private dbConfigCache;
    private useDatabase;
    constructor(configService: ConfigService, dbConfigService?: ManifestationDbConfigService);
    getBackendConfig(): Promise<ManifestationBackendConfig>;
    getBackendConfigSync(): ManifestationBackendConfig;
    private transformDbConfigToBackendConfig;
    private getStaticBackendConfig;
}
export interface ManifestationBackendConfig {
    categories: Array<{
        id: string;
        label: string;
        subcategories: string[];
    }>;
    fallback_category: string;
    category_keywords: Record<string, string[]>;
    energy_rules: Record<string, {
        patterns: string[];
        description: string;
    }>;
    ritual_templates: Array<{
        pattern: string;
        category: string;
        category_color?: string;
        category_specific_action?: string;
    }>;
    what_to_manifest_templates: Array<{
        pattern: string;
        condition: string;
    }>;
    what_not_to_manifest_templates: Array<{
        pattern: string;
        condition: string;
    }>;
    thought_alignment_templates: Array<{
        pattern: string;
        condition: string;
    }>;
    insight_templates: Array<{
        pattern: string;
        condition: string;
    }>;
    summary_template: string;
    scoring_rules: {
        resonance_base: number;
        alignment_base: number;
        antrashaakti_base: number;
        mahaadha_base: number;
        word_count_bonus_per_10_words: number;
        positive_keyword_bonus: number;
        negative_keyword_penalty: number;
        clarity_bonus: number;
        specificity_bonus: number;
    };
    language_rules: {
        default: string;
        supported: string[];
    };
}
