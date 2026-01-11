import { User } from '../../users/entities/user.entity';
import { ManifestationLLMAnalyzerService } from './manifestation-llm-analyzer.service';
import { ManifestationBackendConfigService } from './manifestation-backend-config.service';
import { ConstantsService } from '../../common/constants/constants.service';
export interface ManifestationScores {
    resonance_score: number;
    alignment_score: number;
    antrashaakti_score: number;
    mahaadha_score: number;
    astro_support_index: number;
    mfp_score: number;
    coherence_score: number;
}
export interface ManifestationTips {
    rituals: string[];
    what_to_manifest: string[];
    what_not_to_manifest: string[];
    thought_alignment: string[];
    daily_actions: string[];
}
export interface ManifestationInsights {
    ai_narrative: string;
    astro_insights: string;
    energy_state: 'aligned' | 'unstable' | 'blocked';
    energy_reason?: string;
    keyword_analysis: Record<string, any>;
    emotional_charge: string;
    summary_for_ui?: string;
    category_label?: string;
}
export declare class ManifestationAIEvaluationService {
    private readonly llmAnalyzer;
    private readonly backendConfigService;
    private readonly constantsService;
    private readonly logger;
    constructor(llmAnalyzer: ManifestationLLMAnalyzerService, backendConfigService: ManifestationBackendConfigService, constantsService: ConstantsService);
    private getPositiveKeywords;
    private getNegativeKeywords;
    private getCategoryPlanets;
    private detectCategoryWithBackendConfig;
    private detectCategory;
    evaluateManifestation(title: string, description: string, category?: string, user?: User): Promise<{
        scores: ManifestationScores;
        tips: ManifestationTips;
        insights: ManifestationInsights;
        detectedCategory?: string;
    }>;
    private fallbackEvaluation;
    private mapEnergyState;
    private detectEmotionalCharge;
    private computeResonanceScore;
    private computeAlignmentScore;
    private computeAntrashaaktiScore;
    private computeMahaadhaScore;
    private computeAstroSupportIndex;
    private computeMFPScore;
    private generateTips;
    private generateInsights;
}
