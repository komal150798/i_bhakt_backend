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
exports.ZunoRulebookAuditLog = exports.ZunoRulebookReviewItem = exports.ZunoRulebookValidationRun = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
let ZunoRulebookValidationRun = class ZunoRulebookValidationRun extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoRulebookValidationRun = ZunoRulebookValidationRun;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookValidationRun.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'validator_version' }),
    __metadata("design:type", String)
], ZunoRulebookValidationRun.prototype, "validator_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24 }),
    __metadata("design:type", String)
], ZunoRulebookValidationRun.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_rules', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookValidationRun.prototype, "total_rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'valid_rules', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookValidationRun.prototype, "valid_rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'invalid_rules', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookValidationRun.prototype, "invalid_rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'error_count', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookValidationRun.prototype, "error_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'warning_count', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookValidationRun.prototype, "warning_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookValidationRun.prototype, "findings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'started_at' }),
    __metadata("design:type", Date)
], ZunoRulebookValidationRun.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoRulebookValidationRun.prototype, "completed_at", void 0);
exports.ZunoRulebookValidationRun = ZunoRulebookValidationRun = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_validation_runs'),
    (0, typeorm_1.Index)('idx_zuno_validation_version', ['rulebook_version_id', 'created_at'])
], ZunoRulebookValidationRun);
let ZunoRulebookReviewItem = class ZunoRulebookReviewItem extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoRulebookReviewItem = ZunoRulebookReviewItem;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookReviewItem.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rule_id' }),
    __metadata("design:type", String)
], ZunoRulebookReviewItem.prototype, "rule_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'external_rule_key' }),
    __metadata("design:type", String)
], ZunoRulebookReviewItem.prototype, "external_rule_key", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'review_status',
        default: enums_1.RuleReviewStatus.PENDING,
    }),
    __metadata("design:type", String)
], ZunoRulebookReviewItem.prototype, "review_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reviewer_id', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookReviewItem.prototype, "reviewer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'review_comment', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookReviewItem.prototype, "review_comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'reviewed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoRulebookReviewItem.prototype, "reviewed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'secondary_reviewer_id', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookReviewItem.prototype, "secondary_reviewer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'secondary_reviewed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoRulebookReviewItem.prototype, "secondary_reviewed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'requires_two_person_review', default: false }),
    __metadata("design:type", Boolean)
], ZunoRulebookReviewItem.prototype, "requires_two_person_review", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'duplicate_of_key', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookReviewItem.prototype, "duplicate_of_key", void 0);
exports.ZunoRulebookReviewItem = ZunoRulebookReviewItem = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_review_items'),
    (0, typeorm_1.Index)('idx_zuno_review_version', ['rulebook_version_id', 'review_status']),
    (0, typeorm_1.Index)('idx_zuno_review_rule', ['rule_id'], { unique: true })
], ZunoRulebookReviewItem);
let ZunoRulebookAuditLog = class ZunoRulebookAuditLog extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoRulebookAuditLog = ZunoRulebookAuditLog;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookAuditLog.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48 }),
    __metadata("design:type", String)
], ZunoRulebookAuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'actor_id', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookAuditLog.prototype, "actor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'actor_role', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookAuditLog.prototype, "actor_role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookAuditLog.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, name: 'from_status', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookAuditLog.prototype, "from_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, name: 'to_status', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookAuditLog.prototype, "to_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ZunoRulebookAuditLog.prototype, "metadata", void 0);
exports.ZunoRulebookAuditLog = ZunoRulebookAuditLog = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_audit_log'),
    (0, typeorm_1.Index)('idx_zuno_rulebook_audit_version', ['rulebook_version_id', 'created_at'])
], ZunoRulebookAuditLog);
//# sourceMappingURL=zuno-rulebook-governance.entity.js.map