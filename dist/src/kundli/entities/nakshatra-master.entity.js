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
exports.NakshatraMaster = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let NakshatraMaster = class NakshatraMaster extends base_entity_1.BaseEntity {
};
exports.NakshatraMaster = NakshatraMaster;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true, name: 'nakshatra_name' }),
    __metadata("design:type", String)
], NakshatraMaster.prototype, "nakshatra_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', name: 'nakshatra_number' }),
    __metadata("design:type", Number)
], NakshatraMaster.prototype, "nakshatra_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 3, nullable: true, name: 'start_degrees' }),
    __metadata("design:type", Number)
], NakshatraMaster.prototype, "start_degrees", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 3, nullable: true, name: 'end_degrees' }),
    __metadata("design:type", Number)
], NakshatraMaster.prototype, "end_degrees", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'ruler_planet' }),
    __metadata("design:type", String)
], NakshatraMaster.prototype, "ruler_planet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], NakshatraMaster.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], NakshatraMaster.prototype, "metadata", void 0);
exports.NakshatraMaster = NakshatraMaster = __decorate([
    (0, typeorm_1.Entity)('nakshatra_master'),
    (0, typeorm_1.Index)(['nakshatra_name', 'is_enabled'])
], NakshatraMaster);
//# sourceMappingURL=nakshatra-master.entity.js.map