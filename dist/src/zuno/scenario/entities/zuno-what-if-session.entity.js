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
exports.ZunoWhatIfSession = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_what_if_assumption_entity_1 = require("./zuno-what-if-assumption.entity");
const scenario_enum_1 = require("../enums/scenario.enum");
let ZunoWhatIfSession = class ZunoWhatIfSession extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoWhatIfSession = ZunoWhatIfSession;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoWhatIfSession.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id' }),
    __metadata("design:type", String)
], ZunoWhatIfSession.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoWhatIfSession.prototype, "prompt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 24,
        default: scenario_enum_1.WhatIfSessionStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], ZunoWhatIfSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_hypothetical', default: true }),
    __metadata("design:type", Boolean)
], ZunoWhatIfSession.prototype, "is_hypothetical", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ZunoWhatIfSession.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'current_plan_changed', default: false }),
    __metadata("design:type", Boolean)
], ZunoWhatIfSession.prototype, "current_plan_changed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'challenge_context_version', nullable: true }),
    __metadata("design:type", Number)
], ZunoWhatIfSession.prototype, "challenge_context_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'engine_version' }),
    __metadata("design:type", String)
], ZunoWhatIfSession.prototype, "engine_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'safety_decision_id', nullable: true }),
    __metadata("design:type", String)
], ZunoWhatIfSession.prototype, "safety_decision_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'ai_generation_run_id', nullable: true }),
    __metadata("design:type", String)
], ZunoWhatIfSession.prototype, "ai_generation_run_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'expires_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoWhatIfSession.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoWhatIfSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoWhatIfSession.prototype, "challenge", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_what_if_assumption_entity_1.ZunoWhatIfAssumption, (assumption) => assumption.session),
    __metadata("design:type", Array)
], ZunoWhatIfSession.prototype, "assumptions", void 0);
exports.ZunoWhatIfSession = ZunoWhatIfSession = __decorate([
    (0, typeorm_1.Entity)('zuno_what_if_sessions'),
    (0, typeorm_1.Index)('idx_zuno_what_if_sessions_challenge', ['challenge_id', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_what_if_sessions_user_status', ['user_id', 'status'])
], ZunoWhatIfSession);
//# sourceMappingURL=zuno-what-if-session.entity.js.map