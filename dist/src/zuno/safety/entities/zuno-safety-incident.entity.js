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
exports.ZunoSafetyIncident = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
let ZunoSafetyIncident = class ZunoSafetyIncident extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoSafetyIncident = ZunoSafetyIncident;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], ZunoSafetyIncident.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'safety_decision_id', nullable: true }),
    __metadata("design:type", String)
], ZunoSafetyIncident.prototype, "safety_decision_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'related_response_id', nullable: true }),
    __metadata("design:type", String)
], ZunoSafetyIncident.prototype, "related_response_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48 }),
    __metadata("design:type", String)
], ZunoSafetyIncident.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], ZunoSafetyIncident.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24 }),
    __metadata("design:type", String)
], ZunoSafetyIncident.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoSafetyIncident.prototype, "violations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: 'OPEN' }),
    __metadata("design:type", String)
], ZunoSafetyIncident.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'policy_version' }),
    __metadata("design:type", String)
], ZunoSafetyIncident.prototype, "policy_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'resolved_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoSafetyIncident.prototype, "resolved_at", void 0);
exports.ZunoSafetyIncident = ZunoSafetyIncident = __decorate([
    (0, typeorm_1.Entity)('zuno_safety_incidents'),
    (0, typeorm_1.Index)('idx_zuno_safety_incidents_status', ['status', 'created_at'])
], ZunoSafetyIncident);
//# sourceMappingURL=zuno-safety-incident.entity.js.map