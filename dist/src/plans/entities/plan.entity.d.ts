import { BaseEntity } from '../../common/entities/base.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
import { Module } from '../../modules/entities/module.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Product } from '../../products/entities/product.entity';
export declare class Plan extends BaseEntity {
    plan_type: PlanType;
    name: string;
    description: string | null;
    tagline: string | null;
    monthly_price: number;
    yearly_price: number | null;
    currency: string;
    billing_cycle_days: number | null;
    trial_days: number | null;
    referral_count_required: number | null;
    is_popular: boolean;
    is_featured: boolean;
    sort_order: number;
    badge_color: string | null;
    badge_icon: string | null;
    features: Array<{
        name: string;
        description?: string;
        icon?: string;
    }> | null;
    usage_limits: Record<string, number> | null;
    metadata: Record<string, any> | null;
    modules: Module[];
    products: Product[];
    subscriptions: Subscription[];
}
