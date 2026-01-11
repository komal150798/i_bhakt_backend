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
exports.Plan = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const plan_type_enum_1 = require("../../common/enums/plan-type.enum");
const module_entity_1 = require("../../modules/entities/module.entity");
const subscription_entity_1 = require("../../subscriptions/entities/subscription.entity");
const product_entity_1 = require("../../products/entities/product.entity");
let Plan = class Plan extends base_entity_1.BaseEntity {
};
exports.Plan = Plan;
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: plan_type_enum_1.PlanType, unique: true, name: 'plan_type' }),
    __metadata("design:type", String)
], Plan.prototype, "plan_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Plan.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Plan.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'tagline' }),
    __metadata("design:type", String)
], Plan.prototype, "tagline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'monthly_price' }),
    __metadata("design:type", Number)
], Plan.prototype, "monthly_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'yearly_price' }),
    __metadata("design:type", Number)
], Plan.prototype, "yearly_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'INR' }),
    __metadata("design:type", String)
], Plan.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'billing_cycle_days' }),
    __metadata("design:type", Number)
], Plan.prototype, "billing_cycle_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'trial_days' }),
    __metadata("design:type", Number)
], Plan.prototype, "trial_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'referral_count_required' }),
    __metadata("design:type", Number)
], Plan.prototype, "referral_count_required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_popular' }),
    __metadata("design:type", Boolean)
], Plan.prototype, "is_popular", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_featured' }),
    __metadata("design:type", Boolean)
], Plan.prototype, "is_featured", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'sort_order' }),
    __metadata("design:type", Number)
], Plan.prototype, "sort_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'badge_color' }),
    __metadata("design:type", String)
], Plan.prototype, "badge_color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'badge_icon' }),
    __metadata("design:type", String)
], Plan.prototype, "badge_icon", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Plan.prototype, "features", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'usage_limits' }),
    __metadata("design:type", Object)
], Plan.prototype, "usage_limits", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Plan.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => module_entity_1.Module, (module) => module.plans),
    (0, typeorm_1.JoinTable)({
        name: 'plan_modules',
        joinColumn: { name: 'plan_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'module_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Plan.prototype, "modules", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => product_entity_1.Product, (product) => product.plans),
    __metadata("design:type", Array)
], Plan.prototype, "products", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subscription_entity_1.Subscription, (subscription) => subscription.plan),
    __metadata("design:type", Array)
], Plan.prototype, "subscriptions", void 0);
exports.Plan = Plan = __decorate([
    (0, typeorm_1.Entity)('plans'),
    (0, typeorm_1.Index)(['plan_type', 'is_enabled', 'is_deleted'])
], Plan);
//# sourceMappingURL=plan.entity.js.map