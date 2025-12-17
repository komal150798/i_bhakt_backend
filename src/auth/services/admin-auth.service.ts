import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuthJwtService } from './jwt.service';
import { JwtPayload } from '../strategies/jwt.strategy';
import { PermissionsService } from '../../admin-rbac/services/permissions.service';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: AuthJwtService,
    private permissionsService: PermissionsService,
  ) {}

  /**
   * Admin login with username and password
   * Checks AdminUser table first, then falls back to User table for backward compatibility
   */
  async login(username: string, password: string): Promise<{
    access_token: string;
    refresh_token: string;
    user: {
      id: number;
      unique_id: string;
      email: string;
      name?: string;
      role: string;
      role_id?: number;
      role_name?: string | null;
      is_master?: boolean;
      permissions: string[];
    };
  }> {
    // First, try AdminUser table (preferred)
    let admin = await this.adminUserRepository.findOne({
      where: [
        { email: username, is_deleted: false, is_active: true },
        { username: username, is_deleted: false, is_active: true },
      ],
      relations: ['role'],
    });

    if (admin) {
      // Verify password
      if (!admin.password) {
        throw new UnauthorizedException('Password not set for this admin');
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      admin.last_login = new Date();
      await this.adminUserRepository.save(admin);

      // Get permissions
      const permissions = await this.permissionsService.getUserPermissions(admin.id);
      const roleName = admin.role?.role_name || 'ADMIN';
      // Check if role is super admin: is_master = true means super admin
      const isSuperAdmin = admin.role?.is_master === true;

      // Generate tokens
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: admin.id,
        unique_id: admin.unique_id,
        email: admin.email,
        role: isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.ADMIN,
        type: 'admin' as const,
      };

      const accessToken = this.jwtService.generateAccessToken(payload);
      const refreshToken = this.jwtService.generateRefreshToken(payload);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: admin.id,
          unique_id: admin.unique_id,
          email: admin.email,
          name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username,
          role: isSuperAdmin ? 'super_admin' : roleName.toLowerCase(),
          role_id: admin.role_id || null,
          role_name: admin.role?.role_name || null,
          is_master: admin.role?.is_master || false,
          permissions,
        },
      };
    }

    // Fallback to User table for backward compatibility
    const userAdmin = await this.userRepository.findOne({
      where: [
        { email: username, role: UserRole.ADMIN, is_deleted: false },
        { phone_number: username, role: UserRole.ADMIN, is_deleted: false },
      ],
    });

    if (!userAdmin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (!userAdmin.password) {
      throw new UnauthorizedException('Password not set for this admin');
    }

    const isPasswordValid = await bcrypt.compare(password, userAdmin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login (User entity may not have last_login, so we'll skip if it doesn't exist)
    if ('last_login' in userAdmin) {
      (userAdmin as any).last_login = new Date();
      await this.userRepository.save(userAdmin);
    }

    // Get permissions for user admin (they won't have role_id, so return empty array)
    const permissions: string[] = [];

    // Generate tokens
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userAdmin.id,
      unique_id: userAdmin.unique_id,
      email: userAdmin.email || userAdmin.phone_number,
      role: userAdmin.role as UserRole,
      type: 'admin' as const,
    };

    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userAdmin.id,
        unique_id: userAdmin.unique_id,
        email: userAdmin.email || userAdmin.phone_number,
        name: `${userAdmin.first_name || ''} ${userAdmin.last_name || ''}`.trim() || userAdmin.phone_number,
        role: userAdmin.role as string,
        role_id: null,
        permissions,
      },
    };
  }
}

