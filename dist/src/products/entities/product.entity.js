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
exports.Product = exports.ProductType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const plan_entity_1 = require("../../plans/entities/plan.entity");
var ProductType;
(function (ProductType) {
    ProductType["PHYSICAL"] = "physical";
    ProductType["DIGITAL"] = "digital";
    ProductType["SUBSCRIPTION_ADDON"] = "subscription_addon";
    ProductType["SERVICE"] = "service";
})(ProductType || (exports.ProductType = ProductType = {}));
let Product = class Product extends base_entity_1.BaseEntity {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], Product.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'short_description' }),
    __metadata("design:type", String)
], Product.prototype, "short_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'compare_at_price' }),
    __metadata("design:type", Number)
], Product.prototype, "compare_at_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'INR' }),
    __metadata("design:type", String)
], Product.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProductType, default: ProductType.DIGITAL, name: 'product_type' }),
    __metadata("design:type", String)
], Product.prototype, "product_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'image_url' }),
    __metadata("design:type", String)
], Product.prototype, "image_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'image_gallery' }),
    __metadata("design:type", Array)
], Product.prototype, "image_gallery", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'sku' }),
    __metadata("design:type", String)
], Product.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'stock_quantity' }),
    __metadata("design:type", Number)
], Product.prototype, "stock_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_available' }),
    __metadata("design:type", Boolean)
], Product.prototype, "is_available", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_featured' }),
    __metadata("design:type", Boolean)
], Product.prototype, "is_featured", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'sort_order' }),
    __metadata("design:type", Number)
], Product.prototype, "sort_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'pricing_tiers' }),
    __metadata("design:type", Array)
], Product.prototype, "pricing_tiers", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => plan_entity_1.Plan, (plan) => plan.products),
    (0, typeorm_1.JoinTable)({
        name: 'product_plans',
        joinColumn: { name: 'product_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'plan_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Product.prototype, "plans", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products'),
    (0, typeorm_1.Index)(['slug', 'is_enabled', 'is_deleted']),
    (0, typeorm_1.Index)(['product_type', 'is_enabled'])
], Product);
//# sourceMappingURL=product.entity.js.map