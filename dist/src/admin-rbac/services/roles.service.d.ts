import { Repository } from 'typeorm';
import { AdmRole } from '../entities/adm-role.entity';
import { AdmPermission } from '../entities/adm-permission.entity';
import { AdmRolePermission } from '../entities/adm-role-permission.entity';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { UpdateRolePermissionsDto } from '../dtos/update-role-permissions.dto';
export declare class RolesService {
    private roleRepository;
    private permissionRepository;
    private rolePermissionRepository;
    constructor(roleRepository: Repository<AdmRole>, permissionRepository: Repository<AdmPermission>, rolePermissionRepository: Repository<AdmRolePermission>);
    private isSuperAdminRole;
    findAll(filters?: {
        is_enabled?: boolean;
        search?: string;
    }): Promise<{
        role_id: number;
        id: number;
        unique_id: string;
        role_name: string;
        role_level: number;
        is_enabled: boolean;
        is_editable: boolean;
        is_master: boolean;
        added_date: Date;
        modify_date: Date;
    }[]>;
    findOne(roleId: number): Promise<{
        role: {
            role_id: number;
            unique_id: string;
            role_name: string;
            role_level: number;
            is_enabled: boolean;
            is_editable: boolean;
        };
        permissions: {
            permission_id: number;
            menu_name: string;
            parent_id: number;
            has_submenu: boolean;
            is_allowed: boolean;
        }[];
    }>;
    create(createRoleDto: CreateRoleDto, addedBy?: number): Promise<AdmRole>;
    update(roleId: number, updateRoleDto: UpdateRoleDto, modifiedBy?: number): Promise<AdmRole>;
    remove(roleId: number, deletedBy?: number): Promise<AdmRole>;
    getPermissionsTree(): Promise<any[]>;
    getRolePermissions(roleId: number): Promise<{
        role: {
            role_id: number;
            role_name: string;
        };
        permissions: {
            permission_id: number;
            menu_name: string;
            parent_id: number;
            has_submenu: boolean;
            is_allowed: boolean;
        }[];
    }>;
    updateRolePermissions(roleId: number, updateDto: UpdateRolePermissionsDto, modifiedBy?: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
