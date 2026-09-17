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
var LlmWhatIfEngine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmWhatIfEngine = exports.WHAT_IF_ENGINE_VERSION = exports.WHAT_IF_PROMPT_VERSION = void 0;
const common_1 = require("@nestjs/common");
const zuno_ai_gateway_service_1 = require("../../ai/services/zuno-ai-gateway.service");
const what_if_exploration_schema_1 = require("../schemas/what-if-exploration.schema");
const scenario_enum_1 = require("../enums/scenario.enum");
exports.WHAT_IF_PROMPT_VERSION = 'what-if-explore-v1.0.0';
exports.WHAT_IF_ENGINE_VERSION = 'what-if-llm-1.0.0';
let LlmWhatIfEngine = LlmWhatIfEngine_1 = class LlmWhatIfEngine {
    constructor(gateway) {
        this.gateway = gateway;
        this.logger = new common_1.Logger(LlmWhatIfEngine_1.name);
    }
    async explore(request) {
        const result = await this.gateway.callStructured({
            operationType: 'WHAT_IF_EXPLORE',
            systemPrompt: buildSystemPrompt(request),
            userPrompt: buildUserPrompt(request),
            promptTemplateVersion: exports.WHAT_IF_PROMPT_VERSION,
            validate: what_if_exploration_schema_1.validateWhatIfExploration,
            temperature: 0.2,
            maxTokens: 2500,
            timeoutMs: 45000,
            maxAttempts: 3,
        });
        return {
            exploration: result.value,
            engineVersion: exports.WHAT_IF_ENGINE_VERSION,
            promptVersion: exports.WHAT_IF_PROMPT_VERSION,
            aiGenerationRunId: result.runId,
        };
    }
};
exports.LlmWhatIfEngine = LlmWhatIfEngine;
exports.LlmWhatIfEngine = LlmWhatIfEngine = LlmWhatIfEngine_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [zuno_ai_gateway_service_1.ZunoAiGateway])
], LlmWhatIfEngine);
function buildSystemPrompt(request) {
    return [
        'A person is asking you to think through a hypothetical. Accept their premise for the sake of the exercise and work out what would follow, so they can see what is worth preparing.',
        '',
        'Return ONLY a JSON object. No prose, no markdown fences.',
        '',
        'THE MOST IMPORTANT RULE:',
        'The premise is hypothetical. The consequences must stay possibilities too. Never write that something will happen, is certain, is guaranteed, is inevitable or cannot be avoided. Never give a numeric probability. Never state what another person - a partner, an employer, a bank, a court - will decide or do; describe what could follow and what the person could prepare for. A response that asserts an outcome is rejected and discarded.',
        '',
        `Follow consequences no more than ${request.max_cascade_depth} layers deep, and only along dependencies this person has actually described. If they told you their income services a loan, "income stops -> loan servicing becomes sensitive" is grounded. Do not continue into losing their home, their marriage failing or their health declining unless they described those links themselves. Mark each implication with its layer.`,
        '',
        `Label the grounding of each implication: ${Object.values(scenario_enum_1.ScenarioEvidenceClass).join(', ')}. Use DEPENDENCY when it follows a dependency they described, and name it in dependency_reference.`,
        '',
        `assumptions: the hypothetical itself is USER_STATED. Anything you concluded from propagating a dependency is DERIVED_DEPENDENCY. A real current fact you are carrying forward unchanged is CONTEXT_CARRIED. Types: ${Object.values(scenario_enum_1.WhatIfAssumptionType).join(', ')}.`,
        '',
        'controllable_actions: what remains in this person\'s hands in that situation. This is the point of the exercise - a hypothetical that leaves someone feeling powerless has failed.',
        '',
        'existing_preparation_that_helps: from the preparation already under way, which of it would still help here. Only name things listed below; do not invent preparation they have not started.',
        '',
        `preparation: further contingency actions. Classify as ${Object.values(scenario_enum_1.PreparationClass).join(', ')}. You are proposing preparation, not scheduling it.`,
        '',
        `impact: ${Object.values(scenario_enum_1.ScenarioImpact).join(', ')}. reversibility: ${Object.values(scenario_enum_1.Reversibility).join(', ')} or null.`,
        '',
        'If the hypothetical touches money, law, immigration, medicine or a formal process, stay at the level of general planning and say what a qualified professional would need to confirm. Do not invent what a specific bank, court, employer or authority would decide.',
        '',
        request.astro
            ? 'Approved themes are supplied below. They may colour what deserves attention and roughly when. Do not derive specific events from them and do not mention astrology in any text you return.'
            : 'No approved themes are available. Work from the situation alone and do not mention astrology.',
        '',
        'Schema:',
        JSON.stringify(SCHEMA_SHAPE, null, 2),
    ].join('\n');
}
function buildUserPrompt(request) {
    const parts = [];
    parts.push(`Their hypothetical question: ${request.question}`);
    parts.push(`Their current situation: ${request.summary}`);
    if (request.facts.length > 0) {
        parts.push(`Established facts today:\n- ${request.facts.join('\n- ')}`);
    }
    if (request.dependencies.length > 0) {
        parts.push(`Dependencies they described. These are the ONLY chains you may follow:\n- ${request.dependencies
            .map((edge) => `${edge.from} -> ${edge.to}`)
            .join('\n- ')}`);
    }
    if (request.controllable.length > 0) {
        parts.push(`Within their control:\n- ${request.controllable.join('\n- ')}`);
    }
    if (request.external.length > 0) {
        parts.push(`Outside their control:\n- ${request.external.join('\n- ')}`);
    }
    if (request.existing_preparation.length > 0) {
        parts.push(`Preparation already under way:\n- ${request.existing_preparation.join('\n- ')}`);
    }
    if (request.domains.length > 0) {
        parts.push(`Life areas involved: ${request.domains.join(', ')}`);
    }
    if (request.astro) {
        const lines = [];
        if (request.astro.supportive_themes.length > 0) {
            lines.push(`Supportive themes: ${request.astro.supportive_themes.join(', ')}`);
        }
        if (request.astro.caution_themes.length > 0) {
            lines.push(`Caution themes: ${request.astro.caution_themes.join(', ')}`);
        }
        if (lines.length > 0) {
            parts.push(`Approved themes (attention and timing only):\n${lines.join('\n')}`);
        }
    }
    return parts.join('\n\n');
}
const SCHEMA_SHAPE = {
    assumption: 'Employment ends next month',
    assumptions: [
        { text: 'Employment ends next month', type: scenario_enum_1.WhatIfAssumptionType.USER_STATED, dependency_reference: null },
        {
            text: 'Primary salary stops at the same time',
            type: scenario_enum_1.WhatIfAssumptionType.DERIVED_DEPENDENCY,
            dependency_reference: 'Employment -> Monthly income',
        },
    ],
    implications: [
        {
            text: 'The main income source would pause',
            layer: 1,
            basis: scenario_enum_1.ScenarioEvidenceClass.DEPENDENCY,
            dependency_reference: 'Employment -> Monthly income',
        },
        {
            text: 'Loan servicing would become more sensitive to timing',
            layer: 2,
            basis: scenario_enum_1.ScenarioEvidenceClass.DEPENDENCY,
            dependency_reference: 'Monthly income -> Home loan servicing',
        },
    ],
    controllable_actions: [
        'Prepare employment documents',
        'Speak to the lender about options before anything changes',
    ],
    existing_preparation_that_helps: ['Updated CV'],
    preparation: [
        { action: 'Clarify the loan contingency terms', classification: scenario_enum_1.PreparationClass.CONTINGENCY_ONLY },
    ],
    impact_areas: ['CAREER', 'FINANCE'],
    impact: scenario_enum_1.ScenarioImpact.HIGH,
    reversibility: scenario_enum_1.Reversibility.MEDIUM,
    safety_flags: [],
    confidence: 0.8,
};
//# sourceMappingURL=llm-what-if.engine.js.map