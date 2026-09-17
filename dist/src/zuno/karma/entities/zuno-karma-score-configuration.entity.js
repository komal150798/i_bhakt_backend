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
exports.ZunoKarmaScoreConfiguration = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const karma_enum_1 = require("../enums/karma.enum");
let ZunoKarmaScoreConfiguration = class ZunoKarmaScoreConfiguration extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoKarmaScoreConfiguration = ZunoKarmaScoreConfiguration;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, unique: true }),
    __metadata("design:type", String)
], ZunoKarmaScoreConfiguration.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ZunoKarmaScoreConfiguration.prototype, "configuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: karma_enum_1.KarmaScoreConfigStatus.DRAFT }),
    __metadata("design:type", String)
], ZunoKarmaScoreConfiguration.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'rescore_policy',
        default: karma_enum_1.KarmaRescorePolicy.FUTURE_ONLY,
    }),
    __metadata("design:type", String)
], ZunoKarmaScoreConfiguration.prototype, "rescore_policy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'effective_from' }),
    __metadata("design:type", Date)
], ZunoKarmaScoreConfiguration.prototype, "effective_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'effective_to', nullable: true }),
    __metadata("design:type", Date)
], ZunoKarmaScoreConfiguration.prototype, "effective_to", void 0);
exports.ZunoKarmaScoreConfiguration = ZunoKarmaScoreConfiguration = __decorate([
    (0, typeorm_1.Entity)('zuno_karma_score_configurations'),
    (0, typeorm_1.Index)('idx_zuno_karma_score_configs_status', ['status'])
], ZunoKarmaScoreConfiguration);
//# sourceMappingURL=zuno-karma-score-configuration.entity.js.map