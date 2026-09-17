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
exports.ZunoRulebookRule = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
const zuno_rulebook_version_entity_1 = require("./zuno-rulebook-version.entity");
let ZunoRulebookRule = class ZunoRulebookRule extends zuno_base_entity_1.ZunoBaseEntity {
    isProductionEligible() {
        if (this.status !== enums_1.RuleStatus.APPROVED)
            return false;
        if (this.sme_confidence === enums_1.SmeConfidence.EXPERIMENTAL)
            return false;
        if (this.safety_class === enums_1.RuleSafetyClass.EXCLUDE_PENDING_SPECIAL_REVIEW ||
            this.safety_class === enums_1.RuleSafetyClass.SME_SUPERVISION) {
            return false;
        }
        return true;
    }
};
exports.ZunoRulebookRule = ZunoRulebookRule;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'external_rule_key' }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "external_rule_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, name: 'rule_name' }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "rule_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "subcategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'conditions', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookRule.prototype, "conditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48 }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "strength", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        name: 'interpretation_key',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "interpretation_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'timing_rule_keys', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookRule.prototype, "timing_rule_keys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'remedy_keys', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookRule.prototype, "remedy_keys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'conflict_rule_keys', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookRule.prototype, "conflict_rule_keys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: enums_1.RuleStatus.DRAFT }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'safety_class' }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "safety_class", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'sensitive_subjects', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookRule.prototype, "sensitive_subjects", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 24,
        name: 'sme_confidence',
        default: enums_1.SmeConfidence.CONTEXT_DEPENDENT,
    }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "sme_confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'sme_comment', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "sme_comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'effective_from', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "effective_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'effective_until', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "effective_until", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'rule_version', default: '1.0' }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "rule_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'change_reason', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRule.prototype, "change_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'source_row', nullable: true }),
    __metadata("design:type", Number)
], ZunoRulebookRule.prototype, "source_row", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_rulebook_version_entity_1.ZunoRulebookVersion, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'rulebook_version_id' }),
    __metadata("design:type", zuno_rulebook_version_entity_1.ZunoRulebookVersion)
], ZunoRulebookRule.prototype, "rulebook_version", void 0);
exports.ZunoRulebookRule = ZunoRulebookRule = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_rules'),
    (0, typeorm_1.Index)('idx_zuno_rules_version_key', ['rulebook_version_id', 'external_rule_key'], {
        unique: true,
    }),
    (0, typeorm_1.Index)('idx_zuno_rules_domain', ['rulebook_version_id', 'domain', 'status']),
    (0, typeorm_1.Index)('idx_zuno_rules_theme', ['rulebook_version_id', 'theme'])
], ZunoRulebookRule);
//# sourceMappingURL=zuno-rulebook-rule.entity.js.map