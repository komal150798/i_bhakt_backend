import { PlansService } from '../../plans/services/plans.service';
import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
export declare class WebSubscriptionController {
    private readonly plansService;
    constructor(plansService: PlansService);
    getPlans(_user: CurrentUserPayload): Promise<{
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
}
