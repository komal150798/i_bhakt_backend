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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const plans_service_1 = require("../../plans/services/plans.service");
const plan_response_dto_1 = require("../../plans/dtos/plan-response.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let AppController = class AppController {
    constructor(plansService) {
        this.plansService = plansService;
    }
    async getPlans() {
        return this.plansService.findAll({ is_enabled: true });
    }
    async getPlan(uniqueId) {
        return this.plansService.findOneByUniqueId(uniqueId);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available plans (App user)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of enabled plans', type: [plan_response_dto_1.PlanResponseDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('plans/:uniqueId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get plan details (App user)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan details', type: plan_response_dto_1.PlanResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPlan", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('App'),
    (0, common_1.Controller)('app'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], AppController);
//# sourceMappingURL=app.controller.js.map