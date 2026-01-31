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
const date_util_1 = require("../../../common/utils/date.util");
const string_util_1 = require("../../../common/utils/string.util");
let AppUsersController = class AppUsersController {
    constructor(usersService, customerService, subscriptionsService, usageTrackingService) {
        this.usersService = usersService;
        this.customerService = customerService;
        this.subscriptionsService = subscriptionsService;
        this.usageTrackingService = usageTrackingService;
    }
    async getProfile(user) {
        if (!user.unique_id) {
            throw new common_1.BadRequestException('User unique_id is missing');
        }
        let fullUser = null;
        try {
            fullUser = await this.customerService.findByUniqueId(user.unique_id);
        }
        catch (error) {
            try {
                fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
            }
            catch (userError) {
                throw new common_1.NotFoundException(`User with unique ID ${user.unique_id} not found in Customer or User table`);
            }
        }
        return {
            success: true,
            data: {
                id: fullUser.unique_id,
                name: (0, string_util_1.formatFullName)(fullUser.first_name, fullUser.last_name),
                email: fullUser.email,
                phone: fullUser.phone_number,
                plan: fullUser.current_plan || fullUser.plan || 'free',
                avatar: fullUser.avatar_url || null,
                verified: fullUser.is_verified || false,
            },
        };
    }
    async updateProfile(user, updateData) {
        if (!user.unique_id) {
            throw new common_1.BadRequestException('User unique_id is missing');
        }
        let fullUser = null;
        let isCustomer = false;
        try {
            fullUser = await this.customerService.findByUniqueId(user.unique_id);
            isCustomer = true;
        }
        catch (error) {
            try {
                fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
                isCustomer = false;
            }
            catch (userError) {
                throw new common_1.NotFoundException(`User with unique ID ${user.unique_id} not found`);
            }
        }
        let updated;
        if (isCustomer) {
            updated = await this.customerService.updateProfile(user.id, updateData);
        }
        else {
            const userUpdateData = {};
            Object.keys(updateData).forEach(key => {
                if (key !== 'date_of_birth') {
                    userUpdateData[key] = updateData[key];
                }
            });
            if (updateData.date_of_birth) {
                userUpdateData.date_of_birth = (0, date_util_1.parseDateString)(updateData.date_of_birth);
            }
            updated = await this.usersService.update(user.unique_id, userUpdateData, user.id);
        }
        return {
            success: true,
            data: {
                id: updated.unique_id,
                name: (0, string_util_1.formatFullName)(updated.first_name, updated.last_name),
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
        if (!user.unique_id) {
            throw new common_1.BadRequestException('User unique_id is missing');
        }
        let fullUser = null;
        try {
            fullUser = await this.customerService.findByUniqueId(user.unique_id);
        }
        catch (error) {
            try {
                fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
            }
            catch (userError) {
                throw new common_1.NotFoundException(`User with unique ID ${user.unique_id} not found`);
            }
        }
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
    __metadata("design:paramtypes", [users_service_1.UsersService,
        customer_service_1.CustomerService,
        subscriptions_service_1.SubscriptionsService,
        usage_tracking_service_1.UsageTrackingService])
], AppUsersController);
//# sourceMappingURL=app-users.controller.js.map