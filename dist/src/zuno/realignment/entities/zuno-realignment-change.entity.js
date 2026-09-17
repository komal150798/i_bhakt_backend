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
exports.ZunoRealignmentChange = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_realignment_entity_1 = require("./zuno-realignment.entity");
const enums_1 = require("../enums");
let ZunoRealignmentChange = class ZunoRealignmentChange extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoRealignmentChange = ZunoRealignmentChange;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'realignment_id' }),
    __metadata("design:type", String)
], ZunoRealignmentChange.prototype, "realignment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoRealignmentChange.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'entity_type' }),
    __metadata("design:type", String)
], ZunoRealignmentChange.prototype, "entity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'entity_id', nullable: true }),
    __metadata("design:type", String)
], ZunoRealignmentChange.prototype, "entity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'change_type' }),
    __metadata("design:type", String)
], ZunoRealignmentChange.prototype, "change_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'before_value', nullable: true }),
    __metadata("design:type", Object)
], ZunoRealignmentChange.prototype, "before_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'after_value', nullable: true }),
    __metadata("design:type", Object)
], ZunoRealignmentChange.prototype, "after_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoRealignmentChange.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_realignment_entity_1.ZunoRealignment, (realignment) => realignment.changes, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'realignment_id' }),
    __metadata("design:type", zuno_realignment_entity_1.ZunoRealignment)
], ZunoRealignmentChange.prototype, "realignment", void 0);
exports.ZunoRealignmentChange = ZunoRealignmentChange = __decorate([
    (0, typeorm_1.Entity)('zuno_realignment_changes'),
    (0, typeorm_1.Index)('idx_zuno_realignment_changes_realignment', ['realignment_id']),
    (0, typeorm_1.Index)('idx_zuno_realignment_changes_entity', ['entity_type', 'entity_id'])
], ZunoRealignmentChange);
//# sourceMappingURL=zuno-realignment-change.entity.js.map