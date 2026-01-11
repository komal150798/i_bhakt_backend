import { BaseEntity } from '../../common/entities/base.entity';
import { AdminToken } from '../../auth/entities/admin-token.entity';
import { AdmRole } from '../../admin-rbac/entities/adm-role.entity';
export declare class AdminUser extends BaseEntity {
    username: string;
    password: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    is_active: boolean;
    last_login: Date | null;
    last_login_ip: string | null;
    role_id: number | null;
    role: AdmRole | null;
    tokens: AdminToken[];
}
