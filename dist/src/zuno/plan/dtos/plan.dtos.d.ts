import { ZunoPlan } from '../entities/zuno-plan.entity';
import { ZunoPlanItem } from '../entities/zuno-plan-item.entity';
import { PlanItemCategory, PlanItemPriority, PlanItemStatus, PlanStatus, PlanType } from '../enums/plan.enum';
export declare class GeneratePlanDto {
    challengeId: string;
    planType?: PlanType;
    regenerate?: boolean;
}
export declare class PatchPlanDto {
    title?: string;
    primaryGoal?: string;
    status?: PlanStatus;
    version?: number;
}
export declare class ActivatePlanDto {
    version?: number;
}
export declare class ListPlansQueryDto {
    challengeId?: string;
}
export declare class CompletePlanItemDto {
    completedAt?: string;
    note?: string;
}
export declare class DeferPlanItemDto {
    to?: string;
    reason?: string;
}
export declare class SkipPlanItemDto {
    reason?: string;
}
export declare class BlockPlanItemDto {
    reason: string;
}
export declare class AddPlanItemDto {
    title: string;
    description?: string;
    category?: PlanItemCategory;
    priority?: PlanItemPriority;
    estimatedMinutes?: number;
    scheduledDate?: string;
    isCommitment?: boolean;
}
export declare class PlanItemView {
    id: string;
    title: string;
    description: string | null;
    whyThisMatters: string | null;
    category: PlanItemCategory;
    priority: number;
    priorityLabel: PlanItemPriority;
    status: PlanItemStatus;
    isPractice: boolean;
    karmaEligible: boolean;
    scheduledDate: string | null;
    dueAt: string | null;
    estimatedMinutes: number | null;
    deferredTo: string | null;
    static from(item: ZunoPlanItem): PlanItemView;
}
export declare class PlanView {
    id: string;
    challengeId: string;
    type: PlanType;
    title: string;
    primaryGoal: string | null;
    status: PlanStatus;
    startDate: string;
    endDate: string | null;
    reviewAt: string | null;
    version: number;
    items: PlanItemView[];
    static from(plan: ZunoPlan, items: ZunoPlanItem[]): PlanView;
    static summary(plan: ZunoPlan): PlanView;
}
