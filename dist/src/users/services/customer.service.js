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
var CustomerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("../entities/customer.entity");
const date_util_1 = require("../../common/utils/date.util");
const string_util_1 = require("../../common/utils/string.util");
const kundli_service_1 = require("../../kundli/services/kundli.service");
let CustomerService = CustomerService_1 = class CustomerService {
    constructor(customerRepository, kundliService, kundliRepository) {
        this.customerRepository = customerRepository;
        this.kundliService = kundliService;
        this.kundliRepository = kundliRepository;
        this.logger = new common_1.Logger(CustomerService_1.name);
    }
    async findOne(id) {
        const customer = await this.customerRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        return customer;
    }
    async getProfile(id) {
        const customer = await this.findOne(id);
        const ensuredReferralCode = await this.ensureReferralCode(customer);
        return {
            id: customer.id,
            unique_id: customer.unique_id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            phone_number: customer.phone_number,
            date_of_birth: customer.date_of_birth,
            time_of_birth: customer.time_of_birth,
            place_name: customer.place_name,
            latitude: customer.latitude,
            longitude: customer.longitude,
            timezone: customer.timezone,
            gender: customer.gender,
            avatar_url: customer.avatar_url,
            nakshatra: customer.nakshatra,
            pada: customer.pada,
            current_plan: customer.current_plan,
            is_verified: customer.is_verified,
            referral_code: ensuredReferralCode,
            added_date: customer.added_date,
            modify_date: customer.modify_date,
        };
    }
    async getReferralCode(userId) {
        const customer = await this.findOne(userId);
        return this.ensureReferralCode(customer);
    }
    async getReferralStats(userId) {
        const customer = await this.findOne(userId);
        const referralCode = await this.ensureReferralCode(customer);
        const [totalReferrals, successfulReferrals] = await Promise.all([
            this.customerRepository.count({
                where: { referred_by: userId, is_deleted: false },
            }),
            this.customerRepository.count({
                where: { referred_by: userId, is_deleted: false, is_verified: true },
            }),
        ]);
        return {
            referral_code: referralCode,
            total_referrals: totalReferrals,
            successful_referrals: successfulReferrals,
            total_earnings: 0,
        };
    }
    async getReferralListForDashboard(userId) {
        const rows = await this.customerRepository.find({
            where: { referred_by: userId, is_deleted: false },
            select: ['id', 'email', 'phone_number', 'is_verified'],
            order: { added_date: 'DESC' },
        });
        const toItem = (c) => {
            const email = c.email?.trim();
            if (email) {
                return { id: Number(c.id), referral_type: 'email', referral_value: email };
            }
            const phone = c.phone_number?.trim() || '—';
            return { id: Number(c.id), referral_type: 'phone', referral_value: phone };
        };
        const pending = rows.filter((c) => !c.is_verified).map(toItem);
        const completed = rows.filter((c) => c.is_verified).map(toItem);
        return { pending, completed };
    }
    async updateProfile(id, updateData) {
        const customer = await this.findOne(id);
        if (updateData.full_name !== undefined && updateData.full_name !== null) {
            const { first_name, last_name } = (0, string_util_1.splitFullName)(updateData.full_name);
            customer.first_name = first_name || null;
            customer.last_name = last_name || null;
        }
        if (updateData.first_name !== undefined && updateData.full_name === undefined) {
            customer.first_name = updateData.first_name;
        }
        if (updateData.last_name !== undefined && updateData.full_name === undefined) {
            customer.last_name = updateData.last_name;
        }
        if (updateData.email !== undefined) {
            const newEmail = updateData.email?.trim().toLowerCase() || null;
            if (newEmail && newEmail !== customer.email) {
                const existing = await this.customerRepository.findOne({
                    where: { email: newEmail, is_deleted: false, id: (0, typeorm_2.Not)(id) },
                });
                if (existing) {
                    throw new common_1.ConflictException('This email is already registered by another user.');
                }
            }
            customer.email = newEmail;
        }
        if (updateData.date_of_birth !== undefined) {
            customer.date_of_birth = (0, date_util_1.parseDateString)(updateData.date_of_birth) || null;
        }
        if (updateData.time_of_birth !== undefined) {
            customer.time_of_birth = updateData.time_of_birth || null;
        }
        if (updateData.place_name !== undefined) {
            customer.place_name = updateData.place_name || null;
        }
        if (updateData.latitude !== undefined) {
            customer.latitude = updateData.latitude || null;
        }
        if (updateData.longitude !== undefined) {
            customer.longitude = updateData.longitude || null;
        }
        if (updateData.timezone !== undefined) {
            customer.timezone = updateData.timezone || null;
        }
        if (updateData.gender !== undefined) {
            customer.gender = updateData.gender || null;
        }
        if (updateData.avatar_url !== undefined) {
            customer.avatar_url = updateData.avatar_url || null;
        }
        if (updateData.avatar_img !== undefined) {
            customer.avatar_img = updateData.avatar_img || null;
        }
        if (updateData.life_role !== undefined) {
            customer.life_role = updateData.life_role || null;
        }
        if (updateData.relationship_status !== undefined) {
            customer.relationship_status = updateData.relationship_status || null;
        }
        if (updateData.interests !== undefined) {
            if (updateData.interests && updateData.interests.length > 0) {
                customer.interests = JSON.stringify(updateData.interests);
            }
            else {
                customer.interests = null;
            }
        }
        customer.modify_date = new Date();
        try {
            const updated = await this.customerRepository.save(customer);
            this.logger.log(`Profile updated for customer ${id}`);
            await this.updateKundliOnProfileChange(id, updated);
            return updated;
        }
        catch (error) {
            this.logger.error(`Error updating customer profile: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to update profile');
        }
    }
    async updateKundliOnProfileChange(userId, customer) {
        try {
            if (!customer.date_of_birth ||
                !customer.time_of_birth ||
                !customer.latitude ||
                !customer.longitude ||
                !customer.place_name) {
                this.logger.debug(`Incomplete birth data for customer ${userId}, skipping kundli update`);
                return;
            }
            const birthDate = (0, date_util_1.formatDateToISO)(customer.date_of_birth) ||
                (customer.date_of_birth instanceof Date
                    ? customer.date_of_birth.toISOString().split('T')[0]
                    : String(customer.date_of_birth));
            const birthTime = customer.time_of_birth || '12:00:00';
            const existingKundli = await this.kundliRepository.findOneByUserId(userId, { is_deleted: false });
            if (!existingKundli) {
                this.logger.log(`No existing kundli found for customer ${userId}, creating new kundli`);
                const firstName = customer.first_name || 'User';
                const lastName = customer.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                await this.kundliService.generateKundli({
                    name: fullName,
                    birth_date: birthDate,
                    birth_time: birthTime,
                    birth_place: customer.place_name || '',
                    latitude: customer.latitude || 0,
                    longitude: customer.longitude || 0,
                    timezone: customer.timezone || 'Asia/Kolkata',
                }, userId);
                this.logger.log(`Kundli created for customer ${userId}`);
                return;
            }
            this.logger.log(`Updating existing kundli for customer ${userId}`);
            const kundliUpdate = await this.kundliService.generateKundliUpdateJSON({
                user_id: userId,
                birth_date: birthDate,
                birth_time: birthTime,
                birth_place: customer.place_name || '',
                latitude: customer.latitude || 0,
                longitude: customer.longitude || 0,
                timezone: customer.timezone || 'Asia/Kolkata',
            });
            const kundli = await this.kundliRepository.findOneByUserId(userId, { is_deleted: false });
            if (kundli) {
                const updateData = {
                    ...kundliUpdate.kundli_db_update.update,
                    birth_date: new Date(kundliUpdate.kundli_db_update.update.birth_date),
                    latitude: parseFloat(kundliUpdate.kundli_db_update.update.latitude),
                    longitude: parseFloat(kundliUpdate.kundli_db_update.update.longitude),
                    lagna_degrees: parseFloat(kundliUpdate.kundli_db_update.update.lagna_degrees),
                    pada: parseInt(kundliUpdate.kundli_db_update.update.pada.toString()),
                    ayanamsa: parseFloat(kundliUpdate.kundli_db_update.update.ayanamsa),
                    modify_date: new Date(kundliUpdate.kundli_db_update.update.modify_date),
                };
                await this.kundliRepository.update(kundli, updateData);
                this.logger.log(`Kundli updated for customer ${userId}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to update/create kundli for customer ${userId}:`, error);
        }
    }
    async findByUniqueId(uniqueId) {
        const customer = await this.customerRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        return customer;
    }
    async ensureReferralCode(customer) {
        if (customer.referral_code) {
            return customer.referral_code;
        }
        let attempts = 0;
        while (attempts < 10) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const existing = await this.customerRepository.findOne({
                where: { referral_code: code, is_deleted: false },
            });
            if (!existing) {
                customer.referral_code = code;
                await this.customerRepository.save(customer);
                return code;
            }
            attempts++;
        }
        customer.referral_code = `RF${Date.now().toString().slice(-6)}`;
        await this.customerRepository.save(customer);
        return customer.referral_code;
    }
    async findAll(dto) {
        const { page = 1, limit = 20, search, plan, is_verified, is_active } = dto;
        const skip = (page - 1) * limit;
        const queryBuilder = this.customerRepository
            .createQueryBuilder('customer')
            .where('customer.is_deleted = :deleted', { deleted: false });
        if (search) {
            queryBuilder.andWhere('(customer.first_name ILIKE :search OR customer.last_name ILIKE :search OR customer.phone_number ILIKE :search OR customer.email ILIKE :search)', { search: `%${search}%` });
        }
        if (plan) {
            queryBuilder.andWhere('customer.current_plan = :plan', { plan });
        }
        if (is_verified !== undefined) {
            queryBuilder.andWhere('customer.is_verified = :verified', { verified: is_verified });
        }
        if (is_active !== undefined) {
            queryBuilder.andWhere('customer.is_enabled = :active', { active: is_active });
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
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = CustomerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(2, (0, common_1.Inject)('IKundliRepository')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        kundli_service_1.KundliService, Object])
], CustomerService);
//# sourceMappingURL=customer.service.js.map