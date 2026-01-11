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
exports.AppEntitlementsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const entitlements_service_1 = require("../services/entitlements.service");
let AppEntitlementsController = class AppEntitlementsController {
    constructor(entitlementsService) {
        this.entitlementsService = entitlementsService;
    }
    async getEntitlements(user) {
        const entitlements = await this.entitlementsService.getUserEntitlements(user.id);
        return {
            success: true,
            data: entitlements,
        };
    }
    async checkFeatureAccess(user, feature) {
        const hasAccess = await this.entitlementsService.hasFeatureAccess(user.id, feature);
        return {
            success: true,
            data: {
                feature,
                allowed: hasAccess,
            },
        };
    }
};
exports.AppEntitlementsController = AppEntitlementsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get user entitlements based on current plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entitlements retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppEntitlementsController.prototype, "getEntitlements", null);
__decorate([
    (0, common_1.Get)('check/:feature'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Check if user has access to a specific feature' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feature access check result' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('feature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppEntitlementsController.prototype, "checkFeatureAccess", null);
exports.AppEntitlementsController = AppEntitlementsController = __decorate([
    (0, swagger_1.ApiTags)('app-entitlements'),
    (0, common_1.Controller)('app/entitlements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [entitlements_service_1.EntitlementsService])
], AppEntitlementsController);
//# sourceMappingURL=app-entitlements.controller.js.map