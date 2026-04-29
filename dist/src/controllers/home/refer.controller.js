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
exports.ReferController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const customer_service_1 = require("../../users/services/customer.service");
let ReferController = class ReferController {
    constructor(customerService) {
        this.customerService = customerService;
    }
    async getReferralCode(user) {
        const code = await this.customerService.getReferralCode(user.id);
        const baseUrl = (process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || '').trim();
        const referral_link = `${baseUrl || 'https://app.ibhakt.com'}/signup?ref=${code}`;
        return {
            success: true,
            data: {
                code,
                referral_link,
            },
        };
    }
    async getReferralStats(user) {
        const stats = await this.customerService.getReferralStats(user.id);
        return {
            success: true,
            data: {
                totalReferrals: stats.total_referrals,
                successfulReferrals: stats.successful_referrals,
                earnings: `${stats.total_earnings}`,
            },
        };
    }
};
exports.ReferController = ReferController;
__decorate([
    (0, common_1.Get)('code'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user referral code and share link' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Referral code fetched successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferController.prototype, "getReferralCode", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user referral stats' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Referral stats fetched successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferController.prototype, "getReferralStats", null);
exports.ReferController = ReferController = __decorate([
    (0, swagger_1.ApiTags)('Refer'),
    (0, common_1.Controller)('refer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [customer_service_1.CustomerService])
], ReferController);
//# sourceMappingURL=refer.controller.js.map