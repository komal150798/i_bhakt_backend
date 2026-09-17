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
exports.ZunoScenarioSet = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_scenario_entity_1 = require("./zuno-scenario.entity");
const scenario_enum_1 = require("../enums/scenario.enum");
let ZunoScenarioSet = class ZunoScenarioSet extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoScenarioSet = ZunoScenarioSet;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id' }),
    __metadata("design:type", String)
], ZunoScenarioSet.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoScenarioSet.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'version_number' }),
    __metadata("design:type", Number)
], ZunoScenarioSet.prototype, "version_number", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 24,
        default: scenario_enum_1.ScenarioSetStatus.CURRENT,
    }),
    __metadata("design:type", String)
], ZunoScenarioSet.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 48, name: 'generated_reason' }),
    __metadata("design:type", String)
], ZunoScenarioSet.prototype, "generated_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'shared_preparation', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoScenarioSet.prototype, "shared_preparation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'watch_signals', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoScenarioSet.prototype, "watch_signals", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoScenarioSet.prototype, "seeds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoScenarioSet.prototype, "comparison", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoScenarioSet.prototype, "diff", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'decision_readiness',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoScenarioSet.prototype, "decision_readiness", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ZunoScenarioSet.prototype, "provenance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'user_facing_count', default: 0 }),
    __metadata("design:type", Number)
], ZunoScenarioSet.prototype, "user_facing_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'safety_decision_id', nullable: true }),
    __metadata("design:type", String)
], ZunoScenarioSet.prototype, "safety_decision_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'ai_generation_run_id', nullable: true }),
    __metadata("design:type", String)
], ZunoScenarioSet.prototype, "ai_generation_run_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoScenarioSet.prototype, "challenge", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_scenario_entity_1.ZunoScenario, (scenario) => scenario.scenarioSet),
    __metadata("design:type", Array)
], ZunoScenarioSet.prototype, "scenarios", void 0);
exports.ZunoScenarioSet = ZunoScenarioSet = __decorate([
    (0, typeorm_1.Entity)('zuno_scenario_sets'),
    (0, typeorm_1.Index)('idx_zuno_scenario_sets_version', ['challenge_id', 'version_number'], { unique: true }),
    (0, typeorm_1.Index)('idx_zuno_scenario_sets_user', ['user_id', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_scenario_sets_current', ['challenge_id', 'status'])
], ZunoScenarioSet);
//# sourceMappingURL=zuno-scenario-set.entity.js.map