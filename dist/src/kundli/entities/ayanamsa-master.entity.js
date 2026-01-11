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
exports.AyanamsaMaster = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let AyanamsaMaster = class AyanamsaMaster extends base_entity_1.BaseEntity {
};
exports.AyanamsaMaster = AyanamsaMaster;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true, name: 'ayanamsa_name' }),
    __metadata("design:type", String)
], AyanamsaMaster.prototype, "ayanamsa_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'display_name' }),
    __metadata("design:type", String)
], AyanamsaMaster.prototype, "display_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'default_value' }),
    __metadata("design:type", Number)
], AyanamsaMaster.prototype, "default_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AyanamsaMaster.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_default' }),
    __metadata("design:type", Boolean)
], AyanamsaMaster.prototype, "is_default", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AyanamsaMaster.prototype, "metadata", void 0);
exports.AyanamsaMaster = AyanamsaMaster = __decorate([
    (0, typeorm_1.Entity)('ayanamsa_master'),
    (0, typeorm_1.Index)(['ayanamsa_name', 'is_enabled'])
], AyanamsaMaster);
//# sourceMappingURL=ayanamsa-master.entity.js.map