"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayCheckoutService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = require("crypto");
const order_entity_1 = require("../../orders/entities/order.entity");
const payment_entity_1 = require("../entities/payment.entity");
const plan_entity_1 = require("../../plans/entities/plan.entity");
const order_status_enum_1 = require("../../common/enums/order-status.enum");
const payment_status_enum_1 = require("../../common/enums/payment-status.enum");
const plan_type_enum_1 = require("../../common/enums/plan-type.enum");
const razorpay_service_1 = require("./razorpay.service");
let RazorpayCheckoutService = class RazorpayCheckoutService {
    constructor(razorpay, config, orderRepo, paymentRepo, planRepo, dataSource) {
        this.razorpay = razorpay;
        this.config = config;
        this.orderRepo = orderRepo;
        this.paymentRepo = paymentRepo;
        this.planRepo = planRepo;
        this.dataSource = dataSource;
    }
    async createOrderForPlan(userId, planUniqueId, billing) {
        if (!this.razorpay.isConfigured()) {
            throw new common_1.ServiceUnavailableException('Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
        }
        const plan = await this.planRepo.findOne({
            where: { unique_id: planUniqueId, is_deleted: false, is_enabled: true },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Plan not found or not available');
        }
        if (plan.plan_type === plan_type_enum_1.PlanType.FREE) {
            throw new common_1.BadRequestException('Free plan does not require payment');
        }
        const amountInr = billing === 'yearly' && plan.yearly_price != null
            ? Number(plan.yearly_price)
            : Number(plan.monthly_price);
        if (!Number.isFinite(amountInr) || amountInr <= 0) {
            throw new common_1.BadRequestException('Invalid plan amount for selected billing');
        }
        const amountPaise = Math.round(amountInr * 100);
        const orderNumber = `IB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
        const localOrder = this.orderRepo.create({
            order_number: orderNumber,
            user_id: userId,
            order_status: order_status_enum_1.OrderStatus.PENDING,
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
    isDevBypassMode() {
        const env = (this.config.get('NODE_ENV') || '').toLowerCase();
        const bypass = this.config.get('PAYMENT_BYPASS_IN_DEV');
        const bypassEnabled = bypass === undefined ? true : bypass === 'true';
        return (env === 'dev' || env === 'development') && bypassEnabled;
    }
    async createOfflineSuccessForPlan(userId, planUniqueId, billing, source = 'dev-offline') {
        const plan = await this.planRepo.findOne({
            where: { unique_id: planUniqueId, is_deleted: false, is_enabled: true },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Plan not found or not available');
        }
        if (plan.plan_type === plan_type_enum_1.PlanType.FREE) {
            throw new common_1.BadRequestException('Free plan does not require payment');
        }
        const amountInr = billing === 'yearly' && plan.yearly_price != null
            ? Number(plan.yearly_price)
            : Number(plan.monthly_price);
        if (!Number.isFinite(amountInr) || amountInr <= 0) {
            throw new common_1.BadRequestException('Invalid plan amount for selected billing');
        }
        return this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const paymentRepo = manager.getRepository(payment_entity_1.Payment);
            const orderNumber = `IB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
            const localOrder = orderRepo.create({
                order_number: orderNumber,
                user_id: userId,
                order_status: order_status_enum_1.OrderStatus.COMPLETED,
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
            const transactionId = `OFFLINE-${source.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
            const payment = paymentRepo.create({
                transaction_id: transactionId,
                user_id: userId,
                order_id: savedOrder.id,
                payment_status: payment_status_enum_1.PaymentStatus.COMPLETED,
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
    async verifySignatureAndCapture(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        if (!this.razorpay.isConfigured()) {
            throw new common_1.ServiceUnavailableException('Razorpay is not configured');
        }
        const secret = this.config.get('RAZORPAY_KEY_SECRET');
        if (!secret) {
            throw new common_1.ServiceUnavailableException('Razorpay secret missing');
        }
        const body = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
        if (expected !== razorpaySignature) {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
        const existing = await this.paymentRepo.findOne({
            where: { transaction_id: razorpayPaymentId, is_deleted: false },
        });
        if (existing && existing.payment_status === payment_status_enum_1.PaymentStatus.COMPLETED) {
            const ord = await this.orderRepo.findOne({ where: { id: existing.order_id } });
            if (!ord)
                throw new common_1.ConflictException('Payment recorded but order missing');
            const planId = ord.items?.[0]?.plan_id;
            if (!planId)
                throw new common_1.ConflictException('Order has no plan_id in items');
            return { local_order_id: ord.id, plan_id: planId, payment_id: existing.id };
        }
        const order = await this.orderRepo.findOne({
            where: { user_id: userId, razorpay_order_id: razorpayOrderId, is_deleted: false },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found for this payment');
        }
        if (order.order_status === order_status_enum_1.OrderStatus.COMPLETED) {
            const planId = order.items?.[0]?.plan_id;
            if (!planId)
                throw new common_1.BadRequestException('Order missing plan reference');
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
            throw new common_1.BadRequestException('Payment does not match order');
        }
        if (payment.status !== 'captured' && payment.status !== 'authorized') {
            throw new common_1.BadRequestException(`Payment not successful (status: ${payment.status})`);
        }
        const amountRupees = Number(order.total_amount);
        const paidPaise = Number(payment.amount);
        const expectedPaise = Math.round(amountRupees * 100);
        if (paidPaise !== expectedPaise) {
            throw new common_1.BadRequestException('Paid amount does not match order');
        }
        return this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const paymentRepo = manager.getRepository(payment_entity_1.Payment);
            const freshOrder = await orderRepo.findOne({ where: { id: order.id } });
            if (!freshOrder)
                throw new common_1.NotFoundException('Order disappeared');
            freshOrder.order_status = order_status_enum_1.OrderStatus.COMPLETED;
            freshOrder.completed_at = new Date();
            await orderRepo.save(freshOrder);
            const pay = paymentRepo.create({
                transaction_id: razorpayPaymentId,
                user_id: userId,
                order_id: freshOrder.id,
                payment_status: payment_status_enum_1.PaymentStatus.COMPLETED,
                amount: amountRupees,
                currency: freshOrder.currency,
                payment_method: typeof payment.method === 'string' ? payment.method : 'razorpay',
                gateway: 'razorpay',
                gateway_response: JSON.stringify(payment),
                paid_at: new Date(),
            });
            const savedPay = await paymentRepo.save(pay);
            const planId = freshOrder.items?.[0]?.plan_id;
            if (!planId) {
                throw new common_1.BadRequestException('Order items missing plan_id');
            }
            return {
                local_order_id: freshOrder.id,
                plan_id: planId,
                payment_id: savedPay.id,
            };
        });
    }
};
exports.RazorpayCheckoutService = RazorpayCheckoutService;
exports.RazorpayCheckoutService = RazorpayCheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(3, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(4, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __metadata("design:paramtypes", [razorpay_service_1.RazorpayService,
        config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], RazorpayCheckoutService);
//# sourceMappingURL=razorpay-checkout.service.js.map