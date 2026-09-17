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
exports.ZunoPlan = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const plan_enum_1 = require("../enums/plan.enum");
const zuno_plan_item_entity_1 = require("./zuno-plan-item.entity");
let ZunoPlan = class ZunoPlan extends zuno_base_entity_1.ZunoVersionedEntity {
};
exports.ZunoPlan = ZunoPlan;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id' }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'mka_program_id', nullable: true }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "mka_program_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'plan_type' }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "plan_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, name: 'primary_goal', nullable: true }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "primary_goal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'start_date' }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'end_date', nullable: true }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: plan_enum_1.PlanStatus.DRAFT }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'review_trigger',
        default: plan_enum_1.PlanReviewTrigger.END_OF_HORIZON,
    }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "review_trigger", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'review_at', nullable: true }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "review_at", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        name: 'generated_from_realignment_id',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "generated_from_realignment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'superseded_by_id', nullable: true }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "superseded_by_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'context_version', default: 0 }),
    __metadata("design:type", Number)
], ZunoPlan.prototype, "context_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'safety_decision_id', nullable: true }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "safety_decision_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'engine_version' }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "engine_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, name: 'generated_reason' }),
    __metadata("design:type", String)
], ZunoPlan.prototype, "generated_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'capacity_snapshot',
        default: () => "'{}'::jsonb",
    }),
    __metadata("design:type", Object)
], ZunoPlan.prototype, "capacity_snapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'activated_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoPlan.prototype, "activated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoPlan.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoPlan.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoPlan.prototype, "challenge", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_plan_item_entity_1.ZunoPlanItem, (item) => item.plan),
    __metadata("design:type", Array)
], ZunoPlan.prototype, "items", void 0);
exports.ZunoPlan = ZunoPlan = __decorate([
    (0, typeorm_1.Entity)('zuno_plans'),
    (0, typeorm_1.Index)('idx_zuno_plans_user_status', ['user_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_plans_challenge', ['challenge_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_plans_type', ['challenge_id', 'plan_type', 'status']),
    (0, typeorm_1.Index)('idx_zuno_plans_window', ['user_id', 'start_date']),
    (0, typeorm_1.Index)('idx_zuno_plans_review', ['status', 'review_at'])
], ZunoPlan);
//# sourceMappingURL=zuno-plan.entity.js.map