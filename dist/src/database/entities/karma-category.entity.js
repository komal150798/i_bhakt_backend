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
exports.KarmaCategory = void 0;
const typeorm_1 = require("typeorm");
const karma_record_entity_1 = require("./karma-record.entity");
let KarmaCategory = class KarmaCategory {
};
exports.KarmaCategory = KarmaCategory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], KarmaCategory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, unique: true, nullable: false }),
    __metadata("design:type", String)
], KarmaCategory.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: false }),
    __metadata("design:type", String)
], KarmaCategory.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], KarmaCategory.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: false, default: 'neutral' }),
    __metadata("design:type", String)
], KarmaCategory.prototype, "polarity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: false, default: 0.0 }),
    __metadata("design:type", Number)
], KarmaCategory.prototype, "default_weight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], KarmaCategory.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], KarmaCategory.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], KarmaCategory.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => karma_record_entity_1.KarmaRecord, (record) => record.category),
    __metadata("design:type", Array)
], KarmaCategory.prototype, "karma_records", void 0);
exports.KarmaCategory = KarmaCategory = __decorate([
    (0, typeorm_1.Entity)('karma_categories')
], KarmaCategory);
//# sourceMappingURL=karma-category.entity.js.map