import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoPayload } from '../../common/interceptors/zuno-response.interceptor';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { LifeSignalService } from '../services/life-signal.service';
import { SignalTrendService } from '../services/signal-trend.service';
import { ConfirmLifeSignalDto, CreateLifeSignalDto, LifeSignalView, ListLifeSignalsQueryDto, TrendsQueryDto } from '../dtos/signal.dtos';
export declare class ZunoSignalsController {
    private readonly signals;
    private readonly trends;
    private readonly idempotency;
    constructor(signals: LifeSignalService, trends: SignalTrendService, idempotency: IdempotencyService);
    create(user: ZunoUser, dto: CreateLifeSignalDto, idempotencyKey?: string): Promise<{
        signalId: string;
        confirmationStatus: import("../enums").SignalConfirmationStatus;
        realignmentRecommended: boolean;
        clarificationRequired: boolean;
        acknowledgedOnly: boolean;
        duplicateOfExisting: boolean;
        interpretationUnavailable: boolean;
        signal: LifeSignalView;
    }>;
    list(user: ZunoUser, query: ListLifeSignalsQueryDto): Promise<ZunoPayload<{
        confirmed: LifeSignalView[];
        unconfirmed: LifeSignalView[];
    }>>;
    categoryTrends(user: ZunoUser, query: TrendsQueryDto): Promise<import("../services/signal-trend.service").CategoryTrendsResult>;
    detail(user: ZunoUser, signalId: string): Promise<LifeSignalView>;
    confirm(user: ZunoUser, signalId: string, dto: ConfirmLifeSignalDto): Promise<LifeSignalView>;
    reject(user: ZunoUser, signalId: string, dto: ConfirmLifeSignalDto): Promise<LifeSignalView>;
}
