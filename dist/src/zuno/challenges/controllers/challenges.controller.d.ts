import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoPayload } from '../../common/interceptors/zuno-response.interceptor';
import { ChallengeService } from '../services/challenge.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { ChallengeDetailView, ChallengeView, CreateChallengeDto, ListChallengesQueryDto, ReopenChallengeDto, ResolveChallengeDto, ZunoResponseView } from '../dtos/challenge.dtos';
import { ProcessingState } from '../../common/enums';
export declare class ZunoChallengesController {
    private readonly challenges;
    private readonly idempotency;
    constructor(challenges: ChallengeService, idempotency: IdempotencyService);
    create(user: ZunoUser, dto: CreateChallengeDto, idempotencyKey?: string): Promise<{
        challengeId: string;
        status: ProcessingState;
        challenge: ChallengeView;
    }>;
    list(user: ZunoUser, query: ListChallengesQueryDto): Promise<ZunoPayload<ChallengeView[]>>;
    detail(user: ZunoUser, challengeId: string): Promise<ChallengeDetailView>;
    analyze(user: ZunoUser, challengeId: string, idempotencyKey?: string): Promise<{
        challenge: ChallengeView;
        response: ZunoResponseView;
    }>;
    response(user: ZunoUser, challengeId: string): Promise<ZunoResponseView>;
    resolve(user: ZunoUser, challengeId: string, dto: ResolveChallengeDto): Promise<ChallengeView>;
    reopen(user: ZunoUser, challengeId: string, dto: ReopenChallengeDto): Promise<ChallengeView>;
}
