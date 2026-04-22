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
exports.AppSubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const plans_service_1 = require("../../plans/services/plans.service");
const subscriptions_service_1 = require("../services/subscriptions.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AppSubscriptionController = class AppSubscriptionController {
    constructor(plansService, subscriptionsService) {
        this.plansService = plansService;
        this.subscriptionsService = subscriptionsService;
    }
    async getPlans(user) {
        const plans = await this.plansService.findAll({ is_enabled: true });
        return {
            success: true,
            data: plans.map((plan) => ({
                unique_id: plan.unique_id,
                plan_type: plan.plan_type,
                name: plan.name,
                description: plan.description,
                monthly_price: plan.monthly_price,
                yearly_price: plan.yearly_price,
                currency: plan.currency,
                billing_cycle_days: plan.billing_cycle_days,
                features: plan.features || [],
                is_popular: plan.is_popular || false,
            })),
        };
    }
    async verifySubscription(body, user) {
        const paymentVerified = await this.verifyPayment(body.payment_id, body.payment_provider);
        if (!paymentVerified) {
            return {
                success: false,
                message: 'Payment verification failed',
            };
        }
        const subscription = await this.subscriptionsService.createSubscription(user.id, body.plan_id, new Date(), body.order_id);
        return {
            success: true,
            data: {
                subscription_id: subscription.id,
                plan_id: subscription.plan_id,
                start_date: subscription.start_date,
                end_date: subscription.end_date,
                is_active: subscription.is_active,
                message: 'Subscription activated successfully',
            },
        };
    }
    async getCurrentSubscription(user) {
        const subscription = await this.subscriptionsService.getCurrentSubscription(user.id);
        const planType = await this.subscriptionsService.getCurrentPlanType(user.id);
        return {
            success: true,
            data: {
                plan_type: planType,
                subscription: subscription
                    ? {
                        id: subscription.id,
                        plan_id: subscription.plan_id,
                        start_date: subscription.start_date,
                        end_date: subscription.end_date,
                        is_active: subscription.is_active,
                    }
                    : null,
            },
        };
    }
    async verifyPayment(paymentId, provider) {
        if (provider === 'razorpay') {
            return false;
        }
        return paymentId && paymentId.length > 0;
    }
};
exports.AppSubscriptionController = AppSubscriptionController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subscription plans (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plans retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppSubscriptionController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify subscription payment (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Subscription verified and activated',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppSubscriptionController.prototype, "verifySubscription", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get current subscription (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Current subscription retrieved',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppSubscriptionController.prototype, "getCurrentSubscription", null);
exports.AppSubscriptionController = AppSubscriptionController = __decorate([
    (0, swagger_1.ApiTags)('Subscription (App)'),
    (0, common_1.Controller)('app/subscription'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [plans_service_1.PlansService,
        subscriptions_service_1.SubscriptionsService])
], AppSubscriptionController);
//# sourceMappingURL=app-subscription.controller.js.map