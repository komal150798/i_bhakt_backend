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
exports.ZunoMemoryEvidence = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const memory_enum_1 = require("../enums/memory.enum");
let ZunoMemoryEvidence = class ZunoMemoryEvidence extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoMemoryEvidence = ZunoMemoryEvidence;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'memory_id' }),
    __metadata("design:type", String)
], ZunoMemoryEvidence.prototype, "memory_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'source_entity_type' }),
    __metadata("design:type", String)
], ZunoMemoryEvidence.prototype, "source_entity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'source_entity_id' }),
    __metadata("design:type", String)
], ZunoMemoryEvidence.prototype, "source_entity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, name: 'evidence_role' }),
    __metadata("design:type", String)
], ZunoMemoryEvidence.prototype, "evidence_role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'observed_at' }),
    __metadata("design:type", Date)
], ZunoMemoryEvidence.prototype, "observed_at", void 0);
exports.ZunoMemoryEvidence = ZunoMemoryEvidence = __decorate([
    (0, typeorm_1.Entity)('zuno_memory_evidence'),
    (0, typeorm_1.Index)('idx_zuno_memory_evidence_memory', ['memory_id']),
    (0, typeorm_1.Index)('idx_zuno_memory_evidence_source', ['source_entity_type', 'source_entity_id'])
], ZunoMemoryEvidence);
//# sourceMappingURL=zuno-memory-evidence.entity.js.map