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
exports.ZunoLifeSignalSource = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_life_signal_entity_1 = require("./zuno-life-signal.entity");
const enums_1 = require("../enums");
let ZunoLifeSignalSource = class ZunoLifeSignalSource extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoLifeSignalSource = ZunoLifeSignalSource;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'life_signal_id' }),
    __metadata("design:type", String)
], ZunoLifeSignalSource.prototype, "life_signal_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoLifeSignalSource.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoLifeSignalSource.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoLifeSignalSource.prototype, "origin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24 }),
    __metadata("design:type", String)
], ZunoLifeSignalSource.prototype, "reliability", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'source_event_id', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignalSource.prototype, "source_event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, name: 'source_ref', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignalSource.prototype, "source_ref", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ZunoLifeSignalSource.prototype, "fingerprint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ZunoLifeSignalSource.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'observed_at' }),
    __metadata("design:type", Date)
], ZunoLifeSignalSource.prototype, "observed_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_life_signal_entity_1.ZunoLifeSignal, (signal) => signal.sources, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'life_signal_id' }),
    __metadata("design:type", zuno_life_signal_entity_1.ZunoLifeSignal)
], ZunoLifeSignalSource.prototype, "signal", void 0);
exports.ZunoLifeSignalSource = ZunoLifeSignalSource = __decorate([
    (0, typeorm_1.Entity)('zuno_life_signal_sources'),
    (0, typeorm_1.Index)('idx_zuno_life_signal_sources_signal', ['life_signal_id']),
    (0, typeorm_1.Index)('idx_zuno_life_signal_sources_ref', ['source_event_id'])
], ZunoLifeSignalSource);
//# sourceMappingURL=zuno-life-signal-source.entity.js.map