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
exports.KarmaWeightRule = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let KarmaWeightRule = class KarmaWeightRule extends base_entity_1.BaseEntity {
};
exports.KarmaWeightRule = KarmaWeightRule;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], KarmaWeightRule.prototype, "category_slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], KarmaWeightRule.prototype, "pattern_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], KarmaWeightRule.prototype, "pattern_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['good', 'bad', 'neutral'] }),
    __metadata("design:type", String)
], KarmaWeightRule.prototype, "karma_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], KarmaWeightRule.prototype, "base_weight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 1.0 }),
    __metadata("design:type", Number)
], KarmaWeightRule.prototype, "intensity_multiplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], KarmaWeightRule.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], KarmaWeightRule.prototype, "keywords", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], KarmaWeightRule.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KarmaWeightRule.prototype, "metadata", void 0);
exports.KarmaWeightRule = KarmaWeightRule = __decorate([
    (0, typeorm_1.Entity)('karma_weight_rules'),
    (0, typeorm_1.Index)(['category_slug', 'pattern_key'], { unique: true })
], KarmaWeightRule);
//# sourceMappingURL=karma-weight-rule.entity.js.map