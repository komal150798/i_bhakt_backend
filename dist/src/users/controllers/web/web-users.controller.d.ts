import { UpdateCustomerProfileDto } from '../../dtos/update-customer-profile.dto';
import { CurrentUserPayload } from '../../../common/types/jwt-payload.interface';
import { CustomerService } from '../../services/customer.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
export declare class WebUsersController {
    private readonly customerService;
    private readonly subscriptionsService;
    private readonly usageTrackingService;
    constructor(customerService: CustomerService, subscriptionsService: SubscriptionsService, usageTrackingService: UsageTrackingService);
    getProfile(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            unique_id: string;
            first_name: string;
            last_name: string;
            email: string;
            phone_number: string;
            date_of_birth: Date;
            time_of_birth: string;
            place_name: string;
            gender: string;
            current_plan: import("../../../common/enums/plan-type.enum").PlanType;
            referral_code: string;
            is_verified: boolean;
            avatar_url: string;
        };
    }>;
    updateProfile(user: CurrentUserPayload, updateData: UpdateCustomerProfileDto): Promise<{
        success: boolean;
        data: {
            unique_id: string;
            first_name: string;
            last_name: string;
            email: string;
            message: string;
        };
    }>;
    getCurrentPlan(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            plan_type: import("../../../common/enums/plan-type.enum").PlanType;
            subscription: {
                unique_id: string;
                plan_type: import("../../../common/enums/plan-type.enum").PlanType;
                start_date: Date;
                end_date: Date;
                is_active: boolean;
            };
        };
    }>;
    getAllowedModules(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            modules: string[];
        };
    }>;
    getUsageLimits(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: Record<string, any>;
    }>;
}
