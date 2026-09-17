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
exports.ZunoAiGenerationRun = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
let ZunoAiGenerationRun = class ZunoAiGenerationRun extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoAiGenerationRun = ZunoAiGenerationRun;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], ZunoAiGenerationRun.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoAiGenerationRun.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, name: 'operation_type' }),
    __metadata("design:type", String)
], ZunoAiGenerationRun.prototype, "operation_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'model_provider' }),
    __metadata("design:type", String)
], ZunoAiGenerationRun.prototype, "model_provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'model_name' }),
    __metadata("design:type", String)
], ZunoAiGenerationRun.prototype, "model_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'model_version', nullable: true }),
    __metadata("design:type", String)
], ZunoAiGenerationRun.prototype, "model_version", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        name: 'prompt_template_version',
    }),
    __metadata("design:type", String)
], ZunoAiGenerationRun.prototype, "prompt_template_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'input_reference' }),
    __metadata("design:type", Object)
], ZunoAiGenerationRun.prototype, "input_reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'output_reference', nullable: true }),
    __metadata("design:type", Object)
], ZunoAiGenerationRun.prototype, "output_reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24 }),
    __metadata("design:type", String)
], ZunoAiGenerationRun.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'latency_ms', nullable: true }),
    __metadata("design:type", Number)
], ZunoAiGenerationRun.prototype, "latency_ms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'attempt_count', default: 1 }),
    __metadata("design:type", Number)
], ZunoAiGenerationRun.prototype, "attempt_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'token_usage', nullable: true }),
    __metadata("design:type", Object)
], ZunoAiGenerationRun.prototype, "token_usage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'bigint',
        name: 'cost_micro_usd',
        nullable: true,
        transformer: {
            to: (value) => value,
            from: (value) => (value === null ? null : Number(value)),
        },
    }),
    __metadata("design:type", Number)
], ZunoAiGenerationRun.prototype, "cost_micro_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'pricing_version',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoAiGenerationRun.prototype, "pricing_version", void 0);
exports.ZunoAiGenerationRun = ZunoAiGenerationRun = __decorate([
    (0, typeorm_1.Entity)('zuno_ai_generation_runs'),
    (0, typeorm_1.Index)('idx_zuno_ai_runs_operation', ['operation_type', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_ai_runs_challenge', ['challenge_id'])
], ZunoAiGenerationRun);
//# sourceMappingURL=zuno-ai-generation-run.entity.js.map