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
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../../common/enums/user-role.enum");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const admin_users_service_1 = require("../services/admin-users.service");
const create_admin_user_dto_1 = require("../dtos/create-admin-user.dto");
const update_admin_user_dto_1 = require("../dtos/update-admin-user.dto");
const update_admin_user_role_dto_1 = require("../dtos/update-admin-user-role.dto");
const list_admin_users_dto_1 = require("../dtos/list-admin-users.dto");
let AdminUsersController = class AdminUsersController {
    constructor(adminUsersService) {
        this.adminUsersService = adminUsersService;
    }
    async findAll(dto) {
        const result = await this.adminUsersService.findAll(dto);
        return {
            success: true,
            ...result,
        };
    }
    async findOne(id) {
        return this.adminUsersService.findOne(id);
    }
    async create(createDto, user) {
        return this.adminUsersService.create(createDto, user.id);
    }
    async update(id, updateDto, user) {
        return this.adminUsersService.update(id, updateDto, user.id);
    }
    async updateRole(id, updateDto, user) {
        return this.adminUsersService.updateRole(id, updateDto, user.id);
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Post)('list'),
    (0, swagger_1.ApiOperation)({ summary: 'List all admin users with pagination and filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin users retrieved successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_admin_users_dto_1.ListAdminUsersDto]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single admin user by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin user retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin user not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new admin user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Admin user created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Admin user already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_user_dto_1.CreateAdminUserDto, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update admin user' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin user updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin user not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_admin_user_dto_1.UpdateAdminUserDto, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/role'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update admin user role only' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin user role updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin user or role not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot change role of SUPER_ADMIN' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_admin_user_role_dto_1.UpdateAdminUserRoleDto, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "updateRole", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, swagger_1.ApiTags)('admin-users-rbac'),
    (0, common_1.Controller)('admin/admins'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_users_service_1.AdminUsersService])
], AdminUsersController);
//# sourceMappingURL=admin-users.controller.js.map