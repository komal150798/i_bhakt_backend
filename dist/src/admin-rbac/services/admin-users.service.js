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
exports.AdminUsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const admin_user_entity_1 = require("../../users/entities/admin-user.entity");
const adm_role_entity_1 = require("../entities/adm-role.entity");
let AdminUsersService = class AdminUsersService {
    constructor(adminUserRepository, roleRepository) {
        this.adminUserRepository = adminUserRepository;
        this.roleRepository = roleRepository;
    }
    isSuperAdminRole(role) {
        if (!role)
            return false;
        if (role.is_master === true)
            return true;
        return role.role_name === 'SUPER_ADMIN' || role.role_level === 1;
    }
    async findAll(dto) {
        const { page = 1, limit = 20, search, role_id, is_enabled } = dto;
        const skip = (page - 1) * limit;
        const queryBuilder = this.adminUserRepository
            .createQueryBuilder('admin')
            .leftJoinAndSelect('admin.role', 'role')
            .where('admin.is_deleted = :deleted', { deleted: false });
        if (search) {
            queryBuilder.andWhere('(admin.first_name ILIKE :search OR admin.last_name ILIKE :search OR admin.email ILIKE :search OR admin.username ILIKE :search)', { search: `%${search}%` });
        }
        if (role_id) {
            queryBuilder.andWhere('admin.role_id = :roleId', { roleId: role_id });
        }
        if (is_enabled !== undefined) {
            queryBuilder.andWhere('admin.is_enabled = :enabled', { enabled: is_enabled });
        }
        const [admins, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy('admin.added_date', 'DESC')
            .getManyAndCount();
        return {
            data: admins.map((admin) => ({
                admin_id: admin.id,
                unique_id: admin.unique_id,
                username: admin.username,
                name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                role_id: admin.role_id,
                role_name: admin.role?.role_name || null,
                is_enabled: admin.is_enabled,
                is_active: admin.is_active,
                last_login_at: admin.last_login,
                added_date: admin.added_date,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(adminId) {
        const admin = await this.adminUserRepository.findOne({
            where: { id: adminId, is_deleted: false },
            relations: ['role'],
        });
        if (!admin) {
            throw new common_1.NotFoundException(`Admin user with ID ${adminId} not found`);
        }
        return {
            admin_id: admin.id,
            unique_id: admin.unique_id,
            username: admin.username,
            name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username,
            first_name: admin.first_name,
            last_name: admin.last_name,
            email: admin.email,
            role_id: admin.role_id,
            role_name: admin.role?.role_name || null,
            is_enabled: admin.is_enabled,
            is_active: admin.is_active,
            last_login_at: admin.last_login,
            last_login_ip: admin.last_login_ip,
            added_date: admin.added_date,
        };
    }
    async create(createDto, addedBy) {
        const existing = await this.adminUserRepository.findOne({
            where: [
                { email: createDto.email, is_deleted: false },
                { username: createDto.email.split('@')[0], is_deleted: false },
            ],
        });
        if (existing) {
            throw new common_1.ConflictException('Admin user with this email or username already exists');
        }
        const role = await this.roleRepository.findOne({
            where: { role_id: createDto.role_id, is_deleted: false },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${createDto.role_id} not found`);
        }
        const password = createDto.password || 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);
        const username = createDto.email.split('@')[0];
        const nameParts = createDto.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || null;
        const admin = this.adminUserRepository.create({
            username,
            email: createDto.email,
            password: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            role_id: createDto.role_id,
            is_enabled: createDto.is_enabled !== undefined ? createDto.is_enabled : true,
            is_active: true,
            added_by: addedBy || null,
        });
        const savedAdmin = await this.adminUserRepository.save(admin);
        return {
            admin_id: savedAdmin.id,
            username: savedAdmin.username,
            email: savedAdmin.email,
            role_id: savedAdmin.role_id,
            role_name: role.role_name,
            is_enabled: savedAdmin.is_enabled,
        };
    }
    async update(adminId, updateDto, modifiedBy) {
        const admin = await this.adminUserRepository.findOne({
            where: { id: adminId, is_deleted: false },
            relations: ['role'],
        });
        if (!admin) {
            throw new common_1.NotFoundException(`Admin user with ID ${adminId} not found`);
        }
        if (this.isSuperAdminRole(admin.role) && updateDto.role_id && updateDto.role_id !== admin.role_id) {
            throw new common_1.BadRequestException('Cannot change role of SUPER_ADMIN user');
        }
        if (modifiedBy === adminId && updateDto.is_enabled === false) {
            throw new common_1.BadRequestException('You cannot disable your own account');
        }
        if (updateDto.name) {
            const nameParts = updateDto.name.split(' ');
            admin.first_name = nameParts[0] || admin.first_name;
            admin.last_name = nameParts.slice(1).join(' ') || null;
        }
        if (updateDto.email !== undefined) {
            const existing = await this.adminUserRepository.findOne({
                where: { email: updateDto.email, is_deleted: false },
            });
            if (existing && existing.id !== adminId) {
                throw new common_1.ConflictException('Email already in use');
            }
            admin.email = updateDto.email;
        }
        if (updateDto.role_id !== undefined) {
            const role = await this.roleRepository.findOne({
                where: { role_id: updateDto.role_id, is_deleted: false },
            });
            if (!role) {
                throw new common_1.NotFoundException(`Role with ID ${updateDto.role_id} not found`);
            }
            admin.role_id = updateDto.role_id;
        }
        if (updateDto.is_enabled !== undefined) {
            admin.is_enabled = updateDto.is_enabled;
        }
        if (modifiedBy) {
            admin.modify_by = modifiedBy;
        }
        const savedAdmin = await this.adminUserRepository.save(admin);
        return {
            admin_id: savedAdmin.id,
            username: savedAdmin.username,
            email: savedAdmin.email,
            role_id: savedAdmin.role_id,
            is_enabled: savedAdmin.is_enabled,
        };
    }
    async updateRole(adminId, updateDto, modifiedBy) {
        const admin = await this.adminUserRepository.findOne({
            where: { id: adminId, is_deleted: false },
            relations: ['role'],
        });
        if (!admin) {
            throw new common_1.NotFoundException(`Admin user with ID ${adminId} not found`);
        }
        if (this.isSuperAdminRole(admin.role)) {
            throw new common_1.BadRequestException('Cannot change role of SUPER_ADMIN user');
        }
        const role = await this.roleRepository.findOne({
            where: { role_id: updateDto.role_id, is_deleted: false },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${updateDto.role_id} not found`);
        }
        admin.role_id = updateDto.role_id;
        if (modifiedBy) {
            admin.modify_by = modifiedBy;
        }
        await this.adminUserRepository.save(admin);
        return {
            admin_id: admin.id,
            role_id: admin.role_id,
            role_name: role.role_name,
        };
    }
};
exports.AdminUsersService = AdminUsersService;
exports.AdminUsersService = AdminUsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __param(1, (0, typeorm_1.InjectRepository)(adm_role_entity_1.AdmRole)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdminUsersService);
//# sourceMappingURL=admin-users.service.js.map