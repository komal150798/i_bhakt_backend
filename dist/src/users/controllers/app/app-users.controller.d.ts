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
            first_name: string;
            last_name: string;
            full_name: string;
            email: string;
            phone_number: string;
            gender: string;
            date_of_birth: Date;
            time_of_birth: string;
            place_name: string;
            latitude: number;
            longitude: number;
            timezone: string;
            life_role: string;
            relationship_status: string;
            interests: any;
            avatar_url: string;
            avatar_img: string;
            nakshatra: string;
            pada: number;
            current_plan: import("../../../common/enums/plan-type.enum").PlanType;
            referral_code: string;
            is_verified: boolean;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    updateProfile(user: CurrentUserPayload, updateData: UpdateCustomerProfileDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            first_name: string;
            last_name: string;
            full_name: string;
            email: string;
            phone_number: string;
            gender: string;
            date_of_birth: Date;
            time_of_birth: string;
            place_name: string;
            latitude: number;
            longitude: number;
            timezone: string;
            life_role: string;
            relationship_status: string;
            interests: any;
            avatar_url: string;
            avatar_img: string;
            nakshatra: string;
            pada: number;
            current_plan: import("../../../common/enums/plan-type.enum").PlanType;
            referral_code: string;
            is_verified: boolean;
            created_at: Date;
            updated_at: Date;
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
