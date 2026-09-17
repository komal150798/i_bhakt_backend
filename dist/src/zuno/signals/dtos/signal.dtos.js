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
exports.CreateLifeSignalResponseView = exports.LifeSignalView = exports.TrendsQueryDto = exports.ListLifeSignalsQueryDto = exports.ConfirmLifeSignalDto = exports.CreateLifeSignalDto = exports.SignalValueDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const enums_1 = require("../enums");
class SignalValueDto {
}
exports.SignalValueDto = SignalValueDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'What changed, in the user\'s own words.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 5000),
    __metadata("design:type", String)
], SignalValueDto.prototype, "statement", void 0);
class CreateLifeSignalDto {
}
exports.CreateLifeSignalDto = CreateLifeSignalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The WhatNow this update belongs to, when it is known.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateLifeSignalDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.LifeSignalType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.LifeSignalType),
    __metadata("design:type", String)
], CreateLifeSignalDto.prototype, "signalType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.LifeSignalSource }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.LifeSignalSource),
    __metadata("design:type", String)
], CreateLifeSignalDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: SignalValueDto }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", SignalValueDto)
], CreateLifeSignalDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'When it happened, if that differs from now.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateLifeSignalDto.prototype, "occurredAt", void 0);
class ConfirmLifeSignalDto {
}
exports.ConfirmLifeSignalDto = ConfirmLifeSignalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Anything the user wants to add.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], ConfirmLifeSignalDto.prototype, "note", void 0);
class ListLifeSignalsQueryDto {
}
exports.ListLifeSignalsQueryDto = ListLifeSignalsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListLifeSignalsQueryDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.LifeSignalStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.LifeSignalStatus),
    __metadata("design:type", String)
], ListLifeSignalsQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListLifeSignalsQueryDto.prototype, "limit", void 0);
class TrendsQueryDto {
}
exports.TrendsQueryDto = TrendsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrendsQueryDto.prototype, "challengeId", void 0);
class LifeSignalView {
    static from(signal) {
        const confirmed = (0, enums_1.isConfirmedSignal)(signal.confirmation_status);
        return {
            signalId: signal.id,
            challengeId: signal.challenge_id,
            signalType: signal.signal_type,
            status: signal.status,
            confirmationStatus: signal.confirmation_status,
            confirmed,
            basis: confirmed ? 'CONFIRMED' : 'INFERRED_UNCONFIRMED',
            clarificationRequired: signal.clarification_required,
            realignmentRecommended: signal.realignment_required,
            materiality: signal.materiality,
            domain: signal.domain,
            statement: String(signal.raw_value?.statement ?? ''),
            occurredAt: signal.occurred_at?.toISOString() ?? null,
            detectedAt: signal.detected_at.toISOString(),
            version: signal.version,
        };
    }
}
exports.LifeSignalView = LifeSignalView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], LifeSignalView.prototype, "signalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], LifeSignalView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.LifeSignalType }),
    __metadata("design:type", String)
], LifeSignalView.prototype, "signalType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.LifeSignalStatus }),
    __metadata("design:type", String)
], LifeSignalView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.SignalConfirmationStatus }),
    __metadata("design:type", String)
], LifeSignalView.prototype, "confirmationStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], LifeSignalView.prototype, "confirmed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['CONFIRMED', 'INFERRED_UNCONFIRMED'] }),
    __metadata("design:type", String)
], LifeSignalView.prototype, "basis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], LifeSignalView.prototype, "clarificationRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], LifeSignalView.prototype, "realignmentRecommended", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], LifeSignalView.prototype, "materiality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], LifeSignalView.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], LifeSignalView.prototype, "statement", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], LifeSignalView.prototype, "occurredAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], LifeSignalView.prototype, "detectedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], LifeSignalView.prototype, "version", void 0);
class CreateLifeSignalResponseView {
}
exports.CreateLifeSignalResponseView = CreateLifeSignalResponseView;
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], CreateLifeSignalResponseView.prototype, "signalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.SignalConfirmationStatus, nullable: true }),
    __metadata("design:type", String)
], CreateLifeSignalResponseView.prototype, "confirmationStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CreateLifeSignalResponseView.prototype, "realignmentRecommended", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CreateLifeSignalResponseView.prototype, "clarificationRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CreateLifeSignalResponseView.prototype, "acknowledgedOnly", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CreateLifeSignalResponseView.prototype, "duplicateOfExisting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CreateLifeSignalResponseView.prototype, "interpretationUnavailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: LifeSignalView, nullable: true }),
    __metadata("design:type", LifeSignalView)
], CreateLifeSignalResponseView.prototype, "signal", void 0);
//# sourceMappingURL=signal.dtos.js.map