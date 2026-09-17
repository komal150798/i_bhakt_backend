import { PlanItemPriority, PlanType } from './plan.enum';
export interface PlanCapacityLimits {
    maxActions: number;
    minActions: number;
    maxEssential: number;
    maxPractices: number;
    maxEstimatedMinutes: number;
}
export declare function planCapacityFor(planType: PlanType): PlanCapacityLimits;
export interface CapacityCountable {
    priority: PlanItemPriority;
    isPractice: boolean;
    estimatedMinutes: number | null;
}
export interface CapacityUsage {
    actions: number;
    essentials: number;
    practices: number;
    estimatedMinutes: number;
}
export declare function measureCapacity(items: CapacityCountable[]): CapacityUsage;
export declare function wouldExceedCapacity(usage: CapacityUsage, limits: PlanCapacityLimits, candidate: CapacityCountable): boolean;
