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
exports.ZunoFutureSelfNarrative = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const future_self_enum_1 = require("../enums/future-self.enum");
const zuno_future_self_source_entity_1 = require("./zuno-future-self-source.entity");
let ZunoFutureSelfNarrative = class ZunoFutureSelfNarrative extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoFutureSelfNarrative = ZunoFutureSelfNarrative;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, name: 'mode' }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'period_start', nullable: true }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "period_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'period_end', nullable: true }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "period_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'summary' }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'progress_themes', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoFutureSelfNarrative.prototype, "progress_themes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'open_loops', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoFutureSelfNarrative.prototype, "open_loops", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'strengths_observed',
        default: () => "'[]'::jsonb",
    }),
    __metadata("design:type", Array)
], ZunoFutureSelfNarrative.prototype, "strengths_observed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'next_focus', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoFutureSelfNarrative.prototype, "next_focus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        name: 'generation_model_version',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "generation_model_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'engine_version' }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "engine_version", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        name: 'prompt_template_version',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "prompt_template_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'ai_generation_run_id', nullable: true }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "ai_generation_run_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'safety_decision_id', nullable: true }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "safety_decision_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'boundary_version' }),
    __metadata("design:type", String)
], ZunoFutureSelfNarrative.prototype, "boundary_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'version', default: 1 }),
    __metadata("design:type", Number)
], ZunoFutureSelfNarrative.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'redacted_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoFutureSelfNarrative.prototype, "redacted_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoFutureSelfNarrative.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoFutureSelfNarrative.prototype, "challenge", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_future_self_source_entity_1.ZunoFutureSelfSource, (source) => source.narrative),
    __metadata("design:type", Array)
], ZunoFutureSelfNarrative.prototype, "sources", void 0);
exports.ZunoFutureSelfNarrative = ZunoFutureSelfNarrative = __decorate([
    (0, typeorm_1.Entity)('zuno_future_self_narratives'),
    (0, typeorm_1.Index)('idx_zuno_fs_narratives_user_created', ['user_id', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_fs_narratives_challenge_mode', ['challenge_id', 'mode'])
], ZunoFutureSelfNarrative);
//# sourceMappingURL=zuno-future-self-narrative.entity.js.map