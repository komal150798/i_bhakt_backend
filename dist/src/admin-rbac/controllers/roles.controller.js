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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../../common/enums/user-role.enum");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_service_1 = require("../services/roles.service");
const create_role_dto_1 = require("../dtos/create-role.dto");
const update_role_dto_1 = require("../dtos/update-role.dto");
const update_role_permissions_dto_1 = require("../dtos/update-role-permissions.dto");
let RolesController = class RolesController {
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    async findAll(isEnabled, search) {
        const filters = {};
        if (isEnabled !== undefined) {
            filters.is_enabled = isEnabled === 'true';
        }
        if (search) {
            filters.search = search;
        }
        return this.rolesService.findAll(filters);
    }
    async findOne(id) {
        return this.rolesService.findOne(id);
    }
    async create(createRoleDto, user) {
        return this.rolesService.create(createRoleDto, user.id);
    }
    async update(id, updateRoleDto, user) {
        return this.rolesService.update(id, updateRoleDto, user.id);
    }
    async remove(id, user) {
        await this.rolesService.remove(id, user.id);
    }
    async getRolePermissions(roleId) {
        return this.rolesService.getRolePermissions(roleId);
    }
    async updateRolePermissions(roleId, updateDto, user) {
        return this.rolesService.updateRolePermissions(roleId, updateDto, user.id);
    }
    async getPermissionsTree() {
        return this.rolesService.getPermissionsTree();
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all roles' }),
    (0, swagger_1.ApiQuery)({ name: 'is_enabled', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Roles retrieved successfully' }),
    __param(0, (0, common_1.Query)('is_enabled')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single role with permissions' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new role' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Role created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Role already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update role' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Role cannot be edited' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_role_dto_1.UpdateRoleDto, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete role (soft delete)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Role deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Role cannot be deleted' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':roleId/permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get permissions for a role' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permissions retrieved successfully' }),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getRolePermissions", null);
__decorate([
    (0, common_1.Put)(':roleId/permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Update permissions for a role' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permissions updated successfully' }),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_role_permissions_dto_1.UpdateRolePermissionsDto, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "updateRolePermissions", null);
__decorate([
    (0, common_1.Get)('permissions/tree'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permissions as hierarchical tree' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Permissions tree retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getPermissionsTree", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('admin-roles'),
    (0, common_1.Controller)('admin/roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map