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
exports.ZunoRulebookVersion = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
let ZunoRulebookVersion = class ZunoRulebookVersion extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoRulebookVersion = ZunoRulebookVersion;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'release_name' }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "release_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'release_type' }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "release_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, default: enums_1.RulebookStatus.UPLOADED }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, name: 'source_file_name' }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "source_file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'source_file_hash' }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "source_file_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'source_file_size' }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "source_file_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'source_file_location', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "source_file_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, name: 'sme_reference', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "sme_reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'change_summary', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "change_summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'uploaded_by', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'uploaded_at' }),
    __metadata("design:type", Date)
], ZunoRulebookVersion.prototype, "uploaded_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reviewed_by', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "reviewed_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'reviewed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoRulebookVersion.prototype, "reviewed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'approved_by', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "approved_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'approved_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoRulebookVersion.prototype, "approved_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'activated_by', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "activated_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'activated_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoRulebookVersion.prototype, "activated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'superseded_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoRulebookVersion.prototype, "superseded_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'supersedes_version_id', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "supersedes_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_rules', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookVersion.prototype, "total_rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_interpretations', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookVersion.prototype, "total_interpretations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_remedies', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookVersion.prototype, "total_remedies", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_timing_rules', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookVersion.prototype, "total_timing_rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_golden_cases', default: 0 }),
    __metadata("design:type", Number)
], ZunoRulebookVersion.prototype, "total_golden_cases", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'domains_covered', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookVersion.prototype, "domains_covered", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'status_reason', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookVersion.prototype, "status_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_production', default: false }),
    __metadata("design:type", Boolean)
], ZunoRulebookVersion.prototype, "is_production", void 0);
exports.ZunoRulebookVersion = ZunoRulebookVersion = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_versions'),
    (0, typeorm_1.Index)('idx_zuno_rulebook_versions_version', ['version'], { unique: true }),
    (0, typeorm_1.Index)('idx_zuno_rulebook_versions_status', ['status'])
], ZunoRulebookVersion);
//# sourceMappingURL=zuno-rulebook-version.entity.js.map