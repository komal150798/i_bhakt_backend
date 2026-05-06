import { PlansService } from '../../plans/services/plans.service';
import { SubscriptionsService } from '../services/subscriptions.service';
export declare class AppSubscriptionController {
    private readonly plansService;
    private readonly subscriptionsService;
    constructor(plansService: PlansService, subscriptionsService: SubscriptionsService);
    getPlans(user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            unique_id: string;
            plan_type: import("../../common/enums/plan-type.enum").PlanType;
            name: string;
            description: string;
            tagline: string;
            monthly_price: number;
            yearly_price: number;
            currency: string;
            billing_cycle_days: number;
            referral_count_required: number;
            sort_order: number;
            features: {
                name: string;
                description?: string;
                icon?: string;
            }[];
            is_popular: boolean;
            usage_limits: Record<string, number>;
            metadata: Record<string, any>;
        }[];
    }>;
    verifySubscription(body: {
        plan_id: number;
        payment_id: string;
        payment_provider: 'stripe' | 'razorpay';
        order_id?: number;
    }, user: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            subscription_id: number;
            plan_id: number;
            start_date: Date;
            end_date: Date;
            is_active: boolean;
            message: string;
        };
        message?: undefined;
    }>;
    getCurrentSubscription(user: any): Promise<{
        success: boolean;
        data: {
            plan_type: import("../../common/enums/plan-type.enum").PlanType;
            subscription: {
                id: number;
                plan_id: number;
                start_date: Date;
                end_date: Date;
                is_active: boolean;
            };
        };
    }>;
    private verifyPayment;
}
