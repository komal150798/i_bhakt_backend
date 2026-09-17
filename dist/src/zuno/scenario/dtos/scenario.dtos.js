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
exports.WhatIfView = exports.ScenarioSetView = exports.ScenarioView = exports.WhatIfRequestDto = exports.ScenarioTriggeredDto = exports.ScenarioDecisionDto = exports.ListScenariosQueryDto = exports.GenerateScenariosDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const scenario_enum_1 = require("../enums/scenario.enum");
class GenerateScenariosDto {
}
exports.GenerateScenariosDto = GenerateScenariosDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The challenge to map possibilities for.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateScenariosDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Why this set is being generated, e.g. USER_REASSESSMENT.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 48),
    __metadata("design:type", String)
], GenerateScenariosDto.prototype, "reason", void 0);
class ListScenariosQueryDto {
}
exports.ListScenariosQueryDto = ListScenariosQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The challenge whose scenarios to read.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ListScenariosQueryDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ListScenariosQueryDto.prototype, "includeAll", void 0);
class ScenarioDecisionDto {
}
exports.ScenarioDecisionDto = ScenarioDecisionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [
            scenario_enum_1.ScenarioStatus.USER_ADOPTED,
            scenario_enum_1.ScenarioStatus.USER_REJECTED,
            scenario_enum_1.ScenarioStatus.DISMISSED,
        ],
        description: 'The user\'s own decision about this path (Step 12 sections 68-69).',
    }),
    (0, class_validator_1.IsEnum)(scenario_enum_1.ScenarioStatus),
    __metadata("design:type", String)
], ScenarioDecisionDto.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Why, in the user\'s own words.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], ScenarioDecisionDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Version the client last saw.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ScenarioDecisionDto.prototype, "version", void 0);
class ScenarioTriggeredDto {
}
exports.ScenarioTriggeredDto = ScenarioTriggeredDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'What actually happened, in their words.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], ScenarioTriggeredDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Version the client last saw.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ScenarioTriggeredDto.prototype, "version", void 0);
class WhatIfRequestDto {
}
exports.WhatIfRequestDto = WhatIfRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The challenge to branch the hypothetical from.' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WhatIfRequestDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The hypothetical, in the user\'s own words.',
        example: 'What if I lose my job next month?',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 2000),
    __metadata("design:type", String)
], WhatIfRequestDto.prototype, "question", void 0);
class ScenarioView {
    static from(scenario) {
        return {
            id: scenario.id,
            name: scenario.name,
            type: scenario.case_class,
            scenarioType: scenario.scenario_type,
            description: scenario.description,
            confidence: scenario.probability_label ?? 'PLAUSIBLE',
            impact: scenario.impact,
            horizon: scenario.horizon,
            status: scenario.status,
            hypothetical: scenario.hypothetical,
            version: scenario.version,
            preparation: (scenario.payload?.scenario_specific_preparation ?? []).map((prep) => prep.action),
        };
    }
}
exports.ScenarioView = ScenarioView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioView.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: scenario_enum_1.ScenarioCaseClass }),
    __metadata("design:type", String)
], ScenarioView.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: scenario_enum_1.ScenarioType }),
    __metadata("design:type", String)
], ScenarioView.prototype, "scenarioType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioView.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Qualitative attention label. Never a probability or a percentage.',
        example: 'PLAUSIBLE',
    }),
    __metadata("design:type", String)
], ScenarioView.prototype, "confidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: scenario_enum_1.ScenarioImpact }),
    __metadata("design:type", String)
], ScenarioView.prototype, "impact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: scenario_enum_1.ScenarioHorizon }),
    __metadata("design:type", String)
], ScenarioView.prototype, "horizon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: scenario_enum_1.ScenarioStatus }),
    __metadata("design:type", String)
], ScenarioView.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Always false for a generated scenario set.' }),
    __metadata("design:type", Boolean)
], ScenarioView.prototype, "hypothetical", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ScenarioView.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], ScenarioView.prototype, "preparation", void 0);
class ScenarioSetView {
    static from(set, scenarios) {
        return {
            scenarioSetId: set.id,
            challengeId: set.challenge_id,
            version: set.version_number,
            scenarios: scenarios.map(ScenarioView.from),
            sharedPreparation: (set.shared_preparation ?? []).map((prep) => prep.action),
            watchSignals: set.watch_signals ?? [],
            decisionReadiness: set.decision_readiness,
            generatedAt: set.created_at.toISOString(),
            astrologyAvailable: set.provenance?.astro_available ?? false,
        };
    }
}
exports.ScenarioSetView = ScenarioSetView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioSetView.prototype, "scenarioSetId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioSetView.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ScenarioSetView.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ScenarioView] }),
    __metadata("design:type", Array)
], ScenarioSetView.prototype, "scenarios", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], ScenarioSetView.prototype, "sharedPreparation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], ScenarioSetView.prototype, "watchSignals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ScenarioSetView.prototype, "decisionReadiness", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScenarioSetView.prototype, "generatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ScenarioSetView.prototype, "astrologyAvailable", void 0);
class WhatIfView {
    static from(session, assumptions) {
        const result = session.result;
        return {
            sessionId: session.id,
            mode: 'HYPOTHETICAL',
            hypothetical: session.is_hypothetical,
            assumptions: assumptions.map((entry) => entry.assumption_text),
            implications: (result?.implications ?? []).map((entry) => entry.text),
            controllableFactors: result?.controllable_actions ?? [],
            existingPreparationThatHelps: result?.existing_preparation_that_helps ?? [],
            recommendedPreparation: (result?.preparation ?? []).map((prep) => prep.action),
            impact: result?.impact ?? scenario_enum_1.ScenarioImpact.MODERATE,
            currentPlanChanged: session.current_plan_changed,
            notice: result?.hypothetical_notice ?? '',
            createdAt: session.created_at.toISOString(),
        };
    }
}
exports.WhatIfView = WhatIfView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WhatIfView.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'HYPOTHETICAL' }),
    __metadata("design:type", String)
], WhatIfView.prototype, "mode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], WhatIfView.prototype, "hypothetical", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], WhatIfView.prototype, "assumptions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], WhatIfView.prototype, "implications", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], WhatIfView.prototype, "controllableFactors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], WhatIfView.prototype, "existingPreparationThatHelps", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], WhatIfView.prototype, "recommendedPreparation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Qualitative impact. Never a probability.' }),
    __metadata("design:type", String)
], WhatIfView.prototype, "impact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], WhatIfView.prototype, "currentPlanChanged", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mandatory user-facing notice. Step 12 section 40 requires it verbatim.',
    }),
    __metadata("design:type", String)
], WhatIfView.prototype, "notice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WhatIfView.prototype, "createdAt", void 0);
//# sourceMappingURL=scenario.dtos.js.map