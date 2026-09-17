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
exports.ZunoRulebookGoldenCase = exports.ZunoRulebookConflictRule = exports.ZunoRulebookDomainConfig = exports.ZunoRulebookRemedy = exports.ZunoRulebookTimingRule = exports.ZunoRulebookInterpretation = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
let ZunoRulebookInterpretation = class ZunoRulebookInterpretation extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoRulebookInterpretation = ZunoRulebookInterpretation;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookInterpretation.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'external_interpretation_key' }),
    __metadata("design:type", String)
], ZunoRulebookInterpretation.prototype, "external_interpretation_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookInterpretation.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoRulebookInterpretation.prototype, "meaning", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'allowed_domains', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookInterpretation.prototype, "allowed_domains", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'user_safe_summary', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookInterpretation.prototype, "user_safe_summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: enums_1.RuleStatus.DRAFT }),
    __metadata("design:type", String)
], ZunoRulebookInterpretation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'source_row', nullable: true }),
    __metadata("design:type", Number)
], ZunoRulebookInterpretation.prototype, "source_row", void 0);
exports.ZunoRulebookInterpretation = ZunoRulebookInterpretation = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_interpretations'),
    (0, typeorm_1.Index)('idx_zuno_interpretations_key', ['rulebook_version_id', 'external_interpretation_key'], { unique: true })
], ZunoRulebookInterpretation);
let ZunoRulebookTimingRule = class ZunoRulebookTimingRule extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoRulebookTimingRule = ZunoRulebookTimingRule;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookTimingRule.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'external_timing_key' }),
    __metadata("design:type", String)
], ZunoRulebookTimingRule.prototype, "external_timing_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookTimingRule.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'window_type' }),
    __metadata("design:type", String)
], ZunoRulebookTimingRule.prototype, "window_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoRulebookTimingRule.prototype, "strength", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookTimingRule.prototype, "conditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'timing_language', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookTimingRule.prototype, "timing_language", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: enums_1.RuleStatus.DRAFT }),
    __metadata("design:type", String)
], ZunoRulebookTimingRule.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'source_row', nullable: true }),
    __metadata("design:type", Number)
], ZunoRulebookTimingRule.prototype, "source_row", void 0);
exports.ZunoRulebookTimingRule = ZunoRulebookTimingRule = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_timing_rules'),
    (0, typeorm_1.Index)('idx_zuno_timing_key', ['rulebook_version_id', 'external_timing_key'], {
        unique: true,
    })
], ZunoRulebookTimingRule);
let ZunoRulebookRemedy = class ZunoRulebookRemedy extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoRulebookRemedy = ZunoRulebookRemedy;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'external_remedy_key' }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "external_remedy_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300 }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'remedy_type' }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "remedy_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'mka_dimension' }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "mka_dimension", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'astrological_basis', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "astrological_basis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "instructions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24 }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, name: 'preferred_time', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "preferred_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "restrictions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'conflicts_with', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookRemedy.prototype, "conflicts_with", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'safety_class',
        default: enums_1.RuleSafetyClass.LOW_RISK,
    }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "safety_class", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'has_financial_cost', default: false }),
    __metadata("design:type", Boolean)
], ZunoRulebookRemedy.prototype, "has_financial_cost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_devotional', default: false }),
    __metadata("design:type", Boolean)
], ZunoRulebookRemedy.prototype, "is_devotional", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'alternative_keys', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookRemedy.prototype, "alternative_keys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'user_explanation', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "user_explanation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: enums_1.RuleStatus.DRAFT }),
    __metadata("design:type", String)
], ZunoRulebookRemedy.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'source_row', nullable: true }),
    __metadata("design:type", Number)
], ZunoRulebookRemedy.prototype, "source_row", void 0);
exports.ZunoRulebookRemedy = ZunoRulebookRemedy = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_remedies'),
    (0, typeorm_1.Index)('idx_zuno_remedies_key', ['rulebook_version_id', 'external_remedy_key'], {
        unique: true,
    }),
    (0, typeorm_1.Index)('idx_zuno_remedies_type', ['rulebook_version_id', 'remedy_type'])
], ZunoRulebookRemedy);
let ZunoRulebookDomainConfig = class ZunoRulebookDomainConfig extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoRulebookDomainConfig = ZunoRulebookDomainConfig;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookDomainConfig.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoRulebookDomainConfig.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'primary_houses', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookDomainConfig.prototype, "primary_houses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'secondary_houses', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookDomainConfig.prototype, "secondary_houses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'primary_planets', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookDomainConfig.prototype, "primary_planets", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'supporting_planets', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookDomainConfig.prototype, "supporting_planets", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'relevant_divisional_charts',
        default: () => "'[]'::jsonb",
    }),
    __metadata("design:type", Array)
], ZunoRulebookDomainConfig.prototype, "relevant_divisional_charts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'timing_factors', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookDomainConfig.prototype, "timing_factors", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'methodology_notes', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookDomainConfig.prototype, "methodology_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'source_row', nullable: true }),
    __metadata("design:type", Number)
], ZunoRulebookDomainConfig.prototype, "source_row", void 0);
exports.ZunoRulebookDomainConfig = ZunoRulebookDomainConfig = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_domain_configs'),
    (0, typeorm_1.Index)('idx_zuno_domain_config', ['rulebook_version_id', 'domain'], {
        unique: true,
    })
], ZunoRulebookDomainConfig);
let ZunoRulebookConflictRule = class ZunoRulebookConflictRule extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoRulebookConflictRule = ZunoRulebookConflictRule;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookConflictRule.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'external_conflict_key' }),
    __metadata("design:type", String)
], ZunoRulebookConflictRule.prototype, "external_conflict_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'rule_keys', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookConflictRule.prototype, "rule_keys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'resolution_strategy' }),
    __metadata("design:type", String)
], ZunoRulebookConflictRule.prototype, "resolution_strategy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'winning_rule_key', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookConflictRule.prototype, "winning_rule_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookConflictRule.prototype, "rationale", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'source_row', nullable: true }),
    __metadata("design:type", Number)
], ZunoRulebookConflictRule.prototype, "source_row", void 0);
exports.ZunoRulebookConflictRule = ZunoRulebookConflictRule = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_conflict_rules'),
    (0, typeorm_1.Index)('idx_zuno_conflict_key', ['rulebook_version_id', 'external_conflict_key'], {
        unique: true,
    })
], ZunoRulebookConflictRule);
let ZunoRulebookGoldenCase = class ZunoRulebookGoldenCase extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoRulebookGoldenCase = ZunoRulebookGoldenCase;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id' }),
    __metadata("design:type", String)
], ZunoRulebookGoldenCase.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'external_case_key' }),
    __metadata("design:type", String)
], ZunoRulebookGoldenCase.prototype, "external_case_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, name: 'case_name' }),
    __metadata("design:type", String)
], ZunoRulebookGoldenCase.prototype, "case_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookGoldenCase.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'birth_data' }),
    __metadata("design:type", Object)
], ZunoRulebookGoldenCase.prototype, "birth_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'challenge_statement' }),
    __metadata("design:type", String)
], ZunoRulebookGoldenCase.prototype, "challenge_statement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'expected_rule_keys', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookGoldenCase.prototype, "expected_rule_keys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'expected_themes', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoRulebookGoldenCase.prototype, "expected_themes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'expected_outcome_notes', nullable: true }),
    __metadata("design:type", String)
], ZunoRulebookGoldenCase.prototype, "expected_outcome_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'source_row', nullable: true }),
    __metadata("design:type", Number)
], ZunoRulebookGoldenCase.prototype, "source_row", void 0);
exports.ZunoRulebookGoldenCase = ZunoRulebookGoldenCase = __decorate([
    (0, typeorm_1.Entity)('zuno_rulebook_golden_cases'),
    (0, typeorm_1.Index)('idx_zuno_golden_key', ['rulebook_version_id', 'external_case_key'], {
        unique: true,
    })
], ZunoRulebookGoldenCase);
//# sourceMappingURL=zuno-rulebook-knowledge.entity.js.map