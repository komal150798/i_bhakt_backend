import { UsersService } from '../../services/users.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { User } from '../../entities/user.entity';
export declare class AppUsersController {
    private readonly usersService;
    private readonly subscriptionsService;
    private readonly usageTrackingService;
    constructor(usersService: UsersService, subscriptionsService: SubscriptionsService, usageTrackingService: UsageTrackingService);
    getProfile(user: any): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            email: string;
            phone: string;
            plan: import("../../../common/enums/plan-type.enum").PlanType;
            avatar: string;
            verified: boolean;
        };
    }>;
    updateProfile(user: any, updateData: Partial<User>): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            message: string;
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
