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
exports.ZunoChallengeLink = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
let ZunoChallengeLink = class ZunoChallengeLink extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoChallengeLink = ZunoChallengeLink;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'source_challenge_id' }),
    __metadata("design:type", String)
], ZunoChallengeLink.prototype, "source_challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'target_challenge_id' }),
    __metadata("design:type", String)
], ZunoChallengeLink.prototype, "target_challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoChallengeLink.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'relationship_type' }),
    __metadata("design:type", String)
], ZunoChallengeLink.prototype, "relationship_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZunoChallengeLink.prototype, "reason", void 0);
exports.ZunoChallengeLink = ZunoChallengeLink = __decorate([
    (0, typeorm_1.Entity)('zuno_challenge_links'),
    (0, typeorm_1.Index)('idx_zuno_challenge_links_unique', ['source_challenge_id', 'target_challenge_id', 'relationship_type'], { unique: true }),
    (0, typeorm_1.Index)('idx_zuno_challenge_links_target', ['target_challenge_id'])
], ZunoChallengeLink);
//# sourceMappingURL=zuno-challenge-link.entity.js.map