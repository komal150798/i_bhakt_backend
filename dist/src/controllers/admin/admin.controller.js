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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const plans_service_1 = require("../../plans/services/plans.service");
const users_service_1 = require("../../users/services/users.service");
const create_plan_dto_1 = require("../../plans/dtos/create-plan.dto");
const update_plan_dto_1 = require("../../plans/dtos/update-plan.dto");
const plan_response_dto_1 = require("../../plans/dtos/plan-response.dto");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../../common/enums/user-role.enum");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AdminController = class AdminController {
    constructor(plansService, usersService) {
        this.plansService = plansService;
        this.usersService = usersService;
    }
    async createPlan(createPlanDto, user) {
        return this.plansService.create(createPlanDto, user.id);
    }
    async getAllPlans() {
        return this.plansService.findAll();
    }
    async getPlan(uniqueId) {
        return this.plansService.findOneByUniqueId(uniqueId);
    }
    async updatePlan(uniqueId, updatePlanDto, user) {
        return this.plansService.update(uniqueId, updatePlanDto, user.id);
    }
    async deletePlan(uniqueId, user) {
        return this.plansService.remove(uniqueId, user.id);
    }
    async assignModules(uniqueId, body, user) {
        return this.plansService.assignModules(uniqueId, body.moduleSlugs, user.id);
    }
    async getDashboardStats() {
        return this.usersService.getDashboardStats();
    }
    async getDashboardCharts() {
        return this.usersService.getDashboardCharts();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new plan (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Plan created successfully', type: plan_response_dto_1.PlanResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Plan type already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_plan_dto_1.CreatePlanDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all plans (Admin view)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all plans', type: [plan_response_dto_1.PlanResponseDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllPlans", null);
__decorate([
    (0, common_1.Get)('plans/:uniqueId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get plan by unique ID (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan details', type: plan_response_dto_1.PlanResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlan", null);
__decorate([
    (0, common_1.Put)('plans/:uniqueId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update plan (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan updated successfully', type: plan_response_dto_1.PlanResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_plan_dto_1.UpdatePlanDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('plans/:uniqueId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete plan (soft delete, Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Plan deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Post)('plans/:uniqueId/modules'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign modules to plan (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Modules assigned successfully', type: plan_response_dto_1.PlanResponseDto }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignModules", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('dashboard/charts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard charts data (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard charts data retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardCharts", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN),
    __metadata("design:paramtypes", [plans_service_1.PlansService,
        users_service_1.UsersService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map