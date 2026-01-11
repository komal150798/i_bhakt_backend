import { AuthService } from '../auth.service';
import { LoginPasswordDto } from '../dto/login-password.dto';
import { LoginGoogleDto } from '../dto/login-google.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { SendForgotPasswordOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    login(dto: LoginPasswordDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
        debug_code?: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    loginWithGoogle(dto: LoginGoogleDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
    getCurrentUser(req: any): Promise<any>;
    sendForgotPasswordOtp(dto: SendForgotPasswordOtpDto): Promise<{
        debug_code: any;
        success: boolean;
        message: any;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
