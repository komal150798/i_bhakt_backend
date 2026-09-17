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
exports.ZunoScenarioCondition = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_scenario_entity_1 = require("./zuno-scenario.entity");
const scenario_enum_1 = require("../enums/scenario.enum");
let ZunoScenarioCondition = class ZunoScenarioCondition extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoScenarioCondition = ZunoScenarioCondition;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'scenario_id' }),
    __metadata("design:type", String)
], ZunoScenarioCondition.prototype, "scenario_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoScenarioCondition.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'condition_type' }),
    __metadata("design:type", String)
], ZunoScenarioCondition.prototype, "condition_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ZunoScenarioCondition.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'signal_definition',
        default: () => "'{}'::jsonb",
    }),
    __metadata("design:type", Object)
], ZunoScenarioCondition.prototype, "signal_definition", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_scenario_entity_1.ZunoScenario, (scenario) => scenario.conditions, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'scenario_id' }),
    __metadata("design:type", zuno_scenario_entity_1.ZunoScenario)
], ZunoScenarioCondition.prototype, "scenario", void 0);
exports.ZunoScenarioCondition = ZunoScenarioCondition = __decorate([
    (0, typeorm_1.Entity)('zuno_scenario_conditions'),
    (0, typeorm_1.Index)('idx_zuno_scenario_conditions_scenario', ['scenario_id', 'condition_type']),
    (0, typeorm_1.Index)('idx_zuno_scenario_conditions_user', ['user_id'])
], ZunoScenarioCondition);
//# sourceMappingURL=zuno-scenario-condition.entity.js.map