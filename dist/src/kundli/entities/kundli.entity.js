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
exports.Kundli = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const kundli_planet_entity_1 = require("./kundli-planet.entity");
const kundli_house_entity_1 = require("./kundli-house.entity");
let Kundli = class Kundli extends base_entity_1.BaseEntity {
};
exports.Kundli = Kundli;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], Kundli.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'birth_date' }),
    __metadata("design:type", Date)
], Kundli.prototype, "birth_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'birth_time' }),
    __metadata("design:type", String)
], Kundli.prototype, "birth_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'birth_place' }),
    __metadata("design:type", String)
], Kundli.prototype, "birth_place", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], Kundli.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], Kundli.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Kundli.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 8, nullable: true, name: 'lagna_degrees' }),
    __metadata("design:type", Number)
], Kundli.prototype, "lagna_degrees", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'lagna_name' }),
    __metadata("design:type", String)
], Kundli.prototype, "lagna_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'nakshatra' }),
    __metadata("design:type", String)
], Kundli.prototype, "nakshatra", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', nullable: true }),
    __metadata("design:type", Number)
], Kundli.prototype, "pada", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'tithi' }),
    __metadata("design:type", String)
], Kundli.prototype, "tithi", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'yoga' }),
    __metadata("design:type", String)
], Kundli.prototype, "yoga", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'karana' }),
    __metadata("design:type", String)
], Kundli.prototype, "karana", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'ayanamsa' }),
    __metadata("design:type", Number)
], Kundli.prototype, "ayanamsa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'full_data' }),
    __metadata("design:type", Object)
], Kundli.prototype, "full_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'dasha_timeline' }),
    __metadata("design:type", Array)
], Kundli.prototype, "dasha_timeline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'navamsa_data' }),
    __metadata("design:type", Object)
], Kundli.prototype, "navamsa_data", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id', referencedColumnName: 'id' }),
    __metadata("design:type", user_entity_1.User)
], Kundli.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => kundli_planet_entity_1.KundliPlanet, (planet) => planet.kundli, { cascade: true }),
    __metadata("design:type", Array)
], Kundli.prototype, "planets", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => kundli_house_entity_1.KundliHouse, (house) => house.kundli, { cascade: true }),
    __metadata("design:type", Array)
], Kundli.prototype, "houses", void 0);
exports.Kundli = Kundli = __decorate([
    (0, typeorm_1.Entity)('kundli'),
    (0, typeorm_1.Index)(['user_id', 'is_deleted'])
], Kundli);
//# sourceMappingURL=kundli.entity.js.map