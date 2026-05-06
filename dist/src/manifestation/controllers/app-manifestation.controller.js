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
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const manifestation_enhanced_service_1 = require("../services/manifestation-enhanced.service");
const create_manifestation_enhanced_dto_1 = require("../dtos/create-manifestation-enhanced.dto");
const alignment_action_dto_1 = require("../dtos/alignment-action.dto");
const calculate_resonance_dto_1 = require("../dtos/calculate-resonance.dto");
const daily_progress_entry_dto_1 = require("../dtos/daily-progress-entry.dto");
const number_util_1 = require("../../common/utils/number.util");
const entitlements_service_1 = require("../../subscriptions/services/entitlements.service");
let AppManifestationController = class AppManifestationController {
    constructor(manifestationService, entitlementsService) {
        this.manifestationService = manifestationService;
        this.entitlementsService = entitlementsService;
    }
    async createManifestation(dto, user) {
        const manifestation = await this.manifestationService.createManifestation(user.id, dto);
        return {
            success: true,
            code: 201,
            message: 'Manifestation created.',
            data: {
                id: manifestation.id,
                unique_id: manifestation.unique_id,
                title: manifestation.title,
                category: manifestation.category,
                category_label: manifestation.insights?.category_label || null,
                resonance_score: (0, number_util_1.toNumber)(manifestation.resonance_score),
                alignment_score: (0, number_util_1.toNumber)(manifestation.alignment_score),
                antrashaakti_score: (0, number_util_1.toNumber)(manifestation.antrashaakti_score),
                mahaadha_score: (0, number_util_1.toNumber)(manifestation.mahaadha_score),
                astro_support_index: (0, number_util_1.toNumber)(manifestation.astro_support_index),
                mfp_score: (0, number_util_1.toNumber)(manifestation.mfp_score),
                coherence_score: (0, number_util_1.toNumber)(manifestation.coherence_score),
            },
        };
    }
    async getDashboard(user) {
        if (!user.id) {
            throw new common_1.BadRequestException('User ID is missing');
        }
        const dashboard = await this.manifestationService.getDashboard(user.id);
        return {
            success: true,
            code: 200,
            message: 'Dashboard data retrieved.',
            data: dashboard,
        };
    }
    async getAllManifestations(user) {
        if (!user.id) {
            throw new common_1.BadRequestException('User ID is missing');
        }
        const manifestations = await this.manifestationService.getAllManifestations(user.id, true);
        return {
            success: true,
            code: 200,
            message: 'Manifestations retrieved.',
            data: manifestations.map((m) => ({
                id: m.id,
                unique_id: m.unique_id,
                title: m.title,
                description: m.description,
                category: m.category,
                resonance_score: (0, number_util_1.toNumber)(m.resonance_score),
                alignment_score: (0, number_util_1.toNumber)(m.alignment_score),
                antrashaakti_score: (0, number_util_1.toNumber)(m.antrashaakti_score),
                mahaadha_score: (0, number_util_1.toNumber)(m.mahaadha_score),
                astro_support_index: (0, number_util_1.toNumber)(m.astro_support_index),
                mfp_score: (0, number_util_1.toNumber)(m.mfp_score),
                coherence_score: (0, number_util_1.toNumber)(m.coherence_score),
                is_archived: m.is_archived,
                is_locked: m.is_locked,
                added_date: m.added_date,
            })),
        };
    }
    async calculateResonance(dto, user) {
        if (!dto.description || dto.description.trim().length < 15) {
            throw new common_1.BadRequestException('Description must be at least 15 characters long.');
        }
        const result = await this.manifestationService.calculateDetailedResonance(user.id, dto.description.trim());
        return {
            success: true,
            code: 200,
            message: 'Resonance score calculated.',
            data: result,
        };
    }
    async addAlignmentActionsToKarma(dto, user) {
        const result = await this.manifestationService.addAlignmentActionsToKarma(dto.manifestation_id, dto.action_ids, user.id);
        return {
            success: true,
            code: 201,
            message: 'Alignment actions added to your karma ledger.',
            data: result,
        };
    }
    async commitIntention(dto, user) {
        const result = await this.manifestationService.commitIntention(dto.manifestation_id, user.id, dto.commitment_message, dto.target_date);
        return {
            success: true,
            code: 200,
            message: 'You have consciously committed to your manifestation.',
            data: result,
        };
    }
    async addDailyProgressEntry(dto, user) {
        const entry = await this.manifestationService.addDailyProgressEntry(dto.manifestation_id, user.id, dto.entry_date, dto.action_text);
        return {
            success: true,
            code: 201,
            message: 'Daily progress entry added.',
            data: {
                id: entry.id,
                manifestation_id: entry.manifestation_id,
                entry_date: entry.entry_date,
                action_text: entry.action_text,
            },
        };
    }
    async getDailyProgressEntries(id, user) {
        const entries = await this.manifestationService.getDailyProgressEntries(id, user.id);
        return {
            success: true,
            code: 200,
            message: 'Daily progress entries retrieved.',
            data: entries.map((entry) => ({
                id: entry.id,
                manifestation_id: entry.manifestation_id,
                entry_date: entry.entry_date,
                action_text: entry.action_text,
                added_date: entry.added_date,
            })),
        };
    }
    async updateDailyProgressEntry(entryId, dto, user) {
        const entry = await this.manifestationService.updateDailyProgressEntry(entryId, user.id, dto.action_text || '');
        return {
            success: true,
            code: 200,
            message: 'Daily progress entry updated.',
            data: {
                id: entry.id,
                manifestation_id: entry.manifestation_id,
                entry_date: entry.entry_date,
                action_text: entry.action_text,
            },
        };
    }
    async deleteDailyProgressEntry(entryId, user) {
        await this.manifestationService.deleteDailyProgressEntry(entryId, user.id);
        return {
            success: true,
            code: 200,
            message: 'Daily progress entry deleted.',
        };
    }
    async getManifestation(id, user) {
        const manifestation = await this.manifestationService.getManifestationById(id, user.id);
        const dailyProgressEntries = await this.manifestationService.getDailyProgressEntries(id, user.id);
        const entitlements = await this.entitlementsService.getUserEntitlements(user.id);
        return {
            success: true,
            code: 200,
            message: 'Manifestation retrieved.',
            data: {
                id: manifestation.id,
                unique_id: manifestation.unique_id,
                title: manifestation.title,
                description: manifestation.description,
                category: manifestation.category,
                category_label: manifestation.insights?.category_label || null,
                emotional_state: manifestation.emotional_state,
                target_date: manifestation.target_date,
                resonance_score: (0, number_util_1.toNumber)(manifestation.resonance_score),
                alignment_score: (0, number_util_1.toNumber)(manifestation.alignment_score),
                antrashaakti_score: (0, number_util_1.toNumber)(manifestation.antrashaakti_score),
                mahaadha_score: (0, number_util_1.toNumber)(manifestation.mahaadha_score),
                astro_support_index: (0, number_util_1.toNumber)(manifestation.astro_support_index),
                mfp_score: (0, number_util_1.toNumber)(manifestation.mfp_score),
                coherence_score: (0, number_util_1.toNumber)(manifestation.coherence_score),
                tips: manifestation.tips,
                insights: manifestation.insights,
                summary_for_ui: manifestation.insights?.summary_for_ui || null,
                action_windows: manifestation.action_windows ?? null,
                progress_tracking: manifestation.progress_tracking ?? null,
                plan_type: entitlements.plan_type,
                daily_progress_entries: dailyProgressEntries.map((entry) => ({
                    id: entry.id,
                    manifestation_id: entry.manifestation_id,
                    entry_date: entry.entry_date,
                    action_text: entry.action_text,
                    added_date: entry.added_date,
                })),
                is_archived: manifestation.is_archived,
                is_locked: manifestation.is_locked,
                added_date: manifestation.added_date,
                modify_date: manifestation.modify_date,
            },
        };
    }
    async archiveManifestation(id, user) {
        const manifestation = await this.manifestationService.archiveManifestation(id, user.id);
        return {
            success: true,
            code: 200,
            message: 'Manifestation archived.',
            data: {
                id: manifestation.id,
                is_archived: manifestation.is_archived,
            },
        };
    }
    async toggleLockManifestation(id, user) {
        const manifestation = await this.manifestationService.toggleLockManifestation(id, user.id);
        return {
            success: true,
            code: 200,
            message: manifestation.is_locked
                ? 'Manifestation locked. It will now be included in dashboard calculations.'
                : 'Manifestation unlocked. It will no longer be included in dashboard calculations.',
            data: {
                id: manifestation.id,
                is_locked: manifestation.is_locked,
            },
        };
    }
    async getTips(id, user) {
        const tips = await this.manifestationService.getTips(id, user.id);
        return {
            success: true,
            code: 200,
            message: 'Tips retrieved.',
            data: tips,
        };
    }
    async getResonanceScoreBreakdown(id, user) {
        const result = await this.manifestationService.getResonanceScoreBreakdown(id, user.id);
        return {
            success: true,
            code: 200,
            message: 'Resonance score breakdown retrieved.',
            data: result,
        };
    }
    async getAlignmentActions(id, user) {
        const result = await this.manifestationService.getAlignmentActions(id, user.id);
        return {
            success: true,
            code: 200,
            message: 'Alignment actions retrieved.',
            data: result,
        };
    }
    async getCosmicSupportIndex(id, user) {
        const result = await this.manifestationService.getCosmicSupportIndex(id, user.id);
        return {
            success: true,
            code: 200,
            message: 'Cosmic support index retrieved.',
            data: result,
        };
    }
    async getAlignmentSummary(id, user) {
        const result = await this.manifestationService.getAlignmentSummary(id, user.id);
        return {
            success: true,
            code: 200,
            message: 'Alignment summary retrieved.',
            data: result,
        };
    }
    async getJourneyTimeline(id, user) {
        const result = await this.manifestationService.getJourneyTimeline(id, user.id);
        return {
            success: true,
            code: 200,
            message: 'Journey timeline retrieved.',
            data: result,
        };
    }
    async deleteManifestation(id, user) {
        await this.manifestationService.archiveManifestation(id, user.id);
        return {
            success: true,
            code: 200,
            message: 'Manifestation deleted successfully.',
        };
    }
};
exports.AppManifestationController = AppManifestationController;
__decorate([
    (0, common_1.Post)('add'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new manifestation with AI scoring' }),
    (0, swagger_1.ApiBody)({
        type: create_manifestation_enhanced_dto_1.CreateManifestationEnhancedDto,
        description: 'Manifestation description. Category, scores, and suggestions will be auto-generated based on your kundli.',
        examples: {
            career: {
                summary: 'Career manifestation example',
                value: {
                    description: 'I want to become a successful teacher in 2028 and make a positive impact on students\' lives through quality education.',
                },
            },
            relationship: {
                summary: 'Relationship manifestation example',
                value: {
                    description: 'I want to find my soulmate and build a loving, committed relationship based on mutual respect, understanding, and shared values.',
                },
            },
            money: {
                summary: 'Money manifestation example',
                value: {
                    description: 'I want to achieve financial freedom by 2025 through smart investments and building multiple income streams.',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Manifestation created successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation failed (description too short, kundli missing, etc.)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_manifestation_enhanced_dto_1.CreateManifestationEnhancedDto, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "createManifestation", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get manifestation dashboard data' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard data retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('list/all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get all manifestations including archived' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestations retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getAllManifestations", null);
__decorate([
    (0, common_1.Post)('calculate-resonance'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Calculate detailed resonance score with Dasha analysis',
    }),
    (0, swagger_1.ApiBody)({
        type: calculate_resonance_dto_1.CalculateResonanceDto,
        description: 'Manifestation description for resonance calculation',
        examples: {
            example1: {
                summary: 'Career manifestation',
                value: {
                    description: 'I want to become a successful teacher in 2028 and make a positive impact on students\' lives.',
                },
            },
            example2: {
                summary: 'Relationship manifestation',
                value: {
                    description: 'I want to find my soulmate and build a loving, committed relationship based on mutual respect and understanding.',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Resonance score calculated successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Description too short (minimum 15 characters)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_resonance_dto_1.CalculateResonanceDto, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "calculateResonance", null);
__decorate([
    (0, common_1.Post)('alignment-actions/add'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Add selected alignment actions to karma ledger' }),
    (0, swagger_1.ApiBody)({
        type: alignment_action_dto_1.AddAlignmentActionsDto,
        description: 'Selected alignment actions to add to karma ledger',
        examples: {
            example1: {
                summary: 'Add multiple actions',
                value: {
                    manifestation_id: 123,
                    action_ids: [1, 2, 3],
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Alignment actions added to karma ledger successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation failed',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [alignment_action_dto_1.AddAlignmentActionsDto, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "addAlignmentActionsToKarma", null);
__decorate([
    (0, common_1.Post)('commit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Commit manifestation intention' }),
    (0, swagger_1.ApiBody)({
        type: alignment_action_dto_1.CommitIntentionDto,
        description: 'Commitment data for manifestation',
        examples: {
            example1: {
                summary: 'Commit with message and target date',
                value: {
                    manifestation_id: 123,
                    commitment_message: 'I am fully committed to achieving this goal',
                    target_date: '2025-12-31',
                },
            },
            example2: {
                summary: 'Simple commit',
                value: {
                    manifestation_id: 123,
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestation committed successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [alignment_action_dto_1.CommitIntentionDto, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "commitIntention", null);
__decorate([
    (0, common_1.Post)('daily-progress/add'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Add daily progress entry for a manifestation' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [daily_progress_entry_dto_1.AddDailyProgressEntryDto, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "addDailyProgressEntry", null);
__decorate([
    (0, common_1.Get)(':id/daily-progress'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily progress entries for a manifestation' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getDailyProgressEntries", null);
__decorate([
    (0, common_1.Put)('daily-progress/:entryId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update daily progress entry' }),
    __param(0, (0, common_1.Param)('entryId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, daily_progress_entry_dto_1.UpdateDailyProgressEntryDto, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "updateDailyProgressEntry", null);
__decorate([
    (0, common_1.Delete)('daily-progress/:entryId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete daily progress entry' }),
    __param(0, (0, common_1.Param)('entryId', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "deleteDailyProgressEntry", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get manifestation by ID with full details' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestation retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getManifestation", null);
__decorate([
    (0, common_1.Put)('archive/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Archive a manifestation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestation archived successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "archiveManifestation", null);
__decorate([
    (0, common_1.Put)('lock/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Lock or unlock a manifestation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestation lock status updated successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "toggleLockManifestation", null);
__decorate([
    (0, common_1.Get)('tips/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get tips and rituals for a manifestation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tips retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getTips", null);
__decorate([
    (0, common_1.Get)(':id/resonance-score'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get resonance score breakdown for a manifestation',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Resonance score breakdown retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getResonanceScoreBreakdown", null);
__decorate([
    (0, common_1.Get)(':id/alignment-actions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get alignment actions for a manifestation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Alignment actions retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getAlignmentActions", null);
__decorate([
    (0, common_1.Get)(':id/cosmic-support'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get cosmic support index (Dasha periods) for a manifestation',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cosmic support index retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getCosmicSupportIndex", null);
__decorate([
    (0, common_1.Get)(':id/alignment-summary'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get alignment summary for a manifestation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Alignment summary retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getAlignmentSummary", null);
__decorate([
    (0, common_1.Get)(':id/journey-timeline'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get journey timeline for a manifestation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Journey timeline retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "getJourneyTimeline", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a manifestation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Manifestation deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Manifestation not found',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppManifestationController.prototype, "deleteManifestation", null);
exports.AppManifestationController = AppManifestationController = __decorate([
    (0, swagger_1.ApiTags)('Manifestation (App)'),
    (0, common_1.Controller)('app/manifestation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [manifestation_enhanced_service_1.ManifestationEnhancedService,
        entitlements_service_1.EntitlementsService])
], AppManifestationController);
//# sourceMappingURL=app-manifestation.controller.js.map