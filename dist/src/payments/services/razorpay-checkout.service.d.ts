import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Payment } from '../entities/payment.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
import { RazorpayService } from './razorpay.service';
export interface CreateOrderResult {
    key_id: string;
    amount: number;
    currency: string;
    razorpay_order_id: string;
    local_order_id: number;
    order_number: string;
    plan_id: number;
    plan_type: PlanType;
}
export interface VerifyResult {
    local_order_id: number;
    plan_id: number;
    payment_id: number;
}
export interface OfflineSuccessResult {
    local_order_id: number;
    payment_id: number;
    plan_id: number;
    order_number: string;
}
export declare class RazorpayCheckoutService {
    private readonly razorpay;
    private readonly config;
    private readonly orderRepo;
    private readonly paymentRepo;
    private readonly planRepo;
    private readonly dataSource;
    constructor(razorpay: RazorpayService, config: ConfigService, orderRepo: Repository<Order>, paymentRepo: Repository<Payment>, planRepo: Repository<Plan>, dataSource: DataSource);
    createOrderForPlan(userId: number, planUniqueId: string, billing: 'yearly' | 'monthly'): Promise<CreateOrderResult>;
    isDevBypassMode(): boolean;
    createOfflineSuccessForPlan(userId: number, planUniqueId: string, billing: 'yearly' | 'monthly', source?: 'dev-offline' | 'admin-offline'): Promise<OfflineSuccessResult>;
    verifySignatureAndCapture(userId: number, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<VerifyResult>;
}
