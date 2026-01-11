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
exports.KundliHouse = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const kundli_entity_1 = require("./kundli.entity");
let KundliHouse = class KundliHouse extends base_entity_1.BaseEntity {
};
exports.KundliHouse = KundliHouse;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'kundli_id' }),
    __metadata("design:type", Number)
], KundliHouse.prototype, "kundli_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', name: 'house_number' }),
    __metadata("design:type", Number)
], KundliHouse.prototype, "house_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 8, name: 'cusp_degrees' }),
    __metadata("design:type", Number)
], KundliHouse.prototype, "cusp_degrees", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'sign_name' }),
    __metadata("design:type", String)
], KundliHouse.prototype, "sign_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', name: 'sign_number' }),
    __metadata("design:type", Number)
], KundliHouse.prototype, "sign_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KundliHouse.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kundli_entity_1.Kundli, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'kundli_id', referencedColumnName: 'id' }),
    __metadata("design:type", kundli_entity_1.Kundli)
], KundliHouse.prototype, "kundli", void 0);
exports.KundliHouse = KundliHouse = __decorate([
    (0, typeorm_1.Entity)('kundli_houses'),
    (0, typeorm_1.Index)(['kundli_id', 'house_number'])
], KundliHouse);
//# sourceMappingURL=kundli-house.entity.js.map