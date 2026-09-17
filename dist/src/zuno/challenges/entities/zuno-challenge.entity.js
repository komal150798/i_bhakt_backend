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
exports.ZunoChallenge = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_challenge_context_entity_1 = require("./zuno-challenge-context.entity");
const zuno_challenge_domain_entity_1 = require("./zuno-challenge-domain.entity");
let ZunoChallenge = class ZunoChallenge extends zuno_base_entity_1.ZunoVersionedEntity {
};
exports.ZunoChallenge = ZunoChallenge;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'raw_user_statement' }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "raw_user_statement", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'primary_domain',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "primary_domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        default: enums_1.ChallengeStatus.NEW,
    }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "urgency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 16,
        name: 'emotional_intensity',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "emotional_intensity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ZunoChallenge.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'context_version', default: 0 }),
    __metadata("design:type", Number)
], ZunoChallenge.prototype, "context_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'opened_at' }),
    __metadata("design:type", Date)
], ZunoChallenge.prototype, "opened_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'resolved_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoChallenge.prototype, "resolved_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'resolution_note', nullable: true }),
    __metadata("design:type", String)
], ZunoChallenge.prototype, "resolution_note", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoChallenge.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_challenge_context_entity_1.ZunoChallengeContext, (context) => context.challenge),
    __metadata("design:type", Array)
], ZunoChallenge.prototype, "contexts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_challenge_domain_entity_1.ZunoChallengeDomain, (domain) => domain.challenge),
    __metadata("design:type", Array)
], ZunoChallenge.prototype, "domains", void 0);
exports.ZunoChallenge = ZunoChallenge = __decorate([
    (0, typeorm_1.Entity)('zuno_challenges'),
    (0, typeorm_1.Index)('idx_zuno_challenges_user_status', ['user_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_challenges_user_opened', ['user_id', 'opened_at'])
], ZunoChallenge);
//# sourceMappingURL=zuno-challenge.entity.js.map