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
exports.PlanetMaster = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let PlanetMaster = class PlanetMaster extends base_entity_1.BaseEntity {
};
exports.PlanetMaster = PlanetMaster;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true, name: 'planet_name' }),
    __metadata("design:type", String)
], PlanetMaster.prototype, "planet_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true, name: 'symbol' }),
    __metadata("design:type", String)
], PlanetMaster.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PlanetMaster.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PlanetMaster.prototype, "metadata", void 0);
exports.PlanetMaster = PlanetMaster = __decorate([
    (0, typeorm_1.Entity)('planet_master'),
    (0, typeorm_1.Index)(['planet_name', 'is_enabled'])
], PlanetMaster);
//# sourceMappingURL=planet-master.entity.js.map