import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AdmRole } from '../entities/adm-role.entity';
import { AdmPermission } from '../entities/adm-permission.entity';
import { AdmRolePermission } from '../entities/adm-role-permission.entity';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { UpdateRolePermissionsDto } from '../dtos/update-role-permissions.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(AdmRole)
    private roleRepository: Repository<AdmRole>,
    @InjectRepository(AdmPermission)
    private permissionRepository: Repository<AdmPermission>,
    @InjectRepository(AdmRolePermission)
    private rolePermissionRepository: Repository<AdmRolePermission>,
  ) {}

  /**
   * Check if role is super admin
   * is_master = true means the role is super admin
   */
  private isSuperAdminRole(role: AdmRole): boolean {
    // Check is_master field first (primary indicator)
    if (role.is_master === true) return true;
    // Fallback checks for backward compatibility
    return role.role_name === 'SUPER_ADMIN' || role.role_level === 1;
  }

  /**
   * Get all roles with filters
   */
  async findAll(filters?: { is_enabled?: boolean; search?: string }) {
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

    // Ensure role_id is always present in the response
    return roles.map((role) => ({
      role_id: role.role_id,
      id: role.role_id, // Also include as 'id' for compatibility
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

  /**
   * Get single role by ID with permissions
   */
  async findOne(roleId: number) {
    const role = await this.roleRepository.findOne({
      where: { role_id: roleId, is_deleted: false },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Get all permissions with is_allowed flag for this role
    const allPermissions = await this.permissionRepository.find({
      where: { is_deleted: false },
      order: { permission_id: 'ASC' },
    });

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role_id: roleId },
    });

    const permissionMap = new Map(
      rolePermissions.map((rp) => [rp.permission_id, rp.is_allowed]),
    );

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

  /**
   * Create new role
   */
  async create(createRoleDto: CreateRoleDto, addedBy?: number) {
    // Check if SUPER_ADMIN already exists
    if (createRoleDto.role_name === 'SUPER_ADMIN') {
      const existing = await this.roleRepository.findOne({
        where: { role_name: 'SUPER_ADMIN', is_deleted: false },
      });
      if (existing) {
        throw new ConflictException('SUPER_ADMIN role already exists');
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

  /**
   * Update role
   */
  async update(roleId: number, updateRoleDto: UpdateRoleDto, modifiedBy?: number) {
    const role = await this.roleRepository.findOne({
      where: { role_id: roleId, is_deleted: false },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    if (!role.is_editable) {
      throw new BadRequestException('This role cannot be edited');
    }

    // Prevent changing SUPER_ADMIN role name
    if (this.isSuperAdminRole(role) && updateRoleDto.role_name && updateRoleDto.role_name !== role.role_name) {
      throw new BadRequestException('Cannot change SUPER_ADMIN role name');
    }

    if (updateRoleDto.role_name !== undefined) role.role_name = updateRoleDto.role_name;
    if (updateRoleDto.role_level !== undefined) role.role_level = updateRoleDto.role_level;
    if (updateRoleDto.is_enabled !== undefined) role.is_enabled = updateRoleDto.is_enabled;
    if (modifiedBy) role.modify_by = modifiedBy;

    return this.roleRepository.save(role);
  }

  /**
   * Soft delete role
   */
  async remove(roleId: number, deletedBy?: number) {
    const role = await this.roleRepository.findOne({
      where: { role_id: roleId, is_deleted: false },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    if (!role.is_editable) {
      throw new BadRequestException('This role cannot be deleted');
    }

    if (this.isSuperAdminRole(role)) {
      throw new BadRequestException('Cannot delete SUPER_ADMIN role');
    }

    role.is_deleted = true;
    role.is_enabled = false;
    if (deletedBy) role.modify_by = deletedBy;

    return this.roleRepository.save(role);
  }

  /**
   * Get permissions tree (hierarchical)
   */
  async getPermissionsTree() {
    const allPermissions = await this.permissionRepository.find({
      where: { is_deleted: false },
      order: { permission_id: 'ASC' },
    });

    // Build tree structure
    const permissionMap = new Map<number, any>();
    const rootPermissions: any[] = [];

    // First pass: create all permission objects
    allPermissions.forEach((perm) => {
      permissionMap.set(perm.permission_id, {
        permission_id: perm.permission_id,
        menu_name: perm.menu_name,
        has_submenu: perm.has_submenu,
        parent_id: perm.parent_id,
        children: [],
      });
    });

    // Second pass: build tree
    allPermissions.forEach((perm) => {
      const permObj = permissionMap.get(perm.permission_id);
      if (perm.parent_id === null || perm.parent_id === 0) {
        rootPermissions.push(permObj);
      } else {
        const parent = permissionMap.get(perm.parent_id);
        if (parent) {
          parent.children.push(permObj);
          parent.has_submenu = true;
        } else {
          rootPermissions.push(permObj);
        }
      }
    });

    return rootPermissions;
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: number) {
    const role = await this.roleRepository.findOne({
      where: { role_id: roleId, is_deleted: false },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Get all permissions
    const allPermissions = await this.permissionRepository.find({
      where: { is_deleted: false },
      order: { permission_id: 'ASC' },
    });

    // Get role permissions mapping
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role_id: roleId },
    });

    const permissionMap = new Map(
      rolePermissions.map((rp) => [rp.permission_id, rp.is_allowed]),
    );

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

  /**
   * Update permissions for a role
   */
  async updateRolePermissions(roleId: number, updateDto: UpdateRolePermissionsDto, modifiedBy?: number) {
    const role = await this.roleRepository.findOne({
      where: { role_id: roleId, is_deleted: false },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Delete existing permissions for this role
    await this.rolePermissionRepository.delete({ role_id: roleId });

    // Create new permission mappings
    const permissionIds = updateDto.permissions.map((p) => p.permission_id);
    const permissions = await this.permissionRepository.find({
      where: { permission_id: In(permissionIds), is_deleted: false },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Some permission IDs are invalid');
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
}
