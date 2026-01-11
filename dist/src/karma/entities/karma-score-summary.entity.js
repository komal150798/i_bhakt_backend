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
exports.KarmaScoreSummary = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let KarmaScoreSummary = class KarmaScoreSummary extends base_entity_1.BaseEntity {
};
exports.KarmaScoreSummary = KarmaScoreSummary;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], KarmaScoreSummary.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['daily', 'weekly', 'monthly'] }),
    __metadata("design:type", String)
], KarmaScoreSummary.prototype, "period_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'period_start' }),
    __metadata("design:type", Date)
], KarmaScoreSummary.prototype, "period_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'period_end' }),
    __metadata("design:type", Date)
], KarmaScoreSummary.prototype, "period_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], KarmaScoreSummary.prototype, "karma_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], KarmaScoreSummary.prototype, "total_good_actions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], KarmaScoreSummary.prototype, "total_bad_actions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], KarmaScoreSummary.prototype, "total_neutral_actions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], KarmaScoreSummary.prototype, "total_positive_points", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], KarmaScoreSummary.prototype, "total_negative_points", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], KarmaScoreSummary.prototype, "ai_summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], KarmaScoreSummary.prototype, "prediction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KarmaScoreSummary.prototype, "top_patterns", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KarmaScoreSummary.prototype, "metadata", void 0);
exports.KarmaScoreSummary = KarmaScoreSummary = __decorate([
    (0, typeorm_1.Entity)('karma_score_summaries'),
    (0, typeorm_1.Index)(['user_id', 'period_type', 'period_start'], { unique: true })
], KarmaScoreSummary);
//# sourceMappingURL=karma-score-summary.entity.js.map