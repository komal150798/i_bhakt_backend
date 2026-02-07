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
const customer_service_1 = require("../../services/customer.service");
const subscriptions_service_1 = require("../../../subscriptions/services/subscriptions.service");
const usage_tracking_service_1 = require("../../../subscriptions/services/usage-tracking.service");
const update_customer_profile_dto_1 = require("../../dtos/update-customer-profile.dto");
const string_util_1 = require("../../../common/utils/string.util");
let AppUsersController = class AppUsersController {
    constructor(customerService, subscriptionsService, usageTrackingService) {
        this.customerService = customerService;
        this.subscriptionsService = subscriptionsService;
        this.usageTrackingService = usageTrackingService;
    }
    async getProfile(user) {
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
    async updateProfile(user, updateData) {
        if (!user.unique_id) {
            throw new common_1.BadRequestException('User unique_id is missing');
        }
        const updated = await this.customerService.updateProfile(user.id, updateData);
        return {
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: updated.unique_id,
                first_name: updated.first_name,
                last_name: updated.last_name,
                full_name: (0, string_util_1.formatFullName)(updated.first_name, updated.last_name),
                email: updated.email,
                phone_number: updated.phone_number,
                gender: updated.gender,
                date_of_birth: updated.date_of_birth,
                time_of_birth: updated.time_of_birth,
                place_name: updated.place_name,
                latitude: updated.latitude,
                longitude: updated.longitude,
                timezone: updated.timezone,
                life_role: updated.life_role,
                relationship_status: updated.relationship_status,
                interests: updated.interests ? JSON.parse(updated.interests) : [],
                avatar_url: updated.avatar_url,
                avatar_img: updated.avatar_img,
                nakshatra: updated.nakshatra,
                pada: updated.pada,
                current_plan: updated.current_plan,
                referral_code: updated.referral_code,
                is_verified: updated.is_verified,
                created_at: updated.added_date,
                updated_at: updated.modify_date,
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
        if (!user.unique_id) {
            throw new common_1.BadRequestException('User unique_id is missing');
        }
        const fullUser = await this.customerService.findByUniqueId(user.unique_id);
        const limits = await this.usageTrackingService.getUserUsageLimits(user.id);
        return {
            success: true,
            data: {
                plan: fullUser.current_plan || fullUser.plan || 'free',
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
    (0, swagger_1.ApiBody)({
        type: update_customer_profile_dto_1.UpdateCustomerProfileDto,
        description: 'Profile update data. All fields are optional.',
        examples: {
            basic: {
                summary: 'Basic profile update',
                value: {
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john.doe@example.com',
                },
            },
            withFullName: {
                summary: 'Update with full_name (will be split into first_name and last_name)',
                value: {
                    full_name: 'John Doe',
                    email: 'john.doe@example.com',
                    gender: 'male',
                    life_role: 'Entrepreneur',
                    relationship_status: 'single',
                    interests: ['yoga', 'meditation', 'astrology'],
                    avatar_img: 'https://example.com/avatar.jpg',
                },
            },
            withBirthData: {
                summary: 'Update with birth data for kundli',
                value: {
                    first_name: 'John',
                    last_name: 'Doe',
                    date_of_birth: '1990-01-15',
                    time_of_birth: '10:30:00',
                    place_name: 'Mumbai',
                    latitude: 19.0760,
                    longitude: 72.8777,
                    timezone: 'Asia/Kolkata',
                },
            },
            complete: {
                summary: 'Complete profile update with all new fields',
                value: {
                    full_name: 'Jane Smith',
                    gender: 'female',
                    life_role: 'Teacher',
                    date_of_birth: '1995-05-20',
                    time_of_birth: '14:45:00',
                    place_name: 'Delhi',
                    latitude: 28.6139,
                    longitude: 77.2090,
                    timezone: 'Asia/Kolkata',
                    relationship_status: 'married',
                    interests: ['reading', 'travel', 'cooking'],
                    avatar_img: 'https://example.com/avatar.jpg',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Profile updated successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'uuid-here',
                    name: 'John Doe',
                    message: 'Profile updated',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
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
    __metadata("design:paramtypes", [customer_service_1.CustomerService,
        subscriptions_service_1.SubscriptionsService,
        usage_tracking_service_1.UsageTrackingService])
], AppUsersController);
//# sourceMappingURL=app-users.controller.js.map