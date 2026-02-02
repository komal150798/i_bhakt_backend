import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    @InjectRepository(KarmaEntry)
    private karmaEntryRepository: Repository<KarmaEntry>,
  ) {}

  /**
   * Create user - used by all controllers
   * @deprecated Use CustomerService.create() instead
   */
  async create(userData: Partial<Customer>, addedBy?: number): Promise<Customer> {
    // Check if phone number exists
    const existing = await this.customerRepository.findOne({
      where: { phone_number: userData.phone_number, is_deleted: false },
    });

    if (existing) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Auto-assign FREE plan
    const customer = this.customerRepository.create({
      ...userData,
      current_plan: PlanType.FREE,
      referral_code: this.generateReferralCode(),
      added_by: addedBy || null,
      modify_by: addedBy || null,
    });

    return this.customerRepository.save(customer);
  }

  /**
   * Find by unique_id - used by all controllers
   * @deprecated Use CustomerService.findByUniqueId() instead
   */
  async findOneByUniqueId(uniqueId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
    });

    if (!customer) {
      throw new NotFoundException(`User with unique ID ${uniqueId} not found`);
    }

    return customer;
  }

  /**
   * Find by ID - internal use
   * @deprecated Use CustomerService.findById() instead
   */
  async findOneById(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!customer) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return customer;
  }

  /**
   * Find all with pagination - Admin only typically
   * @deprecated Use CustomerService.findAll() instead
   */
  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: PlanType;
    is_verified?: boolean;
    role?: UserRole;
  }): Promise<{ data: Customer[]; meta: any }> {
    const { page = 1, limit = 10, search, plan, is_verified } = options || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.is_deleted = :deleted', { deleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(customer.first_name ILIKE :search OR customer.last_name ILIKE :search OR customer.phone_number ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (plan) {
      queryBuilder.andWhere('customer.current_plan = :plan', { plan });
    }

    if (is_verified !== undefined) {
      queryBuilder.andWhere('customer.is_verified = :verified', { verified: is_verified });
    }

    const [customers, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('customer.added_date', 'DESC')
      .getManyAndCount();

    return {
      data: customers,
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
   * @deprecated Use CustomerService.updateProfile() instead
   */
  async update(uniqueId: string, updateData: Partial<Customer>, modifiedBy?: number): Promise<Customer> {
    const customer = await this.findOneByUniqueId(uniqueId);
    Object.assign(customer, updateData);
    
    if (modifiedBy) {
      customer.modify_by = modifiedBy;
    }
    
    return this.customerRepository.save(customer);
  }

  /**
   * Soft delete - Admin only
   * @deprecated Use CustomerService.remove() instead
   */
  async remove(uniqueId: string, deletedBy: number): Promise<void> {
    const customer = await this.findOneByUniqueId(uniqueId);
    customer.is_deleted = true;
    customer.modify_by = deletedBy;
    await this.customerRepository.save(customer);
  }

  /**
   * Update user plan - used by subscription service
   * @deprecated Use CustomerService.updatePlan() instead
   */
  async updatePlan(userId: number, planType: PlanType): Promise<void> {
    await this.customerRepository.update(
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
      this.customerRepository.count({
        where: { is_deleted: false },
      }),
      // Active users (enabled and not deleted)
      this.customerRepository.count({
        where: { is_deleted: false, is_enabled: true },
      }),
      // Verified users
      this.customerRepository.count({
        where: { is_deleted: false, is_verified: true },
      }),
      // Users registered today
      this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.is_deleted = :deleted', { deleted: false })
        .andWhere('DATE(customer.added_date) = CURRENT_DATE')
        .getCount(),
      // Users registered this week
      this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.is_deleted = :deleted', { deleted: false })
        .andWhere('customer.added_date >= DATE_TRUNC(\'week\', CURRENT_DATE)')
        .getCount(),
      // Users registered this month
      this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.is_deleted = :deleted', { deleted: false })
        .andWhere('customer.added_date >= DATE_TRUNC(\'month\', CURRENT_DATE)')
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
    const userSignups = await this.customerRepository
      .createQueryBuilder('customer')
      .select('DATE(customer.added_date)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('customer.is_deleted = :deleted', { deleted: false })
      .andWhere('customer.added_date >= CURRENT_DATE - INTERVAL \'30 days\'')
      .groupBy('DATE(customer.added_date)')
      .orderBy('DATE(customer.added_date)', 'ASC')
      .getRawMany();

    // Format user signups data
    const userSignupsData = userSignups.map((item) => ({
      date: item.date,
      count: parseInt(item.count, 10),
    }));

    // Get user signups for last 7 days (for weekly view)
    const weeklySignups = await this.customerRepository
      .createQueryBuilder('customer')
      .select('DATE(customer.added_date)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('customer.is_deleted = :deleted', { deleted: false })
      .andWhere('customer.added_date >= CURRENT_DATE - INTERVAL \'7 days\'')
      .groupBy('DATE(customer.added_date)')
      .orderBy('DATE(customer.added_date)', 'ASC')
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





