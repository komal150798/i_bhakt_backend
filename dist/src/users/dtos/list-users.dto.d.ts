import { PlanType } from '../../common/enums/plan-type.enum';
export declare class ListUsersDto {
    page?: number;
    limit?: number;
    search?: string;
    plan?: PlanType;
    is_verified?: boolean;
    is_active?: boolean;
}
