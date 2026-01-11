import { User } from './user.entity';
export declare class PendingReferral {
    id: number;
    referrer_id: number;
    referrer: User;
    referral_type: string;
    referral_value: string;
    status: string;
    referred_user_id: number;
    referred_user: User;
    created_at: Date;
    completed_at: Date;
}
