import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../entities/user.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    @InjectRepository(KarmaEntry)
    private karmaEntryRepository: Repository<KarmaEntry>,
  ) {}

  /**
   * Create user - used by all controllers
   */
  async create(userData: Partial<User>, addedBy?: number): Promise<User> {
    // Check if phone number exists
    const existing = await this.userRepository.findOne({
      where: { phone_number: userData.phone_number, is_deleted: false },
    });

    if (existing) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Auto-assign FREE plan
    const user = this.userRepository.create({
      ...userData,
      current_plan: PlanType.FREE,
      referral_code: this.generateReferralCode(),
      added_by: addedBy || null,
      modify_by: addedBy || null,
      role: userData.role || UserRole.USER,
    });

    return this.userRepository.save(user);
  }

  /**
   * Find by unique_id - used by all controllers
   */
  async findOneByUniqueId(uniqueId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
    });

    if (!user) {
      throw new NotFoundException(`User with unique ID ${uniqueId} not found`);
    }

    return user;
  }

  /**
   * Find by ID - internal use
   */
  async findOneById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find all with pagination - Admin only typically
   */
  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: PlanType;
    is_verified?: boolean;
    role?: UserRole;
  }): Promise<{ data: User[]; meta: any }> {
    const { page = 1, limit = 10, search, plan, is_verified, role } = options || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.is_deleted = :deleted', { deleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.phone_number ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (plan) {
      queryBuilder.andWhere('user.current_plan = :plan', { plan });
    }

    if (is_verified !== undefined) {
      queryBuilder.andWhere('user.is_verified = :verified', { verified: is_verified });
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('user.added_date', 'DESC')
      .getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user - used by all controllers
   */
  async update(uniqueId: string, updateData: Partial<User>, modifiedBy?: number): Promise<User> {
    const user = await this.findOneByUniqueId(uniqueId);
    Object.assign(user, updateData);
    
    if (modifiedBy) {
      user.modify_by = modifiedBy;
    }
    
    return this.userRepository.save(user);
  }

  /**
   * Soft delete - Admin only
   */
  async remove(uniqueId: string, deletedBy: number): Promise<void> {
    const user = await this.findOneByUniqueId(uniqueId);
    user.is_deleted = true;
    user.modify_by = deletedBy;
    await this.userRepository.save(user);
  }

  /**
   * Update user plan - used by subscription service
   */
  async updatePlan(userId: number, planType: PlanType): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      { current_plan: planType },
    );
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersToday,
      usersThisWeek,
      usersThisMonth,
    ] = await Promise.all([
      // Total users (not deleted) - only regular users, not admins
      this.userRepository.count({
        where: { is_deleted: false, role: UserRole.USER },
      }),
      // Active users (enabled and not deleted)
      this.userRepository.count({
        where: { is_deleted: false, is_enabled: true, role: UserRole.USER },
      }),
      // Verified users
      this.userRepository.count({
        where: { is_deleted: false, is_verified: true, role: UserRole.USER },
      }),
      // Users registered today
      this.userRepository
        .createQueryBuilder('user')
        .where('user.is_deleted = :deleted', { deleted: false })
        .andWhere('user.role = :role', { role: UserRole.USER })
        .andWhere('DATE(user.added_date) = CURRENT_DATE')
        .getCount(),
      // Users registered this week
      this.userRepository
        .createQueryBuilder('user')
        .where('user.is_deleted = :deleted', { deleted: false })
        .andWhere('user.role = :role', { role: UserRole.USER })
        .andWhere('user.added_date >= DATE_TRUNC(\'week\', CURRENT_DATE)')
        .getCount(),
      // Users registered this month
      this.userRepository
        .createQueryBuilder('user')
        .where('user.is_deleted = :deleted', { deleted: false })
        .andWhere('user.role = :role', { role: UserRole.USER })
        .andWhere('user.added_date >= DATE_TRUNC(\'month\', CURRENT_DATE)')
        .getCount(),
    ]);

    // Get admin counts from adm_users table (not users table)
    const totalAdminUsers = await this.adminUserRepository.count({
      where: { is_deleted: false, is_active: true },
    });

    // Count admins by role from adm_users table (if role relationship exists)
    // For now, we'll just return total admin count
    // You can add role-based counting later if needed

    return {
      total_users: totalUsers,
      total_admins: totalAdminUsers,
      admin_count: 0, // Can be calculated from adm_users with role_id if needed
      super_admin_count: 0, // Can be calculated from adm_users with role_id if needed
      ops_count: 0, // Not applicable - ops is not a valid role
      active_users: activeUsers,
      verified_users: verifiedUsers,
      users_today: usersToday,
      users_this_week: usersThisWeek,
      users_this_month: usersThisMonth,
      users_change: usersToday, // Change from yesterday (simplified)
      active_users_change: 0, // Can be calculated if needed
    };
  }

  /**
   * Get dashboard charts data
   */
  async getDashboardCharts() {
    // Get user signups for last 30 days
    const userSignups = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.added_date)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.is_deleted = :deleted', { deleted: false })
      .andWhere('user.role = :role', { role: UserRole.USER })
      .andWhere('user.added_date >= CURRENT_DATE - INTERVAL \'30 days\'')
      .groupBy('DATE(user.added_date)')
      .orderBy('DATE(user.added_date)', 'ASC')
      .getRawMany();

    // Format user signups data
    const userSignupsData = userSignups.map((item) => ({
      date: item.date,
      count: parseInt(item.count, 10),
    }));

    // Get user signups for last 7 days (for weekly view)
    const weeklySignups = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.added_date)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.is_deleted = :deleted', { deleted: false })
      .andWhere('user.role = :role', { role: UserRole.USER })
      .andWhere('user.added_date >= CURRENT_DATE - INTERVAL \'7 days\'')
      .groupBy('DATE(user.added_date)')
      .orderBy('DATE(user.added_date)', 'ASC')
      .getRawMany();

    const weeklySignupsData = weeklySignups.map((item) => ({
      date: item.date,
      count: parseInt(item.count, 10),
    }));

    // Get karma trends for last 30 days
    const karmaTrendsDaily = await this.karmaEntryRepository
      .createQueryBuilder('karma')
      .select('DATE(karma.entry_date)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('karma.is_deleted = :deleted', { deleted: false })
      .andWhere('karma.entry_date >= CURRENT_DATE - INTERVAL \'30 days\'')
      .groupBy('DATE(karma.entry_date)')
      .orderBy('DATE(karma.entry_date)', 'ASC')
      .getRawMany();

    const karmaTrendsData = karmaTrendsDaily.map((item) => ({
      date: item.date,
      count: parseInt(item.count, 10),
    }));

    // Get karma entries by type for last 7 days
    const karmaByType = await this.karmaEntryRepository
      .createQueryBuilder('karma')
      .select('karma.karma_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('karma.is_deleted = :deleted', { deleted: false })
      .andWhere('karma.entry_date >= CURRENT_DATE - INTERVAL \'7 days\'')
      .groupBy('karma.karma_type')
      .getRawMany();

    const karmaByTypeData = karmaByType.map((item) => ({
      type: item.type,
      count: parseInt(item.count, 10),
    }));

    return {
      user_signups: {
        last_30_days: userSignupsData,
        last_7_days: weeklySignupsData,
      },
      karma_trends: {
        daily: karmaTrendsData,
        by_type: karmaByTypeData,
      },
    };
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}





