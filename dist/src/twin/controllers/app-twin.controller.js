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
exports.AppTwinController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const twin_state_service_1 = require("../services/twin-state.service");
const digital_twin_service_1 = require("../services/digital-twin.service");
const customer_service_1 = require("../../users/services/customer.service");
let AppTwinController = class AppTwinController {
    constructor(twinStateService, digitalTwinService, customerService) {
        this.twinStateService = twinStateService;
        this.digitalTwinService = digitalTwinService;
        this.customerService = customerService;
    }
    async getTwinState(user) {
        const state = await this.twinStateService.getTwinState(user.id);
        return {
            success: true,
            data: state,
        };
    }
    async generateDigitalTwin(user) {
        const result = await this.digitalTwinService.generateDigitalTwin(user.id);
        return {
            success: true,
            data: result,
        };
    }
    async uploadAvatar(user, file) {
        const avatarUrl = file ? `/uploads/avatars/${file.filename}` : null;
        if (avatarUrl) {
            await this.customerService.updateProfile(user.id, {
                avatar_img: avatarUrl,
            });
        }
        return {
            success: true,
            data: {
                avatar_url: avatarUrl,
                message: 'Avatar uploaded successfully. This image helps personalize your Digital Twin and is not shared publicly.',
            },
        };
    }
    async getAlignmentIndex(user) {
        const data = await this.digitalTwinService.getAlignmentIndex(user.id);
        return {
            success: true,
            data,
        };
    }
    async getConsciousnessState(user) {
        const data = await this.digitalTwinService.getConsciousnessState(user.id);
        return {
            success: true,
            data,
        };
    }
    async getCurrentPhase(user) {
        const data = await this.digitalTwinService.getCurrentPhase(user.id);
        return {
            success: true,
            data,
        };
    }
    async getEmotionalBaseline(user) {
        const data = await this.digitalTwinService.getEmotionalBaseline(user.id);
        return {
            success: true,
            data,
        };
    }
    async getEnergyLevel(user) {
        const data = await this.digitalTwinService.getEnergyLevel(user.id);
        return {
            success: true,
            data,
        };
    }
    async getKarmaState(user) {
        const data = await this.digitalTwinService.getKarmaState(user.id);
        return {
            success: true,
            data,
        };
    }
    async getManifestationResonance(user) {
        const data = await this.digitalTwinService.getManifestationResonance(user.id);
        return {
            success: true,
            data,
        };
    }
    async getRecentActions(user) {
        const data = await this.digitalTwinService.getRecentActionInfluence(user.id);
        return {
            success: true,
            data,
        };
    }
    async getReflection(user) {
        const data = await this.digitalTwinService.getReflectionPrompt(user.id);
        return {
            success: true,
            data,
        };
    }
    async getTwinEvolution(user) {
        const data = await this.digitalTwinService.getTwinEvolution(user.id);
        return {
            success: true,
            data,
        };
    }
    async getCompleteSummary(user) {
        const data = await this.digitalTwinService.getCompleteTwinSummary(user.id);
        return {
            success: true,
            data,
        };
    }
};
exports.AppTwinController = AppTwinController;
__decorate([
    (0, common_1.Get)('state'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get current digital twin state (Legacy)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Twin state retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getTwinState", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Generate Digital Twin after profile completion' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Digital Twin generated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "generateDigitalTwin", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload avatar image for Digital Twin' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                avatar: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Avatar uploaded successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Get)('alignment-index'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Alignment Index (Screen 01)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alignment index retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getAlignmentIndex", null);
__decorate([
    (0, common_1.Get)('consciousness-state'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Consciousness State (Screen 02)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Consciousness state retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getConsciousnessState", null);
__decorate([
    (0, common_1.Get)('current-phase'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Current Phase (Screen 03)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current phase retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getCurrentPhase", null);
__decorate([
    (0, common_1.Get)('emotional-baseline'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Emotional Baseline (Screen 04)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Emotional baseline retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getEmotionalBaseline", null);
__decorate([
    (0, common_1.Get)('energy-level'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Energy Level (Screen 05)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Energy level retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getEnergyLevel", null);
__decorate([
    (0, common_1.Get)('karma-state'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Karma State (Screen 06)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Karma state retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getKarmaState", null);
__decorate([
    (0, common_1.Get)('manifestation-resonance'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Manifestation Resonance (Screen 07)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Manifestation resonance retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getManifestationResonance", null);
__decorate([
    (0, common_1.Get)('recent-actions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Recent Action Influence (Screen 08)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recent actions retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getRecentActions", null);
__decorate([
    (0, common_1.Get)('reflection'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Today\'s Reflection Prompt (Screen 09)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reflection prompt retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getReflection", null);
__decorate([
    (0, common_1.Get)('evolution'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Twin Evolution (Screen 10)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Twin evolution retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getTwinEvolution", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Complete Digital Twin Summary (All Screens)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Complete twin summary retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppTwinController.prototype, "getCompleteSummary", null);
exports.AppTwinController = AppTwinController = __decorate([
    (0, swagger_1.ApiTags)('app-twin'),
    (0, common_1.Controller)('app/twin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [twin_state_service_1.TwinStateService,
        digital_twin_service_1.DigitalTwinService,
        customer_service_1.CustomerService])
], AppTwinController);
//# sourceMappingURL=app-twin.controller.js.map