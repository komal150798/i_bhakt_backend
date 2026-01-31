import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../users/entities/customer.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Payment } from '../../payments/entities/payment.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
export declare class Order extends BaseEntity {
    order_number: string;
    user_id: number;
    order_status: OrderStatus;
    subtotal: number;
    discount: number;
    tax: number;
    total_amount: number;
    currency: string;
    items: Record<string, any>[] | null;
    notes: string | null;
    completed_at: Date | null;
    customer: Customer;
    payments: Payment[];
    subscriptions: Subscription[];
}
