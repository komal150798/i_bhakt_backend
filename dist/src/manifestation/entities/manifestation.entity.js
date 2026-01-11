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
exports.Manifestation = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let Manifestation = class Manifestation extends base_entity_1.BaseEntity {
};
exports.Manifestation = Manifestation;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], Manifestation.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], Manifestation.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Manifestation.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Manifestation.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'emotional_state' }),
    __metadata("design:type", String)
], Manifestation.prototype, "emotional_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true, name: 'target_date' }),
    __metadata("design:type", Date)
], Manifestation.prototype, "target_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'resonance_score' }),
    __metadata("design:type", Number)
], Manifestation.prototype, "resonance_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'alignment_score' }),
    __metadata("design:type", Number)
], Manifestation.prototype, "alignment_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'antrashaakti_score' }),
    __metadata("design:type", Number)
], Manifestation.prototype, "antrashaakti_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'mahaadha_score' }),
    __metadata("design:type", Number)
], Manifestation.prototype, "mahaadha_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'astro_support_index' }),
    __metadata("design:type", Number)
], Manifestation.prototype, "astro_support_index", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'mfp_score' }),
    __metadata("design:type", Number)
], Manifestation.prototype, "mfp_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'coherence_score' }),
    __metadata("design:type", Number)
], Manifestation.prototype, "coherence_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'action_windows' }),
    __metadata("design:type", Object)
], Manifestation.prototype, "action_windows", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'progress_tracking' }),
    __metadata("design:type", Object)
], Manifestation.prototype, "progress_tracking", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Manifestation.prototype, "tips", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Manifestation.prototype, "insights", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_archived' }),
    __metadata("design:type", Boolean)
], Manifestation.prototype, "is_archived", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_locked' }),
    __metadata("design:type", Boolean)
], Manifestation.prototype, "is_locked", void 0);
exports.Manifestation = Manifestation = __decorate([
    (0, typeorm_1.Entity)('manifestations'),
    (0, typeorm_1.Index)(['user_id', 'is_archived']),
    (0, typeorm_1.Index)(['user_id', 'is_deleted'])
], Manifestation);
//# sourceMappingURL=manifestation.entity.js.map