import { Repository } from 'typeorm';
import { Manifestation } from '../entities/manifestation.entity';
import { CreateManifestationEnhancedDto } from '../dtos/create-manifestation-enhanced.dto';
import { ManifestationAIEvaluationService } from './manifestation-ai-evaluation.service';
import { Customer } from '../../users/entities/customer.entity';
import { SwissEphemerisService } from '../../astrology/services/swiss-ephemeris.service';
import { DashaRecord } from '../../database/entities/dasha-record.entity';
import { AntardashaRecord } from '../../database/entities/antardasha-record.entity';
import { PratyantarDashaRecord } from '../../database/entities/pratyantar-dasha-record.entity';
import { SukshmaDashaRecord } from '../../database/entities/sukshma-dasha-record.entity';
import { Kundli } from '../../kundli/entities/kundli.entity';
import { KundliPlanet } from '../../kundli/entities/kundli-planet.entity';
import { KundliHouse } from '../../kundli/entities/kundli-house.entity';
import { KundliService } from '../../kundli/services/kundli.service';
import { ManifestationAlignmentService } from './manifestation-alignment.service';
export declare class ManifestationEnhancedService {
    private manifestationRepository;
    private customerRepository;
    private dashaRepository;
    private antardashaRepository;
    private pratyantarRepository;
    private sukshmaRepository;
    private kundliRepository;
    private kundliPlanetRepository;
    private kundliHouseRepository;
    private aiEvaluationService;
    private swissEphemerisService;
    private kundliService;
    private alignmentService;
    private readonly logger;
    private readonly regexCache;
    constructor(manifestationRepository: Repository<Manifestation>, customerRepository: Repository<Customer>, dashaRepository: Repository<DashaRecord>, antardashaRepository: Repository<AntardashaRecord>, pratyantarRepository: Repository<PratyantarDashaRecord>, sukshmaRepository: Repository<SukshmaDashaRecord>, kundliRepository: Repository<Kundli>, kundliPlanetRepository: Repository<KundliPlanet>, kundliHouseRepository: Repository<KundliHouse>, aiEvaluationService: ManifestationAIEvaluationService, swissEphemerisService: SwissEphemerisService, kundliService: KundliService, alignmentService: ManifestationAlignmentService);
    createManifestation(userId: number, dto: CreateManifestationEnhancedDto): Promise<Manifestation>;
    private getQuickScores;
    private enhanceManifestationAsync;
    getDashboard(userId: number): Promise<{
        summary: {
            top_resonance: number;
            alignment_score: number;
            astro_support: number;
            energy_state: 'aligned' | 'unstable' | 'blocked';
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
    }>;
    getManifestationById(id: number, userId: number): Promise<Manifestation>;
    archiveManifestation(id: number, userId: number): Promise<Manifestation>;
    toggleLockManifestation(id: number, userId: number): Promise<Manifestation>;
    getTips(id: number, userId: number): Promise<{
        tips: {
            rituals?: string[];
            what_to_manifest?: string[];
            what_not_to_manifest?: string[];
            thought_alignment?: string[];
            daily_actions?: string[];
        };
    }>;
    private calculateActionWindows;
    getAllManifestations(userId: number, includeArchived?: boolean): Promise<Manifestation[]>;
    private calculateKundliBasedScores;
    private computeMFPScore;
    private validateKundliForManifestation;
    private ensureKundliExists;
    private calculateAndStoreDashaPeriods;
    calculateDetailedResonance(userId: number, description: string): Promise<{
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
    }>;
    private calculateCurrentDashaFromTimeline;
    private calculateDashaFromBirthDateAndNakshatra;
    private generateEnhancedTips;
    private generateEnhancedInsights;
    private getDashaSpecificRituals;
    private getPlanetaryGuidance;
    private getKarmicTheme;
    private getDashaAlignmentTips;
    private getDailyActions;
    private generateAstroInsights;
    getResonanceScoreBreakdown(manifestationId: number, userId: number): Promise<{
        overall_score: number;
        clarity_score: number;
        emotional_coherence: number;
        karma_influence: number;
        astrological_support: number;
        insight: string;
    }>;
    getAlignmentActions(manifestationId: number, userId: number): Promise<{
        actions: Array<{
            id: number;
            title: string;
            description: string;
            icon: string;
            effort_level: 'Low' | 'Medium' | 'High';
            karma_score: number;
            category: string;
        }>;
    }>;
    private generateAlignmentActions;
    addAlignmentActionsToKarma(manifestationId: number, actionIds: number[], userId: number): Promise<{
        added_count: number;
        total_karma_score: number;
        actions_added: Array<{
            id: number;
            title: string;
            karma_score: number;
        }>;
    }>;
    commitIntention(manifestationId: number, userId: number, commitmentMessage?: string, targetDate?: string): Promise<{
        id: number;
        title: string;
        is_committed: boolean;
        committed_at: string;
        commitment_message: string | null;
        target_date: string | null;
    }>;
    getCosmicSupportIndex(manifestationId: number, userId: number): Promise<{
        current_mahadasha: {
            lord: string;
            description: string;
            status: 'Supportive' | 'Neutral' | 'Challenging';
        };
        current_antardasha: {
            lord: string;
            description: string;
            status: 'Supportive' | 'Neutral' | 'Challenging';
        };
        current_pratyantar: {
            lord: string;
            description: string;
            status: 'Supportive' | 'Neutral' | 'Challenging';
        };
        guidance_message: string;
    }>;
    getAlignmentSummary(manifestationId: number, userId: number): Promise<{
        manifestation_title: string;
        resonance_score: number;
        resonance_label: string;
        cosmic_support_status: 'Supportive' | 'Neutral' | 'Challenging';
        cosmic_support_period: string;
        commitment_status: 'Not Committed' | 'Consciously Committed';
        active_alignment_actions: Array<{
            id: number;
            title: string;
            icon: string;
            karma_score: number;
        }>;
    }>;
    getJourneyTimeline(manifestationId: number, userId: number): Promise<{
        total_progress: number;
        phases: Array<{
            id: string;
            title: string;
            description: string;
            date_range: string;
            status: 'Completed' | 'In Progress' | 'Upcoming';
            progress_percentage?: number;
        }>;
        current_phase: {
            id: string;
            title: string;
            insight: string;
            resonance_score: number;
        };
    }>;
    private generateJourneyPhases;
}
