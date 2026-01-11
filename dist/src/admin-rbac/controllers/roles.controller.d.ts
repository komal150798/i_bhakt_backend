import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { UpdateRolePermissionsDto } from '../dtos/update-role-permissions.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(isEnabled?: string, search?: string): Promise<{
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
    findOne(id: number): Promise<{
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
    create(createRoleDto: CreateRoleDto, user: any): Promise<import("../entities/adm-role.entity").AdmRole>;
    update(id: number, updateRoleDto: UpdateRoleDto, user: any): Promise<import("../entities/adm-role.entity").AdmRole>;
    remove(id: number, user: any): Promise<void>;
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
    updateRolePermissions(roleId: number, updateDto: UpdateRolePermissionsDto, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getPermissionsTree(): Promise<any[]>;
}
