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
exports.RealignmentView = exports.RealignmentChangeView = exports.ListRealignmentsQueryDto = exports.ApplyRealignmentDto = exports.EvaluateRealignmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const enums_1 = require("../enums");
class EvaluateRealignmentDto {
}
exports.EvaluateRealignmentDto = EvaluateRealignmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The WhatNow being reassessed.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EvaluateRealignmentDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The confirmed Life Signal that prompted this, if there is one.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EvaluateRealignmentDto.prototype, "triggerSignalId", void 0);
class ApplyRealignmentDto {
}
exports.ApplyRealignmentDto = ApplyRealignmentDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The user has agreed to this change.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApplyRealignmentDto.prototype, "confirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Version the client last saw.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ApplyRealignmentDto.prototype, "version", void 0);
class ListRealignmentsQueryDto {
}
exports.ListRealignmentsQueryDto = ListRealignmentsQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListRealignmentsQueryDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListRealignmentsQueryDto.prototype, "limit", void 0);
class RealignmentChangeView {
    static from(change) {
        return {
            type: change.change_type,
            reason: change.reason,
            entityType: change.entity_type,
            entityId: change.entity_id,
        };
    }
}
exports.RealignmentChangeView = RealignmentChangeView;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.RealignmentChangeType }),
    __metadata("design:type", String)
], RealignmentChangeView.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RealignmentChangeView.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RealignmentChangeView.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RealignmentChangeView.prototype, "entityId", void 0);
class RealignmentView {
    static from(realignment, changes = []) {
        return {
            realignmentId: realignment.id,
            challengeId: realignment.challenge_id,
            level: realignment.level,
            status: realignment.status,
            summary: realignment.reason,
            changes: changes.map(RealignmentChangeView.from),
            newPlanId: realignment.new_state_ref?.plan_id ?? null,
            planChangeMode: realignment.plan_change_mode,
            scenarioReassessmentRequired: realignment.scenario_reassessment_required,
            mkaRefreshRequired: realignment.mka_refresh_required,
            userConfirmationRequired: realignment.user_confirmation_required,
            triggerSignalId: realignment.trigger_signal_id,
            createdAt: realignment.created_at.toISOString(),
            appliedAt: realignment.applied_at?.toISOString() ?? null,
            version: realignment.version,
        };
    }
}
exports.RealignmentView = RealignmentView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RealignmentView.prototype, "realignmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RealignmentView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.RealignmentLevel }),
    __metadata("design:type", String)
], RealignmentView.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.RealignmentStatus }),
    __metadata("design:type", String)
], RealignmentView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RealignmentView.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [RealignmentChangeView] }),
    __metadata("design:type", Array)
], RealignmentView.prototype, "changes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RealignmentView.prototype, "newPlanId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.PlanChangeMode }),
    __metadata("design:type", String)
], RealignmentView.prototype, "planChangeMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], RealignmentView.prototype, "scenarioReassessmentRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], RealignmentView.prototype, "mkaRefreshRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], RealignmentView.prototype, "userConfirmationRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RealignmentView.prototype, "triggerSignalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RealignmentView.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], RealignmentView.prototype, "appliedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], RealignmentView.prototype, "version", void 0);
//# sourceMappingURL=realignment.dtos.js.map