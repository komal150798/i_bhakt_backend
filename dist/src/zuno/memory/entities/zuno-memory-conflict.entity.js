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
exports.ZunoMemoryConflict = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const memory_enum_1 = require("../enums/memory.enum");
let ZunoMemoryConflict = class ZunoMemoryConflict extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoMemoryConflict = ZunoMemoryConflict;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoMemoryConflict.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'memory_a_id' }),
    __metadata("design:type", String)
], ZunoMemoryConflict.prototype, "memory_a_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'memory_b_id' }),
    __metadata("design:type", String)
], ZunoMemoryConflict.prototype, "memory_b_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'resolution_status',
        default: memory_enum_1.MemoryConflictResolution.UNRESOLVED,
    }),
    __metadata("design:type", String)
], ZunoMemoryConflict.prototype, "resolution_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'resolved_memory_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMemoryConflict.prototype, "resolved_memory_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'authority_a', nullable: true }),
    __metadata("design:type", Number)
], ZunoMemoryConflict.prototype, "authority_a", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'authority_b', nullable: true }),
    __metadata("design:type", Number)
], ZunoMemoryConflict.prototype, "authority_b", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'resolved_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoMemoryConflict.prototype, "resolved_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoMemoryConflict.prototype, "user", void 0);
exports.ZunoMemoryConflict = ZunoMemoryConflict = __decorate([
    (0, typeorm_1.Entity)('zuno_memory_conflicts'),
    (0, typeorm_1.Index)('idx_zuno_memory_conflicts_user_status', ['user_id', 'resolution_status']),
    (0, typeorm_1.Index)('idx_zuno_memory_conflicts_memory_a', ['memory_a_id']),
    (0, typeorm_1.Index)('idx_zuno_memory_conflicts_memory_b', ['memory_b_id'])
], ZunoMemoryConflict);
//# sourceMappingURL=zuno-memory-conflict.entity.js.map