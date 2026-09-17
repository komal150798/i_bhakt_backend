import { SafetyFlag, ZunoDomain, isZunoDomain } from '../../common/enums';
import { SchemaValidation } from '../../ai/services/zuno-ai-gateway.service';
import { WhatIfExploration } from '../ports/what-if.port';
import {
  PreparationClass,
  Reversibility,
  ScenarioEvidenceClass,
  ScenarioImpact,
  WhatIfAssumptionType,
  WHAT_IF_MAX_CASCADE_DEPTH,
} from '../enums/scenario.enum';
import {
  claimsToValidationErrors,
  scanForDeterministicClaims,
} from './deterministic-language.guard';

/**
 * Hand-written validator for What-If engine output.
 *
 * Same contract as the scenario validator, with two What-If-specific rules that
 * cannot be delegated to the prompt:
 *
 * 1. THE DETERMINISTIC-CLAIM BOUNDARY APPLIES EVEN THOUGH THIS IS HYPOTHETICAL.
 *    A What-If is the easiest place to slip into fortune telling, because the
 *    user has already granted the premise. Step 12 section 73 is explicit that
 *    exploring "what if I leave the relationship" must not deterministically
 *    claim how the partner will behave, and Step 19 section 106's golden test
 *    for "what if I get divorced" expects no fatalistic prediction. The premise
 *    is hypothetical; the consequences must still be possibilities.
 *
 * 2. CASCADE DEPTH IS BOUNDED HERE, NOT ASKED FOR.
 *    Step 12 section 43 bounds cascades at 2-3 consequential layers and
 *    section 44 forbids speculative chains such as
 *    "lose job -> lose home -> marriage breaks down -> health deteriorates".
 *    Implications beyond the bound are dropped rather than failing the whole
 *    response: the first layers are still useful, and discarding a valid
 *    exploration because the model added a fourth link would trade a real
 *    answer for a purity point.
 */
export function validateWhatIfExploration(
  raw: unknown,
): SchemaValidation<WhatIfExploration> {
  if (!isRecord(raw)) {
    return { ok: false, errors: ['root is not an object'] };
  }

  const claims = scanForDeterministicClaims(raw);
  if (claims.length > 0) {
    return { ok: false, errors: claimsToValidationErrors(claims) };
  }

  const assumption = asString(raw.assumption);
  if (!assumption) {
    return {
      ok: false,
      errors: ['assumption is required - the hypothetical must be stated back'],
    };
  }

  const implications = asArray(raw.implications)
    .map((entry) => {
      if (typeof entry === 'string') {
        const text = entry.trim();
        return text.length > 0
          ? {
              text,
              layer: 1,
              basis: ScenarioEvidenceClass.SYSTEM_INFERENCE,
              dependency_reference: null,
            }
          : null;
      }
      if (!isRecord(entry)) return null;
      const text = asString(entry.text) ?? asString(entry.implication);
      if (!text) return null;
      return {
        text,
        layer: clampLayer(asNumber(entry.layer) ?? 1),
        basis: coerceEnum(
          asString(entry.basis),
          ScenarioEvidenceClass,
          // Step 12 section 44: an implication with no stated grounding is an
          // inference, and is labelled as one so the service can weigh it.
          ScenarioEvidenceClass.SYSTEM_INFERENCE,
        ),
        dependency_reference: asString(entry.dependency_reference),
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        text: string;
        layer: number;
        basis: ScenarioEvidenceClass;
        dependency_reference: string | null;
      } => entry !== null,
    )
    // Step 12 section 43: bounded depth, enforced rather than requested.
    .filter((entry) => entry.layer <= WHAT_IF_MAX_CASCADE_DEPTH);

  if (implications.length === 0) {
    return {
      ok: false,
      errors: [
        'implications contained no usable entry within the permitted cascade depth',
      ],
    };
  }

  return {
    ok: true,
    value: {
      assumption,
      assumptions: asArray(raw.assumptions)
        .map((entry) => {
          if (typeof entry === 'string') {
            const text = entry.trim();
            return text.length > 0
              ? {
                  text,
                  type: WhatIfAssumptionType.DERIVED_DEPENDENCY,
                  dependency_reference: null,
                }
              : null;
          }
          if (!isRecord(entry)) return null;
          const text = asString(entry.text) ?? asString(entry.assumption_text);
          if (!text) return null;
          return {
            text,
            type: coerceEnum(
              asString(entry.type),
              WhatIfAssumptionType,
              WhatIfAssumptionType.DERIVED_DEPENDENCY,
            ),
            dependency_reference: asString(entry.dependency_reference),
          };
        })
        .filter(
          (
            entry,
          ): entry is {
            text: string;
            type: WhatIfAssumptionType;
            dependency_reference: string | null;
          } => entry !== null,
        ),
      implications,
      controllable_actions: stringArray(raw.controllable_actions),
      existing_preparation_that_helps: stringArray(
        raw.existing_preparation_that_helps,
      ),
      preparation: asArray(raw.preparation)
        .map((entry) => {
          if (typeof entry === 'string') {
            const action = entry.trim();
            return action.length > 0
              ? { action, classification: PreparationClass.CONTINGENCY_ONLY }
              : null;
          }
          if (!isRecord(entry)) return null;
          const action = asString(entry.action) ?? asString(entry.text);
          if (!action) return null;
          return {
            action,
            classification: coerceEnum(
              asString(entry.classification),
              PreparationClass,
              // Step 12 section 27: preparation proposed inside a hypothetical
              // is contingency preparation until the Plan Engine says otherwise.
              PreparationClass.CONTINGENCY_ONLY,
            ),
          };
        })
        .filter(
          (
            entry,
          ): entry is { action: string; classification: PreparationClass } =>
            entry !== null,
        ),
      impact_areas: asArray(raw.impact_areas)
        .map((entry) => asString(entry))
        .filter((entry): entry is ZunoDomain => isZunoDomain(entry)),
      impact: coerceEnum(asString(raw.impact), ScenarioImpact, ScenarioImpact.MODERATE),
      reversibility: coerceEnumOrNull(asString(raw.reversibility), Reversibility),
      safety_flags: asArray(raw.safety_flags)
        .map((flag) => asString(flag))
        .filter((flag): flag is string => flag !== null)
        .filter((flag): flag is SafetyFlag =>
          Object.values(SafetyFlag).includes(flag as SafetyFlag),
        ),
      confidence: clamp01(asNumber(raw.confidence) ?? 0.5),
    },
  };
}

function clampLayer(value: number): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded) || rounded < 1) return 1;
  return rounded;
}

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
