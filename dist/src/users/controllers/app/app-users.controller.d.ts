import { CurrentUserPayload } from '../../../common/types/jwt-payload.interface';
import { CustomerService } from '../../services/customer.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { PlansService } from '../../../plans/services/plans.service';
import { UpdateCustomerProfileDto } from '../../dtos/update-customer-profile.dto';
import { UpgradePlanDto } from '../../dtos/upgrade-plan.dto';
import { KundliService } from '../../../kundli/services/kundli.service';
export declare class AppUsersController {
    private readonly customerService;
    private readonly subscriptionsService;
    private readonly usageTrackingService;
    private readonly plansService;
    private readonly kundliService;
    constructor(customerService: CustomerService, subscriptionsService: SubscriptionsService, usageTrackingService: UsageTrackingService, plansService: PlansService, kundliService: KundliService);
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
    getReferralsList(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            pending: Array<{
                id: number;
                referral_type: string;
                referral_value: string;
            }>;
            completed: Array<{
                id: number;
                referral_type: string;
                referral_value: string;
            }>;
        };
    }>;
    getReferralStatsDashboard(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            referral_code: string;
            referral_count: number;
            total_referrals: number;
            referrals_needed: number;
            referral_limit_awaken_to_builder: number;
            referral_limit_karma_pro_to_dharma: number;
            current_plan: import("../../../common/enums/plan-type.enum").PlanType;
        };
    }>;
    getCurrentDashaForWeb(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            current_mahadasha: {
                lord: string;
            } | null;
            current_antardasha: {
                lord: string;
            } | null;
            current_pratyantar: {
                lord: string;
            } | null;
            current_sukshma: {
                lord: string;
            } | null;
        };
    }>;
    upgradePlan(user: CurrentUserPayload, body: UpgradePlanDto): Promise<{
        success: boolean;
        data: {
            plan: import("../../../common/enums/plan-type.enum").PlanType;
            plan_id: number;
            unique_id: string;
        };
    }>;
}
