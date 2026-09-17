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
exports.ZunoKarmaEntry = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const karma_enum_1 = require("../enums/karma.enum");
let ZunoKarmaEntry = class ZunoKarmaEntry extends zuno_base_entity_1.ZunoVersionedEntity {
};
exports.ZunoKarmaEntry = ZunoKarmaEntry;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'plan_item_id', nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "plan_item_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'mka_item_id', nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "mka_item_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 128,
        name: 'source_event_id',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "source_event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'raw_text', nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "raw_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "classification", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "intent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'impact_scope', nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "impact_scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ZunoKarmaEntry.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 3, nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'user_confirmed', default: false }),
    __metadata("design:type", Boolean)
], ZunoKarmaEntry.prototype, "user_confirmed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: karma_enum_1.KarmaVisibility.PRIVATE }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'scoring_model_version' }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "scoring_model_version", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        name: 'classification_model_version',
    }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "classification_model_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'score_factors', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoKarmaEntry.prototype, "score_factors", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoKarmaEntry.prototype, "evidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: karma_enum_1.KarmaEntryStatus.ACTIVE }),
    __metadata("design:type", String)
], ZunoKarmaEntry.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'occurred_at' }),
    __metadata("design:type", Date)
], ZunoKarmaEntry.prototype, "occurred_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'redacted_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoKarmaEntry.prototype, "redacted_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoKarmaEntry.prototype, "user", void 0);
exports.ZunoKarmaEntry = ZunoKarmaEntry = __decorate([
    (0, typeorm_1.Entity)('zuno_karma_entries'),
    (0, typeorm_1.Index)('idx_zuno_karma_entries_user_created', ['user_id', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_karma_entries_user_status', ['user_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_karma_entries_user_category', ['user_id', 'category']),
    (0, typeorm_1.Index)('idx_zuno_karma_entries_user_classification', ['user_id', 'classification']),
    (0, typeorm_1.Index)('idx_zuno_karma_entries_user_source', ['user_id', 'source']),
    (0, typeorm_1.Index)('idx_zuno_karma_entries_challenge', ['challenge_id']),
    (0, typeorm_1.Index)('idx_zuno_karma_entries_plan_item', ['plan_item_id']),
    (0, typeorm_1.Index)('idx_zuno_karma_entries_mka_item', ['mka_item_id']),
    (0, typeorm_1.Index)('idx_zuno_karma_entries_source_event', ['user_id', 'source_event_id'])
], ZunoKarmaEntry);
//# sourceMappingURL=zuno-karma-entry.entity.js.map