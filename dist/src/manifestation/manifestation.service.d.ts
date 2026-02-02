import { Repository } from 'typeorm';
import { ManifestationLog } from './entities/manifestation-log.entity';
import { CreateManifestationDto } from './dto/create-manifestation.dto';
import { SwissEphemerisService } from '../astrology/services/swiss-ephemeris.service';
import { Customer } from '../users/entities/customer.entity';
import { ConstantsService } from '../common/constants/constants.service';
export declare class ManifestationService {
    private manifestationRepository;
    private customerRepository;
    private swissEphemerisService;
    private constantsService;
    constructor(manifestationRepository: Repository<ManifestationLog>, customerRepository: Repository<Customer>, swissEphemerisService: SwissEphemerisService, constantsService: ConstantsService);
    createManifestation(userId: number, dto: CreateManifestationDto): Promise<ManifestationLog>;
    getUserManifestations(userId: number): Promise<ManifestationLog[]>;
    getManifestationById(userId: number, manifestationId: number): Promise<ManifestationLog>;
    updateManifestation(userId: number, manifestationId: number, updateData: Partial<{
        is_locked: boolean;
        metadata: Record<string, any>;
    }>): Promise<ManifestationLog>;
    deleteManifestation(userId: number, manifestationId: number): Promise<void>;
    private calculateClarity;
    private calculateCoherence;
    private calculateAstroIndex;
    private calculateBestManifestationDate;
    private getClarityBreakdown;
    private getCoherenceBreakdown;
    private getAstroSupport;
}
