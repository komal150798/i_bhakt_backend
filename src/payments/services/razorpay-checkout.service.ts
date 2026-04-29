import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { Order } from '../../orders/entities/order.entity';
import { Payment } from '../entities/payment.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
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

@Injectable()
export class RazorpayCheckoutService {
  constructor(
    private readonly razorpay: RazorpayService,
    private readonly config: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrderForPlan(
    userId: number,
    planUniqueId: string,
    billing: 'yearly' | 'monthly',
  ): Promise<CreateOrderResult> {
    if (!this.razorpay.isConfigured()) {
      throw new ServiceUnavailableException(
        'Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      );
    }

    const plan = await this.planRepo.findOne({
      where: { unique_id: planUniqueId, is_deleted: false, is_enabled: true },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found or not available');
    }

    if (plan.plan_type === PlanType.FREE) {
      throw new BadRequestException('Free plan does not require payment');
    }

    const amountInr =
      billing === 'yearly' && plan.yearly_price != null
        ? Number(plan.yearly_price)
        : Number(plan.monthly_price);
    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      throw new BadRequestException('Invalid plan amount for selected billing');
    }

    const amountPaise = Math.round(amountInr * 100);
    const orderNumber = `IB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    const localOrder = this.orderRepo.create({
      order_number: orderNumber,
      user_id: userId,
      order_status: OrderStatus.PENDING,
      subtotal: amountInr,
      discount: 0,
      tax: 0,
      total_amount: amountInr,
      currency: plan.currency || 'INR',
      items: [
        {
          type: 'subscription',
          plan_id: plan.id,
          plan_unique_id: plan.unique_id,
          plan_type: plan.plan_type,
          billing,
        },
      ],
      notes: `subscription:${plan.plan_type}`,
    });
    const savedOrder = await this.orderRepo.save(localOrder);

    const rz = this.razorpay.getClient();
    const receipt = orderNumber.slice(0, 40);
    const rzOrder = await rz.orders.create({
      amount: amountPaise,
      currency: plan.currency || 'INR',
      receipt,
      notes: {
        user_id: String(userId),
        plan_id: String(plan.id),
        local_order_id: String(savedOrder.id),
      },
    });

    savedOrder.razorpay_order_id = rzOrder.id;
    await this.orderRepo.save(savedOrder);

    return {
      key_id: this.razorpay.getKeyId(),
      amount: amountPaise,
      currency: rzOrder.currency,
      razorpay_order_id: rzOrder.id,
      local_order_id: savedOrder.id,
      order_number: savedOrder.order_number,
      plan_id: plan.id,
      plan_type: plan.plan_type,
    };
  }

  isDevBypassMode(): boolean {
    const env = (this.config.get<string>('NODE_ENV') || '').toLowerCase();
    const bypass = this.config.get<string>('PAYMENT_BYPASS_IN_DEV');
    const bypassEnabled = bypass === undefined ? true : bypass === 'true';
    return (env === 'dev' || env === 'development') && bypassEnabled;
  }

  async createOfflineSuccessForPlan(
    userId: number,
    planUniqueId: string,
    billing: 'yearly' | 'monthly',
    source: 'dev-offline' | 'admin-offline' = 'dev-offline',
  ): Promise<OfflineSuccessResult> {
    const plan = await this.planRepo.findOne({
      where: { unique_id: planUniqueId, is_deleted: false, is_enabled: true },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found or not available');
    }

    if (plan.plan_type === PlanType.FREE) {
      throw new BadRequestException('Free plan does not require payment');
    }

    const amountInr =
      billing === 'yearly' && plan.yearly_price != null
        ? Number(plan.yearly_price)
        : Number(plan.monthly_price);
    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      throw new BadRequestException('Invalid plan amount for selected billing');
    }

    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const paymentRepo = manager.getRepository(Payment);

      const orderNumber = `IB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
      const localOrder = orderRepo.create({
        order_number: orderNumber,
        user_id: userId,
        order_status: OrderStatus.COMPLETED,
        subtotal: amountInr,
        discount: 0,
        tax: 0,
        total_amount: amountInr,
        currency: plan.currency || 'INR',
        items: [
          {
            type: 'subscription',
            plan_id: plan.id,
            plan_unique_id: plan.unique_id,
            plan_type: plan.plan_type,
            billing,
          },
        ],
        notes: `offline:${source}:subscription:${plan.plan_type}`,
        completed_at: new Date(),
      });
      const savedOrder = await orderRepo.save(localOrder);

      const transactionId = `OFFLINE-${source.toUpperCase()}-${Date.now()}-${Math.floor(
        Math.random() * 100000,
      )}`;
      const payment = paymentRepo.create({
        transaction_id: transactionId,
        user_id: userId,
        order_id: savedOrder.id,
        payment_status: PaymentStatus.COMPLETED,
        amount: amountInr,
        currency: savedOrder.currency,
        payment_method: source,
        gateway: source,
        gateway_response: JSON.stringify({
          mode: 'offline',
          source,
          auto_marked_paid: true,
          recorded_at: new Date().toISOString(),
        }),
        paid_at: new Date(),
      });
      const savedPayment = await paymentRepo.save(payment);

      return {
        local_order_id: savedOrder.id,
        payment_id: savedPayment.id,
        plan_id: plan.id,
        order_number: savedOrder.order_number,
      };
    });
  }

