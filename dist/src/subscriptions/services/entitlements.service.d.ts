import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
export interface FeatureEntitlement {
    feature: string;
    allowed: boolean;
    limit?: number;
    current_usage?: number;
}
export interface UserEntitlements {
    plan_type: PlanType;
    plan_name: string;
    features: FeatureEntitlement[];
    usage_limits: Record<string, {
        limit: number;
        current: number;
    }>;
}
export declare class EntitlementsService {
    private readonly subscriptionRepository;
    private readonly planRepository;
    private readonly logger;
    constructor(subscriptionRepository: Repository<Subscription>, planRepository: Repository<Plan>);
    getUserEntitlements(userId: number): Promise<UserEntitlements>;
    hasFeatureAccess(userId: number, feature: string): Promise<boolean>;
    canPerformAction(userId: number, action: string, currentUsage?: number): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    private buildFeatureEntitlements;
    private getDefaultEntitlements;
    getUserPlanType(userId: number): Promise<PlanType>;
}
