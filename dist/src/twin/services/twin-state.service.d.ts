import { Repository } from 'typeorm';
import { Customer } from '../../users/entities/customer.entity';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
import { KarmaScoreService } from '../../karma/services/karma-score.service';
import { ManifestationLog } from '../../manifestation/entities/manifestation-log.entity';
export interface TwinState {
    energy: number;
    mood: string;
    alignment: number;
    aura: {
        color: string;
        intensity: number;
        evolution_level: string;
    };
    karma_score: number;
    mfp_score: number | null;
    highlights: {
        recent_achievement?: string;
        karma_trend?: 'improving' | 'declining' | 'stable';
        manifestation_progress?: number;
    };
    last_updated: Date;
}
export declare class TwinStateService {
    private readonly customerRepository;
    private readonly karmaRepository;
    private readonly manifestationRepository;
    private readonly karmaScoreService;
    private readonly logger;
    constructor(customerRepository: Repository<Customer>, karmaRepository: IKarmaRepository, manifestationRepository: Repository<ManifestationLog>, karmaScoreService: KarmaScoreService);
    getTwinState(userId: number): Promise<TwinState>;
    private calculateEnergy;
    private determineMood;
    private calculateAlignment;
    private determineAura;
    private getHighlights;
}
