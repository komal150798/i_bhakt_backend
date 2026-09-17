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
var LlmScenarioEngine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmScenarioEngine = exports.SCENARIO_ENGINE_VERSION = exports.SCENARIO_PROMPT_VERSION = void 0;
const common_1 = require("@nestjs/common");
const zuno_ai_gateway_service_1 = require("../../ai/services/zuno-ai-gateway.service");
const scenario_generation_schema_1 = require("../schemas/scenario-generation.schema");
const scenario_enum_1 = require("../enums/scenario.enum");
exports.SCENARIO_PROMPT_VERSION = 'scenario-generate-v1.0.0';
exports.SCENARIO_ENGINE_VERSION = 'scenario-llm-1.0.0';
let LlmScenarioEngine = LlmScenarioEngine_1 = class LlmScenarioEngine {
    constructor(gateway) {
        this.gateway = gateway;
        this.logger = new common_1.Logger(LlmScenarioEngine_1.name);
    }
    async generate(request) {
        const result = await this.gateway.callStructured({
            operationType: 'SCENARIO_GENERATE',
            systemPrompt: buildSystemPrompt(request),
            userPrompt: buildUserPrompt(request),
            promptTemplateVersion: exports.SCENARIO_PROMPT_VERSION,
            validate: scenario_generation_schema_1.validateScenarioGeneration,
            temperature: 0.3,
            maxTokens: 4000,
            timeoutMs: 60000,
            maxAttempts: 3,
        });
        return {
            generation: result.value,
            engineVersion: exports.SCENARIO_ENGINE_VERSION,
            promptVersion: exports.SCENARIO_PROMPT_VERSION,
            aiGenerationRunId: result.runId,
        };
    }
};
exports.LlmScenarioEngine = LlmScenarioEngine;
exports.LlmScenarioEngine = LlmScenarioEngine = LlmScenarioEngine_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [zuno_ai_gateway_service_1.ZunoAiGateway])
], LlmScenarioEngine);
function buildSystemPrompt(request) {
    return [
        'You help a person prepare for several realistic futures. You are not a fortune teller and you do not predict events.',
        '',
        'Return ONLY a JSON object. No prose, no markdown fences.',
        '',
        'THE MOST IMPORTANT RULE:',
        'A scenario is a possibility worth preparing for, never a determined outcome. Never write that something will happen, is guaranteed, is certain, is inevitable, is fated, or cannot be avoided. Never give a percentage or numeric probability for an event - not "70% chance", not "likelihood 0.7". Never say what another person will decide or do. Describe each path in the present or conditional: "Employment continues while the restructuring settles", "If the role is removed, ...". A response that asserts an outcome is rejected and discarded.',
        '',
        `Produce between 2 and ${request.max_scenarios} scenarios. Three is usually right. Do not invent a path to reach a number, and do not split one path into two by rewording it. Each scenario must be a materially different future: "Stay employed", "Remain in current job" and "Continue working" are one scenario, not three.`,
        '',
        'Distinguish two things that are easy to confuse:',
        '  An OPTION is something this person can choose (start a job search).',
        '  A SCENARIO is something that may happen (the employer removes the role).',
        'Use scenario_type DECISION only when the person is genuinely choosing between alternatives.',
        '',
        `scenario_type: ${Object.values(scenario_enum_1.ScenarioType).join(', ')}`,
        `horizon: ${Object.values(scenario_enum_1.ScenarioHorizon).join(', ')}`,
        `impact - how much this path would change their life: ${Object.values(scenario_enum_1.ScenarioImpact).join(', ')}`,
        `relevance - how much attention this path deserves RIGHT NOW. This is NOT the chance it happens: ${Object.values(scenario_enum_1.ScenarioRelevance).join(', ')}`,
        'Use relevance CONTINGENCY for a path that is not the most likely but is too important to ignore.',
        '',
        'confidence (0-1): how confident you are that this is a reasonable scenario worth modelling. It is NOT the probability the event occurs.',
        '',
        `basis: why this scenario exists. Every scenario needs at least one. Source types: ${Object.values(scenario_enum_1.ScenarioEvidenceClass).join(', ')}. Do not rest a scenario entirely on SYSTEM_INFERENCE - it must trace to something the person said, something happening around them, a dependency they described, a decision they are facing, or an approved theme supplied below.`,
        '',
        'signals_for: concrete, observable things that would make this path more relevant (a formal consultation, a contract renewal, an interview invitation). signals_against: observable things that would weaken it. These are watched for later, so they must be things a person could actually notice and report.',
        '',
        'dependencies: only chains that follow from what this person actually described. If they said income services a loan, "employment ends -> income interruption -> loan pressure" is supported. Do not extend a chain into territory they never mentioned.',
        '',
        `scenario_specific_preparation: what helps in THIS path only. shared_preparation: actions that help across several of these futures regardless of which one happens - this is the most valuable thing you produce, so give it real thought. Classify preparation as ${Object.values(scenario_enum_1.PreparationClass).join(', ')}.`,
        '',
        'watch_signals: the union of what is worth watching across all paths.',
        '',
        `reversibility, for DECISION scenarios: ${Object.values(scenario_enum_1.Reversibility).join(', ')}. Applying for a role is highly reversible; resigning with no alternative is not.`,
        '',
        `decision_readiness: ${Object.values(scenario_enum_1.DecisionReadiness).join(', ')} - whether there is enough information here to compare the alternatives.`,
        '',
        'Do not generate a dramatic path because it is technically possible, and do not generate a reassuring one to make the person feel better. Both distort preparation. If only two materially distinct paths exist, return two.',
        '',
        request.astro
            ? 'Approved themes are supplied below. They may influence which paths deserve attention and roughly when, and nothing else. Do not derive specific events from them and do not mention astrology, planets, charts or timing systems in any text you return.'
            : 'No approved themes are available for this person right now. Produce the scenarios from their situation alone. Do not mention astrology, and do not compensate by inventing themes.',
        '',
        'Schema:',
        JSON.stringify(SCHEMA_SHAPE, null, 2),
    ].join('\n');
}
function buildUserPrompt(request) {
    const parts = [];
    parts.push(`Situation: ${request.summary}`);
    if (request.facts.length > 0) {
        parts.push(`What is actually true:\n- ${request.facts.join('\n- ')}`);
    }
    if (request.concerns.length > 0) {
        parts.push(`What they are worried about, which is NOT established fact:\n- ${request.concerns.join('\n- ')}`);
    }
    if (request.dependencies.length > 0) {
        parts.push(`Known dependencies:\n- ${request.dependencies
            .map((edge) => `${edge.from} -> ${edge.to}`)
            .join('\n- ')}`);
    }
    if (request.decisions.length > 0) {
        parts.push(`Decisions they are facing:\n- ${request.decisions
            .map((d) => `${d.question} (${d.options.join(' / ')})`)
            .join('\n- ')}`);
    }
    if (request.controllable.length > 0) {
        parts.push(`Within their control:\n- ${request.controllable.join('\n- ')}`);
    }
    if (request.external.length > 0) {
        parts.push(`Outside their control:\n- ${request.external.join('\n- ')}`);
    }
    if (request.temporal_anchors.length > 0) {
        parts.push(`Timing in their own words:\n- ${request.temporal_anchors
            .map((a) => a.raw)
            .join('\n- ')}`);
    }
    if (request.domains.length > 0) {
        parts.push(`Life areas involved: ${request.domains.join(', ')}`);
    }
    if (request.rejected_paths.length > 0) {
        parts.push(`They have explicitly ruled these out. Do not propose them again:\n- ${request.rejected_paths.join('\n- ')}`);
    }
    if (request.astro) {
        const astro = request.astro;
        const lines = [];
        if (astro.supportive_themes.length > 0) {
            lines.push(`Supportive themes: ${astro.supportive_themes.join(', ')}`);
        }
        if (astro.caution_themes.length > 0) {
            lines.push(`Caution themes: ${astro.caution_themes.join(', ')}`);
        }
        if (astro.timing_windows.length > 0) {
            lines.push(`Timing notes: ${astro.timing_windows.join(', ')}`);
        }
        if (lines.length > 0) {
            parts.push(`Approved themes (influence attention and timing only):\n${lines.join('\n')}`);
        }
    }
    return parts.join('\n\n');
}
const SCHEMA_SHAPE = {
    seeds: [
        'Current job continues',
        'Role is restructured internally',
        'Current employment ends',
    ],
    scenarios: [
        {
            title: 'Stay in the current role',
            summary: 'Employment continues while the company works through its restructuring.',
            scenario_type: scenario_enum_1.ScenarioType.CONTINUITY,
            horizon: scenario_enum_1.ScenarioHorizon.NEAR_TERM,
            impact: scenario_enum_1.ScenarioImpact.MODERATE,
            relevance: scenario_enum_1.ScenarioRelevance.HIGH,
            confidence: 0.78,
            basis: [
                {
                    type: scenario_enum_1.ScenarioEvidenceClass.CURRENT_REALITY,
                    reference: 'Still employed while restructuring is underway',
                },
            ],
            signals_for: ['Manager reassurance', 'New responsibility allocated'],
            signals_against: ['Responsibility reduced', 'Formal consultation opened'],
            dependencies: [
                { from: 'Employment', to: 'Monthly income', description: 'optional' },
            ],
            risks: ['Visibility drops during a reorganisation'],
            opportunities: ['Ownership of work others are leaving behind'],
            controllable_factors: ['Delivery quality', 'Manager alignment'],
            impact_areas: ['CAREER', 'FINANCE'],
            scenario_specific_preparation: [
                { action: 'Increase internal visibility', classification: scenario_enum_1.PreparationClass.SCENARIO_SPECIFIC },
            ],
            benefits: [],
            constraints: [],
            reversibility: null,
            option_ref: null,
        },
    ],
    shared_preparation: [
        { action: 'Refresh the CV', classification: scenario_enum_1.PreparationClass.COMMON },
        { action: 'Understand the loan options', classification: scenario_enum_1.PreparationClass.COMMON },
    ],
    watch_signals: ['Formal restructuring notice', 'Interview invitation'],
    comparison: [
        {
            dimension: 'Financial stability',
            values: { 'Stay in the current role': 'HIGH', 'Transition out': 'LOW' },
        },
    ],
    decision_readiness: scenario_enum_1.DecisionReadiness.PARTIALLY_READY,
    safety_flags: [],
};
//# sourceMappingURL=llm-scenario.engine.js.map