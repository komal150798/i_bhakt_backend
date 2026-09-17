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
exports.ZunoMemoryCandidate = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const memory_enum_1 = require("../enums/memory.enum");
let ZunoMemoryCandidate = class ZunoMemoryCandidate extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoMemoryCandidate = ZunoMemoryCandidate;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'scope', default: memory_enum_1.MemoryScope.GLOBAL }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, name: 'memory_type' }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "memory_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, name: 'memory_key' }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "memory_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'proposed_value', nullable: true }),
    __metadata("design:type", Object)
], ZunoMemoryCandidate.prototype, "proposed_value", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'factuality',
        default: memory_enum_1.MemoryFactuality.FACT,
    }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "factuality", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'source' }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, name: 'source_event_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "source_event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'evidence_type' }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "evidence_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 3, name: 'confidence' }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'suggested_retention' }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "suggested_retention", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 16,
        name: 'sensitivity_class',
        default: memory_enum_1.MemorySensitivity.STANDARD,
    }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "sensitivity_class", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'status',
        default: memory_enum_1.MemoryCandidateStatus.PENDING,
    }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'confirmation_required', default: false }),
    __metadata("design:type", Boolean)
], ZunoMemoryCandidate.prototype, "confirmation_required", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 48,
        name: 'confirmation_reason',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "confirmation_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 48,
        name: 'rejection_reason',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "rejection_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'resulting_memory_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMemoryCandidate.prototype, "resulting_memory_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'decided_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoMemoryCandidate.prototype, "decided_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoMemoryCandidate.prototype, "user", void 0);
exports.ZunoMemoryCandidate = ZunoMemoryCandidate = __decorate([
    (0, typeorm_1.Entity)('zuno_memory_candidates'),
    (0, typeorm_1.Index)('idx_zuno_memory_candidates_user_status', ['user_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_memory_candidates_challenge', ['challenge_id']),
    (0, typeorm_1.Index)('idx_zuno_memory_candidates_event', ['user_id', 'source_event_id'])
], ZunoMemoryCandidate);
//# sourceMappingURL=zuno-memory-candidate.entity.js.map