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
exports.KarmaSummaryView = exports.KarmaEntryCreatedView = exports.KarmaEntryDetailView = exports.KarmaEntryView = exports.ListKarmaQueryDto = exports.CorrectKarmaEntryDto = exports.KarmaClassificationFeedbackDto = exports.CreateKarmaEntryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const karma_enum_1 = require("../enums/karma.enum");
class CreateKarmaEntryDto {
}
exports.CreateKarmaEntryDto = CreateKarmaEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'What the person did, in their own words.',
        example: 'I helped a colleague prepare for an interview.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 5000),
    __metadata("design:type", String)
], CreateKarmaEntryDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'When it actually happened, if not now. ISO-8601. Step 21 section 55.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateKarmaEntryDto.prototype, "occurredAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The WhatNow this relates to. Optional - Step 17 section 29 allows entries unrelated to any challenge.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateKarmaEntryDto.prototype, "challengeId", void 0);
class KarmaClassificationFeedbackDto {
}
exports.KarmaClassificationFeedbackDto = KarmaClassificationFeedbackDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the user accepts ZUNO\'s reading of the action.',
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], KarmaClassificationFeedbackDto.prototype, "accepted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The user\'s own explanation. Preserved in revision history.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 1000),
    __metadata("design:type", String)
], KarmaClassificationFeedbackDto.prototype, "comment", void 0);
class CorrectKarmaEntryDto {
}
exports.CorrectKarmaEntryDto = CorrectKarmaEntryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: karma_enum_1.KarmaClassification }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(karma_enum_1.KarmaClassification),
    __metadata("design:type", String)
], CorrectKarmaEntryDto.prototype, "classification", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: karma_enum_1.KarmaCategory }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(karma_enum_1.KarmaCategory),
    __metadata("design:type", String)
], CorrectKarmaEntryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: karma_enum_1.KarmaIntent }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(karma_enum_1.KarmaIntent),
    __metadata("design:type", String)
], CorrectKarmaEntryDto.prototype, "intent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Corrected or expanded wording.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 5000),
    __metadata("design:type", String)
], CorrectKarmaEntryDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: KarmaClassificationFeedbackDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => KarmaClassificationFeedbackDto),
    __metadata("design:type", KarmaClassificationFeedbackDto)
], CorrectKarmaEntryDto.prototype, "classificationFeedback", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Version the client last saw.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CorrectKarmaEntryDto.prototype, "version", void 0);
class ListKarmaQueryDto {
}
exports.ListKarmaQueryDto = ListKarmaQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: karma_enum_1.KarmaCategory }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(karma_enum_1.KarmaCategory),
    __metadata("design:type", String)
], ListKarmaQueryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: karma_enum_1.KarmaClassification }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(karma_enum_1.KarmaClassification),
    __metadata("design:type", String)
], ListKarmaQueryDto.prototype, "classification", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: karma_enum_1.KarmaEntrySource }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(karma_enum_1.KarmaEntrySource),
    __metadata("design:type", String)
], ListKarmaQueryDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListKarmaQueryDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Inclusive lower bound, ISO-8601.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], ListKarmaQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Exclusive upper bound, ISO-8601.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], ListKarmaQueryDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20, maximum: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], ListKarmaQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cursor from a previous page.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListKarmaQueryDto.prototype, "cursor", void 0);
class KarmaEntryView {
    static from(entry) {
        return {
            id: entry.id,
            classification: entry.classification,
            category: entry.category,
            intent: entry.intent,
            points: entry.points,
            confidence: entry.confidence === null ? null : Number(entry.confidence),
            userConfirmed: entry.user_confirmed,
            status: entry.status,
            source: entry.source,
            challengeId: entry.challenge_id,
            visibility: entry.visibility,
            occurredAt: entry.occurred_at.toISOString(),
            createdAt: entry.created_at.toISOString(),
            version: entry.version,
            scoringModelVersion: entry.scoring_model_version,
        };
    }
}
exports.KarmaEntryView = KarmaEntryView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: karma_enum_1.KarmaClassification }),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "classification", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: karma_enum_1.KarmaCategory }),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: karma_enum_1.KarmaIntent, nullable: true }),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "intent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], KarmaEntryView.prototype, "points", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Number)
], KarmaEntryView.prototype, "confidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], KarmaEntryView.prototype, "userConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: karma_enum_1.KarmaEntryStatus }),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: karma_enum_1.KarmaEntrySource }),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "occurredAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], KarmaEntryView.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Scoring model this entry was scored under.' }),
    __metadata("design:type", String)
], KarmaEntryView.prototype, "scoringModelVersion", void 0);
class KarmaEntryDetailView extends KarmaEntryView {
    static fromDetail(entry) {
        return {
            ...KarmaEntryView.from(entry),
            rawText: entry.raw_text,
            evidence: entry.evidence ?? [],
            scoreFactors: entry.score_factors ?? [],
            planItemId: entry.plan_item_id,
            mkaItemId: entry.mka_item_id,
            redactedAt: entry.redacted_at ? entry.redacted_at.toISOString() : null,
        };
    }
}
exports.KarmaEntryDetailView = KarmaEntryDetailView;
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'The user\'s own words.' }),
    __metadata("design:type", String)
], KarmaEntryDetailView.prototype, "rawText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Stable evidence labels, never model reasoning.' }),
    __metadata("design:type", Array)
], KarmaEntryDetailView.prototype, "evidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'What affected the points.' }),
    __metadata("design:type", Array)
], KarmaEntryDetailView.prototype, "scoreFactors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], KarmaEntryDetailView.prototype, "planItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], KarmaEntryDetailView.prototype, "mkaItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], KarmaEntryDetailView.prototype, "redactedAt", void 0);
class KarmaEntryCreatedView {
    static from(entry, confirmationRequired, explanation) {
        return {
            id: entry.id,
            classification: entry.classification,
            category: entry.category,
            points: entry.points,
            confidence: entry.confidence === null ? null : Number(entry.confidence),
            userConfirmed: entry.user_confirmed,
            confirmationRequired,
            explanation,
        };
    }
}
exports.KarmaEntryCreatedView = KarmaEntryCreatedView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KarmaEntryCreatedView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: karma_enum_1.KarmaClassification }),
    __metadata("design:type", String)
], KarmaEntryCreatedView.prototype, "classification", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: karma_enum_1.KarmaCategory }),
    __metadata("design:type", String)
], KarmaEntryCreatedView.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], KarmaEntryCreatedView.prototype, "points", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Number)
], KarmaEntryCreatedView.prototype, "confidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], KarmaEntryCreatedView.prototype, "userConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], KarmaEntryCreatedView.prototype, "confirmationRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KarmaEntryCreatedView.prototype, "explanation", void 0);
class KarmaSummaryView {
    static from(summary) {
        return {
            pointsLabel: summary.pointsLabel,
            framing: summary.framing,
            today: summary.today,
            thisWeek: summary.thisWeek,
            patterns: summary.patterns,
        };
    }
}
exports.KarmaSummaryView = KarmaSummaryView;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Approved label for the figure. Step 17 section 39.' }),
    __metadata("design:type", String)
], KarmaSummaryView.prototype, "pointsLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'How the figure should be described to the user.' }),
    __metadata("design:type", String)
], KarmaSummaryView.prototype, "framing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], KarmaSummaryView.prototype, "today", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], KarmaSummaryView.prototype, "thisWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Observed behavioural patterns, with evidence.' }),
    __metadata("design:type", Array)
], KarmaSummaryView.prototype, "patterns", void 0);
//# sourceMappingURL=karma.dtos.js.map