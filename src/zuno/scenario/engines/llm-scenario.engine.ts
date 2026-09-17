import { Injectable, Logger } from '@nestjs/common';
import { ZunoAiGateway } from '../../ai/services/zuno-ai-gateway.service';
import {
  IScenarioEngine,
  ScenarioGenerationRequest,
  ScenarioGenerationResult,
} from '../ports/scenario.port';
import { validateScenarioGeneration } from '../schemas/scenario-generation.schema';
import {
  DecisionReadiness,
  PreparationClass,
  Reversibility,
  ScenarioEvidenceClass,
  ScenarioHorizon,
  ScenarioImpact,
  ScenarioRelevance,
  ScenarioType,
} from '../enums/scenario.enum';

/**
 * Prompt template version. Build Rules 88-89: prompts are versioned engineering
 * assets and a material wording change needs a new version plus a Golden
 * regression run. Bump this whenever the text below changes in a way that could
 * move which scenarios come back.
 */
export const SCENARIO_PROMPT_VERSION = 'scenario-generate-v1.0.0';

/** Engine version recorded on every persisted set (Step 12 section 88). */
export const SCENARIO_ENGINE_VERSION = 'scenario-llm-1.0.0';

/**
 * LLM-backed scenario generation.
 *
 * Implements `IScenarioEngine` so it can be replaced by an HTTP adapter to the
 * Python intelligence service without touching ScenarioService.
 *
 * Every model call goes through ZunoAiGateway (Build Rule 81). There is no
 * provider SDK import in this file and there must never be one: the gateway is
 * the only place that knows how to turn a model response into trusted data, and
 * the only place that writes provenance for the attempts that failed.
 *
 * Three attempts rather than the gateway's default two. The extra attempt is
 * specifically for the deterministic-claim rejection: a model that produced
 * "your role will be terminated" on the first pass often produces acceptable
 * possibility language on the next, and spending one more call is a better
 * trade than returning nothing.
 */
@Injectable()
export class LlmScenarioEngine implements IScenarioEngine {
  private readonly logger = new Logger(LlmScenarioEngine.name);

  constructor(private readonly gateway: ZunoAiGateway) {}

  async generate(
    request: ScenarioGenerationRequest,
  ): Promise<ScenarioGenerationResult> {
    const result = await this.gateway.callStructured({
      operationType: 'SCENARIO_GENERATE',
      systemPrompt: buildSystemPrompt(request),
      userPrompt: buildUserPrompt(request),
      promptTemplateVersion: SCENARIO_PROMPT_VERSION,
      validate: validateScenarioGeneration,
      // Slightly above the WhatNow extraction temperature: distinct paths need
      // some divergence, and a near-zero temperature tends to produce the
      // rewording-not-branching failure Step 12 section 104 warns about.
      temperature: 0.3,
      maxTokens: 4000,
      timeoutMs: 60000,
      maxAttempts: 3,
    });

    return {
      generation: result.value,
      engineVersion: SCENARIO_ENGINE_VERSION,
      promptVersion: SCENARIO_PROMPT_VERSION,
      aiGenerationRunId: result.runId,
    };
  }
}

/**
 * The generation instruction.
 *
 * Every constraint traces to a specification line, because Step 29 warns
 * against prompts drifting into product design:
 *   Step 12 s.2    "these are the paths worth preparing for", not "this is what
 *                  will happen"
 *   Step 12 s.3    boundary: no guarantees, no invented astrology, no invented
 *                  user facts, no fake probabilities
 *   Step 12 s.10   every scenario is a materially different path
 *   Step 12 s.12   no sensationalism; do not optimise for emotional intensity
 *   Step 12 s.13   every scenario retains why it exists
 *   Step 12 s.24   shared preparation is the highest-value output
 *   Step 12 s.28   dependency chains follow the context, never invented
 *   Step 12 s.34   an OPTION is something the user chooses; a SCENARIO is
 *                  something that may happen - never interchangeable
 *   Step 12 s.98-9 neither worst-case bias nor optimism bias
 *   Step 12 s.100  never ask the model to derive events from a chart
 *
 * Note what the prompt does NOT do: it does not ask the model to respect the
 * scenario count, the enums, the dedup rule or the no-prediction rule and then
 * trust it. Each of those is also enforced after the fact - in the validator or
 * in ScenarioService. The prompt raises the hit rate; the code is the control.
 */
