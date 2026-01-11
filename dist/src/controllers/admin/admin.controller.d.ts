import { PlansService } from '../../plans/services/plans.service';
import { UsersService } from '../../users/services/users.service';
import { CreatePlanDto } from '../../plans/dtos/create-plan.dto';
import { UpdatePlanDto } from '../../plans/dtos/update-plan.dto';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
export declare class AdminController {
    private readonly plansService;
    private readonly usersService;
    constructor(plansService: PlansService, usersService: UsersService);
    createPlan(createPlanDto: CreatePlanDto, user: any): Promise<PlanResponseDto>;
    getAllPlans(): Promise<PlanResponseDto[]>;
    getPlan(uniqueId: string): Promise<PlanResponseDto>;
    updatePlan(uniqueId: string, updatePlanDto: UpdatePlanDto, user: any): Promise<PlanResponseDto>;
    deletePlan(uniqueId: string, user: any): Promise<void>;
    assignModules(uniqueId: string, body: {
        moduleSlugs: string[];
    }, user: any): Promise<PlanResponseDto>;
    getDashboardStats(): Promise<{
        total_users: number;
        total_admins: number;
        admin_count: number;
        super_admin_count: number;
        ops_count: number;
        active_users: number;
        verified_users: number;
        users_today: number;
        users_this_week: number;
        users_this_month: number;
        users_change: number;
        active_users_change: number;
    }>;
    getDashboardCharts(): Promise<{
        user_signups: {
            last_30_days: {
                date: any;
                count: number;
            }[];
            last_7_days: {
                date: any;
                count: number;
            }[];
        };
        karma_trends: {
            daily: {
                date: any;
                count: number;
            }[];
            by_type: {
                type: any;
                count: number;
            }[];
        };
    }>;
}
