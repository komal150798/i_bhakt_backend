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
exports.LlmFutureSelfEngine = exports.FUTURE_SELF_ENGINE_VERSION = exports.FUTURE_SELF_PROMPT_VERSION = void 0;
const common_1 = require("@nestjs/common");
const zuno_ai_gateway_service_1 = require("../../ai/services/zuno-ai-gateway.service");
const future_self_narrative_schema_1 = require("../schemas/future-self-narrative.schema");
const future_self_enum_1 = require("../enums/future-self.enum");
exports.FUTURE_SELF_PROMPT_VERSION = 'future-self-generate-v1.0.0';
exports.FUTURE_SELF_ENGINE_VERSION = 'future-self-llm-1.0.0';
let LlmFutureSelfEngine = class LlmFutureSelfEngine {
    constructor(gateway) {
        this.gateway = gateway;
    }
    async generate(request) {
        const result = await this.gateway.callStructured({
            operationType: 'FUTURE_SELF_GENERATE',
            systemPrompt: buildSystemPrompt(request.mode),
            userPrompt: buildUserPrompt(request),
            promptTemplateVersion: exports.FUTURE_SELF_PROMPT_VERSION,
            validate: future_self_narrative_schema_1.validateFutureSelfNarrative,
            temperature: 0.3,
            maxTokens: 1200,
            timeoutMs: 45000,
            maxAttempts: 2,
        });
        return {
            narrative: result.value,
            engineVersion: exports.FUTURE_SELF_ENGINE_VERSION,
            modelVersion: `${result.modelProvider}/${result.modelName}`,
            aiGenerationRunId: result.runId,
        };
    }
};
exports.LlmFutureSelfEngine = LlmFutureSelfEngine;
exports.LlmFutureSelfEngine = LlmFutureSelfEngine = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [zuno_ai_gateway_service_1.ZunoAiGateway])
], LlmFutureSelfEngine);
function buildSystemPrompt(mode) {
    const ceiling = future_self_enum_1.MODE_MAX_SUMMARY_CHARS[mode] ?? 900;
    return [
        'You write as a person\'s own wiser, better-prepared future perspective, speaking with them about a situation they are working through. You are a way of thinking, not a being. You are not an oracle, a guru, a therapist or a fortune teller.',
        '',
        'Return ONLY a JSON object. No prose, no markdown fences.',
        '',
        'THE MOST IMPORTANT RULE:',
        'You may only state things that appear in the CONTEXT below. If a fact is not there, it does not exist for you. You have no knowledge of this person beyond what is given, and no knowledge whatsoever of what will happen to them.',
        '',
        'NEVER, under any circumstances:',
        '  - name an employer, company, recruiter or person that is not already in the CONTEXT',
        '  - name or describe a future partner, spouse or relationship that is not in the CONTEXT',
        '  - state a salary, package, figure or amount that is not in the CONTEXT',
        '  - promise, guarantee or predict an outcome. Not "you will get the job", not "everything works out", not "your job is safe", not "by March you will have".',
        '  - claim to have seen the future or to be speaking from a specific future year',
        '  - attribute anything to karma, planets, stars, destiny or fate',
        '  - say the person has become calmer, stronger or happier unless the CONTEXT says so in their own words',
        '  - turn a behaviour into an identity. "We have postponed this a few times" is allowed. "You always avoid difficult conversations" is not.',
        '',
        'VOICE:',
        'Use "we", "our" and "us". This creates continuity between who they were and who they are becoming. Stay calm, grounded, practical and forward-looking. Do not praise excessively. Do not preach. Do not use the person\'s name.',
        '',
        'DO NOT PERFORM MEMORY:',
        'Never list what you remember to prove you remember it. Never say "as you told me N days ago". Refer to a past fact only where it changes what to do now - for example, "since the loan terms are already clear, we do not need to spend this week on them".',
        '',
        'GROUNDING:',
        'For every claim you make about what happened, put the matching source reference from the CONTEXT into source_refs. Use the exact "Type:id" strings given. Do not invent references.',
        '',
        `LENGTH: the summary must be at most ${ceiling} characters.`,
        mode === future_self_enum_1.FutureSelfMode.DAILY
            ? 'This is the DAILY mode: two or three sentences. One thing that moved, one useful next move. Nothing more.'
            : '',
        mode === future_self_enum_1.FutureSelfMode.REFLECTION
            ? 'This is the REFLECTION mode: name what actually worked, evidenced by completed actions. Not perfection, not a character assessment.'
            : '',
        mode === future_self_enum_1.FutureSelfMode.REALIGNMENT
            ? 'This is the REALIGNMENT mode: the facts changed, so the plan changes. That is not failure. Keep what still helps, drop what no longer matters.'
            : '',
        '',
        'Schema:',
        JSON.stringify(SCHEMA_SHAPE, null, 2),
    ]
        .filter((line) => line !== '')
        .join('\n');
}
function buildUserPrompt(request) {
    const { context } = request;
    const parts = [`MODE: ${request.mode}`];
    if (context.periodStart && context.periodEnd) {
        parts.push(`PERIOD: ${context.periodStart} to ${context.periodEnd}`);
    }
    if (context.challengeTitle || context.challengeSummary) {
        parts.push([
            'CURRENT SITUATION:',
            context.challengeTitle ?? '',
            context.challengeSummary ?? '',
        ]
            .filter(Boolean)
            .join('\n'));
    }
    if (context.relevantMemory.length > 0) {
        parts.push(`WHAT IS KNOWN (relevant only):\n${bullets(context.relevantMemory)}`);
    }
    if (context.planTitle || context.openPlanItems.length > 0) {
        parts.push([
            'CURRENT PLAN:',
            context.planTitle ?? '(untitled)',
            context.openPlanItems.length > 0 ? bullets(context.openPlanItems) : '',
        ]
            .filter(Boolean)
            .join('\n'));
    }
    if (context.completedActions.length > 0) {
        parts.push(`ALREADY DONE:\n${bullets(context.completedActions)}`);
    }
    else {
        parts.push('ALREADY DONE:\n(nothing recorded yet - do not imply any action was completed)');
    }
    if (context.openLoops.length > 0) {
        parts.push(`STILL OPEN:\n${bullets(context.openLoops)}`);
    }
    if (context.observedPatterns.length > 0) {
        parts.push(`OBSERVED (evidence-backed, describe as observation not identity):\n${bullets(context.observedPatterns)}`);
    }
    if (context.timingContext) {
        parts.push(`TIMING CONTEXT (approved wording; it explains why preparation mattered, it does not predict anything):\n${context.timingContext}`);
    }
    parts.push('Write the narrative now, using only the facts above.');
    return parts.join('\n\n');
}
function bullets(values) {
    return values.map((value) => `- ${value}`).join('\n');
}
const SCHEMA_SHAPE = {
    summary: 'string - what we have actually done, what has changed, and what matters next. Grounded only.',
    progress_themes: ['string - a theme visible in the completed actions'],
    open_loops: ['string - something still unresolved'],
    strengths_observed: [
        'string - a strength evidenced by a completed action, not a compliment',
    ],
    next_focus: ['string - the next thing that matters, phrased as a choice'],
    source_refs: ['ZunoMemory:uuid', 'ZunoChallenge:uuid'],
};
//# sourceMappingURL=llm-future-self.engine.js.map