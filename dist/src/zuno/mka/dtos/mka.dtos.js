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
exports.MkaCompletionView = exports.MkaProgramView = exports.MkaItemView = exports.ListMkaQueryDto = exports.SkipMkaItemDto = exports.CompleteMkaItemDto = exports.GenerateMkaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../common/enums");
const mka_enum_1 = require("../enums/mka.enum");
class GenerateMkaDto {
}
exports.GenerateMkaDto = GenerateMkaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The WhatNow this practice programme is for.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateMkaDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: mka_enum_1.MkaPeriodType, default: mka_enum_1.MkaPeriodType.WEEK }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(mka_enum_1.MkaPeriodType),
    __metadata("design:type", String)
], GenerateMkaDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Force a new programme version even when an equivalent one is active.',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], GenerateMkaDto.prototype, "regenerate", void 0);
class CompleteMkaItemDto {
}
exports.CompleteMkaItemDto = CompleteMkaItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The date the practice was done (defaults to today, UTC).',
        example: '2026-09-17',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CompleteMkaItemDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'An optional note, in the user\'s words.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CompleteMkaItemDto.prototype, "note", void 0);
class SkipMkaItemDto extends CompleteMkaItemDto {
}
exports.SkipMkaItemDto = SkipMkaItemDto;
class ListMkaQueryDto {
}
exports.ListMkaQueryDto = ListMkaQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Limit to one WhatNow.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListMkaQueryDto.prototype, "challengeId", void 0);
class MkaItemView {
    static from(item) {
        return {
            id: item.id,
            dimension: item.dimension,
            title: item.title,
            description: item.description,
            purpose: item.purpose,
            frequency: item.frequency,
            durationMinutes: item.duration_minutes,
            priority: item.priority,
            karmaEligible: item.karma_eligible,
            planEligible: item.plan_eligible,
            astrologyInformed: item.rulebook_version_id !== null,
            status: item.status,
        };
    }
}
exports.MkaItemView = MkaItemView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaItemView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.MkaDimension }),
    __metadata("design:type", String)
], MkaItemView.prototype, "dimension", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaItemView.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaItemView.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], MkaItemView.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: mka_enum_1.MkaFrequency }),
    __metadata("design:type", String)
], MkaItemView.prototype, "frequency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Number)
], MkaItemView.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: mka_enum_1.MkaPriority }),
    __metadata("design:type", String)
], MkaItemView.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MkaItemView.prototype, "karmaEligible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MkaItemView.prototype, "planEligible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MkaItemView.prototype, "astrologyInformed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaItemView.prototype, "status", void 0);
class MkaProgramView {
    static from(program, items) {
        return {
            programId: program.id,
            challengeId: program.challenge_id,
            status: program.status,
            periodType: program.period_type,
            period: { start: program.start_date, end: program.end_date },
            reviewAt: program.review_at,
            remedyStatus: program.remedy_status,
            items: items.map(MkaItemView.from),
        };
    }
}
exports.MkaProgramView = MkaProgramView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaProgramView.prototype, "programId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaProgramView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: mka_enum_1.MkaProgramStatus }),
    __metadata("design:type", String)
], MkaProgramView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: mka_enum_1.MkaPeriodType }),
    __metadata("design:type", String)
], MkaProgramView.prototype, "periodType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], MkaProgramView.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], MkaProgramView.prototype, "reviewAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaProgramView.prototype, "remedyStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MkaItemView] }),
    __metadata("design:type", Array)
], MkaProgramView.prototype, "items", void 0);
class MkaCompletionView {
    static from(completion) {
        return {
            id: completion.id,
            itemId: completion.mka_item_id,
            completionDate: completion.completion_date,
            status: completion.status,
            karmaEligible: completion.karma_eligible,
        };
    }
}
exports.MkaCompletionView = MkaCompletionView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaCompletionView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaCompletionView.prototype, "itemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MkaCompletionView.prototype, "completionDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: mka_enum_1.MkaCompletionStatus }),
    __metadata("design:type", String)
], MkaCompletionView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MkaCompletionView.prototype, "karmaEligible", void 0);
//# sourceMappingURL=mka.dtos.js.map