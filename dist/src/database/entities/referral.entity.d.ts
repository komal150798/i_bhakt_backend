import { User } from './user.entity';
export declare class Referral {
    id: number;
    referrer_id: number;
    referrer: User;
    referred_user_id: number;
    referred_user: User;
    referral_code_used: string;
    created_at: Date;
}
