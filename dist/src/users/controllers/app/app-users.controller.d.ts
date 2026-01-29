import { UsersService } from '../../services/users.service';
import { CustomerService } from '../../services/customer.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { UpdateCustomerProfileDto } from '../../dtos/update-customer-profile.dto';
export declare class AppUsersController {
    private readonly usersService;
    private readonly customerService;
    private readonly subscriptionsService;
    private readonly usageTrackingService;
    constructor(usersService: UsersService, customerService: CustomerService, subscriptionsService: SubscriptionsService, usageTrackingService: UsageTrackingService);
    getProfile(user: any): Promise<{
        success: boolean;
        data: {
            name_and_gender: {
                name: string;
                gender: string;
            };
            life_role: string;
            birth_details: {
                date_of_birth: string;
                time_of_birth: string;
                place_of_birth: string;
                current_city: string;
            };
            relationship_status: string;
            interests: string;
            contact: {
                email: string;
                phone_number: string;
            };
            avatar_url: string;
        };
    }>;
    updateProfile(user: any, updateData: UpdateCustomerProfileDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            unique_id: string;
            name: string;
            email: string;
            phone_number: string;
            gender: string;
            life_role: string;
            relationship_status: string;
            interests: string;
            current_city: string;
            avatar_url: string;
        };
    }>;
    getCurrentPlan(user: any): Promise<{
        success: boolean;
        data: {
            plan: import("../../../common/enums/plan-type.enum").PlanType;
            active: boolean;
            expires: Date;
        };
    }>;
    getModules(user: any): Promise<{
        success: boolean;
        data: {
            modules: string[];
        };
    }>;
    getStats(user: any): Promise<{
        success: boolean;
        data: {
            plan: import("../../../common/enums/plan-type.enum").PlanType;
            referral_code: string;
            verified: boolean;
            usage: Record<string, any>;
        };
    }>;
}
