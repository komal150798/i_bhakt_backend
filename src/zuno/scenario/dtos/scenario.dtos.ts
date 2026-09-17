import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ZunoScenario } from '../entities/zuno-scenario.entity';
import { ZunoScenarioSet } from '../entities/zuno-scenario-set.entity';
import { ZunoWhatIfSession } from '../entities/zuno-what-if-session.entity';
import { ZunoWhatIfAssumption } from '../entities/zuno-what-if-assumption.entity';
import {
  ScenarioCaseClass,
  ScenarioHorizon,
  ScenarioImpact,
  ScenarioStatus,
  ScenarioType,
} from '../enums/scenario.enum';

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export class GenerateScenariosDto {
  @ApiProperty({ description: 'The challenge to map possibilities for.' })
  @IsUUID()
  challengeId: string;

  /**
   * Step 12 section 86 lists the legitimate regeneration triggers and section
   * 85 says not to regenerate on a screen reopen. Recording why a regeneration
   * happened is what makes that auditable.
   */
  @ApiPropertyOptional({
    description: 'Why this set is being generated, e.g. USER_REASSESSMENT.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 48)
  reason?: string;
}

export class ListScenariosQueryDto {
  @ApiProperty({ description: 'The challenge whose scenarios to read.' })
  @IsUUID()
  challengeId: string;

  /**
   * Step 12 section 54: the user may ask to "show me more possibilities".
   * Default is the user-facing set only.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeAll?: boolean;
}

export class ScenarioDecisionDto {
  @ApiProperty({
    enum: [
      ScenarioStatus.USER_ADOPTED,
      ScenarioStatus.USER_REJECTED,
      ScenarioStatus.DISMISSED,
    ],
    description:
      'The user\'s own decision about this path (Step 12 sections 68-69).',
  })
  @IsEnum(ScenarioStatus)
  decision:
    | ScenarioStatus.USER_ADOPTED
    | ScenarioStatus.USER_REJECTED
    | ScenarioStatus.DISMISSED;

  @ApiPropertyOptional({ description: 'Why, in the user\'s own words.' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  note?: string;

  /** Step 21 section 108: optimistic lock against a concurrent Realignment. */
  @ApiPropertyOptional({ description: 'Version the client last saw.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class ScenarioTriggeredDto {
  @ApiPropertyOptional({ description: 'What actually happened, in their words.' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  note?: string;

  @ApiPropertyOptional({ description: 'Version the client last saw.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class WhatIfRequestDto {
  @ApiProperty({ description: 'The challenge to branch the hypothetical from.' })
  @IsUUID()
  challengeId: string;

  /** Step 21 section 39: the contract field is `question`. */
  @ApiProperty({
    description: 'The hypothetical, in the user\'s own words.',
    example: 'What if I lose my job next month?',
  })
  @IsString()
  @Length(1, 2000)
  question: string;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

/**
 * Scenario card. Step 21 section 37, Step 12 section 81.
 *
 * Step 21 section 37 fixes the shape: `{ id, name, type, description,
 * confidence }` and closes with "do not expose fabricated probability
 * percentages". This view honours that literally:
 *
 *   `confidence` is the QUALITATIVE attention label (PRIMARY / PLAUSIBLE /
 *   SECONDARY / CONTINGENCY, Step 12 section 16), never the numeric
 *   `scenarios.confidence` column. Step 12 section 81 keeps the numeric score
 *   off the default card entirely, and section 50 warns that a number here
 *   would be read as a probability, which it is not.
 *
 *   `type` carries the Step 20 section 27 vocabulary, as the section 37 example
 *   shows. `scenarioType` carries the richer Step 12 section 4 classification
 *   alongside it so the engine vocabulary is available without a second call.
 *
 * Step 12 section 81 also names what must NOT appear on the default card:
 * confidence scores, rule IDs, the dependency graph, astro evidence and
 * internal ranking. None of them are here. They live in `payload` on the row
 * and are available to the detail surface when the user asks.
 */
export class ScenarioView {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ScenarioCaseClass }) type: ScenarioCaseClass;
  @ApiProperty({ enum: ScenarioType }) scenarioType: ScenarioType;
  @ApiProperty() description: string;
  @ApiProperty({
    description:
      'Qualitative attention label. Never a probability or a percentage.',
    example: 'PLAUSIBLE',
  })
  confidence: string;
  @ApiProperty({ enum: ScenarioImpact }) impact: ScenarioImpact;
  @ApiProperty({ enum: ScenarioHorizon }) horizon: ScenarioHorizon;
  @ApiProperty({ enum: ScenarioStatus }) status: ScenarioStatus;
  @ApiProperty({ description: 'Always false for a generated scenario set.' })
  hypothetical: boolean;
  @ApiProperty() version: number;
  @ApiProperty({ type: [String] }) preparation: string[];

  static from(scenario: ZunoScenario): ScenarioView {
    return {
      id: scenario.id,
      name: scenario.name,
      type: scenario.case_class,
      scenarioType: scenario.scenario_type,
      description: scenario.description,
      // The qualitative label, derived in the service from the relevance enum.
      confidence: scenario.probability_label ?? 'PLAUSIBLE',
      impact: scenario.impact,
      horizon: scenario.horizon,
      status: scenario.status,
      hypothetical: scenario.hypothetical,
      version: scenario.version,
      preparation: (scenario.payload?.scenario_specific_preparation ?? []).map(
        (prep) => prep.action,
      ),
    };
  }
}

/**
 * The set around the cards. Step 12 section 83's conceptual output shape
 * (`scenario_set_id`, `version`, `scenarios`, `shared_preparation`,
 * `watch_signals`).
 */
export class ScenarioSetView {
  @ApiProperty() scenarioSetId: string;
  @ApiProperty() challengeId: string;
  @ApiProperty() version: number;
  @ApiProperty({ type: [ScenarioView] }) scenarios: ScenarioView[];
  @ApiProperty({ type: [String] }) sharedPreparation: string[];
  @ApiProperty({ type: [String] }) watchSignals: string[];
  @ApiProperty({ nullable: true }) decisionReadiness: string | null;
  @ApiProperty() generatedAt: string;
  /**
   * Honest disclosure that this set carries no astrology, so the client can
   * avoid promising personalised timing it does not have (Step 21 section 119).
   */
  @ApiProperty() astrologyAvailable: boolean;

  static from(set: ZunoScenarioSet, scenarios: ZunoScenario[]): ScenarioSetView {
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

/**
 * What-If response. Step 21 section 40 fixes the shape:
 * `{ sessionId, mode: "HYPOTHETICAL", assumptions, impact, recommendedPreparation }`
 * and section 40 closes with "no automatic mutation of factual Challenge state
 * is permitted".
 *
 * `mode` is the literal string HYPOTHETICAL and `currentPlanChanged` is always
 * false, because Step 12 sections 39-40 make the hypothetical marker and the
 * "your current plan is unchanged" message mandatory rather than advisory.
 */
export class WhatIfView {
  @ApiProperty() sessionId: string;
  @ApiProperty({ example: 'HYPOTHETICAL' }) mode: string;
  @ApiProperty() hypothetical: boolean;
  @ApiProperty({ type: [String] }) assumptions: string[];
  @ApiProperty({ type: [String] }) implications: string[];
  @ApiProperty({ type: [String] }) controllableFactors: string[];
  @ApiProperty({ type: [String] }) existingPreparationThatHelps: string[];
  @ApiProperty({ type: [String] }) recommendedPreparation: string[];
  @ApiProperty({ description: 'Qualitative impact. Never a probability.' })
  impact: string;
  @ApiProperty() currentPlanChanged: boolean;
  @ApiProperty({
    description:
      'Mandatory user-facing notice. Step 12 section 40 requires it verbatim.',
  })
  notice: string;
  @ApiProperty() createdAt: string;

  static from(
    session: ZunoWhatIfSession,
    assumptions: ZunoWhatIfAssumption[],
  ): WhatIfView {
    const result = session.result;
    return {
      sessionId: session.id,
      mode: 'HYPOTHETICAL',
      hypothetical: session.is_hypothetical,
      assumptions: assumptions.map((entry) => entry.assumption_text),
      implications: (result?.implications ?? []).map((entry) => entry.text),
      controllableFactors: result?.controllable_actions ?? [],
      existingPreparationThatHelps: result?.existing_preparation_that_helps ?? [],
      recommendedPreparation: (result?.preparation ?? []).map(
        (prep) => prep.action,
      ),
      impact: result?.impact ?? ScenarioImpact.MODERATE,
      // Step 12 section 41 / Step 21 section 40. Always false, by construction.
      currentPlanChanged: session.current_plan_changed,
      notice: result?.hypothetical_notice ?? '',
      createdAt: session.created_at.toISOString(),
    };
  }
}
