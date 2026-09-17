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
exports.ZunoEngineRun = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
let ZunoEngineRun = class ZunoEngineRun extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoEngineRun = ZunoEngineRun;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoEngineRun.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id', nullable: true }),
    __metadata("design:type", String)
], ZunoEngineRun.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'engine_type' }),
    __metadata("design:type", String)
], ZunoEngineRun.prototype, "engine_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: enums_1.EngineRunStatus.PENDING }),
    __metadata("design:type", String)
], ZunoEngineRun.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'input_reference' }),
    __metadata("design:type", Object)
], ZunoEngineRun.prototype, "input_reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'output_reference', nullable: true }),
    __metadata("design:type", Object)
], ZunoEngineRun.prototype, "output_reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'started_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoEngineRun.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoEngineRun.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, name: 'error_code', nullable: true }),
    __metadata("design:type", String)
], ZunoEngineRun.prototype, "error_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ZunoEngineRun.prototype, "progress", void 0);
exports.ZunoEngineRun = ZunoEngineRun = __decorate([
    (0, typeorm_1.Entity)('zuno_engine_runs'),
    (0, typeorm_1.Index)('idx_zuno_engine_runs_challenge', ['challenge_id', 'engine_type']),
    (0, typeorm_1.Index)('idx_zuno_engine_runs_status', ['status', 'created_at'])
], ZunoEngineRun);
//# sourceMappingURL=zuno-engine-run.entity.js.map