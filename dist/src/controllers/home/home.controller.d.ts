import { PlansService } from '../../plans/services/plans.service';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { CustomerService } from '../../users/services/customer.service';
export declare class HomeController {
    private readonly plansService;
    private readonly customerService;
    constructor(plansService: PlansService, customerService: CustomerService);
    getPlans(enabled?: string): Promise<PlanResponseDto[]>;
    getPlan(uniqueId: string): Promise<PlanResponseDto>;
    getRuntimeConfig(): {
        node_env: string;
        is_dev_like: boolean;
    };
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
