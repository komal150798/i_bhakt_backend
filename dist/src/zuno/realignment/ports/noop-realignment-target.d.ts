import { ActivateSuccessorPlanResult, CancelPendingItemsResult, CurrentDirection, RealignmentTarget, RealignmentTargetContext, SupersedeProgrammeResult, SuppressRemindersResult } from './realignment-target.port';
export declare class NoopRealignmentTarget implements RealignmentTarget {
    private readonly logger;
    loadCurrentDirection(ctx: RealignmentTargetContext): Promise<CurrentDirection>;
    cancelPendingItems(): Promise<CancelPendingItemsResult>;
    supersedeProgramme(): Promise<SupersedeProgrammeResult>;
    suppressPendingReminders(): Promise<SuppressRemindersResult>;
    activateSuccessorPlan(): Promise<ActivateSuccessorPlanResult>;
}
