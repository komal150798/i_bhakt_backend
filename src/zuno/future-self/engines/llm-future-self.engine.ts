import { Injectable } from '@nestjs/common';
import {
  FutureSelfGenerationRequest,
  FutureSelfGenerationResult,
  IFutureSelfEngine,
} from './future-self.port';
import { ZunoAiGateway } from '../../ai/services/zuno-ai-gateway.service';
import { validateFutureSelfNarrative } from '../schemas/future-self-narrative.schema';
import { FutureSelfMode, MODE_MAX_SUMMARY_CHARS } from '../enums/future-self.enum';

/**
 * Prompt template version. Build Rules 88-89: prompts are versioned engineering
 * assets and a material change needs a new version plus Golden regression. Bump
 * this whenever the wording below could move what the model produces.
 */
export const FUTURE_SELF_PROMPT_VERSION = 'future-self-generate-v1.0.0';

/** Engine version recorded on every persisted narrative. */
export const FUTURE_SELF_ENGINE_VERSION = 'future-self-llm-1.0.0';

/**
 * LLM-backed Future Self generation.
 *
 * Every model call goes through ZunoAiGateway (Build Rule 81) - there is no
 * provider SDK reachable from here - and the gateway will not return anything
 * that failed `validateFutureSelfNarrative`.
 *
 * The prompt states the section 71 boundary because a model told the rule is
 * more likely to follow it, and following it is cheaper than being refused.
 * But the prompt is not the control. `checkFutureSelfBoundary` runs on this
 * output in FutureSelfService and discards anything that crosses the line
 * regardless of what the prompt asked for. If the two ever disagree, the
 * validator wins.
 */
@Injectable()
export class LlmFutureSelfEngine implements IFutureSelfEngine {
  constructor(private readonly gateway: ZunoAiGateway) {}

  async generate(
    request: FutureSelfGenerationRequest,
  ): Promise<FutureSelfGenerationResult> {
    const result = await this.gateway.callStructured({
      operationType: 'FUTURE_SELF_GENERATE',
      systemPrompt: buildSystemPrompt(request.mode),
      userPrompt: buildUserPrompt(request),
      promptTemplateVersion: FUTURE_SELF_PROMPT_VERSION,
      validate: validateFutureSelfNarrative,
      // Low but not zero. This is synthesis of supplied facts, not creative
      // writing; Step 18 section 78 also asks it not to sound mechanical.
      temperature: 0.3,
      maxTokens: 1200,
      timeoutMs: 45000,
      maxAttempts: 2,
    });

    return {
      narrative: result.value,
      engineVersion: FUTURE_SELF_ENGINE_VERSION,
      modelVersion: `${result.modelProvider}/${result.modelName}`,
      aiGenerationRunId: result.runId,
    };
  }
}

/**
 * The generation instruction.
 *
 * Every constraint traces to a specification line, because Step 29 warns
 * against prompts drifting into product design:
 *   s.3, s.5   not a supernatural entity, not a prediction, no literal future
 *   s.4        collaborative "we" voice
 *   s.38       every statement traceable to a supplied fact
 *   s.40       the four prohibited sentences
 *   s.41-42    astrology and Karma give context, never certainty or causation
 *   s.68,117   patterns are observations, not identities
 *   s.77       calm, grounded, non-preachy; no guru or oracle voice
 *   s.78-79    do not perform memory; recall only what helps now
 *   s.107      no unevidenced emotional growth
 *   roadmap 71 never invent employer, partner, salary or guaranteed outcome
 */
function buildSystemPrompt(mode: FutureSelfMode): string {
  const ceiling = MODE_MAX_SUMMARY_CHARS[mode] ?? 900;

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
    mode === FutureSelfMode.DAILY
      ? 'This is the DAILY mode: two or three sentences. One thing that moved, one useful next move. Nothing more.'
      : '',
    mode === FutureSelfMode.REFLECTION
      ? 'This is the REFLECTION mode: name what actually worked, evidenced by completed actions. Not perfection, not a character assessment.'
      : '',
    mode === FutureSelfMode.REALIGNMENT
      ? 'This is the REALIGNMENT mode: the facts changed, so the plan changes. That is not failure. Keep what still helps, drop what no longer matters.'
      : '',
    '',
    'Schema:',
    JSON.stringify(SCHEMA_SHAPE, null, 2),
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * The context block.
 *
 * Step 18 section 87 and Build Rule 93: minimum relevant context only. The
 * memory list arriving here has already been relevance-filtered and bounded by
 * MemoryService.retrieve(), so this function assembles - it does not select.
 */
function buildUserPrompt(request: FutureSelfGenerationRequest): string {
  const { context } = request;
  const parts: string[] = [`MODE: ${request.mode}`];

  if (context.periodStart && context.periodEnd) {
    parts.push(`PERIOD: ${context.periodStart} to ${context.periodEnd}`);
  }
  if (context.challengeTitle || context.challengeSummary) {
    parts.push(
      [
        'CURRENT SITUATION:',
        context.challengeTitle ?? '',
        context.challengeSummary ?? '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }
  if (context.relevantMemory.length > 0) {
    parts.push(
      `WHAT IS KNOWN (relevant only):\n${bullets(context.relevantMemory)}`,
    );
  }
  if (context.planTitle || context.openPlanItems.length > 0) {
    parts.push(
      [
        'CURRENT PLAN:',
        context.planTitle ?? '(untitled)',
        context.openPlanItems.length > 0 ? bullets(context.openPlanItems) : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }
  if (context.completedActions.length > 0) {
    parts.push(`ALREADY DONE:\n${bullets(context.completedActions)}`);
  } else {
    // Honest absence beats a silent gap. Step 18 section 38 forbids fabricated
    // progress, and a model given no progress list has been known to supply one.
    parts.push(
      'ALREADY DONE:\n(nothing recorded yet - do not imply any action was completed)',
    );
  }
  if (context.openLoops.length > 0) {
    parts.push(`STILL OPEN:\n${bullets(context.openLoops)}`);
  }
  if (context.observedPatterns.length > 0) {
    parts.push(
      `OBSERVED (evidence-backed, describe as observation not identity):\n${bullets(context.observedPatterns)}`,
    );
  }
  if (context.timingContext) {
    // Step 18 section 41: approved timing language only, and never converted
    // into certainty.
    parts.push(
      `TIMING CONTEXT (approved wording; it explains why preparation mattered, it does not predict anything):\n${context.timingContext}`,
    );
  }

  parts.push(
    'Write the narrative now, using only the facts above.',
  );
  return parts.join('\n\n');
}

function bullets(values: string[]): string {
  return values.map((value) => `- ${value}`).join('\n');
}

/** Example shape sent to the model so the field names are unambiguous. */
const SCHEMA_SHAPE = {
  summary:
    'string - what we have actually done, what has changed, and what matters next. Grounded only.',
  progress_themes: ['string - a theme visible in the completed actions'],
  open_loops: ['string - something still unresolved'],
  strengths_observed: [
    'string - a strength evidenced by a completed action, not a compliment',
  ],
  next_focus: ['string - the next thing that matters, phrased as a choice'],
  source_refs: ['ZunoMemory:uuid', 'ZunoChallenge:uuid'],
};
