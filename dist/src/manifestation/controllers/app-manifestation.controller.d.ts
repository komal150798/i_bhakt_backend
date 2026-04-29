import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { ManifestationEnhancedService } from '../services/manifestation-enhanced.service';
import { CreateManifestationEnhancedDto } from '../dtos/create-manifestation-enhanced.dto';
import { AddAlignmentActionsDto, CommitIntentionDto } from '../dtos/alignment-action.dto';
import { CalculateResonanceDto } from '../dtos/calculate-resonance.dto';
import { AddDailyProgressEntryDto, UpdateDailyProgressEntryDto } from '../dtos/daily-progress-entry.dto';
export declare class AppManifestationController {
    private readonly manifestationService;
    constructor(manifestationService: ManifestationEnhancedService);
    createManifestation(dto: CreateManifestationEnhancedDto, user: CurrentUserPayload): Promise<{
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
            coherence_score: number;
        };
    }>;
    getDashboard(user: CurrentUserPayload): Promise<{
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
            plan: {
                plan_type: import("../../common/enums/plan-type.enum").PlanType;
                monthly_limit: number | null;
                monthly_used: number;
                monthly_remaining: number | null;
                can_create_manifestation: boolean;
            };
        };
    }>;
    getAllManifestations(user: CurrentUserPayload): Promise<{
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
            alignment_score: number;
            antrashaakti_score: number;
            mahaadha_score: number;
            astro_support_index: number;
            mfp_score: number;
            coherence_score: number;
            is_archived: boolean;
            is_locked: boolean;
            added_date: Date;
        }[];
    }>;
    calculateResonance(dto: CalculateResonanceDto, user: CurrentUserPayload): Promise<{
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
    addAlignmentActionsToKarma(dto: AddAlignmentActionsDto, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            added_count: number;
            total_karma_score: number;
            actions_added: Array<{
                id: number;
                title: string;
                karma_score: number;
            }>;
        };
    }>;
    commitIntention(dto: CommitIntentionDto, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            title: string;
            is_committed: boolean;
            committed_at: string;
            commitment_message: string | null;
            target_date: string | null;
        };
    }>;
    addDailyProgressEntry(dto: AddDailyProgressEntryDto, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            manifestation_id: number;
            entry_date: Date;
            action_text: string;
        };
    }>;
    getDailyProgressEntries(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            manifestation_id: number;
            entry_date: Date;
            action_text: string;
            added_date: Date;
        }[];
    }>;
    updateDailyProgressEntry(entryId: number, dto: UpdateDailyProgressEntryDto, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            manifestation_id: number;
            entry_date: Date;
            action_text: string;
        };
    }>;
    deleteDailyProgressEntry(entryId: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
    }>;
    getManifestation(id: number, user: CurrentUserPayload): Promise<{
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
            coherence_score: number;
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
            daily_progress_entries: {
                id: number;
                manifestation_id: number;
                entry_date: Date;
                action_text: string;
                added_date: Date;
            }[];
            is_archived: boolean;
            is_locked: boolean;
            added_date: Date;
            modify_date: Date;
        };
    }>;
    archiveManifestation(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            is_archived: boolean;
        };
    }>;
    toggleLockManifestation(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            is_locked: boolean;
        };
    }>;
    getTips(id: number, user: CurrentUserPayload): Promise<{
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
    getResonanceScoreBreakdown(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            overall_score: number;
            clarity_score: number;
            emotional_coherence: number;
            karma_influence: number;
            astrological_support: number;
            insight: string;
        };
    }>;
    getAlignmentActions(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            actions: Array<{
                id: number;
                title: string;
                description: string;
                icon: string;
                effort_level: "Low" | "Medium" | "High";
                karma_score: number;
                category: string;
            }>;
        };
    }>;
    getCosmicSupportIndex(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            current_mahadasha: {
                lord: string;
                description: string;
                status: "Supportive" | "Neutral" | "Challenging";
            };
            current_antardasha: {
                lord: string;
                description: string;
                status: "Supportive" | "Neutral" | "Challenging";
            };
            current_pratyantar: {
                lord: string;
                description: string;
                status: "Supportive" | "Neutral" | "Challenging";
            };
            guidance_message: string;
        };
    }>;
    getAlignmentSummary(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            manifestation_title: string;
            resonance_score: number;
            resonance_label: string;
            cosmic_support_status: "Supportive" | "Neutral" | "Challenging";
            cosmic_support_period: string;
            commitment_status: "Not Committed" | "Consciously Committed";
            active_alignment_actions: Array<{
                id: number;
                title: string;
                icon: string;
                karma_score: number;
            }>;
        };
    }>;
    getJourneyTimeline(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            total_progress: number;
            phases: Array<{
                id: string;
                title: string;
                description: string;
                date_range: string;
                status: "Completed" | "In Progress" | "Upcoming";
                progress_percentage?: number;
            }>;
            current_phase: {
                id: string;
                title: string;
                insight: string;
                resonance_score: number;
            };
        };
    }>;
    deleteManifestation(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        code: number;
        message: string;
    }>;
}
