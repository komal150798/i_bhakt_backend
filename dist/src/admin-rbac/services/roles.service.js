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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const adm_role_entity_1 = require("../entities/adm-role.entity");
const adm_permission_entity_1 = require("../entities/adm-permission.entity");
const adm_role_permission_entity_1 = require("../entities/adm-role-permission.entity");
let RolesService = class RolesService {
    constructor(roleRepository, permissionRepository, rolePermissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }
    isSuperAdminRole(role) {
        if (role.is_master === true)
            return true;
        return role.role_name === 'SUPER_ADMIN' || role.role_level === 1;
    }
    async findAll(filters) {
        const queryBuilder = this.roleRepository
            .createQueryBuilder('role')
            .where('role.is_deleted = :deleted', { deleted: false });
        if (filters?.is_enabled !== undefined) {
            queryBuilder.andWhere('role.is_enabled = :enabled', { enabled: filters.is_enabled });
        }
        if (filters?.search) {
            queryBuilder.andWhere('role.role_name ILIKE :search', { search: `%${filters.search}%` });
        }
        const roles = await queryBuilder
            .orderBy('role.role_level', 'ASC')
            .addOrderBy('role.role_name', 'ASC')
            .getMany();
        return roles.map((role) => ({
            role_id: role.role_id,
            id: role.role_id,
            unique_id: role.unique_id,
            role_name: role.role_name,
            role_level: role.role_level,
            is_enabled: role.is_enabled,
            is_editable: role.is_editable,
            is_master: role.is_master,
            added_date: role.added_date,
            modify_date: role.modify_date,
        }));
    }
    async findOne(roleId) {
        const role = await this.roleRepository.findOne({
            where: { role_id: roleId, is_deleted: false },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found`);
        }
        const allPermissions = await this.permissionRepository.find({
            where: { is_deleted: false },
            order: { permission_id: 'ASC' },
        });
        const rolePermissions = await this.rolePermissionRepository.find({
            where: { role_id: roleId },
        });
        const permissionMap = new Map(rolePermissions.map((rp) => [rp.permission_id, rp.is_allowed]));
        const permissions = allPermissions.map((perm) => ({
            permission_id: perm.permission_id,
            menu_name: perm.menu_name,
            parent_id: perm.parent_id,
            has_submenu: perm.has_submenu,
            is_allowed: permissionMap.get(perm.permission_id) || false,
        }));
        return {
            role: {
                role_id: role.role_id,
                unique_id: role.unique_id,
                role_name: role.role_name,
                role_level: role.role_level,
                is_enabled: role.is_enabled,
                is_editable: role.is_editable,
            },
            permissions,
        };
    }
    async create(createRoleDto, addedBy) {
        if (createRoleDto.role_name === 'SUPER_ADMIN') {
            const existing = await this.roleRepository.findOne({
                where: { role_name: 'SUPER_ADMIN', is_deleted: false },
            });
            if (existing) {
                throw new common_1.ConflictException('SUPER_ADMIN role already exists');
            }
        }
        const role = this.roleRepository.create({
            role_name: createRoleDto.role_name,
            role_level: createRoleDto.role_level || 99,
            is_enabled: createRoleDto.is_enabled !== undefined ? createRoleDto.is_enabled : true,
            is_editable: true,
            added_by: addedBy || null,
        });
        return this.roleRepository.save(role);
    }
    async update(roleId, updateRoleDto, modifiedBy) {
        const role = await this.roleRepository.findOne({
            where: { role_id: roleId, is_deleted: false },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found`);
        }
        if (!role.is_editable) {
            throw new common_1.BadRequestException('This role cannot be edited');
        }
        if (this.isSuperAdminRole(role) && updateRoleDto.role_name && updateRoleDto.role_name !== role.role_name) {
            throw new common_1.BadRequestException('Cannot change SUPER_ADMIN role name');
        }
        if (updateRoleDto.role_name !== undefined)
            role.role_name = updateRoleDto.role_name;
        if (updateRoleDto.role_level !== undefined)
            role.role_level = updateRoleDto.role_level;
        if (updateRoleDto.is_enabled !== undefined)
            role.is_enabled = updateRoleDto.is_enabled;
        if (modifiedBy)
            role.modify_by = modifiedBy;
        return this.roleRepository.save(role);
    }
    async remove(roleId, deletedBy) {
        const role = await this.roleRepository.findOne({
            where: { role_id: roleId, is_deleted: false },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found`);
        }
        if (!role.is_editable) {
            throw new common_1.BadRequestException('This role cannot be deleted');
        }
        if (this.isSuperAdminRole(role)) {
            throw new common_1.BadRequestException('Cannot delete SUPER_ADMIN role');
        }
        role.is_deleted = true;
        role.is_enabled = false;
        if (deletedBy)
            role.modify_by = deletedBy;
        return this.roleRepository.save(role);
    }
    async getPermissionsTree() {
        const allPermissions = await this.permissionRepository.find({
            where: { is_deleted: false },
            order: { permission_id: 'ASC' },
        });
        const permissionMap = new Map();
        const rootPermissions = [];
        allPermissions.forEach((perm) => {
            permissionMap.set(perm.permission_id, {
                permission_id: perm.permission_id,
                menu_name: perm.menu_name,
                has_submenu: perm.has_submenu,
                parent_id: perm.parent_id,
                children: [],
            });
        });
        allPermissions.forEach((perm) => {
            const permObj = permissionMap.get(perm.permission_id);
            if (perm.parent_id === null || perm.parent_id === 0) {
                rootPermissions.push(permObj);
            }
            else {
                const parent = permissionMap.get(perm.parent_id);
                if (parent) {
                    parent.children.push(permObj);
                    parent.has_submenu = true;
                }
                else {
                    rootPermissions.push(permObj);
                }
            }
        });
        return rootPermissions;
    }
    async getRolePermissions(roleId) {
        const role = await this.roleRepository.findOne({
            where: { role_id: roleId, is_deleted: false },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found`);
        }
        const allPermissions = await this.permissionRepository.find({
            where: { is_deleted: false },
            order: { permission_id: 'ASC' },
        });
        const rolePermissions = await this.rolePermissionRepository.find({
            where: { role_id: roleId },
        });
        const permissionMap = new Map(rolePermissions.map((rp) => [rp.permission_id, rp.is_allowed]));
        return {
            role: {
                role_id: role.role_id,
                role_name: role.role_name,
            },
            permissions: allPermissions.map((perm) => ({
                permission_id: perm.permission_id,
                menu_name: perm.menu_name,
                parent_id: perm.parent_id,
                has_submenu: perm.has_submenu,
                is_allowed: permissionMap.get(perm.permission_id) || false,
            })),
        };
    }
    async updateRolePermissions(roleId, updateDto, modifiedBy) {
        const role = await this.roleRepository.findOne({
            where: { role_id: roleId, is_deleted: false },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found`);
        }
        await this.rolePermissionRepository.delete({ role_id: roleId });
        const permissionIds = updateDto.permissions.map((p) => p.permission_id);
        const permissions = await this.permissionRepository.find({
            where: { permission_id: (0, typeorm_2.In)(permissionIds), is_deleted: false },
        });
        if (permissions.length !== permissionIds.length) {
            throw new common_1.BadRequestException('Some permission IDs are invalid');
        }
        const rolePermissions = updateDto.permissions.map((p) => {
            const rolePerm = this.rolePermissionRepository.create({
                role_id: roleId,
                permission_id: p.permission_id,
                is_allowed: p.is_allowed,
                added_by: modifiedBy || null,
            });
            return rolePerm;
        });
        await this.rolePermissionRepository.save(rolePermissions);
        return { success: true, message: 'Permissions updated successfully' };
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(adm_role_entity_1.AdmRole)),
    __param(1, (0, typeorm_1.InjectRepository)(adm_permission_entity_1.AdmPermission)),
    __param(2, (0, typeorm_1.InjectRepository)(adm_role_permission_entity_1.AdmRolePermission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map