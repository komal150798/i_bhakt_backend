import { PlanType } from '../../common/enums/plan-type.enum';
declare class FeatureDto {
    name: string;
    description?: string;
    icon?: string;
}
export declare class CreatePlanDto {
    plan_type: PlanType;
    name: string;
    description?: string;
    tagline?: string;
    monthly_price: number;
    yearly_price?: number;
    currency?: string;
    billing_cycle_days?: number;
    trial_days?: number;
    referral_count_required?: number;
    is_popular?: boolean;
    is_featured?: boolean;
    is_enabled?: boolean;
    sort_order?: number;
    badge_color?: string;
    badge_icon?: string;
    features?: FeatureDto[];
    usage_limits?: Record<string, number>;
    metadata?: Record<string, any>;
}
export {};
