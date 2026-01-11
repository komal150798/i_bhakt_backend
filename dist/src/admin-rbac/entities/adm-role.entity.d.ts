import { AdmRolePermission } from './adm-role-permission.entity';
export declare class AdmRole {
    role_id: number;
    unique_id: string;
    role_name: string;
    role_level: number | null;
    is_enabled: boolean;
    is_deleted: boolean;
    added_by: number | null;
    modify_by: number | null;
    added_date: Date | null;
    modify_date: Date | null;
    is_master: boolean;
    is_editable: boolean;
    checker_maker: number;
    role_permissions: AdmRolePermission[];
}
