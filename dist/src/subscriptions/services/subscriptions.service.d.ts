import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Customer } from '../../users/entities/customer.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
export declare class SubscriptionsService {
    private subscriptionRepository;
    private customerRepository;
    private planRepository;
    constructor(subscriptionRepository: Repository<Subscription>, customerRepository: Repository<Customer>, planRepository: Repository<Plan>);
    getCurrentSubscription(userId: number): Promise<Subscription | null>;
    getCurrentPlanType(userId: number): Promise<PlanType>;
    getActivePlanByType(planType: PlanType): Promise<Plan | null>;
    hasModuleAccess(userId: number, moduleSlug: string): Promise<boolean>;
    getUserModules(userId: number): Promise<string[]>;
    createSubscription(userId: number, planId: number, startDate?: Date, orderId?: number): Promise<Subscription>;
    upgradeSubscription(userId: number, newPlanId: number, orderId?: number): Promise<Subscription>;
    cancelSubscription(userId: number, reason?: string): Promise<void>;
    findById(id: number): Promise<Subscription>;
}
