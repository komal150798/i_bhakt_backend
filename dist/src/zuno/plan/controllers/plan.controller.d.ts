import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { PlanService } from '../services/plan.service';
import { ActivatePlanDto, AddPlanItemDto, BlockPlanItemDto, CompletePlanItemDto, DeferPlanItemDto, GeneratePlanDto, ListPlansQueryDto, PatchPlanDto, PlanItemView, PlanView, SkipPlanItemDto } from '../dtos/plan.dtos';
export declare class ZunoPlansController {
    private readonly plans;
    private readonly idempotency;
    constructor(plans: PlanService, idempotency: IdempotencyService);
    list(user: ZunoUser, query: ListPlansQueryDto): Promise<PlanView[]>;
    generate(user: ZunoUser, dto: GeneratePlanDto, idempotencyKey?: string): Promise<{
        id: string;
        challengeId: string;
        type: import("../enums").PlanType;
        title: string;
        primaryGoal: string | null;
        status: import("../enums").PlanStatus;
        startDate: string;
        endDate: string | null;
        reviewAt: string | null;
        version: number;
        items: PlanItemView[];
    }>;
    detail(user: ZunoUser, planId: string): Promise<PlanView>;
    patch(user: ZunoUser, planId: string, dto: PatchPlanDto): Promise<PlanView>;
    activate(user: ZunoUser, planId: string, dto: ActivatePlanDto): Promise<PlanView>;
    addItem(user: ZunoUser, planId: string, dto: AddPlanItemDto): Promise<PlanItemView>;
}
export declare class ZunoPlanItemsController {
    private readonly plans;
    constructor(plans: PlanService);
    detail(user: ZunoUser, itemId: string): Promise<PlanItemView>;
    start(user: ZunoUser, itemId: string): Promise<PlanItemView>;
    complete(user: ZunoUser, itemId: string, dto: CompletePlanItemDto): Promise<PlanItemView>;
    defer(user: ZunoUser, itemId: string, dto: DeferPlanItemDto): Promise<PlanItemView>;
    skip(user: ZunoUser, itemId: string, dto: SkipPlanItemDto): Promise<PlanItemView>;
    block(user: ZunoUser, itemId: string, dto: BlockPlanItemDto): Promise<PlanItemView>;
    history(user: ZunoUser, itemId: string): Promise<{
        id: string;
        eventType: import("../enums").PlanItemEventType;
        oldStatus: import("../enums").PlanItemStatus;
        newStatus: import("../enums").PlanItemStatus;
        reason: string;
        source: import("../enums").PlanItemEventSource;
        createdAt: string;
    }[]>;
}
export declare class ZunoChallengePlansController {
    private readonly plans;
    private readonly idempotency;
    constructor(plans: PlanService, idempotency: IdempotencyService);
    list(user: ZunoUser, challengeId: string): Promise<PlanView[]>;
    generate(user: ZunoUser, challengeId: string, dto: Omit<GeneratePlanDto, 'challengeId'>, idempotencyKey?: string): Promise<{
        id: string;
        challengeId: string;
        type: import("../enums").PlanType;
        title: string;
        primaryGoal: string | null;
        status: import("../enums").PlanStatus;
        startDate: string;
        endDate: string | null;
        reviewAt: string | null;
        version: number;
        items: PlanItemView[];
    }>;
}
