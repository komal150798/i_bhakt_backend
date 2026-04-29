import { CreateRazorpayOrderDto } from '../dto/create-razorpay-order.dto';
import { VerifyRazorpayPaymentDto } from '../dto/verify-razorpay-payment.dto';
import { RazorpayCheckoutService } from '../services/razorpay-checkout.service';
import { SubscriptionsService } from '../../subscriptions/services/subscriptions.service';
export declare class RazorpayAppController {
    private readonly checkout;
    private readonly subscriptions;
    constructor(checkout: RazorpayCheckoutService, subscriptions: SubscriptionsService);
    createOrder(user: any, dto: CreateRazorpayOrderDto): Promise<{
        success: boolean;
        data: {
            mode: string;
            requires_verification: boolean;
            local_order_id: number;
            order_number: string;
            payment_id: number;
            subscription_id: number;
            plan_id: number;
            start_date: Date;
            end_date: Date;
            is_active: boolean;
        };
    } | {
        success: boolean;
        data: import("../services/razorpay-checkout.service").CreateOrderResult;
    }>;
    verify(user: any, dto: VerifyRazorpayPaymentDto): Promise<{
        success: boolean;
        data: {
            subscription_id: number;
            plan_id: number;
            order_id: number;
            start_date: Date;
            end_date: Date;
            is_active: boolean;
        };
    }>;
    private assertCustomer;
}
