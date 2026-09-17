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
exports.ZunoSafetyDecision = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
let ZunoSafetyDecision = class ZunoSafetyDecision extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoSafetyDecision = ZunoSafetyDecision;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoSafetyDecision.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoSafetyDecision.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48 }),
    __metadata("design:type", String)
], ZunoSafetyDecision.prototype, "operation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, name: 'risk_level' }),
    __metadata("design:type", String)
], ZunoSafetyDecision.prototype, "risk_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], ZunoSafetyDecision.prototype, "disposition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoSafetyDecision.prototype, "domains", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoSafetyDecision.prototype, "flags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoSafetyDecision.prototype, "actions", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'blocked_capabilities',
        default: () => "'[]'::jsonb",
    }),
    __metadata("design:type", Array)
], ZunoSafetyDecision.prototype, "blocked_capabilities", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'matched_rule_ids',
        default: () => "'[]'::jsonb",
    }),
    __metadata("design:type", Array)
], ZunoSafetyDecision.prototype, "matched_rule_ids", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'policy_version' }),
    __metadata("design:type", String)
], ZunoSafetyDecision.prototype, "policy_version", void 0);
exports.ZunoSafetyDecision = ZunoSafetyDecision = __decorate([
    (0, typeorm_1.Entity)('zuno_safety_decisions'),
    (0, typeorm_1.Index)('idx_zuno_safety_decisions_user', ['user_id', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_safety_decisions_challenge', ['challenge_id'])
], ZunoSafetyDecision);
//# sourceMappingURL=zuno-safety-decision.entity.js.map