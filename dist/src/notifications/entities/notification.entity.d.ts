import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
export declare class Notification extends BaseEntity {
    user_id: number;
    title: string;
    message: string | null;
    type: string | null;
    action_url: string | null;
    is_read: boolean;
    read_at: Date | null;
    metadata: Record<string, any> | null;
    user: User;
}
