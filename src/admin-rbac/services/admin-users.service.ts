import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { AdmRole } from '../entities/adm-role.entity';
import { CreateAdminUserDto } from '../dtos/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dtos/update-admin-user.dto';
import { UpdateAdminUserRoleDto } from '../dtos/update-admin-user-role.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    @InjectRepository(AdmRole)
    private roleRepository: Repository<AdmRole>,
  ) {}

  /**
   * Check if role is super admin
   * is_master = true means the role is super admin
   */
  private isSuperAdminRole(role: AdmRole | null): boolean {
    if (!role) return false;
    // Check is_master field first (primary indicator)
    if (role.is_master === true) return true;
    // Fallback checks for backward compatibility
    return role.role_name === 'SUPER_ADMIN' || role.role_level === 1;
  }

  /**
   * Get all admin users with pagination and filters
   */
  async findAll(dto: { page?: number; limit?: number; search?: string; role_id?: number; is_enabled?: boolean }) {
    const { page = 1, limit = 20, search, role_id, is_enabled } = dto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.adminUserRepository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.role', 'role')
      .where('admin.is_deleted = :deleted', { deleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(admin.first_name ILIKE :search OR admin.last_name ILIKE :search OR admin.email ILIKE :search OR admin.username ILIKE :search)',
        { search: `%${search}%` },
      );
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

  /**
   * Get single admin user by ID
   */
  async findOne(adminId: number) {
    const admin = await this.adminUserRepository.findOne({
      where: { id: adminId, is_deleted: false },
      relations: ['role'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin user with ID ${adminId} not found`);
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

  /**
   * Create new admin user
   */
  async create(createDto: CreateAdminUserDto, addedBy?: number) {
    // Check if email or username already exists
    const existing = await this.adminUserRepository.findOne({
      where: [
        { email: createDto.email, is_deleted: false },
        { username: createDto.email.split('@')[0], is_deleted: false },
      ],
    });

    if (existing) {
      throw new ConflictException('Admin user with this email or username already exists');
    }

    // Verify role exists
    const role = await this.roleRepository.findOne({
      where: { role_id: createDto.role_id, is_deleted: false },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${createDto.role_id} not found`);
    }

    // Hash password
    const password = createDto.password || 'password123'; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate username from email if not provided
    const username = createDto.email.split('@')[0];

    // Split name
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

  /**
   * Update admin user
   */
  async update(adminId: number, updateDto: UpdateAdminUserDto, modifiedBy?: number) {
    const admin = await this.adminUserRepository.findOne({
      where: { id: adminId, is_deleted: false },
      relations: ['role'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin user with ID ${adminId} not found`);
    }

    // Prevent changing role of SUPER_ADMIN
    if (this.isSuperAdminRole(admin.role) && updateDto.role_id && updateDto.role_id !== admin.role_id) {
      throw new BadRequestException('Cannot change role of SUPER_ADMIN user');
    }

    // Prevent self-demotion (optional - can be removed if not needed)
    if (modifiedBy === adminId && updateDto.is_enabled === false) {
      throw new BadRequestException('You cannot disable your own account');
    }

    if (updateDto.name) {
      const nameParts = updateDto.name.split(' ');
      admin.first_name = nameParts[0] || admin.first_name;
      admin.last_name = nameParts.slice(1).join(' ') || null;
    }

    if (updateDto.email !== undefined) {
      // Check if email already exists
      const existing = await this.adminUserRepository.findOne({
        where: { email: updateDto.email, is_deleted: false },
      });
      if (existing && existing.id !== adminId) {
        throw new ConflictException('Email already in use');
      }
      admin.email = updateDto.email;
    }

    if (updateDto.role_id !== undefined) {
      const role = await this.roleRepository.findOne({
        where: { role_id: updateDto.role_id, is_deleted: false },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID ${updateDto.role_id} not found`);
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

  /**
   * Update admin user role only
   */
  async updateRole(adminId: number, updateDto: UpdateAdminUserRoleDto, modifiedBy?: number) {
    const admin = await this.adminUserRepository.findOne({
      where: { id: adminId, is_deleted: false },
      relations: ['role'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin user with ID ${adminId} not found`);
    }

    // Prevent changing role of SUPER_ADMIN
    if (this.isSuperAdminRole(admin.role)) {
      throw new BadRequestException('Cannot change role of SUPER_ADMIN user');
    }

    const role = await this.roleRepository.findOne({
      where: { role_id: updateDto.role_id, is_deleted: false },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${updateDto.role_id} not found`);
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
}
