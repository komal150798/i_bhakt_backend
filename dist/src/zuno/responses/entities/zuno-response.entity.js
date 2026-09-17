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
exports.ZunoResponse = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
let ZunoResponse = class ZunoResponse extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoResponse = ZunoResponse;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'conversation_id', nullable: true }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "conversation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'response_type' }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "response_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'structured_payload' }),
    __metadata("design:type", Object)
], ZunoResponse.prototype, "structured_payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'rendered_text', nullable: true }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "rendered_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'context_version', nullable: true }),
    __metadata("design:type", Number)
], ZunoResponse.prototype, "context_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'model_version', nullable: true }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "model_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'prompt_version', nullable: true }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "prompt_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'engine_version' }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "engine_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rulebook_version_id', nullable: true }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "rulebook_version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'safety_decision_id', nullable: true }),
    __metadata("design:type", String)
], ZunoResponse.prototype, "safety_decision_id", void 0);
exports.ZunoResponse = ZunoResponse = __decorate([
    (0, typeorm_1.Entity)('zuno_responses'),
    (0, typeorm_1.Index)('idx_zuno_responses_challenge', ['challenge_id', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_responses_user', ['user_id', 'created_at'])
], ZunoResponse);
//# sourceMappingURL=zuno-response.entity.js.map