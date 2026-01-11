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
exports.AppManifestationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const manifestation_service_1 = require("../manifestation.service");
const create_manifestation_dto_1 = require("../dto/create-manifestation.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AppManifestationController = class AppManifestationController {
    constructor(manifestationService) {
        this.manifestationService = manifestationService;
    }
    async createManifestation(dto, user) {
        const manifestation = await this.manifestationService.createManifestation(user.id, dto);
        return {
            success: true,
            data: {
                id: manifestation.id,
                title: manifestation.desire_text,
                clarity: Number(manifestation.linguistic_clarity),
                coherence: Number(manifestation.emotional_coherence),
                mfp_score: Number(manifestation.manifestation_probability),
                astro_index: Number(manifestation.astrological_resonance),
                best_manifestation_date: manifestation.best_manifestation_date,
                analysis_data: manifestation.analysis_data,
                created_at: manifestation.added_date,
            },
        };
    }
    async getManifestations(user) {
        const manifestations = await this.manifestationService.getUserManifestations(user.id);
        return {
            success: true,
            data: manifestations.map((m) => ({
                id: m.id,
                title: m.desire_text,
                clarity: Number(m.linguistic_clarity),
                coherence: Number(m.emotional_coherence),
                mfp_score: Number(m.manifestation_probability),
                astro_index: Number(m.astrological_resonance),
                best_manifestation_date: m.best_manifestation_date,
                is_locked: m.metadata?.is_locked || false,
                created_at: m.added_date,
            })),
        };
    }
    async getManifestation(id, user) {
        const manifestation = await this.manifestationService.getManifestationById(user.id, id);
        return {
            success: true,
            data: {
                id: manifestation.id,
                title: manifestation.desire_text,
                clarity: Number(manifestation.linguistic_clarity),
                coherence: Number(manifestation.emotional_coherence),
                mfp_score: Number(manifestation.manifestation_probability),
                astro_index: Number(manifestation.astrological_resonance),
                best_manifestation_date: manifestation.best_manifestation_date,
                analysis_data: manifestation.analysis_data,
                is_locked: manifestation.metadata?.is_locked || false,
                created_at: manifestation.added_date,
                updated_at: manifestation.modify_date,
            },
        };
    }
    async updateManifestation(id, body, user) {
        const manifestation = await this.manifestationService.updateManifestation(user.id, id, body);
        return {
            success: true,
            data: {
                id: manifestation.id,
                is_locked: manifestation.metadata?.is_locked || false,
                updated_at: manifestation.modify_date,
            },
        };
    }
    async deleteManifestation(id, user) {
        await this.manifestationService.deleteManifestation(user.id, id);
        return {
            success: true,
            message: 'Manifestation deleted successfully',
        };
    }
};
exports.AppManifestationController = AppManifestationController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new manifestation (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Manifestation created successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_manifestation_dto_1.CreateManifestationDto, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "createManifestation", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get all manifestations (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestations retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getManifestations", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get manifestation by ID (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestation retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Manifestation not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getManifestation", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update manifestation (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestation updated successfully',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "updateManifestation", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete manifestation (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestation deleted successfully',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "deleteManifestation", null);
exports.AppManifestationController = AppManifestationController = __decorate([
    (0, swagger_1.ApiTags)('Manifestation (App)'),
    (0, common_1.Controller)('app/manifestations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [manifestation_service_1.ManifestationService])
], AppManifestationController);
//# sourceMappingURL=app-manifestation.controller.js.map