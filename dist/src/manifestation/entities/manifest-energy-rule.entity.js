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
exports.ManifestEnergyRule = void 0;
const typeorm_1 = require("typeorm");
let ManifestEnergyRule = class ManifestEnergyRule {
};
exports.ManifestEnergyRule = ManifestEnergyRule;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' }),
    __metadata("design:type", String)
], ManifestEnergyRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'energy_state' }),
    __metadata("design:type", String)
], ManifestEnergyRule.prototype, "energy_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ManifestEnergyRule.prototype, "pattern", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], ManifestEnergyRule.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ManifestEnergyRule.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' }),
    __metadata("design:type", Date)
], ManifestEnergyRule.prototype, "created_at", void 0);
exports.ManifestEnergyRule = ManifestEnergyRule = __decorate([
    (0, typeorm_1.Entity)('manifest_energy_rules'),
    (0, typeorm_1.Index)(['energy_state'])
], ManifestEnergyRule);
//# sourceMappingURL=manifest-energy-rule.entity.js.map