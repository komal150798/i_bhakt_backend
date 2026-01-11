import { LLMService } from '../../common/ai/services/llm.service';
export interface AIKundliData {
    lagna: {
        sign: string;
        degrees: number;
        signLord: string;
    };
    nakshatra: {
        name: string;
        lord: string;
        pada: number;
    };
    planets: Array<{
        name: string;
        sign: string;
        signLord: string;
        degrees: number;
        nakshatra: string;
        nakshatraLord: string;
        nakshatraPada: number;
        house: number;
        isRetrograde: boolean;
    }>;
    tithi: string;
    yoga: string;
    karana: string;
    ayanamsa: number;
}
export declare class AIKundliService {
    private readonly llmService;
    private readonly logger;
    constructor(llmService: LLMService);
    calculateKundli(params: {
        birthDate: string;
        birthTime: string;
        birthPlace: string;
        latitude: number;
        longitude: number;
        timezone: string;
    }): Promise<AIKundliData>;
}
