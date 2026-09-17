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
exports.ZunoMemory = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const memory_enum_1 = require("../enums/memory.enum");
let ZunoMemory = class ZunoMemory extends zuno_base_entity_1.ZunoVersionedEntity {
};
exports.ZunoMemory = ZunoMemory;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'scope', default: memory_enum_1.MemoryScope.GLOBAL }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, name: 'memory_type' }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "memory_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, name: 'memory_key' }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "memory_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'memory_value' }),
    __metadata("design:type", Object)
], ZunoMemory.prototype, "memory_value", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'factuality',
        default: memory_enum_1.MemoryFactuality.FACT,
    }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "factuality", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'source' }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, name: 'source_event_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "source_event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'evidence_type' }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "evidence_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 3, name: 'confidence' }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'retention_class' }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "retention_class", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 16,
        name: 'sensitivity_class',
        default: memory_enum_1.MemorySensitivity.STANDARD,
    }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "sensitivity_class", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'status', default: memory_enum_1.MemoryStatus.ACTIVE }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'last_confirmed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoMemory.prototype, "last_confirmed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'confirmation_count', default: 1 }),
    __metadata("design:type", Number)
], ZunoMemory.prototype, "confirmation_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'expires_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoMemory.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'supersedes_memory_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "supersedes_memory_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'superseded_by_memory_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "superseded_by_memory_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'superseded_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoMemory.prototype, "superseded_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'redacted_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoMemory.prototype, "redacted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, name: 'deletion_reason', nullable: true }),
    __metadata("design:type", String)
], ZunoMemory.prototype, "deletion_reason", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoMemory.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoMemory.prototype, "challenge", void 0);
exports.ZunoMemory = ZunoMemory = __decorate([
    (0, typeorm_1.Entity)('zuno_memories'),
    (0, typeorm_1.Index)('idx_zuno_memories_user_type_status', ['user_id', 'memory_type', 'status']),
    (0, typeorm_1.Index)('idx_zuno_memories_challenge_status', ['challenge_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_memories_expiry', ['status', 'expires_at'])
], ZunoMemory);
//# sourceMappingURL=zuno-memory.entity.js.map