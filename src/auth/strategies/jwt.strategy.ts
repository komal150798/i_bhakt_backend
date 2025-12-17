import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../users/entities/customer.entity';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export interface JwtPayload {
  sub: number;
  unique_id?: string;
  phone_number?: string;
  email?: string;
  role: UserRole;
  type: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production-min-32-chars',
    });
  }

  async validate(payload: JwtPayload) {
    // Validate payload structure
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload: missing user ID');
    }

    const userId = payload.sub;
    const userType = payload.type || 'user';

    // Check based on user type
    if (userType === 'admin') {
      // For admin users, check AdminUser table
      const admin = await this.adminUserRepository.findOne({
        where: { id: userId, is_deleted: false, is_active: true },
      });

      if (!admin) {
        console.warn(`Admin user not found for ID: ${userId}`);
        throw new UnauthorizedException('Admin user not found or inactive');
      }

      return {
        id: admin.id,
        unique_id: admin.unique_id,
        email: admin.email,
        username: admin.username,
        role: UserRole.ADMIN,
        type: 'admin',
      };
    } else {
      // For regular users, check Customer table first (new normalized structure)
      let customer = await this.customerRepository.findOne({
        where: { id: userId, is_deleted: false },
      });

      if (customer) {
        return {
          id: customer.id,
          unique_id: customer.unique_id,
          email: customer.email,
          phone_number: customer.phone_number,
          role: UserRole.USER,
          type: 'user',
        };
      }

      // Fallback to legacy User table for backward compatibility
      const user = await this.userRepository.findOne({
        where: { id: userId, is_deleted: false },
      });

      if (!user) {
        console.warn(`User not found for ID: ${userId}, type: ${userType}`);
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        unique_id: user.unique_id,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        type: payload.type || 'user',
      };
    }
  }
}