function buildSystemPrompt(request: ScenarioGenerationRequest): string {
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
    `scenario_type: ${Object.values(ScenarioType).join(', ')}`,
    `horizon: ${Object.values(ScenarioHorizon).join(', ')}`,
    `impact - how much this path would change their life: ${Object.values(ScenarioImpact).join(', ')}`,
    `relevance - how much attention this path deserves RIGHT NOW. This is NOT the chance it happens: ${Object.values(ScenarioRelevance).join(', ')}`,
    'Use relevance CONTINGENCY for a path that is not the most likely but is too important to ignore.',
    '',
    'confidence (0-1): how confident you are that this is a reasonable scenario worth modelling. It is NOT the probability the event occurs.',
    '',
    `basis: why this scenario exists. Every scenario needs at least one. Source types: ${Object.values(ScenarioEvidenceClass).join(', ')}. Do not rest a scenario entirely on SYSTEM_INFERENCE - it must trace to something the person said, something happening around them, a dependency they described, a decision they are facing, or an approved theme supplied below.`,
    '',
    'signals_for: concrete, observable things that would make this path more relevant (a formal consultation, a contract renewal, an interview invitation). signals_against: observable things that would weaken it. These are watched for later, so they must be things a person could actually notice and report.',
    '',
    'dependencies: only chains that follow from what this person actually described. If they said income services a loan, "employment ends -> income interruption -> loan pressure" is supported. Do not extend a chain into territory they never mentioned.',
    '',
    `scenario_specific_preparation: what helps in THIS path only. shared_preparation: actions that help across several of these futures regardless of which one happens - this is the most valuable thing you produce, so give it real thought. Classify preparation as ${Object.values(PreparationClass).join(', ')}.`,
    '',
    'watch_signals: the union of what is worth watching across all paths.',
    '',
    `reversibility, for DECISION scenarios: ${Object.values(Reversibility).join(', ')}. Applying for a role is highly reversible; resigning with no alternative is not.`,
    '',
    `decision_readiness: ${Object.values(DecisionReadiness).join(', ')} - whether there is enough information here to compare the alternatives.`,
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

function buildUserPrompt(request: ScenarioGenerationRequest): string {
  const parts: string[] = [];

  parts.push(`Situation: ${request.summary}`);

  // Step 12 section 14 and Step 11 section 8: facts and concerns are labelled
  // separately on the way in, so the model cannot flatten a fear into a fact.
  if (request.facts.length > 0) {
    parts.push(`What is actually true:\n- ${request.facts.join('\n- ')}`);
  }
  if (request.concerns.length > 0) {
    parts.push(
      `What they are worried about, which is NOT established fact:\n- ${request.concerns.join('\n- ')}`,
    );
  }
  if (request.dependencies.length > 0) {
    parts.push(
      `Known dependencies:\n- ${request.dependencies
        .map((edge) => `${edge.from} -> ${edge.to}`)
        .join('\n- ')}`,
    );
  }
  if (request.decisions.length > 0) {
    parts.push(
      `Decisions they are facing:\n- ${request.decisions
        .map((d) => `${d.question} (${d.options.join(' / ')})`)
        .join('\n- ')}`,
    );
  }
  if (request.controllable.length > 0) {
    parts.push(`Within their control:\n- ${request.controllable.join('\n- ')}`);
  }
  if (request.external.length > 0) {
    parts.push(`Outside their control:\n- ${request.external.join('\n- ')}`);
  }
  if (request.temporal_anchors.length > 0) {
    parts.push(
      `Timing in their own words:\n- ${request.temporal_anchors
        .map((a) => a.raw)
        .join('\n- ')}`,
    );
  }
  if (request.domains.length > 0) {
    parts.push(`Life areas involved: ${request.domains.join(', ')}`);
  }

  // Step 12 sections 69-70 / Rule 9: a path the user has ruled out is a
  // boundary, and re-proposing it is the anti-pattern in section 105.
  if (request.rejected_paths.length > 0) {
    parts.push(
      `They have explicitly ruled these out. Do not propose them again:\n- ${request.rejected_paths.join('\n- ')}`,
    );
  }

  if (request.astro) {
    // Only validated themes are sent, never a chart. Step 12 section 100.
    const astro = request.astro;
    const lines: string[] = [];
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

/** Example shape sent to the model so field names are unambiguous. */
const SCHEMA_SHAPE = {
  seeds: [
    'Current job continues',
    'Role is restructured internally',
    'Current employment ends',
  ],
  scenarios: [
    {
      title: 'Stay in the current role',
      summary:
        'Employment continues while the company works through its restructuring.',
      scenario_type: ScenarioType.CONTINUITY,
      horizon: ScenarioHorizon.NEAR_TERM,
      impact: ScenarioImpact.MODERATE,
      relevance: ScenarioRelevance.HIGH,
      confidence: 0.78,
      basis: [
        {
          type: ScenarioEvidenceClass.CURRENT_REALITY,
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
        { action: 'Increase internal visibility', classification: PreparationClass.SCENARIO_SPECIFIC },
      ],
      benefits: [],
      constraints: [],
      reversibility: null,
      option_ref: null,
    },
  ],
  shared_preparation: [
    { action: 'Refresh the CV', classification: PreparationClass.COMMON },
    { action: 'Understand the loan options', classification: PreparationClass.COMMON },
  ],
  watch_signals: ['Formal restructuring notice', 'Interview invitation'],
  comparison: [
    {
      dimension: 'Financial stability',
      values: { 'Stay in the current role': 'HIGH', 'Transition out': 'LOW' },
    },
  ],
  decision_readiness: DecisionReadiness.PARTIALLY_READY,
  safety_flags: [],
};
