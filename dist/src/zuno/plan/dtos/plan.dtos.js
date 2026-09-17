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
exports.PlanView = exports.PlanItemView = exports.AddPlanItemDto = exports.BlockPlanItemDto = exports.SkipPlanItemDto = exports.DeferPlanItemDto = exports.CompletePlanItemDto = exports.ListPlansQueryDto = exports.ActivatePlanDto = exports.PatchPlanDto = exports.GeneratePlanDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const plan_enum_1 = require("../enums/plan.enum");
class GeneratePlanDto {
}
exports.GeneratePlanDto = GeneratePlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The WhatNow this plan is for.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GeneratePlanDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: plan_enum_1.PlanType, default: plan_enum_1.PlanType.TODAY }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(plan_enum_1.PlanType),
    __metadata("design:type", String)
], GeneratePlanDto.prototype, "planType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Force a new plan version even when an equivalent one is active.',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], GeneratePlanDto.prototype, "regenerate", void 0);
class PatchPlanDto {
}
exports.PatchPlanDto = PatchPlanDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], PatchPlanDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 300),
    __metadata("design:type", String)
], PatchPlanDto.prototype, "primaryGoal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: [plan_enum_1.PlanStatus.ACTIVE, plan_enum_1.PlanStatus.PAUSED, plan_enum_1.PlanStatus.COMPLETED, plan_enum_1.PlanStatus.CANCELLED],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(plan_enum_1.PlanStatus),
    __metadata("design:type", String)
], PatchPlanDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PatchPlanDto.prototype, "version", void 0);
class ActivatePlanDto {
}
exports.ActivatePlanDto = ActivatePlanDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ActivatePlanDto.prototype, "version", void 0);
class ListPlansQueryDto {
}
exports.ListPlansQueryDto = ListPlansQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListPlansQueryDto.prototype, "challengeId", void 0);
class CompletePlanItemDto {
}
exports.CompletePlanItemDto = CompletePlanItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-09-17T10:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CompletePlanItemDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Spoke to the bank relationship manager.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CompletePlanItemDto.prototype, "note", void 0);
class DeferPlanItemDto {
}
exports.DeferPlanItemDto = DeferPlanItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The date to move it to.',
        example: '2026-09-19',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], DeferPlanItemDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], DeferPlanItemDto.prototype, "reason", void 0);
class SkipPlanItemDto {
}
exports.SkipPlanItemDto = SkipPlanItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], SkipPlanItemDto.prototype, "reason", void 0);
class BlockPlanItemDto {
}
exports.BlockPlanItemDto = BlockPlanItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "What is blocking this, in the user's words." }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 500),
    __metadata("design:type", String)
], BlockPlanItemDto.prototype, "reason", void 0);
class AddPlanItemDto {
}
exports.AddPlanItemDto = AddPlanItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 300),
    __metadata("design:type", String)
], AddPlanItemDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], AddPlanItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: plan_enum_1.PlanItemCategory }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(plan_enum_1.PlanItemCategory),
    __metadata("design:type", String)
], AddPlanItemDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: plan_enum_1.PlanItemPriority }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(plan_enum_1.PlanItemPriority),
    __metadata("design:type", String)
], AddPlanItemDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maximum: 1440 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1440),
    __metadata("design:type", Number)
], AddPlanItemDto.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], AddPlanItemDto.prototype, "scheduledDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AddPlanItemDto.prototype, "isCommitment", void 0);
class PlanItemView {
    static from(item) {
        return {
            id: item.id,
            title: item.title,
            description: item.description,
            whyThisMatters: item.why_this_matters,
            category: item.category,
            priority: item.priority_rank,
            priorityLabel: item.priority,
            status: item.status,
            isPractice: item.is_practice,
            karmaEligible: item.karma_eligible,
            scheduledDate: item.scheduled_date,
            dueAt: item.due_at ? new Date(item.due_at).toISOString() : null,
            estimatedMinutes: item.estimated_minutes,
            deferredTo: item.deferred_to,
        };
    }
}
exports.PlanItemView = PlanItemView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanItemView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanItemView.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], PlanItemView.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], PlanItemView.prototype, "whyThisMatters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: plan_enum_1.PlanItemCategory }),
    __metadata("design:type", String)
], PlanItemView.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '1 = essential, 2 = important, 3 = optional.' }),
    __metadata("design:type", Number)
], PlanItemView.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: plan_enum_1.PlanItemPriority }),
    __metadata("design:type", String)
], PlanItemView.prototype, "priorityLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: plan_enum_1.PlanItemStatus }),
    __metadata("design:type", String)
], PlanItemView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PlanItemView.prototype, "isPractice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PlanItemView.prototype, "karmaEligible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], PlanItemView.prototype, "scheduledDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], PlanItemView.prototype, "dueAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Number)
], PlanItemView.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], PlanItemView.prototype, "deferredTo", void 0);
class PlanView {
    static from(plan, items) {
        return {
            id: plan.id,
            challengeId: plan.challenge_id,
            type: plan.plan_type,
            title: plan.title,
            primaryGoal: plan.primary_goal,
            status: plan.status,
            startDate: plan.start_date,
            endDate: plan.end_date,
            reviewAt: plan.review_at,
            version: plan.version,
            items: items.map(PlanItemView.from),
        };
    }
    static summary(plan) {
        return PlanView.from(plan, []);
    }
}
exports.PlanView = PlanView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: plan_enum_1.PlanType }),
    __metadata("design:type", String)
], PlanView.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanView.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], PlanView.prototype, "primaryGoal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: plan_enum_1.PlanStatus }),
    __metadata("design:type", String)
], PlanView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanView.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], PlanView.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], PlanView.prototype, "reviewAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PlanView.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PlanItemView] }),
    __metadata("design:type", Array)
], PlanView.prototype, "items", void 0);
//# sourceMappingURL=plan.dtos.js.map