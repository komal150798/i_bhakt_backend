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
exports.WebAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("../../auth.service");
const send_otp_dto_1 = require("../../dto/send-otp.dto");
const verify_otp_dto_1 = require("../../dto/verify-otp.dto");
const refresh_token_dto_1 = require("../../dto/refresh-token.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
let WebAuthController = class WebAuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async sendOtp(dto) {
        return this.authService.sendOtp(dto.phone_number);
    }
    async verifyOtp(dto) {
        return this.authService.verifyOtp(dto.phone_number, dto.otp_code, dto.is_login || false);
    }
    async refreshToken(dto) {
        return this.authService.refreshAccessToken(dto.refresh_token);
    }
    async logout(dto) {
        await this.authService.logout(dto.refresh_token);
        return { message: 'Logged out successfully' };
    }
};
exports.WebAuthController = WebAuthController;
__decorate([
    (0, common_1.Post)('otp/send'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP to phone number (Web)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_otp_dto_1.SendOtpDto]),
    __metadata("design:returntype", Promise)
], WebAuthController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('otp/verify'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP and get access/refresh tokens (Web)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP verified, tokens returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_otp_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], WebAuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token (Web)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New tokens generated' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], WebAuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and invalidate refresh token (Web)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], WebAuthController.prototype, "logout", null);
exports.WebAuthController = WebAuthController = __decorate([
    (0, swagger_1.ApiTags)('web-auth'),
    (0, common_1.Controller)('web/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], WebAuthController);
//# sourceMappingURL=web-auth.controller.js.map