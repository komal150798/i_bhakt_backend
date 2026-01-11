import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Customer } from '../users/entities/customer.entity';
import { AdminUser } from '../users/entities/admin-user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { CustomerToken } from './entities/customer-token.entity';
import { AdminToken } from './entities/admin-token.entity';
import { OtpService } from './services/otp.service';
import { AuthJwtService } from './services/jwt.service';
import { HoroscopeService } from '../horoscope/services/horoscope.service';
export declare class AuthService {
    private userRepository;
    private customerRepository;
    private adminUserRepository;
    private refreshTokenRepository;
    private customerTokenRepository;
    private adminTokenRepository;
    private otpService;
    private jwtService;
    private configService;
    private horoscopeService;
    constructor(userRepository: Repository<User>, customerRepository: Repository<Customer>, adminUserRepository: Repository<AdminUser>, refreshTokenRepository: Repository<RefreshToken>, customerTokenRepository: Repository<CustomerToken>, adminTokenRepository: Repository<AdminToken>, otpService: OtpService, jwtService: AuthJwtService, configService: ConfigService, horoscopeService: HoroscopeService);
    private getAppSessionExpiration;
    sendOtp(phoneNumber: string): Promise<{
        message: string;
        debug_code?: string;
    }>;
    sendEmailOtp(email: string): Promise<{
        message: string;
        debug_code?: string;
    }>;
    verifyOtp(phoneNumber: string, otpCode: string, isLogin?: boolean): Promise<{
        success: boolean;
        access_token: string;
        refresh_token: string;
        user_id?: number;
    }>;
    verifyEmailOtp(email: string, otpCode: string, isLogin?: boolean): Promise<{
        success: boolean;
        access_token: string;
        refresh_token: string;
        user_id?: number;
    }>;
    checkUserExists(phoneNumber: string | null, email: string | null): Promise<boolean>;
    resetPasswordWithOtp(phoneNumber: string | null, email: string | null, otpCode: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
    logout(refreshTokenString: string): Promise<void>;
    private storeRefreshToken;
    private parseExpiresIn;
    validateCustomerByPassword(username: string, password: string): Promise<Customer | null>;
    validateUserByPassword(username: string, password: string): Promise<User | null>;
    loginWithPassword(username: string, password: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    verifyOtpForLogin(phoneNumber: string, otpCode: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    loginWithGoogle(idToken: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    issueTokens(user: User): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    issueAppTokens(user: User): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    findOrCreateGoogleUser(googleProfile: {
        email: string;
        name: string;
        picture?: string;
        googleId: string;
    }): Promise<User>;
    private verifyGoogleToken;
    register(name: string | undefined, email: string | undefined, phone_number: string | undefined, password: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    private issueCustomerTokens;
    private storeCustomerToken;
    private storeCustomerRefreshToken;
    private formatCustomerResponse;
    private formatUserResponse;
    getCurrentUser(userPayload: any): Promise<any>;
    refreshAccessToken(refreshTokenString: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    private findCustomerByPhone;
    private findCustomerByEmail;
    private findUserByPhone;
    private findUserByEmail;
}
