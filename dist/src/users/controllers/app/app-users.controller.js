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
const customer_service_1 = require("../../services/customer.service");
const subscriptions_service_1 = require("../../../subscriptions/services/subscriptions.service");
const usage_tracking_service_1 = require("../../../subscriptions/services/usage-tracking.service");
const update_customer_profile_dto_1 = require("../../dtos/update-customer-profile.dto");
let AppUsersController = class AppUsersController {
    constructor(usersService, customerService, subscriptionsService, usageTrackingService) {
        this.usersService = usersService;
        this.customerService = customerService;
        this.subscriptionsService = subscriptionsService;
        this.usageTrackingService = usageTrackingService;
    }
    async getProfile(user) {
        const profile = await this.customerService.getProfile(user.id);
        const formattedProfile = {
            name_and_gender: {
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
                gender: profile.gender || null,
            },
            life_role: profile.life_role || null,
            birth_details: {
                date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-GB') : null,
                time_of_birth: profile.time_of_birth || null,
                place_of_birth: profile.place_name || null,
                current_city: profile.current_city || null,
            },
            relationship_status: profile.relationship_status || null,
            interests: profile.interests || null,
            contact: {
                email: profile.email || null,
                phone_number: profile.phone_number || null,
            },
            avatar_url: profile.avatar_url || null,
        };
        return {
            success: true,
            data: formattedProfile,
        };
    }
    async updateProfile(user, updateData) {
        const updated = await this.customerService.updateProfile(user.id, updateData);
        return {
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: updated.id,
                unique_id: updated.unique_id,
                name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || 'User',
                email: updated.email,
                phone_number: updated.phone_number,
                gender: updated.gender,
                life_role: updated.life_role || null,
                relationship_status: updated.relationship_status || null,
                interests: updated.interests || null,
                current_city: updated.current_city || null,
                avatar_url: updated.avatar_url,
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
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile (Mobile App) - Screen 07 Review Profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppUsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update profile (Mobile App) - All screens (02-06, 09)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_customer_profile_dto_1.UpdateCustomerProfileDto]),
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
        customer_service_1.CustomerService,
        subscriptions_service_1.SubscriptionsService,
        usage_tracking_service_1.UsageTrackingService])
], AppUsersController);
//# sourceMappingURL=app-users.controller.js.map