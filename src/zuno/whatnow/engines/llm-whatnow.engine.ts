import { Injectable, Logger } from '@nestjs/common';
import {
  IWhatNowEngine,
  WhatNowExtractionRequest,
  WhatNowExtractionResult,
} from './whatnow.port';
import { ZunoAiGateway } from '../../ai/services/zuno-ai-gateway.service';
import { validateWhatNowExtraction } from '../schemas/whatnow-extraction.schema';
import {
  ChallengeTimeline,
  ContextItemSource,
  ContextItemType,
  EmotionalIntensity,
  EmotionalSignal,
  GoalStatus,
  SafetyFlag,
  Urgency,
  ZUNO_DOMAINS,
} from '../../common/enums';

/**
 * Prompt template version. Build Rule 88-89: prompts are versioned engineering
 * assets, and a material change requires a new version plus Golden regression.
 * Bump this whenever the wording below changes in a way that could move
 * classification.
 */
export const WHATNOW_PROMPT_VERSION = 'whatnow-extract-v1.0.0';

/** Engine version recorded on every persisted context (Step 11 section 60). */
export const WHATNOW_ENGINE_VERSION = 'whatnow-llm-1.0.0';

/**
 * LLM-backed WhatNow extraction.
 *
 * Implements the port so it can be replaced by an HTTP adapter to the Python
 * intelligence service without touching WhatNowService (Step 21 section 27).
 *
 * Step 11 section 61 asks for a single structured understanding pass rather
 * than chaining several model calls, so the whole extraction is one request.
 * Step 11 section 54 constrains what the model is allowed to do: semantic
 * extraction, classification and inference - it returns a schema, and ZUNO
 * software decides what happens next.
 */
@Injectable()
export class LlmWhatNowEngine implements IWhatNowEngine {
  private readonly logger = new Logger(LlmWhatNowEngine.name);

  constructor(private readonly gateway: ZunoAiGateway) {}

  async extract(
    request: WhatNowExtractionRequest,
  ): Promise<WhatNowExtractionResult> {
    const result = await this.gateway.callStructured({
      operationType: 'WHATNOW_EXTRACT',
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt(request),
      promptTemplateVersion: WHATNOW_PROMPT_VERSION,
      validate: validateWhatNowExtraction,
      // Low temperature: this is a classification task, not a creative one.
      temperature: 0.1,
      maxTokens: 3000,
      timeoutMs: 45000,
      maxAttempts: 2,
    });

    return {
      extraction: result.value,
      extractorVersion: WHATNOW_ENGINE_VERSION,
      aiGenerationRunId: result.runId,
    };
  }
}

/**
 * The extraction instruction.
 *
 * Every constraint here traces to a specification rule, because Step 29 warns
 * against prompts drifting into product design:
 *   Step 11 s.8   fact vs fear vs assumption is the central distinction
 *   Step 11 s.19  inferred goals are marked INFERRED, never USER_STATED
 *   Step 11 s.16  never invent a date the user did not supply
 *   Step 11 s.24  emotional signal, never a clinical diagnosis
 *   Step 11 s.26  urgency is separate from emotional intensity
 *   Step 11 s.4   do not predict, do not plan, do not produce astrology
 *   Step 11 s.31  clarification questions ranked by information gain
 */
function buildSystemPrompt(): string {
  return [
    'You are the understanding layer of a life-navigation system. Your only job is to convert what a person said about their life into a structured representation. You do not advise, predict, plan, or reference astrology.',
    '',
    'Return ONLY a JSON object. No prose, no markdown fences.',
    '',
    'THE MOST IMPORTANT RULE:',
    'Distinguish what is true from what the person fears. "Layoffs are happening at my company" is a FACT. "I might lose my job" is a FEAR, even though the same person said both in the same breath. Never record a fear, worry, or possibility as a FACT. Getting this wrong causes the system to tell someone a feared event is certain.',
    '',
    'Classify every extracted statement with one of these types:',
    `  ${Object.values(ContextItemType).join(', ')}`,
    '',
    'Mark the provenance of every statement:',
    `  ${Object.values(ContextItemSource).join(', ')}`,
    '  USER_STATED  = the person said it',
    '  INFERRED     = you concluded it from what they said',
    '',
    'Life domains (choose exactly one primary, plus any secondary that genuinely apply):',
    `  ${ZUNO_DOMAINS.join(', ')}`,
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
    `Emotional signals - observed tone only, never a diagnosis: ${Object.values(EmotionalSignal).join(', ')}`,
    `Emotional intensity: ${Object.values(EmotionalIntensity).join(', ')}`,
    `Urgency - how soon action is actually needed, which is NOT the same as how worried they sound: ${Object.values(Urgency).join(', ')}`,
    '',
    `Safety flags, only if genuinely indicated: ${Object.values(SafetyFlag).join(', ')}`,
    '',
    'missing_information: questions that would materially change the guidance, each with information_gain 0-1. Rank by how much the answer would change things. Do not produce a questionnaire - if you have enough to be useful, return few or none.',
    '',
    'confidence: 0-1, how well you understood the situation overall. Be honest. If the person said something vague like "nothing is working", confidence should be low and missing_information should carry one good question.',
    '',
    'Schema:',
    JSON.stringify(SCHEMA_SHAPE, null, 2),
  ].join('\n');
}

function buildUserPrompt(request: WhatNowExtractionRequest): string {
  const parts: string[] = [];
  const known = request.knownContext;

  // Minimal context only. Build Rule 93 / Step 21 Anti-Pattern 139: do not send
  // the user's entire history to every call.
  if (known?.countryCode) {
    parts.push(`Known context - country: ${known.countryCode}`);
  }
  if (known?.previousSummary) {
    parts.push(
      `Previously understood about this same situation: ${known.previousSummary}`,
    );
  }
  parts.push('What the person said:');
  parts.push(request.statement);
  return parts.join('\n\n');
}

/** Example shape sent to the model so the field names are unambiguous. */
const SCHEMA_SHAPE = {
  summary: 'string - plain language, what this person is actually facing',
  primary_domain: 'CAREER',
  secondary_domains: [{ domain: 'FINANCE', confidence: 0.9 }],
  theme: 'JOB_SECURITY',
  subthemes: ['LAYOFF_RISK'],
  items: [
    {
      text: 'Layoffs are occurring at the employer',
      type: ContextItemType.FACT,
      source: ContextItemSource.USER_STATED,
      confidence: 0.95,
    },
    {
      text: 'They may lose their job',
      type: ContextItemType.FEAR,
      source: ContextItemSource.USER_STATED,
      confidence: 0.98,
    },
  ],
  dependencies: [
    { from: 'Employment', to: 'Monthly income', description: 'optional' },
  ],
  desired_outcomes: [
    { goal: 'Maintain financial stability', status: GoalStatus.INFERRED, confidence: 0.8 },
  ],
  decisions: [
    { question: 'Stay employed or start a business?', options: ['Stay', 'Start'], confidence: 0.9 },
  ],
  controllable: ['CV readiness', 'Networking'],
  external: ['Employer restructuring decisions'],
  temporal_anchors: [
    { raw: 'in about four months', normalized_date: null, timeline: ChallengeTimeline.UPCOMING },
  ],
  missing_information: [
    {
      question: 'Is the bigger worry finding another role, or covering costs during a gap?',
      information_gain: 0.9,
      rationale: 'changes whether the plan leads with job search or financial buffer',
    },
  ],
  emotional_signals: [EmotionalSignal.WORRIED],
  emotional_intensity: EmotionalIntensity.HIGH,
  urgency: Urgency.HIGH,
  safety_flags: [],
  confidence: 0.91,
};
