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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("../auth.service");
const login_password_dto_1 = require("../dto/login-password.dto");
const login_google_dto_1 = require("../dto/login-google.dto");
const send_otp_dto_1 = require("../dto/send-otp.dto");
const verify_otp_dto_1 = require("../dto/verify-otp.dto");
const refresh_token_dto_1 = require("../dto/refresh-token.dto");
const register_dto_1 = require("../dto/register.dto");
const forgot_password_dto_1 = require("../dto/forgot-password.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto) {
        return this.authService.register(dto.name, dto.email, dto.phone_number, dto.password);
    }
    async login(dto) {
        return this.authService.loginWithPassword(dto.username, dto.password);
    }
    async sendOtp(dto) {
        return this.authService.sendOtp(dto.phone_number);
    }
    async verifyOtp(dto) {
        return this.authService.verifyOtpForLogin(dto.phone_number, dto.otp_code);
    }
    async loginWithGoogle(dto) {
        return this.authService.loginWithGoogle(dto.id_token);
    }
    async refreshToken(dto) {
        return this.authService.refreshAccessToken(dto.refresh_token);
    }
    async logout(dto) {
        await this.authService.logout(dto.refresh_token);
        return { message: 'Logged out successfully' };
    }
    async getCurrentUser(req) {
        return this.authService.getCurrentUser(req.user);
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
    async resetPassword(dto) {
        const result = await this.authService.resetPasswordWithOtp(dto.phone_number || null, dto.email || null, dto.otp_code, dto.new_password);
        return {
            success: result.success,
            message: result.message,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new customer account' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Registration successful, returns access_token, refresh_token, and user',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - missing required fields' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email or phone number already registered' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with username/email and password' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful, returns access_token, refresh_token, and user',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_password_dto_1.LoginPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('otp/send'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP to phone number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_otp_dto_1.SendOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('otp/verify'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP and login' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'OTP verified, returns access_token, refresh_token, and user',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_otp_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('google'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with Google (Gmail) using ID token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Google login successful, returns access_token, refresh_token, and user',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid Google ID token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_google_dto_1.LoginGoogleDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithGoogle", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'New tokens generated, returns access_token, refresh_token, and user',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and invalidate refresh token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logged out successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user information' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Current user information retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Post)('forgot-password/send-otp'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP for password reset' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Either phone_number or email is required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.SendForgotPasswordOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendForgotPasswordOtp", null);
__decorate([
    (0, common_1.Post)('forgot-password/reset'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using OTP' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired OTP' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map