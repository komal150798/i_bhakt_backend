import {
  ChallengeTimeline,
  ContextItemSource,
  ContextItemType,
  EmotionalIntensity,
  EmotionalSignal,
  GoalStatus,
  SafetyFlag,
  Urgency,
  ZunoDomain,
  isZunoDomain,
} from '../../common/enums';
import { WhatNowExtraction } from '../engines/whatnow.port';
import { SchemaValidation } from '../../ai/services/zuno-ai-gateway.service';

/**
 * Hand-written validator for WhatNow model output.
 *
 * Master Index rule 11 and Build Rule 84: never trust model output merely
 * because it parses. This checks schema, enum membership, numeric ranges and
 * required fields before any of it becomes domain state.
 *
 * Written by hand rather than with a schema library because the project has no
 * runtime JSON-schema validator in its dependencies, and Build Rule 121 says to
 * add a dependency only when it has a clear purpose that existing capability
 * does not cover. The validator is ~200 lines and fully testable; a new
 * dependency would not be obviously better.
 *
 * Design note on strictness: unknown *enum values* are coerced to a safe
 * default rather than rejecting the whole extraction, because Step 21 section
 * 19 wants unknown enum values to degrade gracefully rather than crash. Missing
 * or malformed *structure* is a hard failure - that is a broken contract, not a
 * new vocabulary word.
 */
export function validateWhatNowExtraction(
  raw: unknown,
): SchemaValidation<WhatNowExtraction> {
  const errors: string[] = [];

  if (!isRecord(raw)) {
    return { ok: false, errors: ['root is not an object'] };
  }

  const summary = asString(raw.summary);
  if (!summary) errors.push('summary is required and must be a non-empty string');

  const primaryDomainRaw = asString(raw.primary_domain);
  if (!primaryDomainRaw) {
    errors.push('primary_domain is required');
  } else if (!isZunoDomain(primaryDomainRaw)) {
    errors.push(`primary_domain "${primaryDomainRaw}" is not a known ZUNO domain`);
  }

  const confidence = asNumber(raw.confidence);
  if (confidence === null) {
    errors.push('confidence is required and must be a number');
  } else if (confidence < 0 || confidence > 1) {
    errors.push('confidence must be between 0 and 1');
  }

  if (!Array.isArray(raw.items)) {
    errors.push('items must be an array');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Items: the fact/fear distinction lives here, so an item with an
  // unrecognised type is coerced to UNKNOWN rather than guessed as FACT.
  // Step 11 section 8 - the failure mode we must never have is a fear silently
  // becoming a fact.
  const items = (raw.items as unknown[])
    .filter(isRecord)
    .map((item) => ({
      text: asString(item.text) ?? '',
      type: coerceEnum(
        asString(item.type),
        ContextItemType,
        ContextItemType.UNKNOWN,
      ),
      source: coerceEnum(
        asString(item.source),
        ContextItemSource,
        ContextItemSource.INFERRED,
      ),
      confidence: clamp01(asNumber(item.confidence) ?? 0.5),
    }))
    .filter((item) => item.text.length > 0);

  const secondaryDomains = asArray(raw.secondary_domains)
    .filter(isRecord)
    .map((entry) => ({
      domain: asString(entry.domain),
      confidence: clamp01(asNumber(entry.confidence) ?? 0.5),
    }))
    .filter(
      (entry): entry is { domain: ZunoDomain; confidence: number } =>
        entry.domain !== null && isZunoDomain(entry.domain),
    );

  const dependencies = asArray(raw.dependencies)
    .filter(isRecord)
    .map((entry) => ({
      from: asString(entry.from) ?? '',
      to: asString(entry.to) ?? '',
      description: asString(entry.description) ?? undefined,
    }))
    .filter((entry) => entry.from.length > 0 && entry.to.length > 0);

  const desiredOutcomes = asArray(raw.desired_outcomes)
    .filter(isRecord)
    .map((entry) => ({
      goal: asString(entry.goal) ?? '',
      // Step 11 section 20: an inferred goal must never be recorded as
      // USER_STATED, so anything unrecognised falls back to INFERRED.
      status: coerceEnum(asString(entry.status), GoalStatus, GoalStatus.INFERRED),
      confidence: clamp01(asNumber(entry.confidence) ?? 0.5),
    }))
    .filter((entry) => entry.goal.length > 0);

  const decisions = asArray(raw.decisions)
    .filter(isRecord)
    .map((entry) => ({
      question: asString(entry.question) ?? '',
      options: asArray(entry.options)
        .map((option) => asString(option))
        .filter((option): option is string => option !== null),
      confidence: clamp01(asNumber(entry.confidence) ?? 0.5),
    }))
    .filter((entry) => entry.question.length > 0);

  const temporalAnchors = asArray(raw.temporal_anchors)
    .filter(isRecord)
    .map((entry) => ({
      raw: asString(entry.raw) ?? '',
      // Step 11 section 16: do not invent dates. A non-ISO value becomes null
      // rather than being parsed into a plausible-looking guess.
      normalized_date: asIsoDate(entry.normalized_date),
      timeline: coerceEnum(
        asString(entry.timeline),
        ChallengeTimeline,
        ChallengeTimeline.UNKNOWN,
      ),
    }))
    .filter((entry) => entry.raw.length > 0);

  const missingInformation = asArray(raw.missing_information)
    .filter(isRecord)
    .map((entry) => ({
      question: asString(entry.question) ?? '',
      information_gain: clamp01(asNumber(entry.information_gain) ?? 0.5),
      rationale: asString(entry.rationale) ?? '',
    }))
    .filter((entry) => entry.question.length > 0);

  const emotionalSignals = asArray(raw.emotional_signals)
    .map((signal) => asString(signal))
    .filter((signal): signal is string => signal !== null)
    .filter((signal): signal is EmotionalSignal =>
      Object.values(EmotionalSignal).includes(signal as EmotionalSignal),
    );

  // Safety flags from the model are advisory. SafetyService unions them with
  // deterministic detection and can only escalate (Step 19 section 55).
  const safetyFlags = asArray(raw.safety_flags)
    .map((flag) => asString(flag))
    .filter((flag): flag is string => flag !== null)
    .filter((flag): flag is SafetyFlag =>
      Object.values(SafetyFlag).includes(flag as SafetyFlag),
    );

  return {
    ok: true,
    value: {
      summary: summary as string,
      primary_domain: primaryDomainRaw as ZunoDomain,
      secondary_domains: secondaryDomains,
      theme: asString(raw.theme),
      subthemes: asArray(raw.subthemes)
        .map((item) => asString(item))
        .filter((item): item is string => item !== null),
      items,
      dependencies,
      desired_outcomes: desiredOutcomes,
      decisions,
      controllable: asArray(raw.controllable)
        .map((item) => asString(item))
        .filter((item): item is string => item !== null),
      external: asArray(raw.external)
        .map((item) => asString(item))
        .filter((item): item is string => item !== null),
      temporal_anchors: temporalAnchors,
      missing_information: missingInformation,
      emotional_signals: emotionalSignals,
      emotional_intensity: coerceEnum(
        asString(raw.emotional_intensity),
        EmotionalIntensity,
        EmotionalIntensity.MODERATE,
      ),
      urgency: coerceEnum(asString(raw.urgency), Urgency, Urgency.MEDIUM),
      safety_flags: safetyFlags,
      confidence: clamp01(confidence as number),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
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

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function asIsoDate(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
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
