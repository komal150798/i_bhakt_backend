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
exports.KarmaMasterGood = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let KarmaMasterGood = class KarmaMasterGood extends base_entity_1.BaseEntity {
};
exports.KarmaMasterGood = KarmaMasterGood;
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], KarmaMasterGood.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'category_slug' }),
    __metadata("design:type", String)
], KarmaMasterGood.prototype, "category_slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'category_name' }),
    __metadata("design:type", String)
], KarmaMasterGood.prototype, "category_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 1.0, name: 'weight' }),
    __metadata("design:type", Number)
], KarmaMasterGood.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'match_count' }),
    __metadata("design:type", Number)
], KarmaMasterGood.prototype, "match_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KarmaMasterGood.prototype, "metadata", void 0);
exports.KarmaMasterGood = KarmaMasterGood = __decorate([
    (0, typeorm_1.Entity)('karma_master_good'),
    (0, typeorm_1.Index)(['is_enabled', 'is_deleted'])
], KarmaMasterGood);
//# sourceMappingURL=karma-master-good.entity.js.map