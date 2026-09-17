import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { MkaService } from '../services/mka.service';
import { CompleteMkaItemDto, GenerateMkaDto, ListMkaQueryDto, MkaCompletionView, MkaProgramView, SkipMkaItemDto } from '../dtos/mka.dtos';
export declare class ZunoMkaController {
    private readonly mka;
    private readonly idempotency;
    constructor(mka: MkaService, idempotency: IdempotencyService);
    current(user: ZunoUser, query: ListMkaQueryDto): Promise<MkaProgramView | MkaProgramView[]>;
    detail(user: ZunoUser, programId: string): Promise<MkaProgramView>;
    generate(user: ZunoUser, dto: GenerateMkaDto, idempotencyKey?: string): Promise<{
        programId: string;
        challengeId: string;
        status: import("../enums").MkaProgramStatus;
        periodType: import("../enums").MkaPeriodType;
        period: {
            start: string;
            end: string;
        };
        reviewAt: string | null;
        remedyStatus: string;
        items: import("../dtos/mka.dtos").MkaItemView[];
    }>;
    complete(user: ZunoUser, itemId: string, dto: CompleteMkaItemDto): Promise<MkaCompletionView>;
    skip(user: ZunoUser, itemId: string, dto: SkipMkaItemDto): Promise<MkaCompletionView>;
    completions(user: ZunoUser, programId: string): Promise<MkaCompletionView[]>;
}
export declare class ZunoChallengeMkaController {
    private readonly mka;
    private readonly idempotency;
    constructor(mka: MkaService, idempotency: IdempotencyService);
    current(user: ZunoUser, challengeId: string): Promise<MkaProgramView>;
    generate(user: ZunoUser, challengeId: string, dto: Omit<GenerateMkaDto, 'challengeId'>, idempotencyKey?: string): Promise<{
        programId: string;
        challengeId: string;
        status: import("../enums").MkaProgramStatus;
        periodType: import("../enums").MkaPeriodType;
        period: {
            start: string;
            end: string;
        };
        reviewAt: string | null;
        remedyStatus: string;
        items: import("../dtos/mka.dtos").MkaItemView[];
    }>;
}
