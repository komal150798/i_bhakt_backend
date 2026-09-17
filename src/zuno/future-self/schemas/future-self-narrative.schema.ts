import { SchemaValidation } from '../../ai/services/zuno-ai-gateway.service';
import { FutureSelfNarrative } from '../engines/future-self.port';

/**
 * Hand-written validator for Future Self model output.
 *
 * Master Index rule 11 and Build Rule 84: never trust model output merely
 * because it parses. Written by hand rather than with a schema library for the
 * same reason `whatnow-extraction.schema.ts` is - the project carries no
 * runtime JSON-schema validator, and Build Rule 121 says not to add a
 * dependency that existing capability already covers.
 *
 * Strictness policy, matching the WhatNow validator so the two behave alike:
 *   - missing or malformed *structure* is a hard failure. A narrative without a
 *     summary is a broken contract, not a stylistic choice.
 *   - list entries that are the wrong type are dropped rather than failing the
 *     whole call, because one malformed bullet should not cost the generation.
 *
 * This validator checks shape only. Whether the content is permissible is
 * `checkFutureSelfBoundary`'s job, and the two are kept apart deliberately:
 * a well-formed narrative promising the user a job at a named company passes
 * here and is refused there.
 */
export function validateFutureSelfNarrative(
  raw: unknown,
): SchemaValidation<FutureSelfNarrative> {
  const errors: string[] = [];

  if (!isRecord(raw)) {
    return { ok: false, errors: ['root is not an object'] };
  }

  // Accept `message` as an alias for `summary`: Step 21 section 62 names the
  // API field `message` while Step 20 section 54 names the column `summary`,
  // and a model given either wording should not fail validation over it.
  const summary = asString(raw.summary) ?? asString(raw.message);
  if (!summary) {
    errors.push('summary is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      summary,
      progress_themes: asStringArray(raw.progress_themes, 8),
      open_loops: asStringArray(raw.open_loops, 8),
      strengths_observed: asStringArray(raw.strengths_observed, 8),
      next_focus: asStringArray(raw.next_focus, 5),
      source_refs: asStringArray(raw.source_refs, 40),
    },
  };
}

function asStringArray(value: unknown, cap: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => entry !== null)
    .slice(0, cap);
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
