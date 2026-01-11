import { BaseEntity } from '../../common/entities/base.entity';
import { AdminUser } from '../../users/entities/admin-user.entity';
export declare class AdminToken extends BaseEntity {
    token: string;
    admin_id: number;
    expires_at: Date;
    is_revoked: boolean;
    device_info: string | null;
    ip_address: string | null;
    admin: AdminUser;
}
