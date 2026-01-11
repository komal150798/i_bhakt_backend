import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
export declare class Payment extends BaseEntity {
    transaction_id: string;
    user_id: number;
    order_id: number;
    payment_status: PaymentStatus;
    amount: number;
    currency: string;
    payment_method: string | null;
    gateway: string | null;
    gateway_response: string | null;
    paid_at: Date | null;
    refunded_at: Date | null;
    refund_amount: number | null;
    user: User;
    order: Order;
}
