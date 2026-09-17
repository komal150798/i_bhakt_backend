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
exports.ZunoChallengeContext = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_challenge_entity_1 = require("./zuno-challenge.entity");
let ZunoChallengeContext = class ZunoChallengeContext extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoChallengeContext = ZunoChallengeContext;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id' }),
    __metadata("design:type", String)
], ZunoChallengeContext.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoChallengeContext.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'version_number' }),
    __metadata("design:type", Number)
], ZunoChallengeContext.prototype, "version_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoChallengeContext.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ZunoChallengeContext.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ZunoChallengeContext.prototype, "routing", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 3 }),
    __metadata("design:type", String)
], ZunoChallengeContext.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'clarification_required', default: false }),
    __metadata("design:type", Boolean)
], ZunoChallengeContext.prototype, "clarification_required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'extractor_version' }),
    __metadata("design:type", String)
], ZunoChallengeContext.prototype, "extractor_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'ai_generation_run_id', nullable: true }),
    __metadata("design:type", String)
], ZunoChallengeContext.prototype, "ai_generation_run_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, name: 'created_reason' }),
    __metadata("design:type", String)
], ZunoChallengeContext.prototype, "created_reason", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, (challenge) => challenge.contexts, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoChallengeContext.prototype, "challenge", void 0);
exports.ZunoChallengeContext = ZunoChallengeContext = __decorate([
    (0, typeorm_1.Entity)('zuno_challenge_contexts'),
    (0, typeorm_1.Index)('idx_zuno_challenge_contexts_version', ['challenge_id', 'version_number'], { unique: true })
], ZunoChallengeContext);
//# sourceMappingURL=zuno-challenge-context.entity.js.map