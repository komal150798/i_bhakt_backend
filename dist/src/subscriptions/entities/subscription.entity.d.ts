import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
import { Order } from '../../orders/entities/order.entity';
import { UsageTracking } from './usage-tracking.entity';
export declare class Subscription extends BaseEntity {
    user_id: number;
    plan_id: number;
    plan_type: PlanType;
    start_date: Date;
    end_date: Date | null;
    is_active: boolean;
    is_renewal: boolean;
    order_id: number | null;
    cancelled_at: Date | null;
    cancellation_reason: string | null;
    user: User;
    plan: Plan;
    order: Order | null;
    usage_tracking: UsageTracking[];
}
