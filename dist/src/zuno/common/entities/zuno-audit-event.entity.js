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
exports.ZunoAuditEvent = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
let ZunoAuditEvent = class ZunoAuditEvent extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoAuditEvent = ZunoAuditEvent;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'actor_type' }),
    __metadata("design:type", String)
], ZunoAuditEvent.prototype, "actor_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'actor_id', nullable: true }),
    __metadata("design:type", String)
], ZunoAuditEvent.prototype, "actor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], ZunoAuditEvent.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ZunoAuditEvent.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'entity_type' }),
    __metadata("design:type", String)
], ZunoAuditEvent.prototype, "entity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'entity_id', nullable: true }),
    __metadata("design:type", String)
], ZunoAuditEvent.prototype, "entity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'before_hash', nullable: true }),
    __metadata("design:type", String)
], ZunoAuditEvent.prototype, "before_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'after_hash', nullable: true }),
    __metadata("design:type", String)
], ZunoAuditEvent.prototype, "after_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ZunoAuditEvent.prototype, "metadata", void 0);
exports.ZunoAuditEvent = ZunoAuditEvent = __decorate([
    (0, typeorm_1.Entity)('zuno_audit_events'),
    (0, typeorm_1.Index)('idx_zuno_audit_entity', ['entity_type', 'entity_id']),
    (0, typeorm_1.Index)('idx_zuno_audit_user', ['user_id', 'created_at'])
], ZunoAuditEvent);
//# sourceMappingURL=zuno-audit-event.entity.js.map