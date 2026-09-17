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
exports.ZunoScenario = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_scenario_set_entity_1 = require("./zuno-scenario-set.entity");
const zuno_scenario_condition_entity_1 = require("./zuno-scenario-condition.entity");
const scenario_enum_1 = require("../enums/scenario.enum");
let ZunoScenario = class ZunoScenario extends zuno_base_entity_1.ZunoVersionedEntity {
};
exports.ZunoScenario = ZunoScenario;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'scenario_set_id' }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "scenario_set_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'challenge_id' }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'scenario_type' }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "scenario_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'case_class' }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "case_class", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        default: scenario_enum_1.ScenarioStatus.ACTIVE_CANDIDATE,
    }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "relevance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "impact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: scenario_enum_1.ScenarioHorizon.UNSPECIFIED }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "horizon", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'probability_label',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "probability_label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 3, nullable: true }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ZunoScenario.prototype, "hypothetical", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'user_facing', default: true }),
    __metadata("design:type", Boolean)
], ZunoScenario.prototype, "user_facing", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'display_order', default: 0 }),
    __metadata("design:type", Number)
], ZunoScenario.prototype, "display_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'option_ref', nullable: true }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "option_ref", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ZunoScenario.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'user_decision_note', nullable: true }),
    __metadata("design:type", String)
], ZunoScenario.prototype, "user_decision_note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'triggered_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoScenario.prototype, "triggered_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_scenario_set_entity_1.ZunoScenarioSet, (set) => set.scenarios, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'scenario_set_id' }),
    __metadata("design:type", zuno_scenario_set_entity_1.ZunoScenarioSet)
], ZunoScenario.prototype, "scenarioSet", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_challenge_entity_1.ZunoChallenge, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id' }),
    __metadata("design:type", zuno_challenge_entity_1.ZunoChallenge)
], ZunoScenario.prototype, "challenge", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_scenario_condition_entity_1.ZunoScenarioCondition, (condition) => condition.scenario),
    __metadata("design:type", Array)
], ZunoScenario.prototype, "conditions", void 0);
exports.ZunoScenario = ZunoScenario = __decorate([
    (0, typeorm_1.Entity)('zuno_scenarios'),
    (0, typeorm_1.Index)('idx_zuno_scenarios_set', ['scenario_set_id', 'display_order']),
    (0, typeorm_1.Index)('idx_zuno_scenarios_challenge_status', ['challenge_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_scenarios_user', ['user_id']),
    (0, typeorm_1.Index)('idx_zuno_scenarios_relevance', ['challenge_id', 'relevance', 'impact'])
], ZunoScenario);
//# sourceMappingURL=zuno-scenario.entity.js.map