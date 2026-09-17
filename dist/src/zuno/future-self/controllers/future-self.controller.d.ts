import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { FutureSelfService } from '../services/future-self.service';
import { FutureSelfView, GenerateFutureSelfDto, ListFutureSelfQueryDto } from '../dtos/future-self.dtos';
export declare class ZunoFutureSelfController {
    private readonly futureSelf;
    private readonly idempotency;
    constructor(futureSelf: FutureSelfService, idempotency: IdempotencyService);
    generate(user: ZunoUser, dto: GenerateFutureSelfDto, idempotencyKey?: string): Promise<{
        id: string;
        mode: import("../enums/future-self.enum").FutureSelfMode;
        message: string;
        progressThemes: string[];
        openLoops: string[];
        strengthsObserved: string[];
        nextFocus: string[];
        challengeId: string | null;
        periodStart: string | null;
        periodEnd: string | null;
        sourceCount: number;
        createdAt: string;
    }>;
    list(user: ZunoUser, query: ListFutureSelfQueryDto): Promise<FutureSelfView[]>;
    detail(user: ZunoUser, futureSelfId: string): Promise<FutureSelfView>;
}
