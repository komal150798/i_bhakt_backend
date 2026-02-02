import { CurrentUserPayload } from '../../../common/types/jwt-payload.interface';
import { CustomerService } from '../../services/customer.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { UpdateCustomerProfileDto } from '../../dtos/update-customer-profile.dto';
export declare class AppUsersController {
    private readonly customerService;
    private readonly subscriptionsService;
    private readonly usageTrackingService;
    constructor(customerService: CustomerService, subscriptionsService: SubscriptionsService, usageTrackingService: UsageTrackingService);
    getProfile(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            email: string;
            phone: string;
            plan: any;
            avatar: any;
            verified: any;
        };
    }>;
    updateProfile(user: CurrentUserPayload, updateData: UpdateCustomerProfileDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            message: string;
        };
    }>;
    getCurrentPlan(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            plan: import("../../../common/enums/plan-type.enum").PlanType;
            active: boolean;
            expires: Date;
        };
    }>;
    getModules(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            modules: string[];
        };
    }>;
    getStats(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            plan: any;
            referral_code: string;
            verified: boolean;
            usage: Record<string, any>;
        };
    }>;
}
