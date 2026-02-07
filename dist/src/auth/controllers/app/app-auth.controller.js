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
exports.AppAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("../../auth.service");
const send_otp_dto_1 = require("../../dto/send-otp.dto");
const verify_otp_dto_1 = require("../../dto/verify-otp.dto");
const refresh_token_dto_1 = require("../../dto/refresh-token.dto");
const login_google_dto_1 = require("../../dto/login-google.dto");
const forgot_password_dto_1 = require("../../dto/forgot-password.dto");
const login_password_dto_1 = require("../../dto/login-password.dto");
const register_dto_1 = require("../../dto/register.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const class_validator_1 = require("class-validator");
class SendEmailOtpDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendEmailOtpDto.prototype, "email", void 0);
class VerifyEmailOtpDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], VerifyEmailOtpDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyEmailOtpDto.prototype, "otp_code", void 0);
let AppAuthController = class AppAuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto) {
        const result = await this.authService.register(dto.name, dto.email, dto.phone_number, dto.password);
        return {
            success: true,
            data: {
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                user: result.user,
            },
        };
    }
    async login(dto) {
        const result = await this.authService.loginWithPassword(dto.username, dto.password);
        return {
            success: true,
            data: {
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                user: result.user,
            },
        };
    }
    async sendOtp(dto) {
        const result = await this.authService.sendOtp(dto.phone_number);
        return {
            success: true,
            message: result.message,
            ...(result.debug_code && { debug_code: result.debug_code }),
        };
    }
    async resendOtp(dto) {
        const result = await this.authService.sendOtp(dto.phone_number);
        return {
            success: true,
            message: 'OTP resent successfully',
            ...(result.debug_code && { debug_code: result.debug_code }),
        };
    }
    async verifyOtp(dto) {
        const result = await this.authService.verifyOtp(dto.phone_number, dto.otp_code, dto.is_login || false);
        return {
            success: result.success,
            data: {
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                user_id: result.user_id,
            },
        };
    }
    async sendEmailOtp(dto) {
        const result = await this.authService.sendEmailOtp(dto.email);
        return {
            success: true,
            message: result.message,
            ...(result.debug_code && { debug_code: result.debug_code }),
        };
    }
    async resendEmailOtp(dto) {
        const result = await this.authService.sendEmailOtp(dto.email);
        return {
            success: true,
            message: 'OTP resent successfully',
            ...(result.debug_code && { debug_code: result.debug_code }),
        };
    }
    async verifyEmailOtp(dto) {
        const result = await this.authService.verifyEmailOtp(dto.email, dto.otp_code, dto.is_login || false);
        return {
            success: result.success,
            data: {
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                user_id: result.user_id,
            },
        };
    }
    async loginWithGoogle(dto) {
        const result = await this.authService.loginWithGoogle(dto.id_token);
        return {
            success: true,
            data: {
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                user: result.user,
            },
        };
    }
    async refreshToken(dto) {
        const result = await this.authService.refreshAccessToken(dto.refresh_token);
        return {
            success: true,
            data: {
                access_token: result.access_token,
                refresh_token: result.refresh_token,
            },
        };
    }
    async logout(user) {
        await this.authService.logoutByUserId(user.id, user.type);
        return {
            success: true,
            message: 'Logged out successfully',
        };
    }
    async sendForgotPasswordOtp(dto) {
        if (!dto.phone_number && !dto.email) {
            throw new common_1.BadRequestException('Either phone_number or email is required');
        }
        const userExists = await this.authService.checkUserExists(dto.phone_number || null, dto.email || null);
        if (!userExists) {
            throw new common_1.NotFoundException('User not found. Please check your phone number or email.');
        }
        let result;
        if (dto.phone_number) {
            result = await this.authService.sendOtp(dto.phone_number);
        }
        else if (dto.email) {
            result = await this.authService.sendEmailOtp(dto.email);
        }
        return {
            success: true,
            message: result.message,
            ...(result.debug_code && { debug_code: result.debug_code }),
        };
    }
    async resendForgotPasswordOtp(dto) {
        if (!dto.phone_number && !dto.email) {
            throw new common_1.BadRequestException('Either phone_number or email is required');
        }
        const userExists = await this.authService.checkUserExists(dto.phone_number || null, dto.email || null);
        if (!userExists) {
            throw new common_1.NotFoundException('User not found. Please check your phone number or email.');
        }
        let result;
        if (dto.phone_number) {
            result = await this.authService.sendOtp(dto.phone_number);
        }
        else if (dto.email) {
            result = await this.authService.sendEmailOtp(dto.email);
        }
        return {
            success: true,
            message: 'OTP resent successfully',
            ...(result.debug_code && { debug_code: result.debug_code }),
        };
    }
    async resetPassword(dto) {
        const result = await this.authService.resetPasswordWithOtp(dto.phone_number || null, dto.email || null, dto.otp_code, dto.new_password);
        return {
            success: result.success,
            message: result.message,
        };
    }
};
exports.AppAuthController = AppAuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new customer account (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Registration successful, returns access_token, refresh_token, and user',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - missing required fields or invalid email format' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email or phone number already registered' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with username/email and password (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful, returns access_token, refresh_token, and user',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_password_dto_1.LoginPasswordDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('otp/send'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP to phone number (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_otp_dto_1.SendOtpDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('otp/resend'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resend OTP to phone number (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP resent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many requests. Please wait before requesting again.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_otp_dto_1.SendOtpDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "resendOtp", null);
__decorate([
    (0, common_1.Post)('otp/verify'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP and get access/refresh tokens (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP verified, tokens returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_otp_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('otp/email/send'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP to email address (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendEmailOtpDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "sendEmailOtp", null);
__decorate([
    (0, common_1.Post)('otp/email/resend'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resend OTP to email address (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP resent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many requests. Please wait before requesting again.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendEmailOtpDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "resendEmailOtp", null);
__decorate([
    (0, common_1.Post)('otp/email/verify'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify email OTP and get access/refresh tokens (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP verified, tokens returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyEmailOtpDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "verifyEmailOtp", null);
__decorate([
    (0, common_1.Post)('google'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with Google (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Google login successful, tokens returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid Google ID token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_google_dto_1.LoginGoogleDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "loginWithGoogle", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New tokens generated' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and revoke all active tokens (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logged out successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Bearer token required' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('forgot-password/send-otp'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP for password reset (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Either phone_number or email is required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.SendForgotPasswordOtpDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "sendForgotPasswordOtp", null);
__decorate([
    (0, common_1.Post)('forgot-password/resend-otp'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resend OTP for password reset (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP resent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Either phone_number or email is required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many requests. Please wait before requesting again.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.SendForgotPasswordOtpDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "resendForgotPasswordOtp", null);
__decorate([
    (0, common_1.Post)('forgot-password/reset'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using OTP (Mobile App)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired OTP' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "resetPassword", null);
exports.AppAuthController = AppAuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth (App)'),
    (0, common_1.Controller)('app/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AppAuthController);
//# sourceMappingURL=app-auth.controller.js.map