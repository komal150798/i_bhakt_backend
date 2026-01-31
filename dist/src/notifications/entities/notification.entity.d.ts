import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../users/entities/customer.entity';
export declare class Notification extends BaseEntity {
    user_id: number;
    title: string;
    message: string | null;
    type: string | null;
    action_url: string | null;
    is_read: boolean;
    read_at: Date | null;
    metadata: Record<string, any> | null;
    customer: Customer;
}
