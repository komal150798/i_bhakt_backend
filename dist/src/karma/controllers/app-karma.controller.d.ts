import { KarmaService } from '../services/karma.service';
import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { RecordKarmaDto } from '../dtos/record-karma.dto';
export declare class AppKarmaController {
    private readonly karmaService;
    constructor(karmaService: KarmaService);
    getKarmaLedger(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: any;
    }>;
    recordKarma(dto: RecordKarmaDto, user: CurrentUserPayload): Promise<{
        success: boolean;
        data: any;
    }>;
    getKarmaList(user: CurrentUserPayload, filter?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getKarmaPatterns(user: CurrentUserPayload, filter?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getKarmaInsight(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        data: any;
    }>;
    getKarmaEntry(id: number, user: CurrentUserPayload): Promise<{
        success: boolean;
        data: any;
    }>;
}
