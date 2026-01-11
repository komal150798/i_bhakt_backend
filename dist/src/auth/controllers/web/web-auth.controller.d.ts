import { AuthService } from '../../auth.service';
import { SendOtpDto } from '../../dto/send-otp.dto';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';
export declare class WebAuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
        debug_code?: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        success: boolean;
        access_token: string;
        refresh_token: string;
        user_id?: number;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
}
