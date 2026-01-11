import { User } from './user.entity';
export declare class UserKarmaScore {
    id: number;
    user_id: number;
    user: User;
    cumulative_score: number;
    positive_score: number;
    negative_score: number;
    last_recalculated_at: Date;
    observations: string;
}
