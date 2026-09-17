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
exports.ZunoLifeSignalConfirmation = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_life_signal_entity_1 = require("./zuno-life-signal.entity");
const enums_1 = require("../enums");
let ZunoLifeSignalConfirmation = class ZunoLifeSignalConfirmation extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoLifeSignalConfirmation = ZunoLifeSignalConfirmation;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'life_signal_id' }),
    __metadata("design:type", String)
], ZunoLifeSignalConfirmation.prototype, "life_signal_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoLifeSignalConfirmation.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'from_status' }),
    __metadata("design:type", String)
], ZunoLifeSignalConfirmation.prototype, "from_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'to_status' }),
    __metadata("design:type", String)
], ZunoLifeSignalConfirmation.prototype, "to_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'actor_type' }),
    __metadata("design:type", String)
], ZunoLifeSignalConfirmation.prototype, "actor_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'actor_id', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignalConfirmation.prototype, "actor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'prompt_text', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignalConfirmation.prototype, "prompt_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'response_note', nullable: true }),
    __metadata("design:type", String)
], ZunoLifeSignalConfirmation.prototype, "response_note", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_life_signal_entity_1.ZunoLifeSignal, (signal) => signal.confirmations, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'life_signal_id' }),
    __metadata("design:type", zuno_life_signal_entity_1.ZunoLifeSignal)
], ZunoLifeSignalConfirmation.prototype, "signal", void 0);
exports.ZunoLifeSignalConfirmation = ZunoLifeSignalConfirmation = __decorate([
    (0, typeorm_1.Entity)('zuno_life_signal_confirmations'),
    (0, typeorm_1.Index)('idx_zuno_life_signal_confirmations_signal', [
        'life_signal_id',
        'created_at',
    ])
], ZunoLifeSignalConfirmation);
//# sourceMappingURL=zuno-life-signal-confirmation.entity.js.map