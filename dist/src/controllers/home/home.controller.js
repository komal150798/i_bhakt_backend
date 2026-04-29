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
exports.HomeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const plans_service_1 = require("../../plans/services/plans.service");
const plan_response_dto_1 = require("../../plans/dtos/plan-response.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const customer_service_1 = require("../../users/services/customer.service");
let HomeController = class HomeController {
    constructor(plansService, customerService) {
        this.plansService = plansService;
        this.customerService = customerService;
    }
    async getPlans(enabled) {
        const isEnabled = enabled === 'true' || enabled === undefined;
        return this.plansService.findAll({ is_enabled: isEnabled });
    }
    async getPlan(uniqueId) {
        return this.plansService.findOneByUniqueId(uniqueId);
    }
    async getReferralCode(user) {
        const code = await this.customerService.getReferralCode(user.id);
        const baseUrl = (process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || '').trim();
        const referral_link = `${baseUrl || 'https://app.ibhakt.com'}/signup?ref=${code}`;
        return {
            success: true,
            data: {
                code,
                referral_link,
            },
        };
    }
    async getReferralStats(user) {
        const stats = await this.customerService.getReferralStats(user.id);
        return {
            success: true,
            data: {
                totalReferrals: stats.total_referrals,
                successfulReferrals: stats.successful_referrals,
                earnings: `${stats.total_earnings}`,
            },
        };
    }
};
exports.HomeController = HomeController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all enabled plans (Public)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of enabled plans', type: [plan_response_dto_1.PlanResponseDto] }),
    __param(0, (0, common_1.Query)('enabled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('plans/:uniqueId'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get plan details by unique ID (Public)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan details', type: plan_response_dto_1.PlanResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getPlan", null);
__decorate([
    (0, common_1.Get)('refer/code'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user referral code and share link' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Referral code fetched successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getReferralCode", null);
__decorate([
    (0, common_1.Get)('refer/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user referral stats' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Referral stats fetched successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getReferralStats", null);
exports.HomeController = HomeController = __decorate([
    (0, swagger_1.ApiTags)('Home'),
    (0, common_1.Controller)('home'),
    __metadata("design:paramtypes", [plans_service_1.PlansService,
        customer_service_1.CustomerService])
], HomeController);
//# sourceMappingURL=home.controller.js.map