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
exports.ZunoMkaCompletion = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const mka_enum_1 = require("../enums/mka.enum");
let ZunoMkaCompletion = class ZunoMkaCompletion extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoMkaCompletion = ZunoMkaCompletion;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'mka_item_id' }),
    __metadata("design:type", String)
], ZunoMkaCompletion.prototype, "mka_item_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'mka_program_id' }),
    __metadata("design:type", String)
], ZunoMkaCompletion.prototype, "mka_program_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoMkaCompletion.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'completion_date' }),
    __metadata("design:type", String)
], ZunoMkaCompletion.prototype, "completion_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoMkaCompletion.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'user_note', nullable: true }),
    __metadata("design:type", String)
], ZunoMkaCompletion.prototype, "user_note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: mka_enum_1.MkaCompletionSource.USER }),
    __metadata("design:type", String)
], ZunoMkaCompletion.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'karma_eligible', default: false }),
    __metadata("design:type", Boolean)
], ZunoMkaCompletion.prototype, "karma_eligible", void 0);
exports.ZunoMkaCompletion = ZunoMkaCompletion = __decorate([
    (0, typeorm_1.Entity)('zuno_mka_completions'),
    (0, typeorm_1.Index)('idx_zuno_mka_completions_item', ['mka_item_id', 'completion_date'], {
        unique: true,
    }),
    (0, typeorm_1.Index)('idx_zuno_mka_completions_user', ['user_id', 'completion_date']),
    (0, typeorm_1.Index)('idx_zuno_mka_completions_program', ['mka_program_id', 'status'])
], ZunoMkaCompletion);
//# sourceMappingURL=zuno-mka-completion.entity.js.map