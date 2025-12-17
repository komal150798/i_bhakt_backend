import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AdmRole } from '../entities/adm-role.entity';
import { AdmPermission } from '../entities/adm-permission.entity';
import { AdmRolePermission } from '../entities/adm-role-permission.entity';
import { AdminUser } from '../../users/entities/admin-user.entity';

/**
 * Permission code mapping
 * Maps permission_id to frontend permission codes
 * This can be extended to use a database table if needed
 */
const PERMISSION_CODE_MAP: Record<number, string> = {
  // Dashboard
  1: 'VIEW_DASHBOARD',
  // Users
  2: 'MANAGE_USERS',
  // Roles
  3: 'MANAGE_ROLES',
  // Templates
  4: 'MANAGE_TEMPLATES',
  // Content
  5: 'MANAGE_CONTENT',
  // Master Data
  6: 'MANAGE_MASTER_DATA',
  // Karma
  7: 'VIEW_KARMA',
  // Settings
  8: 'VIEW_SETTINGS',
  // Admin Users
  9: 'MANAGE_ADMINS',
  // Add more mappings as needed
};

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(AdmRole)
    private roleRepository: Repository<AdmRole>,
    @InjectRepository(AdmPermission)
    private permissionRepository: Repository<AdmPermission>,
    @InjectRepository(AdmRolePermission)
    private rolePermissionRepository: Repository<AdmRolePermission>,
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
  ) {}

  /**
   * Check if role is super admin
   * is_master = true means the role is super admin
   */
  private isSuperAdminRole(role: AdmRole | null): boolean {
    if (!role) return false;
    // Check is_master field first (primary indicator)
    if (role.is_master === true) return true;
    // Fallback checks for backward compatibility
    return role.role_name === 'SUPER_ADMIN' || role.role_level === 1;
  }

  /**
   * Get all permission codes for a user
   * Returns all permission codes if user is super admin
   */
  async getUserPermissions(adminUserId: number): Promise<string[]> {
    const admin = await this.adminUserRepository.findOne({
      where: { id: adminUserId, is_deleted: false },
      relations: ['role'],
    });

    if (!admin || !admin.role_id) {
      return [];
    }

    const role = admin.role;

    // Super admin gets all permissions
    if (this.isSuperAdminRole(role)) {
      return Object.values(PERMISSION_CODE_MAP);
    }

    // Get allowed permissions for the role
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role_id: role.role_id, is_allowed: true },
      relations: ['permission'],
    });

    // Map permission_ids to permission codes
    const permissionCodes = rolePermissions
      .map((rp) => PERMISSION_CODE_MAP[rp.permission.permission_id])
      .filter((code) => code !== undefined);

    return permissionCodes;
  }

  /**
   * Get all available permission codes
   */
  getAllPermissionCodes(): string[] {
    return Object.values(PERMISSION_CODE_MAP);
  }
}
