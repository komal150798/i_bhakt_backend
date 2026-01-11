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
exports.PlanFeatureLimit = void 0;
const typeorm_1 = require("typeorm");
const admin_entity_1 = require("./admin.entity");
let PlanFeatureLimit = class PlanFeatureLimit {
};
exports.PlanFeatureLimit = PlanFeatureLimit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PlanFeatureLimit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlanFeatureLimit.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlanFeatureLimit.prototype, "feature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], PlanFeatureLimit.prototype, "max_per_day", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], PlanFeatureLimit.prototype, "max_per_week", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], PlanFeatureLimit.prototype, "max_per_month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false, default: true }),
    __metadata("design:type", Boolean)
], PlanFeatureLimit.prototype, "karma_ledger_visible", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false, default: true }),
    __metadata("design:type", Boolean)
], PlanFeatureLimit.prototype, "cosmic_blueprint_visible", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], PlanFeatureLimit.prototype, "updated_by_admin_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => admin_entity_1.Admin, (admin) => admin.updated_limits, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by_admin_id' }),
    __metadata("design:type", admin_entity_1.Admin)
], PlanFeatureLimit.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PlanFeatureLimit.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PlanFeatureLimit.prototype, "updated_at", void 0);
exports.PlanFeatureLimit = PlanFeatureLimit = __decorate([
    (0, typeorm_1.Entity)('plan_feature_limits'),
    (0, typeorm_1.Unique)(['plan', 'feature'])
], PlanFeatureLimit);
//# sourceMappingURL=plan-feature-limit.entity.js.map