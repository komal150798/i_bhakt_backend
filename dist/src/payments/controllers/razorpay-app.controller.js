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
exports.RazorpayAppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const create_razorpay_order_dto_1 = require("../dto/create-razorpay-order.dto");
const verify_razorpay_payment_dto_1 = require("../dto/verify-razorpay-payment.dto");
const razorpay_checkout_service_1 = require("../services/razorpay-checkout.service");
const subscriptions_service_1 = require("../../subscriptions/services/subscriptions.service");
let RazorpayAppController = class RazorpayAppController {
    constructor(checkout, subscriptions) {
        this.checkout = checkout;
        this.subscriptions = subscriptions;
    }
    async createOrder(user, dto) {
        this.assertCustomer(user);
        const billing = dto.billing ?? 'yearly';
        const data = await this.checkout.createOrderForPlan(user.id, dto.plan_unique_id, billing);
        return {
            success: true,
            data,
        };
    }
    async verify(user, dto) {
        this.assertCustomer(user);
        const { plan_id, local_order_id } = await this.checkout.verifySignatureAndCapture(user.id, dto.razorpay_order_id, dto.razorpay_payment_id, dto.razorpay_signature);
        const subscription = await this.subscriptions.createSubscription(user.id, plan_id, new Date(), local_order_id);
        return {
            success: true,
            data: {
                subscription_id: subscription.id,
                plan_id: subscription.plan_id,
                order_id: local_order_id,
                start_date: subscription.start_date,
                end_date: subscription.end_date,
                is_active: subscription.is_active,
            },
        };
    }
    assertCustomer(user) {
        if (user?.type !== 'user') {
            throw new common_1.ForbiddenException('Only customer accounts can purchase subscriptions');
        }
    }
};
exports.RazorpayAppController = RazorpayAppController;
__decorate([
    (0, common_1.Post)('order'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Create Razorpay order + local pending order',
        description: 'Returns key_id and razorpay_order_id for Razorpay Checkout. Amount is in paise. After client pays, call POST verify with signature.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_razorpay_order_dto_1.CreateRazorpayOrderDto]),
    __metadata("design:returntype", Promise)
], RazorpayAppController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify Razorpay payment signature and activate subscription',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_razorpay_payment_dto_1.VerifyRazorpayPaymentDto]),
    __metadata("design:returntype", Promise)
], RazorpayAppController.prototype, "verify", null);
exports.RazorpayAppController = RazorpayAppController = __decorate([
    (0, swagger_1.ApiTags)('Payments — Razorpay (App)'),
    (0, common_1.Controller)('app/payments/razorpay'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [razorpay_checkout_service_1.RazorpayCheckoutService,
        subscriptions_service_1.SubscriptionsService])
], RazorpayAppController);
//# sourceMappingURL=razorpay-app.controller.js.map