import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoPayload } from '../../common/interceptors/zuno-response.interceptor';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { KarmaService } from '../services/karma.service';
import { CorrectKarmaEntryDto, CreateKarmaEntryDto, KarmaEntryDetailView, KarmaEntryView, KarmaSummaryView, ListKarmaQueryDto } from '../dtos/karma.dtos';
export declare class ZunoKarmaController {
    private readonly karma;
    private readonly idempotency;
    constructor(karma: KarmaService, idempotency: IdempotencyService);
    create(user: ZunoUser, dto: CreateKarmaEntryDto, idempotencyKey?: string): Promise<{
        id: string;
        classification: import("../enums/karma.enum").KarmaClassification;
        category: import("../enums/karma.enum").KarmaCategory;
        points: number;
        confidence: number | null;
        userConfirmed: boolean;
        confirmationRequired: boolean;
        explanation: string;
    }>;
    list(user: ZunoUser, query: ListKarmaQueryDto): Promise<ZunoPayload<KarmaEntryView[]>>;
    summary(user: ZunoUser): Promise<KarmaSummaryView>;
    detail(user: ZunoUser, entryId: string): Promise<KarmaEntryDetailView>;
    correct(user: ZunoUser, entryId: string, dto: CorrectKarmaEntryDto): Promise<KarmaEntryDetailView>;
    remove(user: ZunoUser, entryId: string): Promise<void>;
}
