import { AuthService } from '../../auth.service';
import { SendOtpDto } from '../../dto/send-otp.dto';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';
import { LoginGoogleDto } from '../../dto/login-google.dto';
import { SendForgotPasswordOtpDto, ResetPasswordDto } from '../../dto/forgot-password.dto';
import { LoginPasswordDto } from '../../dto/login-password.dto';
import { RegisterDto } from '../../dto/register.dto';
declare class SendEmailOtpDto {
    email: string;
}
declare class VerifyEmailOtpDto {
    email: string;
    otp_code: string;
    is_login?: boolean;
}
export declare class AppAuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        data: {
            access_token: string;
            refresh_token: string;
            user: any;
        };
    }>;
    login(dto: LoginPasswordDto): Promise<{
        success: boolean;
        data: {
            access_token: string;
            refresh_token: string;
            user: any;
        };
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        debug_code: string;
        success: boolean;
        message: string;
    }>;
    resendOtp(dto: SendOtpDto): Promise<{
        debug_code: string;
        success: boolean;
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        success: boolean;
        data: {
            access_token: string;
            refresh_token: string;
            user_id: number;
        };
    }>;
    sendEmailOtp(dto: SendEmailOtpDto): Promise<{
        debug_code: string;
        success: boolean;
        message: string;
    }>;
    resendEmailOtp(dto: SendEmailOtpDto): Promise<{
        debug_code: string;
        success: boolean;
        message: string;
    }>;
    verifyEmailOtp(dto: VerifyEmailOtpDto): Promise<{
        success: boolean;
        data: {
            access_token: string;
            refresh_token: string;
            user_id: number;
        };
    }>;
    loginWithGoogle(dto: LoginGoogleDto): Promise<{
        success: boolean;
        data: {
            access_token: string;
            refresh_token: string;
            user: any;
        };
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        success: boolean;
        data: {
            access_token: string;
            refresh_token: string;
        };
    }>;
    logout(user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    sendForgotPasswordOtp(dto: SendForgotPasswordOtpDto): Promise<{
        debug_code: any;
        success: boolean;
        message: any;
    }>;
    resendForgotPasswordOtp(dto: SendForgotPasswordOtpDto): Promise<{
        debug_code: any;
        success: boolean;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
