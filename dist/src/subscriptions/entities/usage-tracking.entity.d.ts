import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Subscription } from './subscription.entity';
export declare class UsageTracking extends BaseEntity {
    user_id: number;
    subscription_id: number | null;
    module_slug: string;
    action_type: string;
    usage_count: number;
    limit: number | null;
    period: Date;
    metadata: Record<string, any> | null;
    user: User;
    subscription: Subscription | null;
}
