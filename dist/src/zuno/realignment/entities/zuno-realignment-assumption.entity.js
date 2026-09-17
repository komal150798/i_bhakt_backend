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
exports.ZunoRealignmentAssumption = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_realignment_entity_1 = require("./zuno-realignment.entity");
const enums_1 = require("../enums");
let ZunoRealignmentAssumption = class ZunoRealignmentAssumption extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoRealignmentAssumption = ZunoRealignmentAssumption;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'realignment_id' }),
    __metadata("design:type", String)
], ZunoRealignmentAssumption.prototype, "realignment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoRealignmentAssumption.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, name: 'assumption_key' }),
    __metadata("design:type", String)
], ZunoRealignmentAssumption.prototype, "assumption_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoRealignmentAssumption.prototype, "statement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoRealignmentAssumption.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoRealignmentAssumption.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'invalidated_by_signal_id', nullable: true }),
    __metadata("design:type", String)
], ZunoRealignmentAssumption.prototype, "invalidated_by_signal_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'affected_components',
        default: () => "'[]'::jsonb",
    }),
    __metadata("design:type", Array)
], ZunoRealignmentAssumption.prototype, "affected_components", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_realignment_entity_1.ZunoRealignment, (realignment) => realignment.assumptions, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'realignment_id' }),
    __metadata("design:type", zuno_realignment_entity_1.ZunoRealignment)
], ZunoRealignmentAssumption.prototype, "realignment", void 0);
exports.ZunoRealignmentAssumption = ZunoRealignmentAssumption = __decorate([
    (0, typeorm_1.Entity)('zuno_realignment_assumptions'),
    (0, typeorm_1.Index)('idx_zuno_realignment_assumptions_realignment', ['realignment_id']),
    (0, typeorm_1.Index)('idx_zuno_realignment_assumptions_status', ['status'])
], ZunoRealignmentAssumption);
//# sourceMappingURL=zuno-realignment-assumption.entity.js.map