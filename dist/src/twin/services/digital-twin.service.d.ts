import { Repository } from 'typeorm';
import { Customer } from '../../users/entities/customer.entity';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
import { KarmaScoreService } from '../../karma/services/karma-score.service';
import { Manifestation } from '../../manifestation/entities/manifestation.entity';
import { JournalEntry } from '../../journal/entities/journal-entry.entity';
import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
export interface AlignmentIndex {
    status: 'Fully Aligned' | 'Partially Aligned' | 'Misaligned';
    score: number;
    components: {
        desire_clarity: 'Clear' | 'Unclear' | 'Mixed';
        karma_trend: 'Improving' | 'Declining' | 'Stable';
        current_time_support: 'Favorable' | 'Neutral' | 'Unfavorable';
    };
    focus_message: string;
    determination_note: string;
}
export interface ConsciousnessState {
    state: 'Stable' | 'Unstable' | 'Expanding' | 'Contracted';
    meaning: string;
    influence_factors: string[];
    action_suggestion: string;
}
export interface CurrentPhase {
    phase_label: string;
    direction: 'Favorable ↑' | 'Neutral →' | 'Unfavorable ↓';
    advisory_text: string;
    time_window_note: string;
}
export interface EmotionalBaseline {
    baseline: 'Calm' | 'Anxious' | 'Excited' | 'Neutral' | 'Stable';
    stability_indicator: number[];
    insight_text: string;
    reflection_prompt: string;
}
export interface EnergyLevel {
    level: 'High' | 'Balanced' | 'Low' | 'Fluctuating';
    icon: string;
    suggested_approach: {
        act: string;
        reflect: string;
        rest: string;
    };
    influence_text: string;
    wisdom_prompt: string;
}
export interface KarmaState {
    state: 'Positive' | 'Negative' | 'Neutral';
    trend: 'Improving' | 'Declining' | 'Stable';
    icon: string;
    summary: {
        today: {
            good: number;
            bad: number;
            neutral: number;
        };
        this_week: {
            good: number;
            bad: number;
            neutral: number;
        };
        this_month: {
            good: number;
            bad: number;
            neutral: number;
        };
    };
    recent_influence: string[];
    why_this_state: string;
    focus_message: string;
}
export interface ManifestationResonance {
    active_manifestation: {
        name: string;
        time_horizon: string;
    } | null;
    resonance_state: 'Supportive ↑' | 'Neutral →' | 'Challenging ↓';
    influence_summary: {
        karma: string;
        emotion: string;
        timing: string;
    };
    guidance_text: string;
}
export interface RecentActionInfluence {
    last_actions: Array<{
        action: string;
        status: 'Completed' | 'Pending' | 'Skipped';
        impact: 'High Impact' | 'Moderate Impact' | 'Low Impact';
    }>;
    impact_indicator: 'Strengthening ↑' | 'Stable →' | 'Weakening ↓';
    insight_text: string;
}
export interface ReflectionPrompt {
    question: string;
    type: 'daily' | 'weekly' | 'monthly';
}
export interface TwinEvolution {
    current_stage: 'Awakening' | 'Building' | 'Expanding' | 'Mastering';
    growth_indicators: {
        consistency: {
            value: number;
            label: string;
        };
        awareness: {
            value: number;
            label: string;
        };
        alignment: {
            value: number;
            label: string;
        };
    };
    locked_states: string[];
}
export declare class DigitalTwinService {
    private readonly customerRepository;
    private readonly karmaRepository;
    private readonly manifestationRepository;
    private readonly journalRepository;
    private readonly karmaEntryRepository;
    private readonly karmaScoreService;
    private readonly logger;
    constructor(customerRepository: Repository<Customer>, karmaRepository: IKarmaRepository, manifestationRepository: Repository<Manifestation>, journalRepository: Repository<JournalEntry>, karmaEntryRepository: Repository<KarmaEntry>, karmaScoreService: KarmaScoreService);
    generateDigitalTwin(userId: number): Promise<{
        success: boolean;
        message: string;
        twin_id: string;
    }>;
    getAlignmentIndex(userId: number): Promise<AlignmentIndex>;
    getConsciousnessState(userId: number): Promise<ConsciousnessState>;
    getCurrentPhase(userId: number): Promise<CurrentPhase>;
    getEmotionalBaseline(userId: number): Promise<EmotionalBaseline>;
    getEnergyLevel(userId: number): Promise<EnergyLevel>;
    getKarmaState(userId: number): Promise<KarmaState>;
    getManifestationResonance(userId: number): Promise<ManifestationResonance>;
    getRecentActionInfluence(userId: number): Promise<RecentActionInfluence>;
    getReflectionPrompt(userId: number): Promise<ReflectionPrompt>;
    getTwinEvolution(userId: number): Promise<TwinEvolution>;
    getCompleteTwinSummary(userId: number): Promise<{
        alignment_index: AlignmentIndex;
        consciousness_state: ConsciousnessState;
        current_phase: CurrentPhase;
        emotional_baseline: EmotionalBaseline;
        energy_level: EnergyLevel;
        karma_state: KarmaState;
        manifestation_resonance: ManifestationResonance;
        recent_actions: RecentActionInfluence;
        reflection: ReflectionPrompt;
        evolution: TwinEvolution;
    }>;
    private calculateEnergyFromKarma;
}
