import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Challenge } from './challenge.entity';
export declare class UserChallenge extends BaseEntity {
    user_id: number;
    challenge_id: number;
    start_date: Date;
    end_date: Date | null;
    status: string;
    current_day: number;
    completed_days: number[] | null;
    metadata: Record<string, any> | null;
    user: User;
    challenge: Challenge;
}
