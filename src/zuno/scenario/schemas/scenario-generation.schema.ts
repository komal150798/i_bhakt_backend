import { SafetyFlag, ZunoDomain, isZunoDomain } from '../../common/enums';
import { SchemaValidation } from '../../ai/services/zuno-ai-gateway.service';
import {
  ScenarioCandidate,
  ScenarioGeneration,
} from '../ports/scenario.port';
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
import {
  claimsToValidationErrors,
  scanForDeterministicClaims,
} from './deterministic-language.guard';

/**
 * Hand-written validator for Scenario engine output.
 *
 * Written in the same shape as `whatnow-extraction.schema.ts`, for the same
 * reasons: Master Index rule 11 and Build Rule 84 forbid treating model output
 * as trusted structured data merely because it parses, and the project has no
 * runtime JSON-schema library (Build Rule 121 says not to add one for this).
 *
 * The strictness policy is inherited deliberately:
 *   - an unknown ENUM VALUE degrades to a safe default (Step 21 section 19)
 *   - missing or malformed STRUCTURE is a hard failure
 *
 * With one addition that is specific to this engine and is NOT a degradation:
 *
 *   - ANY DETERMINISTIC CLAIM ANYWHERE IN THE RESPONSE IS A HARD FAILURE.
 *
 * That check runs across the whole response object, not a list of fields, and
 * returns `{ ok: false }`. ZunoAiGateway then retries within its bounded budget
 * and, if the model keeps asserting outcomes, throws
 * INTELLIGENCE_SERVICE_UNAVAILABLE rather than persisting the claim. Failing to
 * produce scenarios is recoverable; telling someone their job will end is not.
 */
export function validateScenarioGeneration(
  raw: unknown,
): SchemaValidation<ScenarioGeneration> {
  const errors: string[] = [];

  if (!isRecord(raw)) {
    return { ok: false, errors: ['root is not an object'] };
  }

  if (!Array.isArray(raw.scenarios)) {
    return { ok: false, errors: ['scenarios must be an array'] };
  }

  // The possibility-language boundary, applied before anything is shaped.
  // Running it first means a rejected response never gets far enough for a
  // partial result to look usable.
  const claims = scanForDeterministicClaims(raw);
  if (claims.length > 0) {
    return { ok: false, errors: claimsToValidationErrors(claims) };
  }

  const scenarios = (raw.scenarios as unknown[])
    .filter(isRecord)
    .map(parseCandidate)
    .filter((candidate): candidate is ScenarioCandidate => candidate !== null);

  // Step 12 section 106: the engine is not implemented if it cannot produce a
  // meaningful set. An empty array is a broken contract, not a new vocabulary
  // word, so it fails rather than degrading.
  if (scenarios.length === 0) {
    errors.push('scenarios contained no usable entry (each needs title and summary)');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      seeds: stringArray(raw.seeds),
      scenarios,
      shared_preparation: parsePreparation(
        raw.shared_preparation,
        PreparationClass.COMMON,
      ),
      watch_signals: stringArray(raw.watch_signals),
      comparison: asArray(raw.comparison)
        .filter(isRecord)
        .map((entry) => ({
          dimension: asString(entry.dimension) ?? '',
          values: parseStringMap(entry.values),
        }))
        .filter((entry) => entry.dimension.length > 0),
      decision_readiness: coerceEnum(
        asString(raw.decision_readiness),
        DecisionReadiness,
        // Step 12 section 37: when we cannot tell, say we cannot tell rather
        // than claiming the comparison is ready.
        DecisionReadiness.PARTIALLY_READY,
      ),
      safety_flags: asArray(raw.safety_flags)
        .map((flag) => asString(flag))
        .filter((flag): flag is string => flag !== null)
        .filter((flag): flag is SafetyFlag =>
          Object.values(SafetyFlag).includes(flag as SafetyFlag),
        ),
    },
  };
}

