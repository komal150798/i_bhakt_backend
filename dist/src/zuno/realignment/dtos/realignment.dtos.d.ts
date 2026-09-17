import { ZunoRealignment } from '../entities/zuno-realignment.entity';
import { ZunoRealignmentChange } from '../entities/zuno-realignment-change.entity';
import { PlanChangeMode, RealignmentChangeType, RealignmentLevel, RealignmentStatus } from '../enums';
export declare class EvaluateRealignmentDto {
    challengeId: string;
    triggerSignalId?: string;
}
export declare class ApplyRealignmentDto {
    confirmed?: boolean;
    version?: number;
}
export declare class ListRealignmentsQueryDto {
    challengeId: string;
    limit?: number;
}
export declare class RealignmentChangeView {
    type: RealignmentChangeType;
    reason: string;
    entityType: string | null;
    entityId: string | null;
    static from(change: ZunoRealignmentChange): RealignmentChangeView;
}
export declare class RealignmentView {
    realignmentId: string;
    challengeId: string;
    level: RealignmentLevel;
    status: RealignmentStatus;
    summary: string;
    changes: RealignmentChangeView[];
    newPlanId: string | null;
    planChangeMode: PlanChangeMode;
    scenarioReassessmentRequired: boolean;
    mkaRefreshRequired: boolean;
    userConfirmationRequired: boolean;
    triggerSignalId: string | null;
    createdAt: string;
    appliedAt: string | null;
    version: number;
    static from(realignment: ZunoRealignment, changes?: ZunoRealignmentChange[]): RealignmentView;
}
