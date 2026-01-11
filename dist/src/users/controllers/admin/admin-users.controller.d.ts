import { CustomerService } from '../../services/customer.service';
import { ListUsersDto } from '../../dtos/list-users.dto';
export declare class AdminUsersController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    findAll(dto: ListUsersDto): Promise<{
        success: boolean;
        data: {
            id: number;
            unique_id: string;
            first_name: string;
            last_name: string;
            email: string;
            phone_number: string;
            current_plan: import("../../../common/enums/plan-type.enum").PlanType;
            is_verified: boolean;
            is_active: boolean;
            added_date: Date;
            last_login: Date;
        }[];
        meta: any;
    }>;
    findOne(uniqueId: string): Promise<{
        success: boolean;
        data: {
            id: number;
            unique_id: string;
            first_name: string;
            last_name: string;
            email: string;
            phone_number: string;
            date_of_birth: Date;
            current_plan: import("../../../common/enums/plan-type.enum").PlanType;
            is_verified: boolean;
            referral_code: string;
            added_date: Date;
        };
    }>;
}
