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
exports.KarmaPattern = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let KarmaPattern = class KarmaPattern extends base_entity_1.BaseEntity {
};
exports.KarmaPattern = KarmaPattern;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], KarmaPattern.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], KarmaPattern.prototype, "pattern_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], KarmaPattern.prototype, "pattern_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['good', 'bad', 'neutral'] }),
    __metadata("design:type", String)
], KarmaPattern.prototype, "pattern_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], KarmaPattern.prototype, "frequency_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], KarmaPattern.prototype, "total_score_impact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'detected_date', default: () => 'CURRENT_DATE' }),
    __metadata("design:type", Date)
], KarmaPattern.prototype, "detected_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'first_detected_date' }),
    __metadata("design:type", Date)
], KarmaPattern.prototype, "first_detected_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'last_detected_date' }),
    __metadata("design:type", Date)
], KarmaPattern.prototype, "last_detected_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], KarmaPattern.prototype, "sample_actions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KarmaPattern.prototype, "metadata", void 0);
exports.KarmaPattern = KarmaPattern = __decorate([
    (0, typeorm_1.Entity)('karma_patterns'),
    (0, typeorm_1.Index)(['user_id', 'pattern_key', 'detected_date'])
], KarmaPattern);
//# sourceMappingURL=karma-pattern.entity.js.map