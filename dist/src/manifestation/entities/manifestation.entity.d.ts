import { BaseEntity } from '../../common/entities/base.entity';
export declare class Manifestation extends BaseEntity {
    user_id: number;
    title: string;
    description: string;
    category: string | null;
    emotional_state: string | null;
    target_date: Date | null;
    resonance_score: number | null;
    alignment_score: number | null;
    antrashaakti_score: number | null;
    mahaadha_score: number | null;
    astro_support_index: number | null;
    mfp_score: number | null;
    coherence_score: number | null;
    action_windows: {
        optimal_dates?: string[];
        next_optimal_date?: string;
        planetary_influences?: Array<{
            date: string;
            planet: string;
            influence: 'positive' | 'neutral' | 'negative';
            description: string;
        }>;
    } | null;
    progress_tracking: {
        current_progress: number;
        journal_entries_count: number;
        last_journal_date?: string;
        milestones?: Array<{
            date: string;
            description: string;
            progress: number;
        }>;
    } | null;
    tips: {
        rituals?: string[];
        what_to_manifest?: string[];
        what_not_to_manifest?: string[];
        thought_alignment?: string[];
        daily_actions?: string[];
    } | null;
    insights: {
        ai_narrative?: string;
        astro_insights?: string;
        energy_state?: 'aligned' | 'unstable' | 'blocked';
        keyword_analysis?: Record<string, any>;
        emotional_charge?: string;
        category_label?: string;
        summary_for_ui?: string;
        energy_reason?: string;
    } | null;
    is_archived: boolean;
    is_locked: boolean;
}
