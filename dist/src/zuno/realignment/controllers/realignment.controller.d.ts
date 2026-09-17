import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { RealignmentService } from '../services/realignment.service';
import { ApplyRealignmentDto, EvaluateRealignmentDto, ListRealignmentsQueryDto, RealignmentView } from '../dtos/realignment.dtos';
export declare class ZunoRealignmentController {
    private readonly realignment;
    private readonly idempotency;
    constructor(realignment: RealignmentService, idempotency: IdempotencyService);
    evaluate(user: ZunoUser, dto: EvaluateRealignmentDto, idempotencyKey?: string): Promise<{
        replayed: boolean;
        realignmentId: string;
        challengeId: string;
        level: import("../enums").RealignmentLevel;
        status: import("../enums").RealignmentStatus;
        summary: string;
        changes: import("../dtos/realignment.dtos").RealignmentChangeView[];
        newPlanId: string | null;
        planChangeMode: import("../enums").PlanChangeMode;
        scenarioReassessmentRequired: boolean;
        mkaRefreshRequired: boolean;
        userConfirmationRequired: boolean;
        triggerSignalId: string | null;
        createdAt: string;
        appliedAt: string | null;
        version: number;
    }>;
    apply(user: ZunoUser, realignmentId: string, dto: ApplyRealignmentDto, idempotencyKey?: string): Promise<{
        newPlanId: string;
        cancelledItemCount: number;
        suppressedReminderCount: number;
        planChangesApplied: boolean;
        realignmentId: string;
        challengeId: string;
        level: import("../enums").RealignmentLevel;
        status: import("../enums").RealignmentStatus;
        summary: string;
        changes: import("../dtos/realignment.dtos").RealignmentChangeView[];
        planChangeMode: import("../enums").PlanChangeMode;
        scenarioReassessmentRequired: boolean;
        mkaRefreshRequired: boolean;
        userConfirmationRequired: boolean;
        triggerSignalId: string | null;
        createdAt: string;
        appliedAt: string | null;
        version: number;
    }>;
    list(user: ZunoUser, query: ListRealignmentsQueryDto): Promise<RealignmentView[]>;
    detail(user: ZunoUser, realignmentId: string): Promise<RealignmentView>;
}
