import { Repository } from 'typeorm';
import { AdmRole } from '../entities/adm-role.entity';
import { AdmPermission } from '../entities/adm-permission.entity';
import { AdmRolePermission } from '../entities/adm-role-permission.entity';
import { AdminUser } from '../../users/entities/admin-user.entity';
export declare class PermissionsService {
    private roleRepository;
    private permissionRepository;
    private rolePermissionRepository;
    private adminUserRepository;
    constructor(roleRepository: Repository<AdmRole>, permissionRepository: Repository<AdmPermission>, rolePermissionRepository: Repository<AdmRolePermission>, adminUserRepository: Repository<AdminUser>);
    private isSuperAdminRole;
    getUserPermissions(adminUserId: number): Promise<string[]>;
    getAllPermissionCodes(): string[];
}
