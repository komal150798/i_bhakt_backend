import { Repository } from 'typeorm';
import { Manifestation } from '../entities/manifestation.entity';
import { CreateManifestationEnhancedDto } from '../dtos/create-manifestation-enhanced.dto';
import { ManifestationAIEvaluationService } from './manifestation-ai-evaluation.service';
import { User } from '../../users/entities/user.entity';
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
export declare class ManifestationEnhancedService {
    private manifestationRepository;
    private userRepository;
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
    private readonly logger;
    constructor(manifestationRepository: Repository<Manifestation>, userRepository: Repository<User>, customerRepository: Repository<Customer>, dashaRepository: Repository<DashaRecord>, antardashaRepository: Repository<AntardashaRecord>, pratyantarRepository: Repository<PratyantarDashaRecord>, sukshmaRepository: Repository<SukshmaDashaRecord>, kundliRepository: Repository<Kundli>, kundliPlanetRepository: Repository<KundliPlanet>, kundliHouseRepository: Repository<KundliHouse>, aiEvaluationService: ManifestationAIEvaluationService, swissEphemerisService: SwissEphemerisService, kundliService: KundliService);
    createManifestation(userId: number, dto: CreateManifestationEnhancedDto): Promise<Manifestation>;
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
}
