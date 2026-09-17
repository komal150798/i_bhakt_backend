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
exports.AdminRulebookController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const rulebook_governance_service_1 = require("../services/rulebook-governance.service");
const rulebook_actor_service_1 = require("../services/rulebook-actor.service");
const rulebook_template_service_1 = require("../templates/rulebook-template.service");
const rulebook_repository_service_1 = require("../services/rulebook-repository.service");
const rulebook_dashboard_service_1 = require("../services/rulebook-dashboard.service");
const rulebook_dtos_1 = require("../dtos/rulebook.dtos");
let AdminRulebookController = class AdminRulebookController {
    constructor(governance, actors, templates, repository, dashboard) {
        this.governance = governance;
        this.actors = actors;
        this.templates = templates;
        this.repository = repository;
        this.dashboard = dashboard;
    }
    async downloadTemplate(req, res) {
        await this.actors.resolve(req.user);
        const buffer = await this.templates.generate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="ZUNO_Astrology_Rulebook_Template.xlsx"');
        res.send(buffer);
    }
    async list(req, limit) {
        await this.actors.resolve(req.user);
        const versions = await this.dashboard.listVersions(Math.min(Number(limit) || 25, 100));
        const active = await this.repository.getActive();
        return new zuno_response_interceptor_1.ZunoPayload(versions.map(rulebook_dtos_1.RulebookVersionView.from), {
            activeVersion: active?.version ?? null,
            astrologyAvailable: active !== null,
        });
    }
    async active(req) {
        await this.actors.resolve(req.user);
        const active = await this.repository.getActive();
        return {
            active,
            astrologyAvailable: active !== null,
            message: active
                ? null
                : 'No approved rulebook is active, so astrology-derived guidance is disabled.',
        };
    }
    async detail(req, versionId) {
        await this.actors.resolve(req.user);
        const version = await this.governance.findVersion(versionId);
        return rulebook_dtos_1.RulebookVersionView.from(version);
    }
    async upload(req, file, dto) {
        const actor = await this.actors.resolve(req.user);
        if (!file?.buffer) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'file', code: 'REQUIRED' }], 'An .xlsx workbook is required.');
        }
        const version = await this.governance.upload(actor, {
            version: dto.version,
            releaseName: dto.releaseName,
            description: dto.description,
            releaseType: dto.releaseType,
            smeReference: dto.smeReference,
            changeSummary: dto.changeSummary,
            fileName: file.originalname,
            buffer: file.buffer,
        });
        return {
            versionId: version.id,
            version: version.version,
            status: version.status,
            fileHash: version.source_file_hash,
            nextStep: 'Upload does not activate anything. Run validate next, then SME review.',
        };
    }
    async validate(req, versionId, file) {
        const actor = await this.actors.resolve(req.user);
        if (!file?.buffer) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'file', code: 'REQUIRED' }], 'Re-supply the same .xlsx file that was uploaded for this version.');
        }
        const { version, run } = await this.governance.validate(actor, versionId, file.buffer);
        return {
            version: rulebook_dtos_1.RulebookVersionView.from(version),
            validation: rulebook_dtos_1.ValidationRunView.from(run),
        };
    }
    async reviewDashboard(req, versionId) {
        await this.actors.resolve(req.user);
        return this.dashboard.reviewDashboard(versionId);
    }
    async rules(req, versionId, reviewStatus, domain, limit, offset) {
        await this.actors.resolve(req.user);
        const { items, total } = await this.dashboard.listRules(versionId, {
            reviewStatus,
            domain,
            limit: Math.min(Number(limit) || 50, 200),
            offset: Number(offset) || 0,
        });
        return new zuno_response_interceptor_1.ZunoPayload(items, { total });
    }
    async reviewRule(req, versionId, ruleId, dto) {
        const actor = await this.actors.resolve(req.user);
        const item = await this.governance.reviewRule(actor, versionId, ruleId, {
            status: dto.status,
            comment: dto.comment,
            isSecondaryReview: dto.isSecondaryReview,
        });
        return {
            ruleId: item.rule_id,
            ruleKey: item.external_rule_key,
            reviewStatus: item.review_status,
            requiresTwoPersonReview: item.requires_two_person_review,
            hasSecondaryReview: item.secondary_reviewer_id !== null,
        };
    }
    async approve(req, versionId, dto) {
        const actor = await this.actors.resolve(req.user);
        const version = await this.governance.smeApprove(actor, versionId, dto.comment);
        return rulebook_dtos_1.RulebookVersionView.from(version);
    }
    async reject(req, versionId, dto) {
        const actor = await this.actors.resolve(req.user);
        const version = await this.governance.smeReject(actor, versionId, dto.reason);
        return rulebook_dtos_1.RulebookVersionView.from(version);
    }
    async stage(req, versionId) {
        const actor = await this.actors.resolve(req.user);
        const version = await this.governance.moveToStaging(actor, versionId);
        return rulebook_dtos_1.RulebookVersionView.from(version);
    }
    async regression(req, versionId, dto) {
        const actor = await this.actors.resolve(req.user);
        const version = await this.governance.recordRegression(actor, versionId, {
            passed: dto.passed,
            totalCases: dto.totalCases,
            unchanged: dto.unchanged,
            improvements: dto.improvements,
            needsReview: dto.needsReview,
            criticalRegressions: dto.criticalRegressions,
            notes: dto.notes,
        });
        return rulebook_dtos_1.RulebookVersionView.from(version);
    }
    async approveForProduction(req, versionId) {
        const actor = await this.actors.resolve(req.user);
        const version = await this.governance.approveForProduction(actor, versionId);
        return rulebook_dtos_1.RulebookVersionView.from(version);
    }
    async activate(req, versionId, dto) {
        const actor = await this.actors.resolve(req.user);
        const version = await this.governance.activate(actor, versionId, dto.comment);
        this.repository.invalidateCache();
        return rulebook_dtos_1.RulebookVersionView.from(version);
    }
    async rollback(req, versionId, dto) {
        const actor = await this.actors.resolve(req.user);
        const version = await this.governance.rollback(actor, versionId, dto.reason);
        this.repository.invalidateCache();
        return rulebook_dtos_1.RulebookVersionView.from(version);
    }
    async audit(req, versionId) {
        await this.actors.resolve(req.user);
        return this.dashboard.auditTrail(versionId);
    }
    async validation(req, versionId) {
        await this.actors.resolve(req.user);
        const run = await this.dashboard.latestValidationRun(versionId);
        if (!run) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.NOT_FOUND, {
                message: 'This version has not been validated yet.',
            });
        }
        return rulebook_dtos_1.ValidationRunView.from(run);
    }
};
exports.AdminRulebookController = AdminRulebookController;
__decorate([
    (0, common_1.Get)('template'),
    (0, swagger_1.ApiOperation)({ summary: 'Download the blank SME Rulebook template (.xlsx)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "downloadTemplate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List rulebook versions with lifecycle state' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'The current production rulebook, if any' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active version, or null.' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "active", null);
__decorate([
    (0, common_1.Get)(':versionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Rulebook version detail' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a new rulebook version (.xlsx)' }),
    (0, swagger_1.ApiBody)({ type: rulebook_dtos_1.UploadRulebookDto }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 25 * 1024 * 1024, files: 1 },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, rulebook_dtos_1.UploadRulebookDto]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)(':versionId/validate'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate and compile an uploaded rulebook' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 25 * 1024 * 1024, files: 1 } })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "validate", null);
__decorate([
    (0, common_1.Get)(':versionId/review-dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'SME review progress and breakdowns' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "reviewDashboard", null);
__decorate([
    (0, common_1.Get)(':versionId/rules'),
    (0, swagger_1.ApiOperation)({ summary: 'List rules in a version, filterable by review state' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)('reviewStatus')),
    __param(3, (0, common_1.Query)('domain')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "rules", null);
__decorate([
    (0, common_1.Post)(':versionId/rules/:ruleId/review'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Record an SME review decision for a rule' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('ruleId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, rulebook_dtos_1.ReviewRuleDto]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "reviewRule", null);
__decorate([
    (0, common_1.Post)(':versionId/approve'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'SME approval of the whole rulebook' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Rules still awaiting review.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Separation of duties violation.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, rulebook_dtos_1.ApproveRulebookDto]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':versionId/reject'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'SME rejection, with a required reason' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, rulebook_dtos_1.RejectRulebookDto]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':versionId/stage'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Move an SME-approved rulebook to staging' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "stage", null);
__decorate([
    (0, common_1.Post)(':versionId/regression'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Record the Golden Case regression result' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, rulebook_dtos_1.RecordRegressionDto]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "regression", null);
__decorate([
    (0, common_1.Post)(':versionId/approve-for-production'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Administrative approval after SME sign-off and regression' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "approveForProduction", null);
__decorate([
    (0, common_1.Post)(':versionId/activate'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Activate as the single production rulebook' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Separation of duties violation.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Illegal lifecycle transition.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, rulebook_dtos_1.ApproveRulebookDto]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':versionId/rollback'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Roll back to this previously superseded version' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, rulebook_dtos_1.RollbackRulebookDto]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "rollback", null);
__decorate([
    (0, common_1.Get)(':versionId/audit'),
    (0, swagger_1.ApiOperation)({ summary: 'Governance audit trail for this version' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "audit", null);
__decorate([
    (0, common_1.Get)(':versionId/validation'),
    (0, swagger_1.ApiOperation)({ summary: 'Latest validation run with findings' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('versionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRulebookController.prototype, "validation", null);
exports.AdminRulebookController = AdminRulebookController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Admin Rulebook'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('internal/rulebooks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [rulebook_governance_service_1.RulebookGovernanceService,
        rulebook_actor_service_1.RulebookActorService,
        rulebook_template_service_1.RulebookTemplateService,
        rulebook_repository_service_1.RulebookRepositoryService,
        rulebook_dashboard_service_1.RulebookDashboardService])
], AdminRulebookController);
//# sourceMappingURL=admin-rulebook.controller.js.map