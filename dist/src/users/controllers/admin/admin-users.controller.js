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
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../../../common/enums/user-role.enum");
const customer_service_1 = require("../../services/customer.service");
const list_users_dto_1 = require("../../dtos/list-users.dto");
let AdminUsersController = class AdminUsersController {
    constructor(customerService) {
        this.customerService = customerService;
    }
    async findAll(dto) {
        const result = await this.customerService.findAll(dto);
        return {
            success: true,
            data: result.data.map((c) => ({
                id: c.id,
                unique_id: c.unique_id,
                first_name: c.first_name,
                last_name: c.last_name,
                email: c.email,
                phone_number: c.phone_number,
                current_plan: c.current_plan,
                is_verified: c.is_verified,
                is_active: c.is_enabled,
                added_date: c.added_date,
                last_login: c.last_login,
            })),
            meta: result.meta,
        };
    }
    async findOne(uniqueId) {
        const customer = await this.customerService.findByUniqueId(uniqueId);
        return {
            success: true,
            data: {
                id: customer.id,
                unique_id: customer.unique_id,
                first_name: customer.first_name,
                last_name: customer.last_name,
                email: customer.email,
                phone_number: customer.phone_number,
                date_of_birth: customer.date_of_birth,
                current_plan: customer.current_plan,
                is_verified: customer.is_verified,
                referral_code: customer.referral_code,
                added_date: customer.added_date,
            },
        };
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Post)('list'),
    (0, swagger_1.ApiOperation)({ summary: 'List all customers (cst_customer) with pagination and filters (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customers retrieved successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_users_dto_1.ListUsersDto]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':uniqueId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer by unique ID (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "findOne", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, swagger_1.ApiTags)('admin-users'),
    (0, common_1.Controller)('admin/users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [customer_service_1.CustomerService])
], AdminUsersController);
//# sourceMappingURL=admin-users.controller.js.map