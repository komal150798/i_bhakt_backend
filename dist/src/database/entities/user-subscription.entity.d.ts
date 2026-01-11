import { User } from './user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
export declare class UserSubscription {
    id: number;
    user_id: number;
    user: User;
    plan_id: number;
    plan: SubscriptionPlan;
    status: string;
    started_at: Date;
    expires_at: Date;
    cancelled_at: Date;
    auto_renew: boolean;
    freebies_unlocked: boolean;
    notes: string;
    created_at: Date;
    updated_at: Date;
}
