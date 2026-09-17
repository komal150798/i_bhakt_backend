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
exports.ZunoWhatIfAssumption = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_what_if_session_entity_1 = require("./zuno-what-if-session.entity");
const scenario_enum_1 = require("../enums/scenario.enum");
let ZunoWhatIfAssumption = class ZunoWhatIfAssumption extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoWhatIfAssumption = ZunoWhatIfAssumption;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'what_if_session_id' }),
    __metadata("design:type", String)
], ZunoWhatIfAssumption.prototype, "what_if_session_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoWhatIfAssumption.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'assumption_text' }),
    __metadata("design:type", String)
], ZunoWhatIfAssumption.prototype, "assumption_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'assumption_type' }),
    __metadata("design:type", String)
], ZunoWhatIfAssumption.prototype, "assumption_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ZunoWhatIfAssumption.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_what_if_session_entity_1.ZunoWhatIfSession, (session) => session.assumptions, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'what_if_session_id' }),
    __metadata("design:type", zuno_what_if_session_entity_1.ZunoWhatIfSession)
], ZunoWhatIfAssumption.prototype, "session", void 0);
exports.ZunoWhatIfAssumption = ZunoWhatIfAssumption = __decorate([
    (0, typeorm_1.Entity)('zuno_what_if_assumptions'),
    (0, typeorm_1.Index)('idx_zuno_what_if_assumptions_session', ['what_if_session_id']),
    (0, typeorm_1.Index)('idx_zuno_what_if_assumptions_user', ['user_id'])
], ZunoWhatIfAssumption);
//# sourceMappingURL=zuno-what-if-assumption.entity.js.map