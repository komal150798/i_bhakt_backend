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
exports.ZunoMkaProgram = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const mka_enum_1 = require("../enums/mka.enum");
const zuno_mka_item_entity_1 = require("./zuno-mka-item.entity");
let ZunoMkaProgram = class ZunoMkaProgram extends zuno_base_entity_1.ZunoVersionedEntity {
};
exports.ZunoMkaProgram = ZunoMkaProgram;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id' }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'plan_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "plan_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'period_type' }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "period_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'start_date' }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'end_date' }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: mka_enum_1.MkaProgramStatus.DRAFT }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 40,
        name: 'remedy_status',
        default: mka_enum_1.MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
    }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "remedy_status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'review_trigger',
        default: mka_enum_1.MkaReviewTrigger.END_OF_PERIOD,
    }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "review_trigger", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'review_at', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "review_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'context_version', default: 0 }),
    __metadata("design:type", Number)
], ZunoMkaProgram.prototype, "context_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'source_response_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "source_response_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'safety_decision_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "safety_decision_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'engine_version' }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "engine_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, name: 'generated_reason' }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "generated_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'superseded_by_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaProgram.prototype, "superseded_by_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'activated_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoMkaProgram.prototype, "activated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoMkaProgram.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoMkaProgram.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoMkaProgram.prototype, "challenge", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_mka_item_entity_1.ZunoMkaItem, (item) => item.program),
    __metadata("design:type", Array)
], ZunoMkaProgram.prototype, "items", void 0);
exports.ZunoMkaProgram = ZunoMkaProgram = __decorate([
    (0, typeorm_1.Entity)('zuno_mka_programs'),
    (0, typeorm_1.Index)('idx_zuno_mka_programs_user', ['user_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_mka_programs_challenge', ['challenge_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_mka_programs_period', ['user_id', 'start_date', 'end_date']),
    (0, typeorm_1.Index)('idx_zuno_mka_programs_review', ['status', 'review_at'])
], ZunoMkaProgram);
//# sourceMappingURL=zuno-mka-program.entity.js.map