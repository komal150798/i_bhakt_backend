import { ManifestationEnhancedService } from '../services/manifestation-enhanced.service';
import { CreateManifestationEnhancedDto } from '../dtos/create-manifestation-enhanced.dto';
export declare class AppManifestationEnhancedController {
    private readonly manifestationService;
    constructor(manifestationService: ManifestationEnhancedService);
    createManifestation(dto: CreateManifestationEnhancedDto, user: any): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            unique_id: string;
            title: string;
            category: string;
            category_label: string;
            resonance_score: number;
            alignment_score: number;
            antrashaakti_score: number;
            mahaadha_score: number;
            astro_support_index: number;
            mfp_score: number;
            tips: {
                rituals?: string[];
                what_to_manifest?: string[];
                what_not_to_manifest?: string[];
                thought_alignment?: string[];
                daily_actions?: string[];
            };
            insights: {
                ai_narrative?: string;
                astro_insights?: string;
                energy_state?: "aligned" | "unstable" | "blocked";
                keyword_analysis?: Record<string, any>;
                emotional_charge?: string;
                category_label?: string;
                summary_for_ui?: string;
                energy_reason?: string;
            };
            summary_for_ui: string;
            added_date: Date;
        };
    }>;
    getDashboard(user: any): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            summary: {
                top_resonance: number;
                alignment_score: number;
                astro_support: number;
                energy_state: "aligned" | "unstable" | "blocked";
            };
            manifestations: Array<{
                id: number;
                title: string;
                description: string;
                resonance_score: number | null;
                alignment_score: number | null;
                coherence_score: number | null;
                mfp_score: number | null;
                astro_support_index: number | null;
                is_archived: boolean;
                is_locked: boolean;
                added_date: Date;
                category: string | null;
                category_label: string | null;
                action_windows: any;
                progress_tracking: any;
            }>;
        };
    }>;
    getManifestation(id: number, user: any): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            unique_id: string;
            title: string;
            description: string;
            category: string;
            category_label: string;
            emotional_state: string;
            target_date: Date;
            resonance_score: number;
            alignment_score: number;
            antrashaakti_score: number;
            mahaadha_score: number;
            astro_support_index: number;
            mfp_score: number;
            tips: {
                rituals?: string[];
                what_to_manifest?: string[];
                what_not_to_manifest?: string[];
                thought_alignment?: string[];
                daily_actions?: string[];
            };
            insights: {
                ai_narrative?: string;
                astro_insights?: string;
                energy_state?: "aligned" | "unstable" | "blocked";
                keyword_analysis?: Record<string, any>;
                emotional_charge?: string;
                category_label?: string;
                summary_for_ui?: string;
                energy_reason?: string;
            };
            summary_for_ui: string;
            is_archived: boolean;
            is_locked: boolean;
            added_date: Date;
            modify_date: Date;
        };
    }>;
    archiveManifestation(id: number, user: any): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            is_archived: boolean;
        };
    }>;
    toggleLockManifestation(id: number, user: any): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            is_locked: boolean;
        };
    }>;
    getTips(id: number, user: any): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            tips: {
                rituals?: string[];
                what_to_manifest?: string[];
                what_not_to_manifest?: string[];
                thought_alignment?: string[];
                daily_actions?: string[];
            };
        };
    }>;
    getAllManifestations(user: any): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            unique_id: string;
            title: string;
            description: string;
            category: string;
            resonance_score: number;
            mfp_score: number;
            is_archived: boolean;
            is_locked: boolean;
            added_date: Date;
        }[];
    }>;
    calculateResonance(body: {
        description: string;
    }, user: any): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            resonance_score: number;
            category: string;
            category_label: string;
            manifestation_class: string;
            manifestation_class_label: string;
            supportive_factors: Array<{
                type: string;
                description: string;
                score: number;
                weightage: number;
                period?: string;
            }>;
            challenging_factors: Array<{
                type: string;
                description: string;
                impact: number;
                weightage: number;
            }>;
            dasha_resonance: {
                mahadasha: {
                    lord: string;
                    supportive: number;
                    challenging: number;
                    period: string;
                };
                antardasha: {
                    lord: string;
                    supportive: number;
                    challenging: number;
                    period: string;
                };
                pratyantar: {
                    lord: string;
                    supportive: number;
                    challenging: number;
                    period: string;
                };
                sukshma: {
                    lord: string;
                    supportive: number;
                    challenging: number;
                    period: string;
                };
            };
            tips: any;
            insights: any;
        };
    }>;
}
