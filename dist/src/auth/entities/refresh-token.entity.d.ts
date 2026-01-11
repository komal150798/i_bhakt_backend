import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
export declare class RefreshToken extends BaseEntity {
    token: string;
    user_id: number | null;
    admin_id: number | null;
    expires_at: Date;
    is_revoked: boolean;
    user: User | null;
}
