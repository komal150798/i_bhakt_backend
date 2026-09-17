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
exports.ZunoLifeSignalImpact = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_life_signal_entity_1 = require("./zuno-life-signal.entity");
const enums_1 = require("../enums");
let ZunoLifeSignalImpact = class ZunoLifeSignalImpact extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoLifeSignalImpact = ZunoLifeSignalImpact;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'life_signal_id' }),
    __metadata("design:type", String)
], ZunoLifeSignalImpact.prototype, "life_signal_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoLifeSignalImpact.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'entity_type' }),
    __metadata("design:type", String)
], ZunoLifeSignalImpact.prototype, "entity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'entity_id', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignalImpact.prototype, "entity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, name: 'entity_key', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignalImpact.prototype, "entity_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, name: 'impact_type' }),
    __metadata("design:type", String)
], ZunoLifeSignalImpact.prototype, "impact_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'numeric',
        precision: 4,
        scale: 3,
        name: 'impact_score',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoLifeSignalImpact.prototype, "impact_score", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_life_signal_entity_1.ZunoLifeSignal, (signal) => signal.impacts, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'life_signal_id' }),
    __metadata("design:type", zuno_life_signal_entity_1.ZunoLifeSignal)
], ZunoLifeSignalImpact.prototype, "signal", void 0);
exports.ZunoLifeSignalImpact = ZunoLifeSignalImpact = __decorate([
    (0, typeorm_1.Entity)('zuno_life_signal_impacts'),
    (0, typeorm_1.Index)('idx_zuno_life_signal_impacts_signal', ['life_signal_id']),
    (0, typeorm_1.Index)('idx_zuno_life_signal_impacts_entity', ['entity_type', 'entity_id'])
], ZunoLifeSignalImpact);
//# sourceMappingURL=zuno-life-signal-impact.entity.js.map