function parseCandidate(raw: Record<string, unknown>): ScenarioCandidate | null {
  const title = asString(raw.title);
  const summary = asString(raw.summary) ?? asString(raw.description);
  // A scenario with no title or no meaning cannot be shown on a card
  // (Step 12 section 81), so it is dropped rather than padded with a default.
  if (!title || !summary) return null;

  return {
    title,
    summary,
    scenario_type: coerceEnum(
      asString(raw.scenario_type) ?? asString(raw.type),
      ScenarioType,
      // CHANGE is the least assertive fallback: it claims a material change
      // without claiming which direction, so an unrecognised label cannot
      // silently become an OPPORTUNITY or a RECOVERY.
      ScenarioType.CHANGE,
    ),
    horizon: coerceEnum(
      asString(raw.horizon) ?? asString(raw.time_horizon),
      ScenarioHorizon,
      ScenarioHorizon.UNSPECIFIED,
    ),
    impact: coerceEnum(
      asString(raw.impact),
      ScenarioImpact,
      ScenarioImpact.MODERATE,
    ),
    relevance: coerceEnum(
      asString(raw.relevance),
      ScenarioRelevance,
      // Step 12 sections 31-32: an unclassified path is worth preparing for,
      // not worth leading with. CONTINGENCY is the safe default in both
      // directions - it neither buries a real risk nor promotes a guess.
      ScenarioRelevance.CONTINGENCY,
    ),
    confidence: clamp01(asNumber(raw.confidence) ?? 0.5),
    basis: asArray(raw.basis)
      .filter(isRecord)
      .map((entry) => ({
        type: coerceEnum(
          asString(entry.type),
          ScenarioEvidenceClass,
          // Step 12 section 14: an unlabelled source is system inference, and
          // section 14 then forbids a scenario resting only on that. Guessing
          // USER_STATED here would launder an inference into evidence.
          ScenarioEvidenceClass.SYSTEM_INFERENCE,
        ),
        reference: asString(entry.reference) ?? '',
      }))
      .filter((entry) => entry.reference.length > 0),
    signals_for: stringArray(raw.signals_for),
    signals_against: stringArray(raw.signals_against),
    dependencies: asArray(raw.dependencies)
      .filter(isRecord)
      .map((entry) => ({
        from: asString(entry.from) ?? '',
        to: asString(entry.to) ?? '',
        description: asString(entry.description),
      }))
      .filter((entry) => entry.from.length > 0 && entry.to.length > 0),
    risks: stringArray(raw.risks),
    opportunities: stringArray(raw.opportunities),
    controllable_factors: stringArray(raw.controllable_factors),
    impact_areas: asArray(raw.impact_areas)
      .map((entry) => asString(entry))
      .filter((entry): entry is ZunoDomain => isZunoDomain(entry)),
    scenario_specific_preparation: parsePreparation(
      raw.scenario_specific_preparation ?? raw.preparation,
      PreparationClass.SCENARIO_SPECIFIC,
    ),
    benefits: stringArray(raw.benefits),
    constraints: stringArray(raw.constraints),
    reversibility: coerceEnumOrNull(asString(raw.reversibility), Reversibility),
    option_ref: asString(raw.option_ref) ?? asString(raw.option_id),
  };
}

/**
 * Preparation entries, accepting either `"Update CV"` or
 * `{ action, classification }`.
 *
 * The plain-string form is accepted because models reliably produce it and the
 * classification has a correct default per call site; rejecting it would burn a
 * retry on a difference that carries no meaning.
 */
function parsePreparation(
  raw: unknown,
  defaultClass: PreparationClass,
): { action: string; classification: PreparationClass }[] {
  return asArray(raw)
    .map((entry) => {
      if (typeof entry === 'string') {
        const action = entry.trim();
        return action.length > 0
          ? { action, classification: defaultClass }
          : null;
      }
      if (isRecord(entry)) {
        const action = asString(entry.action) ?? asString(entry.text);
        if (!action) return null;
        return {
          action,
          classification: coerceEnum(
            asString(entry.classification),
            PreparationClass,
            defaultClass,
          ),
        };
      }
      return null;
    })
    .filter(
      (entry): entry is { action: string; classification: PreparationClass } =>
        entry !== null,
    );
}

function parseStringMap(raw: unknown): Record<string, string> {
  if (!isRecord(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const text = asString(value);
    if (text) out[key] = text;
  }
  return out;
}

// --- shared primitives, mirroring whatnow-extraction.schema.ts ------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringArray(value: unknown): string[] {
  return asArray(value)
    .map((entry) => asString(entry))
    .filter((entry): entry is string => entry !== null);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function coerceEnum<T extends Record<string, string>>(
  value: string | null,
  enumObject: T,
  fallback: T[keyof T],
): T[keyof T] {
  if (value && Object.values(enumObject).includes(value)) {
    return value as T[keyof T];
  }
  return fallback;
}

function coerceEnumOrNull<T extends Record<string, string>>(
  value: string | null,
  enumObject: T,
): T[keyof T] | null {
  if (value && Object.values(enumObject).includes(value)) {
    return value as T[keyof T];
  }
  return null;
}
