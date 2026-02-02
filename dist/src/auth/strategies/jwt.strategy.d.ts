import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
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
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private customerRepository;
    private adminUserRepository;
    constructor(configService: ConfigService, customerRepository: Repository<Customer>, adminUserRepository: Repository<AdminUser>);
    validate(payload: JwtPayload): Promise<{
        id: number;
        unique_id: string;
        email: string;
        username: string;
        role: UserRole;
        type: string;
        phone_number?: undefined;
    } | {
        id: number;
        unique_id: string;
        email: string;
        phone_number: string;
        role: UserRole;
        type: string;
        username?: undefined;
    }>;
}
export {};
