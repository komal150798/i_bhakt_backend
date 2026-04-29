import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { CustomerService } from '../../users/services/customer.service';
export declare class ReferController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    getReferralCode(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            code: string;
            referral_link: string;
        };
    }>;
    getReferralStats(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            totalReferrals: number;
            successfulReferrals: number;
            earnings: string;
        };
    }>;
}
