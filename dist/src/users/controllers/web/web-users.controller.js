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
exports.WebUsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const update_customer_profile_dto_1 = require("../../dtos/update-customer-profile.dto");
const string_util_1 = require("../../../common/utils/string.util");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const customer_service_1 = require("../../services/customer.service");
const subscriptions_service_1 = require("../../../subscriptions/services/subscriptions.service");
const usage_tracking_service_1 = require("../../../subscriptions/services/usage-tracking.service");
const plans_service_1 = require("../../../plans/services/plans.service");
const kundli_service_1 = require("../../../kundli/services/kundli.service");
const upgrade_plan_dto_1 = require("../../dtos/upgrade-plan.dto");
let WebUsersController = class WebUsersController {
    constructor(customerService, subscriptionsService, usageTrackingService, plansService, kundliService) {
        this.customerService = customerService;
        this.subscriptionsService = subscriptionsService;
        this.usageTrackingService = usageTrackingService;
        this.plansService = plansService;
        this.kundliService = kundliService;
    }
    async getProfile(user) {
        if (!user.unique_id) {
            throw new common_1.BadRequestException('User unique_id is missing');
        }
        const fullUser = await this.customerService.findByUniqueId(user.unique_id);
        return {
            success: true,
            data: {
                unique_id: fullUser.unique_id,
                first_name: fullUser.first_name,
                last_name: fullUser.last_name,
                email: fullUser.email,
                phone_number: fullUser.phone_number,
                date_of_birth: fullUser.date_of_birth,
                time_of_birth: fullUser.time_of_birth,
                place_name: fullUser.place_name,
                gender: fullUser.gender,
                current_plan: fullUser.current_plan,
                referral_code: fullUser.referral_code,
                is_verified: fullUser.is_verified,
                avatar_url: fullUser.avatar_url,
            },
        };
    }
    async updateProfile(user, updateData) {
        if (!user.unique_id) {
            throw new common_1.BadRequestException('User unique_id is missing');
        }
        const fullUser = await this.customerService.findByUniqueId(user.unique_id);
        const updated = await this.customerService.updateProfile(user.id, updateData);
        return {
            success: true,
            data: {
                unique_id: updated.unique_id,
                first_name: updated.first_name,
                last_name: updated.last_name,
                email: updated.email,
                message: 'Profile updated successfully',
            },
        };
    }
    async getCurrentPlan(user) {
        const subscription = await this.subscriptionsService.getCurrentSubscription(user.id);
        const planType = await this.subscriptionsService.getCurrentPlanType(user.id);
        return {
            success: true,
            data: {
                plan_type: planType,
                subscription: subscription
                    ? {
                        unique_id: subscription.unique_id,
                        plan_type: subscription.plan_type,
                        start_date: subscription.start_date,
                        end_date: subscription.end_date,
                        is_active: subscription.is_active,
                    }
                    : null,
            },
        };
    }
    async getAllowedModules(user) {
        const modules = await this.subscriptionsService.getUserModules(user.id);
        return {
            success: true,
            data: {
                modules,
            },
        };
    }
    async getUsageLimits(user) {
        const limits = await this.usageTrackingService.getUserUsageLimits(user.id);
        return {
            success: true,
            data: limits,
        };
    }
    async getProfileForDashboard(user) {
        if (!user.unique_id) {
            throw new common_1.BadRequestException('User unique_id is missing');
        }
        const fullUser = await this.customerService.findByUniqueId(user.unique_id);
        return {
            success: true,
            data: {
                id: fullUser.unique_id,
                first_name: fullUser.first_name,
                last_name: fullUser.last_name,
                full_name: (0, string_util_1.formatFullName)(fullUser.first_name, fullUser.last_name),
                email: fullUser.email,
                phone_number: fullUser.phone_number,
                gender: fullUser.gender,
                date_of_birth: fullUser.date_of_birth,
                time_of_birth: fullUser.time_of_birth,
                place_name: fullUser.place_name,
                latitude: fullUser.latitude,
                longitude: fullUser.longitude,
                timezone: fullUser.timezone,
                life_role: fullUser.life_role,
                relationship_status: fullUser.relationship_status,
                interests: fullUser.interests ? JSON.parse(fullUser.interests) : [],
                avatar_url: fullUser.avatar_url,
                avatar_img: fullUser.avatar_img,
                nakshatra: fullUser.nakshatra,
                pada: fullUser.pada,
                current_plan: fullUser.current_plan,
                referral_code: fullUser.referral_code,
                is_verified: fullUser.is_verified,
                created_at: fullUser.added_date,
                updated_at: fullUser.modify_date,
            },
        };
    }
    async getReferralsList(user) {
        const data = await this.customerService.getReferralListForDashboard(user.id);
        return {
            success: true,
            data,
        };
    }
    async getReferralStatsDashboard(user) {
        const stats = await this.customerService.getReferralStats(user.id);
        const fullUser = await this.customerService.findOne(user.id);
        return {
            success: true,
            data: {
                referral_code: stats.referral_code,
                referral_count: stats.successful_referrals,
                total_referrals: stats.total_referrals,
                referrals_needed: 11,
                referral_limit_awaken_to_builder: 5,
                referral_limit_karma_pro_to_dharma: 51,
                current_plan: fullUser.current_plan,
            },
        };
    }
    async getCurrentDashaForWeb(user) {
        const data = await this.kundliService.getCurrentDashaForDashboard(user.id);
        return {
            success: true,
            data: data ?? {
                current_mahadasha: null,
                current_antardasha: null,
                current_pratyantar: null,
                current_sukshma: null,
            },
        };
    }
    async upgradePlan(user, body) {
        const plan = await this.plansService.resolveSubscribablePlan({
            unique_id: body.unique_id,
            plan_id: body.plan_id,
        });
        await this.subscriptionsService.createSubscription(user.id, plan.id, new Date());
        return {
            success: true,
            data: {
                plan: plan.plan_type,
                plan_id: Number(plan.id),
                unique_id: plan.unique_id,
            },
        };
    }
};
exports.WebUsersController = WebUsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile (Web)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update own profile (Web)' }),
    (0, swagger_1.ApiBody)({
        type: update_customer_profile_dto_1.UpdateCustomerProfileDto,
        description: 'Profile update data. All fields are optional.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Profile updated successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_customer_profile_dto_1.UpdateCustomerProfileDto]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('me/current-plan'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user subscription plan (Web)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "getCurrentPlan", null);
__decorate([
    (0, common_1.Get)('me/allowed-modules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all modules user has access to (Web)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "getAllowedModules", null);
__decorate([
    (0, common_1.Get)('me/usage-limits'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current usage and limits for all modules (Web)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "getUsageLimits", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile for web dashboard (same fields as app profile)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "getProfileForDashboard", null);
__decorate([
    (0, common_1.Get)('referrals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Referred signups (Web)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pending and completed referrals' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "getReferralsList", null);
__decorate([
    (0, common_1.Get)('referral-stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Referral summary (Web)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Referral stats' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "getReferralStatsDashboard", null);
__decorate([
    (0, common_1.Get)('current-dasha'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Current Vimshottari lords from stored kundli (Web)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current dasha levels' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "getCurrentDashaForWeb", null);
__decorate([
    (0, common_1.Post)('upgrade-plan'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign subscription by plan id or unique_id (Web; direct activation; use payment verify for paid checkout)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan upgraded' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid plan or plan not available' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upgrade_plan_dto_1.UpgradePlanDto]),
    __metadata("design:returntype", Promise)
], WebUsersController.prototype, "upgradePlan", null);
exports.WebUsersController = WebUsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [customer_service_1.CustomerService,
        subscriptions_service_1.SubscriptionsService,
        usage_tracking_service_1.UsageTrackingService,
        plans_service_1.PlansService,
        kundli_service_1.KundliService])
], WebUsersController);
//# sourceMappingURL=web-users.controller.js.map