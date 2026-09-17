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
exports.FutureSelfView = exports.ListFutureSelfQueryDto = exports.GenerateFutureSelfDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const future_self_enum_1 = require("../enums/future-self.enum");
class GenerateFutureSelfDto {
}
exports.GenerateFutureSelfDto = GenerateFutureSelfDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The challenge to reflect on. Omit for a whole-life reflection.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateFutureSelfDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: future_self_enum_1.FutureSelfMode, example: future_self_enum_1.FutureSelfMode.WEEKLY }),
    (0, class_validator_1.IsEnum)(future_self_enum_1.FutureSelfMode),
    __metadata("design:type", String)
], GenerateFutureSelfDto.prototype, "mode", void 0);
class ListFutureSelfQueryDto {
}
exports.ListFutureSelfQueryDto = ListFutureSelfQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListFutureSelfQueryDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: future_self_enum_1.FutureSelfMode }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(future_self_enum_1.FutureSelfMode),
    __metadata("design:type", String)
], ListFutureSelfQueryDto.prototype, "mode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20, maximum: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], ListFutureSelfQueryDto.prototype, "limit", void 0);
class FutureSelfView {
    static from(narrative, sourceCount) {
        return {
            id: narrative.id,
            mode: narrative.mode,
            message: narrative.summary,
            progressThemes: narrative.progress_themes ?? [],
            openLoops: narrative.open_loops ?? [],
            strengthsObserved: narrative.strengths_observed ?? [],
            nextFocus: narrative.next_focus ?? [],
            challengeId: narrative.challenge_id,
            periodStart: narrative.period_start,
            periodEnd: narrative.period_end,
            sourceCount,
            createdAt: narrative.created_at
                ? narrative.created_at.toISOString()
                : new Date().toISOString(),
        };
    }
}
exports.FutureSelfView = FutureSelfView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FutureSelfView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: future_self_enum_1.FutureSelfMode }),
    __metadata("design:type", String)
], FutureSelfView.prototype, "mode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'What the Future Self says.' }),
    __metadata("design:type", String)
], FutureSelfView.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], FutureSelfView.prototype, "progressThemes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], FutureSelfView.prototype, "openLoops", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], FutureSelfView.prototype, "strengthsObserved", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], FutureSelfView.prototype, "nextFocus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], FutureSelfView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], FutureSelfView.prototype, "periodStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], FutureSelfView.prototype, "periodEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'How many stored facts this rests on.' }),
    __metadata("design:type", Number)
], FutureSelfView.prototype, "sourceCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FutureSelfView.prototype, "createdAt", void 0);
//# sourceMappingURL=future-self.dtos.js.map