import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { GenerateKundliDto } from '../dto/generate-kundli.dto';
import { KundliResponseDto } from '../dto/kundli-response.dto';
import { IKundliRepository } from '../../core/interfaces/repositories/kundli-repository.interface';
import { KundliPlanet } from '../entities/kundli-planet.entity';
import { KundliHouse } from '../entities/kundli-house.entity';
import { SwissEphemerisService } from '../../astrology/services/swiss-ephemeris.service';
import { AIKundliService } from '../../astrology/services/ai-kundli.service';
export declare class KundliService {
    private readonly httpService;
    private readonly kundliRepository;
    private readonly kundliPlanetRepository;
    private readonly kundliHouseRepository;
    private readonly swissEphemerisService;
    private readonly aiKundliService;
    private readonly configService;
    private readonly logger;
    private readonly useAICalculation;
    constructor(httpService: HttpService, kundliRepository: IKundliRepository, kundliPlanetRepository: Repository<KundliPlanet>, kundliHouseRepository: Repository<KundliHouse>, swissEphemerisService: SwissEphemerisService, aiKundliService: AIKundliService, configService: ConfigService);
    generateKundli(dto: GenerateKundliDto, userId?: number): Promise<KundliResponseDto>;
    private calculateWithSwissEphemeris;
    private transformSwissEphemerisResponse;
    private transformAIKundliResponse;
    private getCoordinatesFromPlace;
    private saveKundliToDatabase;
    private getSignNumber;
    generateKundliUpdateJSON(params: {
        user_id: number;
        birth_date: string;
        birth_time: string;
        birth_place: string;
        latitude: number;
        longitude: number;
        timezone: string;
    }): Promise<{
        kundli_db_update: {
            where: {
                user_id: number;
            };
            update: any;
        };
    }>;
    private calculateVimshottariDasha;
    private dateToJD;
    private jdToDate;
    private addYearsToJD;
    private formatJDToDateString;
    private calculateBirthDashaLord;
    private calculateBalanceYears;
    private findCurrentPeriod;
    private buildMahadashaTimeline;
    private buildDetailedTimeline;
    private addBalanceMahaPeriods;
    private findBirthAntardasha;
    private findBirthPratyantar;
    private addFullMahaPeriods;
    private calculateBhavAnalysis;
    private calculateYogDetails;
    private calculateDoshaDetails;
    private calculateGocharAnalysis;
}
