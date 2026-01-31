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
exports.CustomerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const plans_service_1 = require("../../plans/services/plans.service");
const plan_response_dto_1 = require("../../plans/dtos/plan-response.dto");
const customer_service_1 = require("../../users/services/customer.service");
const update_customer_profile_dto_1 = require("../../users/dtos/update-customer-profile.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let CustomerController = class CustomerController {
    constructor(plansService, customerService) {
        this.plansService = plansService;
        this.customerService = customerService;
    }
    async getAvailablePlans() {
        return this.plansService.findAll({ is_enabled: true });
    }
    async getPlan(uniqueId) {
        return this.plansService.findOneByUniqueId(uniqueId);
    }
    async getProfile(user) {
        if (!user.id) {
            throw new common_1.BadRequestException('User ID is missing');
        }
        const profile = await this.customerService.getProfile(user.id);
        return {
            success: true,
            code: 200,
            message: 'Profile retrieved successfully',
            data: profile,
        };
    }
    async updateProfile(user, updateData) {
        const updated = await this.customerService.updateProfile(user.id, updateData);
        return {
            success: true,
            code: 200,
            message: 'Profile updated successfully',
            data: {
                id: updated.id,
                unique_id: updated.unique_id,
                first_name: updated.first_name,
                last_name: updated.last_name,
                email: updated.email,
                date_of_birth: updated.date_of_birth,
                time_of_birth: updated.time_of_birth,
                place_name: updated.place_name,
                latitude: updated.latitude,
                longitude: updated.longitude,
                timezone: updated.timezone,
                gender: updated.gender,
                avatar_url: updated.avatar_url,
            },
        };
    }
};
exports.CustomerController = CustomerController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available plans (Customer view)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of enabled plans', type: [plan_response_dto_1.PlanResponseDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getAvailablePlans", null);
__decorate([
    (0, common_1.Get)('plans/:uniqueId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get plan details (Customer)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan details', type: plan_response_dto_1.PlanResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getPlan", null);
__decorate([
    (0, common_1.Post)('profile'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get current customer profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update customer profile' }),
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
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_customer_profile_dto_1.UpdateCustomerProfileDto]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "updateProfile", null);
exports.CustomerController = CustomerController = __decorate([
    (0, swagger_1.ApiTags)('Customer'),
    (0, common_1.Controller)('customer'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [plans_service_1.PlansService,
        customer_service_1.CustomerService])
], CustomerController);
//# sourceMappingURL=customer.controller.js.map