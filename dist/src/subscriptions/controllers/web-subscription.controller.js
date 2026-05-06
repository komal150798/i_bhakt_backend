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
exports.WebSubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const plans_service_1 = require("../../plans/services/plans.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let WebSubscriptionController = class WebSubscriptionController {
    constructor(plansService) {
        this.plansService = plansService;
    }
    async getPlans(_user) {
        const plans = await this.plansService.findAll({ is_enabled: true });
        return {
            success: true,
            data: plans.map((plan) => ({
                id: plan.id,
                unique_id: plan.unique_id,
                plan_type: plan.plan_type,
                name: plan.name,
                description: plan.description,
                tagline: plan.tagline,
                monthly_price: plan.monthly_price,
                yearly_price: plan.yearly_price,
                currency: plan.currency,
                billing_cycle_days: plan.billing_cycle_days,
                referral_count_required: plan.referral_count_required,
                sort_order: plan.sort_order,
                features: plan.features || [],
                is_popular: plan.is_popular || false,
                usage_limits: plan.usage_limits,
                metadata: plan.metadata,
            })),
        };
    }
};
exports.WebSubscriptionController = WebSubscriptionController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subscription plans (Web)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plans retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebSubscriptionController.prototype, "getPlans", null);
exports.WebSubscriptionController = WebSubscriptionController = __decorate([
    (0, swagger_1.ApiTags)('subscription'),
    (0, common_1.Controller)('subscription'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], WebSubscriptionController);
//# sourceMappingURL=web-subscription.controller.js.map