import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
export declare class UsersService {
    private userRepository;
    private adminUserRepository;
    private karmaEntryRepository;
    constructor(userRepository: Repository<User>, adminUserRepository: Repository<AdminUser>, karmaEntryRepository: Repository<KarmaEntry>);
    create(userData: Partial<User>, addedBy?: number): Promise<User>;
    findOneByUniqueId(uniqueId: string): Promise<User>;
    findOneById(id: number): Promise<User>;
    findAll(options?: {
        page?: number;
        limit?: number;
        search?: string;
        plan?: PlanType;
        is_verified?: boolean;
        role?: UserRole;
    }): Promise<{
        data: User[];
        meta: any;
    }>;
    update(uniqueId: string, updateData: Partial<User>, modifiedBy?: number): Promise<User>;
    remove(uniqueId: string, deletedBy: number): Promise<void>;
    updatePlan(userId: number, planType: PlanType): Promise<void>;
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
    private generateReferralCode;
}
