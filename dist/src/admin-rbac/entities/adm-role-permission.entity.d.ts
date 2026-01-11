import { AdmRole } from './adm-role.entity';
import { AdmPermission } from './adm-permission.entity';
export declare class AdmRolePermission {
    ar_id: number;
    role_id: number;
    permission_id: number;
    is_allowed: boolean;
    added_by: number | null;
    modify_by: number | null;
    added_date: Date | null;
    modify_date: Date | null;
    role: AdmRole;
    permission: AdmPermission;
}