  async verifySignatureAndCapture(
    userId: number,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<VerifyResult> {
    if (!this.razorpay.isConfigured()) {
      throw new ServiceUnavailableException('Razorpay is not configured');
    }

    const secret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Razorpay secret missing');
    }

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const existing = await this.paymentRepo.findOne({
      where: { transaction_id: razorpayPaymentId, is_deleted: false },
    });
    if (existing && existing.payment_status === PaymentStatus.COMPLETED) {
      const ord = await this.orderRepo.findOne({ where: { id: existing.order_id } });
      if (!ord) throw new ConflictException('Payment recorded but order missing');
      const planId = (ord.items?.[0] as { plan_id?: number })?.plan_id;
      if (!planId) throw new ConflictException('Order has no plan_id in items');
      return { local_order_id: ord.id, plan_id: planId, payment_id: existing.id };
    }

    const order = await this.orderRepo.findOne({
      where: { user_id: userId, razorpay_order_id: razorpayOrderId, is_deleted: false },
    });
    if (!order) {
      throw new NotFoundException('Order not found for this payment');
    }
    if (order.order_status === OrderStatus.COMPLETED) {
      const planId = (order.items?.[0] as { plan_id?: number })?.plan_id;
      if (!planId) throw new BadRequestException('Order missing plan reference');
      const priorPay = await this.paymentRepo.findOne({
        where: { order_id: order.id, is_deleted: false },
        order: { id: 'DESC' },
      });
      return {
        local_order_id: order.id,
        plan_id: planId,
        payment_id: priorPay?.id ?? 0,
      };
    }

    const rz = this.razorpay.getClient();
    const payment = await rz.payments.fetch(razorpayPaymentId);
    if (payment.order_id !== razorpayOrderId) {
      throw new BadRequestException('Payment does not match order');
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      throw new BadRequestException(`Payment not successful (status: ${payment.status})`);
    }

    const amountRupees = Number(order.total_amount);
    const paidPaise = Number(payment.amount);
    const expectedPaise = Math.round(amountRupees * 100);
    if (paidPaise !== expectedPaise) {
      throw new BadRequestException('Paid amount does not match order');
    }

    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const paymentRepo = manager.getRepository(Payment);

      const freshOrder = await orderRepo.findOne({ where: { id: order.id } });
      if (!freshOrder) throw new NotFoundException('Order disappeared');

      freshOrder.order_status = OrderStatus.COMPLETED;
      freshOrder.completed_at = new Date();
      await orderRepo.save(freshOrder);

      const pay = paymentRepo.create({
        transaction_id: razorpayPaymentId,
        user_id: userId,
        order_id: freshOrder.id,
        payment_status: PaymentStatus.COMPLETED,
        amount: amountRupees,
        currency: freshOrder.currency,
        payment_method: typeof payment.method === 'string' ? payment.method : 'razorpay',
        gateway: 'razorpay',
        gateway_response: JSON.stringify(payment),
        paid_at: new Date(),
      });
      const savedPay = await paymentRepo.save(pay);

      const planId = (freshOrder.items?.[0] as { plan_id?: number })?.plan_id;
      if (!planId) {
        throw new BadRequestException('Order items missing plan_id');
      }

      return {
        local_order_id: freshOrder.id,
        plan_id: planId,
        payment_id: savedPay.id,
      };
    });
  }
}
