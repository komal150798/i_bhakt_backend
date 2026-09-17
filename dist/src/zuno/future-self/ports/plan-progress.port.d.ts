export interface PlanItemSnapshot {
    id: string;
    title: string;
    status: string;
    dueAt: Date | null;
}
export interface PlanSnapshot {
    planId: string;
    title: string;
    status: string;
    activeItems: PlanItemSnapshot[];
}
export interface CompletedAction {
    id: string;
    title: string;
    completedAt: Date;
    sourceEntityType: string;
    sourceEntityId: string;
}
export interface ProgressSnapshot {
    completedActions: CompletedAction[];
    openLoops: string[];
    observedPatterns: string[];
}
export interface IPlanProgressProvider {
    getCurrentPlan(userId: string, challengeId: string | null): Promise<PlanSnapshot | null>;
    getProgress(userId: string, challengeId: string | null, since: Date): Promise<ProgressSnapshot>;
}
export declare const PLAN_PROGRESS_PROVIDER: unique symbol;
export declare class NullPlanProgressProvider implements IPlanProgressProvider {
    private readonly logger;
    getCurrentPlan(): Promise<PlanSnapshot | null>;
    getProgress(): Promise<ProgressSnapshot>;
}
