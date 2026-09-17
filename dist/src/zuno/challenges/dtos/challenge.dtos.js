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
exports.ZunoResponseView = exports.ChallengeDetailView = exports.ChallengeView = exports.ListChallengesQueryDto = exports.ReopenChallengeDto = exports.ResolveChallengeDto = exports.CreateChallengeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../common/enums");
class CreateChallengeDto {
}
exports.CreateChallengeDto = CreateChallengeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'What the person wants to talk through, in their own words.',
        example: 'Many people have been laid off in my company in Dubai. I have a home loan and I am worried about what happens if I lose my job.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 5000),
    __metadata("design:type", String)
], CreateChallengeDto.prototype, "statement", void 0);
class ResolveChallengeDto {
}
exports.ResolveChallengeDto = ResolveChallengeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'How it worked out, in the user\'s words.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], ResolveChallengeDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Version the client last saw.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ResolveChallengeDto.prototype, "version", void 0);
class ReopenChallengeDto {
}
exports.ReopenChallengeDto = ReopenChallengeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Version the client last saw.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ReopenChallengeDto.prototype, "version", void 0);
class ListChallengesQueryDto {
}
exports.ListChallengesQueryDto = ListChallengesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.ChallengeStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ChallengeStatus),
    __metadata("design:type", String)
], ListChallengesQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20, maximum: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], ListChallengesQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListChallengesQueryDto.prototype, "cursor", void 0);
class ChallengeView {
    static from(challenge) {
        return {
            id: challenge.id,
            title: challenge.title,
            status: challenge.status,
            primaryDomain: challenge.primary_domain,
            theme: challenge.theme,
            mode: challenge.mode,
            urgency: challenge.urgency,
            contextVersion: challenge.context_version,
            version: challenge.version,
            openedAt: challenge.opened_at.toISOString(),
            resolvedAt: challenge.resolved_at
                ? challenge.resolved_at.toISOString()
                : null,
        };
    }
}
exports.ChallengeView = ChallengeView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChallengeView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ChallengeView.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.ChallengeStatus }),
    __metadata("design:type", String)
], ChallengeView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ChallengeView.prototype, "primaryDomain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ChallengeView.prototype, "theme", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ChallengeView.prototype, "mode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ChallengeView.prototype, "urgency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ChallengeView.prototype, "contextVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ChallengeView.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChallengeView.prototype, "openedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ChallengeView.prototype, "resolvedAt", void 0);
class ChallengeDetailView extends ChallengeView {
    static fromDetail(challenge, context) {
        const base = ChallengeView.from(challenge);
        const items = context?.payload?.items ?? [];
        return {
            ...base,
            summary: context?.summary ?? null,
            clarificationRequired: context?.clarification_required ?? false,
            understood: items
                .filter((item) => item.type === 'FACT' || item.type === 'EXTERNAL_EVENT')
                .map((item) => item.text),
            concerns: items
                .filter((item) => item.type === 'FEAR' ||
                item.type === 'ASSUMPTION' ||
                item.type === 'USER_BELIEF')
                .map((item) => item.text),
        };
    }
}
exports.ChallengeDetailView = ChallengeDetailView;
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ChallengeDetailView.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ChallengeDetailView.prototype, "clarificationRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], ChallengeDetailView.prototype, "understood", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], ChallengeDetailView.prototype, "concerns", void 0);
class ZunoResponseView {
    static from(response) {
        return {
            responseId: response.id,
            challengeId: response.challenge_id,
            title: response.structured_payload.title,
            sections: response.structured_payload.sections,
            generatedAt: response.created_at.toISOString(),
        };
    }
}
exports.ZunoResponseView = ZunoResponseView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ZunoResponseView.prototype, "responseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ZunoResponseView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ZunoResponseView.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'array', items: { type: 'object' } }),
    __metadata("design:type", Array)
], ZunoResponseView.prototype, "sections", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ZunoResponseView.prototype, "generatedAt", void 0);
//# sourceMappingURL=challenge.dtos.js.map