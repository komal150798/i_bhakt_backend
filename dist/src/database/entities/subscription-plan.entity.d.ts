import { UserSubscription } from './user-subscription.entity';
export declare class SubscriptionPlan {
    id: number;
    code: string;
    name: string;
    tier: string;
    description: string;
    benefits: string;
    max_daily_guidances: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    subscriptions: UserSubscription[];
}
