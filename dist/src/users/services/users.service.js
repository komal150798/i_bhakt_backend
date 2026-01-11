"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const admin_user_entity_1 = require("../entities/admin-user.entity");
const karma_entry_entity_1 = require("../../karma/entities/karma-entry.entity");
const plan_type_enum_1 = require("../../common/enums/plan-type.enum");
const user_role_enum_1 = require("../../common/enums/user-role.enum");
let UsersService = class UsersService {
    constructor(userRepository, adminUserRepository, karmaEntryRepository) {
        this.userRepository = userRepository;
        this.adminUserRepository = adminUserRepository;
        this.karmaEntryRepository = karmaEntryRepository;
    }
    async create(userData, addedBy) {
        const existing = await this.userRepository.findOne({
            where: { phone_number: userData.phone_number, is_deleted: false },
        });
        if (existing) {
            throw new common_1.ConflictException('User with this phone number already exists');
        }
        const user = this.userRepository.create({
            ...userData,
            current_plan: plan_type_enum_1.PlanType.FREE,
            referral_code: this.generateReferralCode(),
            added_by: addedBy || null,
            modify_by: addedBy || null,
            role: userData.role || user_role_enum_1.UserRole.USER,
        });
        return this.userRepository.save(user);
    }
    async findOneByUniqueId(uniqueId) {
        const user = await this.userRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with unique ID ${uniqueId} not found`);
        }
        return user;
    }
    async findOneById(id) {
        const user = await this.userRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async findAll(options) {
        const { page = 1, limit = 10, search, plan, is_verified, role } = options || {};
        const skip = (page - 1) * limit;
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .where('user.is_deleted = :deleted', { deleted: false });
        if (search) {
            queryBuilder.andWhere('(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.phone_number ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` });
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
    async update(uniqueId, updateData, modifiedBy) {
        const user = await this.findOneByUniqueId(uniqueId);
        Object.assign(user, updateData);
        if (modifiedBy) {
            user.modify_by = modifiedBy;
        }
        return this.userRepository.save(user);
    }
    async remove(uniqueId, deletedBy) {
        const user = await this.findOneByUniqueId(uniqueId);
        user.is_deleted = true;
        user.modify_by = deletedBy;
        await this.userRepository.save(user);
    }
    async updatePlan(userId, planType) {
        await this.userRepository.update({ id: userId }, { current_plan: planType });
    }
    async getDashboardStats() {
        const [totalUsers, activeUsers, verifiedUsers, usersToday, usersThisWeek, usersThisMonth,] = await Promise.all([
            this.userRepository.count({
                where: { is_deleted: false, role: user_role_enum_1.UserRole.USER },
            }),
            this.userRepository.count({
                where: { is_deleted: false, is_enabled: true, role: user_role_enum_1.UserRole.USER },
            }),
            this.userRepository.count({
                where: { is_deleted: false, is_verified: true, role: user_role_enum_1.UserRole.USER },
            }),
            this.userRepository
                .createQueryBuilder('user')
                .where('user.is_deleted = :deleted', { deleted: false })
                .andWhere('user.role = :role', { role: user_role_enum_1.UserRole.USER })
                .andWhere('DATE(user.added_date) = CURRENT_DATE')
                .getCount(),
            this.userRepository
                .createQueryBuilder('user')
                .where('user.is_deleted = :deleted', { deleted: false })
                .andWhere('user.role = :role', { role: user_role_enum_1.UserRole.USER })
                .andWhere('user.added_date >= DATE_TRUNC(\'week\', CURRENT_DATE)')
                .getCount(),
            this.userRepository
                .createQueryBuilder('user')
                .where('user.is_deleted = :deleted', { deleted: false })
                .andWhere('user.role = :role', { role: user_role_enum_1.UserRole.USER })
                .andWhere('user.added_date >= DATE_TRUNC(\'month\', CURRENT_DATE)')
                .getCount(),
        ]);
        const totalAdminUsers = await this.adminUserRepository.count({
            where: { is_deleted: false, is_active: true },
        });
        return {
            total_users: totalUsers,
            total_admins: totalAdminUsers,
            admin_count: 0,
            super_admin_count: 0,
            ops_count: 0,
            active_users: activeUsers,
            verified_users: verifiedUsers,
            users_today: usersToday,
            users_this_week: usersThisWeek,
            users_this_month: usersThisMonth,
            users_change: usersToday,
            active_users_change: 0,
        };
    }
    async getDashboardCharts() {
        const userSignups = await this.userRepository
            .createQueryBuilder('user')
            .select('DATE(user.added_date)', 'date')
            .addSelect('COUNT(*)', 'count')
            .where('user.is_deleted = :deleted', { deleted: false })
            .andWhere('user.role = :role', { role: user_role_enum_1.UserRole.USER })
            .andWhere('user.added_date >= CURRENT_DATE - INTERVAL \'30 days\'')
            .groupBy('DATE(user.added_date)')
            .orderBy('DATE(user.added_date)', 'ASC')
            .getRawMany();
        const userSignupsData = userSignups.map((item) => ({
            date: item.date,
            count: parseInt(item.count, 10),
        }));
        const weeklySignups = await this.userRepository
            .createQueryBuilder('user')
            .select('DATE(user.added_date)', 'date')
            .addSelect('COUNT(*)', 'count')
            .where('user.is_deleted = :deleted', { deleted: false })
            .andWhere('user.role = :role', { role: user_role_enum_1.UserRole.USER })
            .andWhere('user.added_date >= CURRENT_DATE - INTERVAL \'7 days\'')
            .groupBy('DATE(user.added_date)')
            .orderBy('DATE(user.added_date)', 'ASC')
            .getRawMany();
        const weeklySignupsData = weeklySignups.map((item) => ({
            date: item.date,
            count: parseInt(item.count, 10),
        }));
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
    generateReferralCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __param(2, (0, typeorm_1.InjectRepository)(karma_entry_entity_1.KarmaEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map