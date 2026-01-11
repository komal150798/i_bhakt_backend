import { AdmRolePermission } from './adm-role-permission.entity';
export declare class AdmPermission {
    permission_id: number;
    menu_name: string | null;
    has_submenu: boolean;
    parent_id: number | null;
    is_enabled: boolean;
    is_deleted: boolean;
    added_by: number | null;
    modify_by: number | null;
    added_date: Date | null;
    modify_date: Date | null;
    parent: AdmPermission | null;
    children: AdmPermission[];
    role_permissions: AdmRolePermission[];
}
