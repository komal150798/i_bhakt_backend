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
exports.AppUsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const users_service_1 = require("../../services/users.service");
const subscriptions_service_1 = require("../../../subscriptions/services/subscriptions.service");
const usage_tracking_service_1 = require("../../../subscriptions/services/usage-tracking.service");
let AppUsersController = class AppUsersController {
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
                id: fullUser.unique_id,
                name: `${fullUser.first_name || ''} ${fullUser.last_name || ''}`.trim() || 'User',
                email: fullUser.email,
                phone: fullUser.phone_number,
                plan: fullUser.current_plan,
                avatar: fullUser.avatar_url,
                verified: fullUser.is_verified,
            },
        };
    }
    async updateProfile(user, updateData) {
        const updated = await this.usersService.update(user.unique_id, updateData, user.id);
        return {
            success: true,
            data: {
                id: updated.unique_id,
                name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || 'User',
                message: 'Profile updated',
            },
        };
    }
    async getCurrentPlan(user) {
        const planType = await this.subscriptionsService.getCurrentPlanType(user.id);
        const subscription = await this.subscriptionsService.getCurrentSubscription(user.id);
        return {
            success: true,
            data: {
                plan: planType,
                active: subscription?.is_active || false,
                expires: subscription?.end_date || null,
            },
        };
    }
    async getModules(user) {
        const modules = await this.subscriptionsService.getUserModules(user.id);
        return {
            success: true,
            data: {
                modules,
            },
        };
    }
    async getStats(user) {
        const fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
        const limits = await this.usageTrackingService.getUserUsageLimits(user.id);
        return {
            success: true,
            data: {
                plan: fullUser.current_plan,
                referral_code: fullUser.referral_code,
                verified: fullUser.is_verified,
                usage: limits,
            },
        };
    }
};
exports.AppUsersController = AppUsersController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile (Mobile App)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update profile (Mobile App)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppUsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('current-plan'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current subscription plan (Mobile App)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUsersController.prototype, "getCurrentPlan", null);
__decorate([
    (0, common_1.Get)('modules'),
    (0, swagger_1.ApiOperation)({ summary: 'Get allowed modules (Mobile App)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUsersController.prototype, "getModules", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user stats (Mobile App)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUsersController.prototype, "getStats", null);
exports.AppUsersController = AppUsersController = __decorate([
    (0, swagger_1.ApiTags)('app-users'),
    (0, common_1.Controller)('app/users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        subscriptions_service_1.SubscriptionsService,
        usage_tracking_service_1.UsageTrackingService])
], AppUsersController);
//# sourceMappingURL=app-users.controller.js.map