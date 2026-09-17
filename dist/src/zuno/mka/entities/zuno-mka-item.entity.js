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
exports.ZunoMkaItem = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
const mka_enum_1 = require("../enums/mka.enum");
const zuno_mka_program_entity_1 = require("./zuno-mka-program.entity");
let ZunoMkaItem = class ZunoMkaItem extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoMkaItem = ZunoMkaItem;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'mka_program_id' }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "mka_program_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "dimension", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300 }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, name: 'source_type' }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "source_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'source_rule_key', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "source_rule_key", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        name: 'source_remedy_key',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "source_remedy_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'source_rule_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "source_rule_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: mka_enum_1.MkaFrequency.WEEKLY }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'schedule_data', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], ZunoMkaItem.prototype, "schedule_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'duration_minutes', nullable: true }),
    __metadata("design:type", Number)
], ZunoMkaItem.prototype, "duration_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: mka_enum_1.MkaPriority.IMPORTANT }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'valid_from', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "valid_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'valid_to', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "valid_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'plan_eligible', default: true }),
    __metadata("design:type", Boolean)
], ZunoMkaItem.prototype, "plan_eligible", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'karma_eligible', default: false }),
    __metadata("design:type", Boolean)
], ZunoMkaItem.prototype, "karma_eligible", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'safety_class',
        default: enums_1.RuleSafetyClass.LOW_RISK,
    }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "safety_class", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_devotional', default: false }),
    __metadata("design:type", Boolean)
], ZunoMkaItem.prototype, "is_devotional", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'alternative_keys',
        default: () => "'[]'::jsonb",
    }),
    __metadata("design:type", Array)
], ZunoMkaItem.prototype, "alternative_keys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'display_order', default: 0 }),
    __metadata("design:type", Number)
], ZunoMkaItem.prototype, "display_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: mka_enum_1.MkaItemStatus.ACTIVE }),
    __metadata("design:type", String)
], ZunoMkaItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_mka_program_entity_1.ZunoMkaProgram, (program) => program.items, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'mka_program_id' }),
    __metadata("design:type", zuno_mka_program_entity_1.ZunoMkaProgram)
], ZunoMkaItem.prototype, "program", void 0);
exports.ZunoMkaItem = ZunoMkaItem = __decorate([
    (0, typeorm_1.Entity)('zuno_mka_items'),
    (0, typeorm_1.Index)('idx_zuno_mka_items_program', ['mka_program_id', 'display_order']),
    (0, typeorm_1.Index)('idx_zuno_mka_items_user', ['user_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_mka_items_dimension', ['mka_program_id', 'dimension']),
    (0, typeorm_1.Index)('idx_zuno_mka_items_plan_eligible', ['mka_program_id', 'plan_eligible'])
], ZunoMkaItem);
//# sourceMappingURL=zuno-mka-item.entity.js.map