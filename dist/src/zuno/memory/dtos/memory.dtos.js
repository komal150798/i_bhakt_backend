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
exports.MemorySummaryView = exports.MemoryCandidateView = exports.MemoryView = exports.RejectCandidateDto = exports.CorrectMemoryDto = exports.ListMemoryQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const memory_enum_1 = require("../enums/memory.enum");
class ListMemoryQueryDto {
}
exports.ListMemoryQueryDto = ListMemoryQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: memory_enum_1.MemoryType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(memory_enum_1.MemoryType),
    __metadata("design:type", String)
], ListMemoryQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Limit to one challenge.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListMemoryQueryDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: memory_enum_1.MemoryScope }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(memory_enum_1.MemoryScope),
    __metadata("design:type", String)
], ListMemoryQueryDto.prototype, "scope", void 0);
class CorrectMemoryDto {
}
exports.CorrectMemoryDto = CorrectMemoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'What is actually true, in the user\'s own words.',
        example: 'I decided to stay in Dubai as long as my job is stable.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 2000),
    __metadata("design:type", String)
], CorrectMemoryDto.prototype, "statement", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Short label for the memory screen.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 80),
    __metadata("design:type", String)
], CorrectMemoryDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Version the client last saw.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CorrectMemoryDto.prototype, "version", void 0);
class RejectCandidateDto {
}
exports.RejectCandidateDto = RejectCandidateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional note. Not stored as memory content.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 200),
    __metadata("design:type", String)
], RejectCandidateDto.prototype, "note", void 0);
class MemoryView {
    static from(memory, why) {
        return {
            id: memory.id,
            type: memory.memory_type,
            label: memory.memory_value?.label ?? defaultLabel(memory.memory_type),
            value: memory.memory_value?.statement ?? '',
            scope: memory.scope,
            challengeId: memory.challenge_id,
            why,
            expiresAt: memory.expires_at ? memory.expires_at.toISOString() : null,
            version: memory.version,
        };
    }
}
exports.MemoryView = MemoryView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MemoryView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: memory_enum_1.MemoryType }),
    __metadata("design:type", String)
], MemoryView.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MemoryView.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MemoryView.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: memory_enum_1.MemoryScope }),
    __metadata("design:type", String)
], MemoryView.prototype, "scope", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], MemoryView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Why ZUNO keeps this.' }),
    __metadata("design:type", String)
], MemoryView.prototype, "why", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], MemoryView.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MemoryView.prototype, "version", void 0);
class MemoryCandidateView {
    static from(candidate) {
        return {
            id: candidate.id,
            type: candidate.memory_type,
            proposed: candidate.proposed_value?.statement ?? '',
            challengeId: candidate.challenge_id,
            askingBecause: askingBecause(candidate.confirmation_reason),
        };
    }
}
exports.MemoryCandidateView = MemoryCandidateView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MemoryCandidateView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: memory_enum_1.MemoryType }),
    __metadata("design:type", String)
], MemoryCandidateView.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MemoryCandidateView.prototype, "proposed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], MemoryCandidateView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Why ZUNO is asking rather than assuming.',
    }),
    __metadata("design:type", String)
], MemoryCandidateView.prototype, "askingBecause", void 0);
class MemorySummaryView {
}
exports.MemorySummaryView = MemorySummaryView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MemorySummaryView.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MemorySummaryView.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], MemorySummaryView.prototype, "items", void 0);
function askingBecause(reason) {
    switch (reason) {
        case 'LOW_CONFIDENCE_INFERENCE':
            return 'ZUNO thinks this might be true but is not sure enough to assume it.';
        case 'SENSITIVE_CLASSIFICATION':
            return 'This is personal enough that ZUNO will not keep it unless you say so.';
        case 'CONTRADICTS_ACTIVE_MEMORY':
            return 'This does not match something ZUNO already had. Which one is right?';
        case 'DERIVED_PATTERN':
            return 'ZUNO noticed a pattern across several things. Does it sound right?';
        default:
            return 'ZUNO would like to confirm this before keeping it.';
    }
}
function defaultLabel(type) {
    return type
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
//# sourceMappingURL=memory.dtos.js.map