import { EntityManager } from 'typeorm';
export declare const REALIGNMENT_TARGET: unique symbol;
export interface RealignmentTargetContext {
    manager: EntityManager;
    userId: string;
    challengeId: string;
    realignmentId: string;
    occurredAt: Date;
}
export interface CurrentDirection {
    planId: string | null;
    planVersion: number | null;
    mkaProgramId: string | null;
    pendingItemIds: string[];
    pendingReminderIds: string[];
    assumptions: {
        key: string;
        statement: string;
    }[];
    available: boolean;
}
export interface CancelPendingItemsInput {
    itemIds?: string[];
    reasonCode: string;
    reason: string;
}
export interface CancelPendingItemsResult {
    cancelledItemIds: string[];
    applied: boolean;
}
export interface SupersedeProgrammeInput {
    mkaProgramId: string | null;
    reason: string;
    refreshRequired: boolean;
}
export interface SupersedeProgrammeResult {
    supersededProgramId: string | null;
    successorProgramId: string | null;
    applied: boolean;
}
export interface SuppressRemindersInput {
    reminderIds?: string[];
    reason: string;
}
export interface SuppressRemindersResult {
    suppressedReminderIds: string[];
    applied: boolean;
}
export interface ActivateSuccessorPlanInput {
    mode: 'PATCH' | 'REGENERATE';
    previousPlanId: string | null;
    reason: string;
    preserveItemIds: string[];
}
export interface ActivateSuccessorPlanResult {
    planId: string | null;
    planVersion: number | null;
    archivedPlanId: string | null;
    applied: boolean;
}
export interface RealignmentTarget {
    loadCurrentDirection(ctx: RealignmentTargetContext): Promise<CurrentDirection>;
    cancelPendingItems(ctx: RealignmentTargetContext, input: CancelPendingItemsInput): Promise<CancelPendingItemsResult>;
    supersedeProgramme(ctx: RealignmentTargetContext, input: SupersedeProgrammeInput): Promise<SupersedeProgrammeResult>;
    suppressPendingReminders(ctx: RealignmentTargetContext, input: SuppressRemindersInput): Promise<SuppressRemindersResult>;
    activateSuccessorPlan(ctx: RealignmentTargetContext, input: ActivateSuccessorPlanInput): Promise<ActivateSuccessorPlanResult>;
}
