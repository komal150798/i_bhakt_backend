import { PlansService } from '../../plans/services/plans.service';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
import { CustomerService } from '../../users/services/customer.service';
import { UpdateCustomerProfileDto } from '../../users/dtos/update-customer-profile.dto';
export declare class CustomerController {
    private readonly plansService;
    private readonly customerService;
    constructor(plansService: PlansService, customerService: CustomerService);
    getAvailablePlans(): Promise<PlanResponseDto[]>;
    getPlan(uniqueId: string): Promise<PlanResponseDto>;
    getProfile(user: any): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: Partial<import("../../users/entities/customer.entity").Customer>;
    }>;
    updateProfile(user: any, updateData: UpdateCustomerProfileDto): Promise<{
        success: boolean;
        code: number;
        message: string;
        data: {
            id: number;
            unique_id: string;
            first_name: string;
            last_name: string;
            email: string;
            date_of_birth: Date;
            time_of_birth: string;
            place_name: string;
            latitude: number;
            longitude: number;
            timezone: string;
            gender: string;
            avatar_url: string;
        };
    }>;
}
