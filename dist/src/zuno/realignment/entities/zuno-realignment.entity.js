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
exports.ZunoRealignment = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const enums_1 = require("../enums");
const zuno_realignment_change_entity_1 = require("./zuno-realignment-change.entity");
const zuno_realignment_assumption_entity_1 = require("./zuno-realignment-assumption.entity");
let ZunoRealignment = class ZunoRealignment extends zuno_base_entity_1.ZunoVersionedEntity {
};
exports.ZunoRealignment = ZunoRealignment;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id' }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'trigger_type' }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "trigger_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'trigger_signal_id', nullable: true }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "trigger_signal_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24 }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'reason_codes', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRealignment.prototype, "reason_codes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'previous_state_ref', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], ZunoRealignment.prototype, "previous_state_ref", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'new_state_ref', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], ZunoRealignment.prototype, "new_state_ref", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'previous_context_version', nullable: true }),
    __metadata("design:type", Number)
], ZunoRealignment.prototype, "previous_context_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'current_context_version', nullable: true }),
    __metadata("design:type", Number)
], ZunoRealignment.prototype, "current_context_version", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 16,
        name: 'plan_change_mode',
        default: enums_1.PlanChangeMode.NONE,
    }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "plan_change_mode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        name: 'scenario_reassessment_required',
        default: false,
    }),
    __metadata("design:type", Boolean)
], ZunoRealignment.prototype, "scenario_reassessment_required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'mka_refresh_required', default: false }),
    __metadata("design:type", Boolean)
], ZunoRealignment.prototype, "mka_refresh_required", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        name: 'user_confirmation_required',
        default: false,
    }),
    __metadata("design:type", Boolean)
], ZunoRealignment.prototype, "user_confirmation_required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'safety_review_required', default: false }),
    __metadata("design:type", Boolean)
], ZunoRealignment.prototype, "safety_review_required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'trigger_fingerprint' }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "trigger_fingerprint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'superseded_by_id', nullable: true }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "superseded_by_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id', nullable: true }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'engine_version' }),
    __metadata("design:type", String)
], ZunoRealignment.prototype, "engine_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'applied_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoRealignment.prototype, "applied_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoRealignment.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoRealignment.prototype, "challenge", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_realignment_change_entity_1.ZunoRealignmentChange, (change) => change.realignment),
    __metadata("design:type", Array)
], ZunoRealignment.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_realignment_assumption_entity_1.ZunoRealignmentAssumption, (row) => row.realignment),
    __metadata("design:type", Array)
], ZunoRealignment.prototype, "assumptions", void 0);
exports.ZunoRealignment = ZunoRealignment = __decorate([
    (0, typeorm_1.Entity)('zuno_realignments'),
    (0, typeorm_1.Index)('idx_zuno_realignments_user_challenge', ['user_id', 'challenge_id']),
    (0, typeorm_1.Index)('idx_zuno_realignments_status', ['status']),
    (0, typeorm_1.Index)('idx_zuno_realignments_trigger_signal', ['trigger_signal_id']),
    (0, typeorm_1.Index)('idx_zuno_realignments_fingerprint', ['challenge_id', 'trigger_fingerprint'])
], ZunoRealignment);
//# sourceMappingURL=zuno-realignment.entity.js.map