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
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const users_service_1 = require("../../services/users.service");
const subscriptions_service_1 = require("../../../subscriptions/services/subscriptions.service");
const usage_tracking_service_1 = require("../../../subscriptions/services/usage-tracking.service");
let WebUsersController = class WebUsersController {
    constructor(usersService, subscriptionsService, usageTrackingService) {
        this.usersService = usersService;
        this.subscriptionsService = subscriptionsService;
        this.usageTrackingService = usageTrackingService;
    }
    async getProfile(user) {
        const fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
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
        const updated = await this.usersService.update(user.unique_id, updateData, user.id);
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
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
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
exports.WebUsersController = WebUsersController = __decorate([
    (0, swagger_1.ApiTags)('web-users'),
    (0, common_1.Controller)('web/users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        subscriptions_service_1.SubscriptionsService,
        usage_tracking_service_1.UsageTrackingService])
], WebUsersController);
//# sourceMappingURL=web-users.controller.js.map