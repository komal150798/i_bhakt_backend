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
exports.ZunoChallengeDomain = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
const zuno_challenge_entity_1 = require("./zuno-challenge.entity");
let ZunoChallengeDomain = class ZunoChallengeDomain extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoChallengeDomain = ZunoChallengeDomain;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id' }),
    __metadata("design:type", String)
], ZunoChallengeDomain.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoChallengeDomain.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ZunoChallengeDomain.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, name: 'risk_class' }),
    __metadata("design:type", String)
], ZunoChallengeDomain.prototype, "risk_class", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_primary', default: false }),
    __metadata("design:type", Boolean)
], ZunoChallengeDomain.prototype, "is_primary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 3, nullable: true }),
    __metadata("design:type", String)
], ZunoChallengeDomain.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, (challenge) => challenge.domains, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoChallengeDomain.prototype, "challenge", void 0);
exports.ZunoChallengeDomain = ZunoChallengeDomain = __decorate([
    (0, typeorm_1.Entity)('zuno_challenge_domains'),
    (0, typeorm_1.Index)('idx_zuno_challenge_domains_lookup', ['challenge_id', 'domain'], {
        unique: true,
    })
], ZunoChallengeDomain);
//# sourceMappingURL=zuno-challenge-domain.entity.js.map