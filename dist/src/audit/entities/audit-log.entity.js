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
exports.AuditLog = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let AuditLog = class AuditLog extends base_entity_1.BaseEntity {
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'user_id' }),
    __metadata("design:type", Number)
], AuditLog.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'entity_type' }),
    __metadata("design:type", String)
], AuditLog.prototype, "entity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'entity_id' }),
    __metadata("design:type", Number)
], AuditLog.prototype, "entity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'entity_unique_id' }),
    __metadata("design:type", String)
], AuditLog.prototype, "entity_unique_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'old_values' }),
    __metadata("design:type", String)
], AuditLog.prototype, "old_values", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'new_values' }),
    __metadata("design:type", String)
], AuditLog.prototype, "new_values", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' }),
    __metadata("design:type", String)
], AuditLog.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'user_agent' }),
    __metadata("design:type", String)
], AuditLog.prototype, "user_agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs'),
    (0, typeorm_1.Index)(['entity_type', 'entity_id', 'is_deleted']),
    (0, typeorm_1.Index)(['user_id', 'action', 'added_date'])
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map