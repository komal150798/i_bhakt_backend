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
var LlmWhatNowEngine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmWhatNowEngine = exports.WHATNOW_ENGINE_VERSION = exports.WHATNOW_PROMPT_VERSION = void 0;
const common_1 = require("@nestjs/common");
const zuno_ai_gateway_service_1 = require("../../ai/services/zuno-ai-gateway.service");
const whatnow_extraction_schema_1 = require("../schemas/whatnow-extraction.schema");
const enums_1 = require("../../common/enums");
exports.WHATNOW_PROMPT_VERSION = 'whatnow-extract-v1.0.0';
exports.WHATNOW_ENGINE_VERSION = 'whatnow-llm-1.0.0';
let LlmWhatNowEngine = LlmWhatNowEngine_1 = class LlmWhatNowEngine {
    constructor(gateway) {
        this.gateway = gateway;
        this.logger = new common_1.Logger(LlmWhatNowEngine_1.name);
    }
    async extract(request) {
        const result = await this.gateway.callStructured({
            operationType: 'WHATNOW_EXTRACT',
            systemPrompt: buildSystemPrompt(),
            userPrompt: buildUserPrompt(request),
            promptTemplateVersion: exports.WHATNOW_PROMPT_VERSION,
            validate: whatnow_extraction_schema_1.validateWhatNowExtraction,
            temperature: 0.1,
            maxTokens: 3000,
            timeoutMs: 45000,
            maxAttempts: 2,
        });
        return {
            extraction: result.value,
            extractorVersion: exports.WHATNOW_ENGINE_VERSION,
            aiGenerationRunId: result.runId,
        };
    }
};
exports.LlmWhatNowEngine = LlmWhatNowEngine;
exports.LlmWhatNowEngine = LlmWhatNowEngine = LlmWhatNowEngine_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [zuno_ai_gateway_service_1.ZunoAiGateway])
], LlmWhatNowEngine);
function buildSystemPrompt() {
    return [
        'You are the understanding layer of a life-navigation system. Your only job is to convert what a person said about their life into a structured representation. You do not advise, predict, plan, or reference astrology.',
        '',
        'Return ONLY a JSON object. No prose, no markdown fences.',
        '',
        'THE MOST IMPORTANT RULE:',
        'Distinguish what is true from what the person fears. "Layoffs are happening at my company" is a FACT. "I might lose my job" is a FEAR, even though the same person said both in the same breath. Never record a fear, worry, or possibility as a FACT. Getting this wrong causes the system to tell someone a feared event is certain.',
        '',
        'Classify every extracted statement with one of these types:',
        `  ${Object.values(enums_1.ContextItemType).join(', ')}`,
        '',
        'Mark the provenance of every statement:',
        `  ${Object.values(enums_1.ContextItemSource).join(', ')}`,
        '  USER_STATED  = the person said it',
        '  INFERRED     = you concluded it from what they said',
        '',
        'Life domains (choose exactly one primary, plus any secondary that genuinely apply):',
        `  ${enums_1.ZUNO_DOMAINS.join(', ')}`,
        'Choose the primary domain by the person\'s central concern, not by which words appear most often. Someone whose marriage is strained because of business debt may be primarily worried about the marriage, or primarily about the money - read what they are actually anxious about.',
        '',
        'Dependencies: capture what rests on what, as from -> to. If income pays a loan, that is a dependency. These matter more than categories.',
        '',
        'Desired outcomes: if the person stated a goal, status is USER_STATED. If you inferred it, status is INFERRED. Never mark an inference as USER_STATED.',
        '',
        'Controllable vs external: separate what this person can influence from what they cannot. This is what turns worry into action later.',
        '',
        'Dates: only set normalized_date (YYYY-MM-DD) when the person gave enough information to determine it without guessing. Otherwise null. Keep their own words in "raw".',
        '',
        `Emotional signals - observed tone only, never a diagnosis: ${Object.values(enums_1.EmotionalSignal).join(', ')}`,
        `Emotional intensity: ${Object.values(enums_1.EmotionalIntensity).join(', ')}`,
        `Urgency - how soon action is actually needed, which is NOT the same as how worried they sound: ${Object.values(enums_1.Urgency).join(', ')}`,
        '',
        `Safety flags, only if genuinely indicated: ${Object.values(enums_1.SafetyFlag).join(', ')}`,
        '',
        'missing_information: questions that would materially change the guidance, each with information_gain 0-1. Rank by how much the answer would change things. Do not produce a questionnaire - if you have enough to be useful, return few or none.',
        '',
        'confidence: 0-1, how well you understood the situation overall. Be honest. If the person said something vague like "nothing is working", confidence should be low and missing_information should carry one good question.',
        '',
        'Schema:',
        JSON.stringify(SCHEMA_SHAPE, null, 2),
    ].join('\n');
}
function buildUserPrompt(request) {
    const parts = [];
    const known = request.knownContext;
    if (known?.countryCode) {
        parts.push(`Known context - country: ${known.countryCode}`);
    }
    if (known?.previousSummary) {
        parts.push(`Previously understood about this same situation: ${known.previousSummary}`);
    }
    parts.push('What the person said:');
    parts.push(request.statement);
    return parts.join('\n\n');
}
const SCHEMA_SHAPE = {
    summary: 'string - plain language, what this person is actually facing',
    primary_domain: 'CAREER',
    secondary_domains: [{ domain: 'FINANCE', confidence: 0.9 }],
    theme: 'JOB_SECURITY',
    subthemes: ['LAYOFF_RISK'],
    items: [
        {
            text: 'Layoffs are occurring at the employer',
            type: enums_1.ContextItemType.FACT,
            source: enums_1.ContextItemSource.USER_STATED,
            confidence: 0.95,
        },
        {
            text: 'They may lose their job',
            type: enums_1.ContextItemType.FEAR,
            source: enums_1.ContextItemSource.USER_STATED,
            confidence: 0.98,
        },
    ],
    dependencies: [
        { from: 'Employment', to: 'Monthly income', description: 'optional' },
    ],
    desired_outcomes: [
        { goal: 'Maintain financial stability', status: enums_1.GoalStatus.INFERRED, confidence: 0.8 },
    ],
    decisions: [
        { question: 'Stay employed or start a business?', options: ['Stay', 'Start'], confidence: 0.9 },
    ],
    controllable: ['CV readiness', 'Networking'],
    external: ['Employer restructuring decisions'],
    temporal_anchors: [
        { raw: 'in about four months', normalized_date: null, timeline: enums_1.ChallengeTimeline.UPCOMING },
    ],
    missing_information: [
        {
            question: 'Is the bigger worry finding another role, or covering costs during a gap?',
            information_gain: 0.9,
            rationale: 'changes whether the plan leads with job search or financial buffer',
        },
    ],
    emotional_signals: [enums_1.EmotionalSignal.WORRIED],
    emotional_intensity: enums_1.EmotionalIntensity.HIGH,
    urgency: enums_1.Urgency.HIGH,
    safety_flags: [],
    confidence: 0.91,
};
//# sourceMappingURL=llm-whatnow.engine.js.map