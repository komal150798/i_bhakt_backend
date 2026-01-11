import { User } from './user.entity';
import { Admin } from './admin.entity';
export declare class RefreshToken {
    id: number;
    token: string;
    user_id: number;
    user: User;
    admin_id: number;
    admin: Admin;
    expires_at: Date;
    is_revoked: boolean;
    created_at: Date;
}
