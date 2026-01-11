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
exports.KarmaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const karma_service_1 = require("../../karma/services/karma.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let KarmaController = class KarmaController {
    constructor(karmaService) {
        this.karmaService = karmaService;
    }
    async addKarmaAction(dto, req) {
        dto.user_id = req.user.id;
        return this.karmaService.addKarmaAction(dto);
    }
    async getUserKarmaSummary(body, req) {
        if (body.user_id !== undefined && body.user_id !== null) {
            const requestedUserId = Number(body.user_id);
            const authenticatedUserId = Number(req.user.id);
            if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
                throw new common_1.UnauthorizedException('You can only access your own karma data');
            }
            return this.karmaService.getUserKarmaSummary(requestedUserId);
        }
        return this.karmaService.getUserKarmaSummary(Number(req.user.id));
    }
    async getUserHabits(body, req) {
        if (body.user_id !== undefined && body.user_id !== null) {
            const requestedUserId = Number(body.user_id);
            const authenticatedUserId = Number(req.user.id);
            if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
                throw new common_1.UnauthorizedException('You can only access your own karma data');
            }
            return this.karmaService.getUserHabits(requestedUserId);
        }
        return this.karmaService.getUserHabits(Number(req.user.id));
    }
    async getUserPatterns(body, req) {
        if (body.user_id !== undefined && body.user_id !== null) {
            const requestedUserId = Number(body.user_id);
            const authenticatedUserId = Number(req.user.id);
            if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
                throw new common_1.UnauthorizedException('You can only access your own karma data');
            }
            return this.karmaService.getUserPatterns(requestedUserId);
        }
        return this.karmaService.getUserPatterns(Number(req.user.id));
    }
    async getWeeklyInsights(body, req) {
        if (body.user_id !== undefined && body.user_id !== null) {
            const requestedUserId = Number(body.user_id);
            const authenticatedUserId = Number(req.user.id);
            if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
                throw new common_1.UnauthorizedException('You can only access your own karma data');
            }
            return this.karmaService.getWeeklyInsights(requestedUserId);
        }
        return this.karmaService.getWeeklyInsights(Number(req.user.id));
    }
    async getMonthlyInsights(body, req) {
        if (body.user_id !== undefined && body.user_id !== null) {
            const requestedUserId = Number(body.user_id);
            const authenticatedUserId = Number(req.user.id);
            if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
                throw new common_1.UnauthorizedException('You can only access your own karma data');
            }
            return this.karmaService.getMonthlyInsights(requestedUserId);
        }
        return this.karmaService.getMonthlyInsights(Number(req.user.id));
    }
    async getDashboard(req) {
        const userId = req.user.id;
        return this.karmaService.getDashboardSummary(userId);
    }
};
exports.KarmaController = KarmaController;
__decorate([
    (0, common_1.Post)('add'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KarmaController.prototype, "addKarmaAction", null);
__decorate([
    (0, common_1.Post)('user/summary'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KarmaController.prototype, "getUserKarmaSummary", null);
__decorate([
    (0, common_1.Post)('user/habits'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KarmaController.prototype, "getUserHabits", null);
__decorate([
    (0, common_1.Post)('user/patterns'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KarmaController.prototype, "getUserPatterns", null);
__decorate([
    (0, common_1.Post)('user/weekly'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KarmaController.prototype, "getWeeklyInsights", null);
__decorate([
    (0, common_1.Post)('user/monthly'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KarmaController.prototype, "getMonthlyInsights", null);
__decorate([
    (0, common_1.Post)('dashboard'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma dashboard summary for authenticated user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard summary retrieved successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KarmaController.prototype, "getDashboard", null);
exports.KarmaController = KarmaController = __decorate([
    (0, swagger_1.ApiTags)('karma'),
    (0, common_1.Controller)('customer/karma'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [karma_service_1.KarmaService])
], KarmaController);
//# sourceMappingURL=karma.controller.js.map