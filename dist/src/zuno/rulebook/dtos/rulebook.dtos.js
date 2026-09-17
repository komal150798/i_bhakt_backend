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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationRunView = exports.RulebookVersionView = exports.RecordRegressionDto = exports.RollbackRulebookDto = exports.RejectRulebookDto = exports.ApproveRulebookDto = exports.ReviewRuleDto = exports.UploadRulebookDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../common/enums");
class UploadRulebookDto {
}
exports.UploadRulebookDto = UploadRulebookDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1.0.0', description: 'Semantic version. Must be unique.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d+\.\d+\.\d+$/, { message: 'version must be semantic, e.g. 1.0.0' }),
    __metadata("design:type", String)
], UploadRulebookDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Career domain baseline' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], UploadRulebookDto.prototype, "releaseName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], UploadRulebookDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: enums_1.RulebookReleaseType,
        description: 'PATCH for wording only. MINOR for new rules or remedies. MAJOR for methodology or schema change.',
    }),
    (0, class_validator_1.IsEnum)(enums_1.RulebookReleaseType),
    __metadata("design:type", String)
], UploadRulebookDto.prototype, "releaseType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Who authored the astrological content.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 120),
    __metadata("design:type", String)
], UploadRulebookDto.prototype, "smeReference", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'What changed since the previous version.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 4000),
    __metadata("design:type", String)
], UploadRulebookDto.prototype, "changeSummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: 'string',
        format: 'binary',
        description: 'The .xlsx workbook. Macro-enabled files are rejected.',
    }),
    __metadata("design:type", Object)
], UploadRulebookDto.prototype, "file", void 0);
class ReviewRuleDto {
}
exports.ReviewRuleDto = ReviewRuleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.RuleReviewStatus }),
    (0, class_validator_1.IsEnum)(enums_1.RuleReviewStatus),
    __metadata("design:type", String)
], ReviewRuleDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Internal SME note. Never shown to users.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], ReviewRuleDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Set when recording the second of two required reviews.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    __metadata("design:type", Boolean)
], ReviewRuleDto.prototype, "isSecondaryReview", void 0);
class ApproveRulebookDto {
}
exports.ApproveRulebookDto = ApproveRulebookDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], ApproveRulebookDto.prototype, "comment", void 0);
class RejectRulebookDto {
}
exports.RejectRulebookDto = RejectRulebookDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Required. Recorded in the audit trail.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 2000),
    __metadata("design:type", String)
], RejectRulebookDto.prototype, "reason", void 0);
class RollbackRulebookDto {
}
exports.RollbackRulebookDto = RollbackRulebookDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Required. Step 10 section 28: a rollback must state why.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 2000),
    __metadata("design:type", String)
], RollbackRulebookDto.prototype, "reason", void 0);
class RecordRegressionDto {
}
exports.RecordRegressionDto = RecordRegressionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    __metadata("design:type", Boolean)
], RecordRegressionDto.prototype, "passed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RecordRegressionDto.prototype, "totalCases", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RecordRegressionDto.prototype, "unchanged", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RecordRegressionDto.prototype, "improvements", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RecordRegressionDto.prototype, "needsReview", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Any value above zero blocks activation (Step 10 section 22).',
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RecordRegressionDto.prototype, "criticalRegressions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 4000),
    __metadata("design:type", String)
], RecordRegressionDto.prototype, "notes", void 0);
class RulebookVersionView {
    static from(version) {
        return {
            id: version.id,
            version: version.version,
            releaseName: version.release_name,
            status: version.status,
            releaseType: version.release_type,
            isProduction: version.is_production,
            description: version.description,
            smeReference: version.sme_reference,
            changeSummary: version.change_summary,
            fileName: version.source_file_name,
            fileHash: version.source_file_hash,
            totals: {
                rules: version.total_rules,
                interpretations: version.total_interpretations,
                remedies: version.total_remedies,
                timingRules: version.total_timing_rules,
                goldenCases: version.total_golden_cases,
            },
            domainsCovered: version.domains_covered ?? [],
            statusReason: version.status_reason,
            uploadedAt: version.uploaded_at?.toISOString(),
            approvedAt: version.approved_at?.toISOString() ?? null,
            activatedAt: version.activated_at?.toISOString() ?? null,
            supersededAt: version.superseded_at?.toISOString() ?? null,
        };
    }
}
exports.RulebookVersionView = RulebookVersionView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "releaseName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.RulebookStatus }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.RulebookReleaseType }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "releaseType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], RulebookVersionView.prototype, "isProduction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "smeReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "changeSummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'SHA-256 of the uploaded workbook.' }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "fileHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], RulebookVersionView.prototype, "totals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], RulebookVersionView.prototype, "domainsCovered", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "statusReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "uploadedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "approvedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "activatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RulebookVersionView.prototype, "supersededAt", void 0);
class ValidationRunView {
    static from(run) {
        return {
            id: run.id,
            status: run.status,
            validatorVersion: run.validator_version,
            totals: {
                rules: run.total_rules,
                validRules: run.valid_rules,
                invalidRules: run.invalid_rules,
                errors: run.error_count,
                warnings: run.warning_count,
            },
            findings: run.findings ?? [],
            startedAt: run.started_at?.toISOString(),
            completedAt: run.completed_at?.toISOString() ?? null,
        };
    }
}
exports.ValidationRunView = ValidationRunView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ValidationRunView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ValidationRunView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ValidationRunView.prototype, "validatorVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ValidationRunView.prototype, "totals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'array', items: { type: 'object' } }),
    __metadata("design:type", Array)
], ValidationRunView.prototype, "findings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ValidationRunView.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ValidationRunView.prototype, "completedAt", void 0);
//# sourceMappingURL=rulebook.dtos.js.map