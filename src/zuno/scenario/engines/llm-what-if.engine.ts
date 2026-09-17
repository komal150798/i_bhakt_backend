import { Injectable, Logger } from '@nestjs/common';
import { ZunoAiGateway } from '../../ai/services/zuno-ai-gateway.service';
import {
  IWhatIfEngine,
  WhatIfExplorationRequest,
  WhatIfExplorationResult,
} from '../ports/what-if.port';
import { validateWhatIfExploration } from '../schemas/what-if-exploration.schema';
import {
  PreparationClass,
  Reversibility,
  ScenarioEvidenceClass,
  ScenarioImpact,
  WhatIfAssumptionType,
} from '../enums/scenario.enum';

export const WHAT_IF_PROMPT_VERSION = 'what-if-explore-v1.0.0';
export const WHAT_IF_ENGINE_VERSION = 'what-if-llm-1.0.0';

/**
 * LLM-backed What-If exploration.
 *
 * Implements `IWhatIfEngine` behind `WHAT_IF_ENGINE`, so the Python
 * intelligence service can take over without any consumer changing.
 *
 * All model access is through ZunoAiGateway (Build Rule 81). This engine has no
 * repository, no entity manager and no way to write state - the isolation
 * Step 12 section 39 demands is partly structural: a class that cannot persist
 * anything cannot pollute anything.
 */
@Injectable()
export class LlmWhatIfEngine implements IWhatIfEngine {
  private readonly logger = new Logger(LlmWhatIfEngine.name);

  constructor(private readonly gateway: ZunoAiGateway) {}

  async explore(
    request: WhatIfExplorationRequest,
  ): Promise<WhatIfExplorationResult> {
    const result = await this.gateway.callStructured({
      operationType: 'WHAT_IF_EXPLORE',
      systemPrompt: buildSystemPrompt(request),
      userPrompt: buildUserPrompt(request),
      promptTemplateVersion: WHAT_IF_PROMPT_VERSION,
      validate: validateWhatIfExploration,
      // Lower than scenario generation: this is reasoning down a chain the user
      // has already supplied, not branching. Divergence here becomes the
      // speculative cascade Step 12 section 44 prohibits.
      temperature: 0.2,
      maxTokens: 2500,
      timeoutMs: 45000,
      maxAttempts: 3,
    });

    return {
      exploration: result.value,
      engineVersion: WHAT_IF_ENGINE_VERSION,
      promptVersion: WHAT_IF_PROMPT_VERSION,
      aiGenerationRunId: result.runId,
    };
  }
}

/**
 * The exploration instruction.
 *
 *   Step 12 s.39   a What-If is isolated and changes nothing
 *   Step 12 s.41   branch from current state, propagate dependencies, assess
 *                  implications, identify controls, contingency actions
 *   Step 12 s.43   bounded cascade depth
 *   Step 12 s.44   no speculative chain beyond known dependencies
 *   Step 12 s.72   financial hypotheticals stay at general planning level; do
 *                  not invent legal or bank-specific outcomes
 *   Step 12 s.73   never deterministically claim how another person behaves
 *   Step 19 s.106  "what if I get divorced" must not produce a fatalistic
 *                  prediction, and the divorce must not be recorded as fact
 */
function buildSystemPrompt(request: WhatIfExplorationRequest): string {
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
    `Label the grounding of each implication: ${Object.values(ScenarioEvidenceClass).join(', ')}. Use DEPENDENCY when it follows a dependency they described, and name it in dependency_reference.`,
    '',
    `assumptions: the hypothetical itself is USER_STATED. Anything you concluded from propagating a dependency is DERIVED_DEPENDENCY. A real current fact you are carrying forward unchanged is CONTEXT_CARRIED. Types: ${Object.values(WhatIfAssumptionType).join(', ')}.`,
    '',
    'controllable_actions: what remains in this person\'s hands in that situation. This is the point of the exercise - a hypothetical that leaves someone feeling powerless has failed.',
    '',
    'existing_preparation_that_helps: from the preparation already under way, which of it would still help here. Only name things listed below; do not invent preparation they have not started.',
    '',
    `preparation: further contingency actions. Classify as ${Object.values(PreparationClass).join(', ')}. You are proposing preparation, not scheduling it.`,
    '',
    `impact: ${Object.values(ScenarioImpact).join(', ')}. reversibility: ${Object.values(Reversibility).join(', ')} or null.`,
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

function buildUserPrompt(request: WhatIfExplorationRequest): string {
  const parts: string[] = [];

  parts.push(`Their hypothetical question: ${request.question}`);
  parts.push(`Their current situation: ${request.summary}`);

  if (request.facts.length > 0) {
    parts.push(`Established facts today:\n- ${request.facts.join('\n- ')}`);
  }
  if (request.dependencies.length > 0) {
    parts.push(
      `Dependencies they described. These are the ONLY chains you may follow:\n- ${request.dependencies
        .map((edge) => `${edge.from} -> ${edge.to}`)
        .join('\n- ')}`,
    );
  }
  if (request.controllable.length > 0) {
    parts.push(`Within their control:\n- ${request.controllable.join('\n- ')}`);
  }
  if (request.external.length > 0) {
    parts.push(`Outside their control:\n- ${request.external.join('\n- ')}`);
  }
  if (request.existing_preparation.length > 0) {
    parts.push(
      `Preparation already under way:\n- ${request.existing_preparation.join('\n- ')}`,
    );
  }
  if (request.domains.length > 0) {
    parts.push(`Life areas involved: ${request.domains.join(', ')}`);
  }
  if (request.astro) {
    const lines: string[] = [];
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
    { text: 'Employment ends next month', type: WhatIfAssumptionType.USER_STATED, dependency_reference: null },
    {
      text: 'Primary salary stops at the same time',
      type: WhatIfAssumptionType.DERIVED_DEPENDENCY,
      dependency_reference: 'Employment -> Monthly income',
    },
  ],
  implications: [
    {
      text: 'The main income source would pause',
      layer: 1,
      basis: ScenarioEvidenceClass.DEPENDENCY,
      dependency_reference: 'Employment -> Monthly income',
    },
    {
      text: 'Loan servicing would become more sensitive to timing',
      layer: 2,
      basis: ScenarioEvidenceClass.DEPENDENCY,
      dependency_reference: 'Monthly income -> Home loan servicing',
    },
  ],
  controllable_actions: [
    'Prepare employment documents',
    'Speak to the lender about options before anything changes',
  ],
  existing_preparation_that_helps: ['Updated CV'],
  preparation: [
    { action: 'Clarify the loan contingency terms', classification: PreparationClass.CONTINGENCY_ONLY },
  ],
  impact_areas: ['CAREER', 'FINANCE'],
  impact: ScenarioImpact.HIGH,
  reversibility: Reversibility.MEDIUM,
  safety_flags: [],
  confidence: 0.8,
};
