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
exports.ZunoLifeSignal = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const enums_2 = require("../enums");
const zuno_life_signal_source_entity_1 = require("./zuno-life-signal-source.entity");
const zuno_life_signal_confirmation_entity_1 = require("./zuno-life-signal-confirmation.entity");
const zuno_life_signal_impact_entity_1 = require("./zuno-life-signal-impact.entity");
let ZunoLifeSignal = class ZunoLifeSignal extends zuno_base_entity_1.ZunoVersionedEntity {
};
exports.ZunoLifeSignal = ZunoLifeSignal;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'signal_type' }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "signal_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: enums_2.LifeSignalNature.EVENT }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "nature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'raw_value' }),
    __metadata("design:type", Object)
], ZunoLifeSignal.prototype, "raw_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'normalized_value', nullable: true }),
    __metadata("design:type", Object)
], ZunoLifeSignal.prototype, "normalized_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 3, default: 0 }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24 }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "reliability", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'confirmation_status' }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "confirmation_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "materiality", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "relevance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'urgency_change' }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "urgency_change", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24 }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_inference', default: false }),
    __metadata("design:type", Boolean)
], ZunoLifeSignal.prototype, "is_inference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'clarification_required', default: false }),
    __metadata("design:type", Boolean)
], ZunoLifeSignal.prototype, "clarification_required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'realignment_required', default: false }),
    __metadata("design:type", Boolean)
], ZunoLifeSignal.prototype, "realignment_required", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'reason_codes',
        default: () => "'[]'::jsonb",
    }),
    __metadata("design:type", Array)
], ZunoLifeSignal.prototype, "reason_codes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "fingerprint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'supersedes_signal_id', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "supersedes_signal_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'occurred_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoLifeSignal.prototype, "occurred_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'detected_at' }),
    __metadata("design:type", Date)
], ZunoLifeSignal.prototype, "detected_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'processed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoLifeSignal.prototype, "processed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'stale_after', nullable: true }),
    __metadata("design:type", Date)
], ZunoLifeSignal.prototype, "stale_after", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'detector_version' }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "detector_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'safety_decision_id', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignal.prototype, "safety_decision_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoLifeSignal.prototype, "challenge", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_life_signal_source_entity_1.ZunoLifeSignalSource, (row) => row.signal),
    __metadata("design:type", Array)
], ZunoLifeSignal.prototype, "sources", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_life_signal_confirmation_entity_1.ZunoLifeSignalConfirmation, (row) => row.signal),
    __metadata("design:type", Array)
], ZunoLifeSignal.prototype, "confirmations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_life_signal_impact_entity_1.ZunoLifeSignalImpact, (row) => row.signal),
    __metadata("design:type", Array)
], ZunoLifeSignal.prototype, "impacts", void 0);
exports.ZunoLifeSignal = ZunoLifeSignal = __decorate([
    (0, typeorm_1.Entity)('zuno_life_signals'),
    (0, typeorm_1.Index)('idx_zuno_life_signals_user_challenge_status', [
        'user_id',
        'challenge_id',
        'status',
    ]),
    (0, typeorm_1.Index)('idx_zuno_life_signals_user_detected', ['user_id', 'detected_at']),
    (0, typeorm_1.Index)('idx_zuno_life_signals_challenge', ['challenge_id']),
    (0, typeorm_1.Index)('idx_zuno_life_signals_confirmation', ['confirmation_status']),
    (0, typeorm_1.Index)('idx_zuno_life_signals_fingerprint', ['challenge_id', 'fingerprint'])
], ZunoLifeSignal);
//# sourceMappingURL=zuno-life-signal.entity.js.map