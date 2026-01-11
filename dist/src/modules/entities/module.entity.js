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
exports.Module = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const module_type_enum_1 = require("../../common/enums/module-type.enum");
const plan_entity_1 = require("../../plans/entities/plan.entity");
let Module = class Module extends base_entity_1.BaseEntity {
};
exports.Module = Module;
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: module_type_enum_1.ModuleType, name: 'module_type' }),
    __metadata("design:type", String)
], Module.prototype, "module_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Module.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Module.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Module.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'icon_name' }),
    __metadata("design:type", String)
], Module.prototype, "icon_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'route_path' }),
    __metadata("design:type", String)
], Module.prototype, "route_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'image_url' }),
    __metadata("design:type", String)
], Module.prototype, "image_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'badge_color' }),
    __metadata("design:type", String)
], Module.prototype, "badge_color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'sort_order' }),
    __metadata("design:type", Number)
], Module.prototype, "sort_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_premium' }),
    __metadata("design:type", Boolean)
], Module.prototype, "is_premium", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'required_permissions' }),
    __metadata("design:type", Array)
], Module.prototype, "required_permissions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Module.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => plan_entity_1.Plan, (plan) => plan.modules),
    __metadata("design:type", Array)
], Module.prototype, "plans", void 0);
exports.Module = Module = __decorate([
    (0, typeorm_1.Entity)('modules'),
    (0, typeorm_1.Index)(['slug', 'is_enabled', 'is_deleted']),
    (0, typeorm_1.Index)(['module_type', 'is_enabled'])
], Module);
//# sourceMappingURL=module.entity.js.map