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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const adm_role_entity_1 = require("../entities/adm-role.entity");
const adm_permission_entity_1 = require("../entities/adm-permission.entity");
const adm_role_permission_entity_1 = require("../entities/adm-role-permission.entity");
const admin_user_entity_1 = require("../../users/entities/admin-user.entity");
const PERMISSION_CODE_MAP = {
    1: 'VIEW_DASHBOARD',
    2: 'MANAGE_USERS',
    3: 'MANAGE_ROLES',
    4: 'MANAGE_TEMPLATES',
    5: 'MANAGE_CONTENT',
    6: 'MANAGE_MASTER_DATA',
    7: 'VIEW_KARMA',
    8: 'VIEW_SETTINGS',
    9: 'MANAGE_ADMINS',
};
let PermissionsService = class PermissionsService {
    constructor(roleRepository, permissionRepository, rolePermissionRepository, adminUserRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.adminUserRepository = adminUserRepository;
    }
    isSuperAdminRole(role) {
        if (!role)
            return false;
        if (role.is_master === true)
            return true;
        return role.role_name === 'SUPER_ADMIN' || role.role_level === 1;
    }
    async getUserPermissions(adminUserId) {
        const admin = await this.adminUserRepository.findOne({
            where: { id: adminUserId, is_deleted: false },
            relations: ['role'],
        });
        if (!admin || !admin.role_id) {
            return [];
        }
        const role = admin.role;
        if (this.isSuperAdminRole(role)) {
            return Object.values(PERMISSION_CODE_MAP);
        }
        const rolePermissions = await this.rolePermissionRepository.find({
            where: { role_id: role.role_id, is_allowed: true },
            relations: ['permission'],
        });
        const permissionCodes = rolePermissions
            .map((rp) => PERMISSION_CODE_MAP[rp.permission.permission_id])
            .filter((code) => code !== undefined);
        return permissionCodes;
    }
    getAllPermissionCodes() {
        return Object.values(PERMISSION_CODE_MAP);
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(adm_role_entity_1.AdmRole)),
    __param(1, (0, typeorm_1.InjectRepository)(adm_permission_entity_1.AdmPermission)),
    __param(2, (0, typeorm_1.InjectRepository)(adm_role_permission_entity_1.AdmRolePermission)),
    __param(3, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map