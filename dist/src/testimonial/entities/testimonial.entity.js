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
exports.Testimonial = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let Testimonial = class Testimonial extends base_entity_1.BaseEntity {
};
exports.Testimonial = Testimonial;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Testimonial.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Testimonial.prototype, "avatar_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Testimonial.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Testimonial.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 5 }),
    __metadata("design:type", Number)
], Testimonial.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Testimonial.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_featured' }),
    __metadata("design:type", Boolean)
], Testimonial.prototype, "is_featured", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'display_order' }),
    __metadata("design:type", Number)
], Testimonial.prototype, "display_order", void 0);
exports.Testimonial = Testimonial = __decorate([
    (0, typeorm_1.Entity)('testimonials')
], Testimonial);
//# sourceMappingURL=testimonial.entity.js.map