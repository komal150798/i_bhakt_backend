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
exports.ZunoKarmaPattern = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const karma_enum_1 = require("../enums/karma.enum");
let ZunoKarmaPattern = class ZunoKarmaPattern extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoKarmaPattern = ZunoKarmaPattern;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoKarmaPattern.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaPattern.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, name: 'pattern_type' }),
    __metadata("design:type", String)
], ZunoKarmaPattern.prototype, "pattern_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'evidence_count', default: 0 }),
    __metadata("design:type", Number)
], ZunoKarmaPattern.prototype, "evidence_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 3, nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaPattern.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: karma_enum_1.KarmaPatternStatus.OBSERVED }),
    __metadata("design:type", String)
], ZunoKarmaPattern.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'first_observed_at' }),
    __metadata("design:type", Date)
], ZunoKarmaPattern.prototype, "first_observed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'last_observed_at' }),
    __metadata("design:type", Date)
], ZunoKarmaPattern.prototype, "last_observed_at", void 0);
exports.ZunoKarmaPattern = ZunoKarmaPattern = __decorate([
    (0, typeorm_1.Entity)('zuno_karma_patterns'),
    (0, typeorm_1.Index)('idx_zuno_karma_patterns_user', ['user_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_karma_patterns_user_type', ['user_id', 'pattern_type']),
    (0, typeorm_1.Index)('idx_zuno_karma_patterns_challenge', ['challenge_id'])
], ZunoKarmaPattern);
//# sourceMappingURL=zuno-karma-pattern.entity.js.map