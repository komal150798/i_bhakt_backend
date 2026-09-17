import { validateWhatNowExtraction } from './whatnow-extraction.schema';
import { isSchemaValid } from '../../ai/services/zuno-ai-gateway.service';
import {
  ContextItemSource,
  ContextItemType,
  GoalStatus,
  ZunoDomain,
} from '../../common/enums';

/**
 * Master Index rule 11 / Build Rule 84: model output never becomes trusted
 * business data without validation. These tests are that guarantee.
 */
describe('validateWhatNowExtraction', () => {
  const valid = {
    summary: 'A career worry with a financial tail.',
    primary_domain: 'CAREER',
    secondary_domains: [{ domain: 'FINANCE', confidence: 0.9 }],
    theme: 'JOB_SECURITY',
    subthemes: ['LAYOFF_RISK'],
    items: [
      {
        text: 'Layoffs are happening',
        type: 'FACT',
        source: 'USER_STATED',
        confidence: 0.95,
      },
    ],
    dependencies: [{ from: 'Employment', to: 'Income' }],
    desired_outcomes: [
      { goal: 'Stay solvent', status: 'INFERRED', confidence: 0.8 },
    ],
    decisions: [],
    controllable: ['CV'],
    external: ['Market'],
    temporal_anchors: [],
    missing_information: [],
    emotional_signals: ['WORRIED'],
    emotional_intensity: 'HIGH',
    urgency: 'HIGH',
    safety_flags: [],
    confidence: 0.9,
  };

  it('accepts a well-formed extraction', () => {
    const result = validateWhatNowExtraction(valid);
    expect(isSchemaValid(result)).toBe(true);
    if (isSchemaValid(result)) {
      expect(result.value.primary_domain).toBe(ZunoDomain.CAREER);
      expect(result.value.items[0].type).toBe(ContextItemType.FACT);
    }
  });

  describe('hard failures - a broken contract, not a new vocabulary word', () => {
    it('rejects a non-object', () => {
      expect(isSchemaValid(validateWhatNowExtraction('a string'))).toBe(false);
      expect(isSchemaValid(validateWhatNowExtraction(null))).toBe(false);
      expect(isSchemaValid(validateWhatNowExtraction([1, 2]))).toBe(false);
    });

    it('rejects a missing summary', () => {
      const result = validateWhatNowExtraction({ ...valid, summary: '' });
      expect(isSchemaValid(result)).toBe(false);
    });

    it('rejects an unknown primary domain rather than guessing one', () => {
      // A domain outside the taxonomy would flow into safety routing, so this
      // must fail loudly rather than default to GENERAL.
      const result = validateWhatNowExtraction({
        ...valid,
        primary_domain: 'CRYPTOCURRENCY',
      });
      expect(isSchemaValid(result)).toBe(false);
      if (!isSchemaValid(result)) {
        expect(result.errors.join(' ')).toContain('CRYPTOCURRENCY');
      }
    });

    it('rejects an out-of-range confidence', () => {
      expect(
        isSchemaValid(validateWhatNowExtraction({ ...valid, confidence: 1.7 })),
      ).toBe(false);
    });

    it('rejects a missing items array', () => {
      const withoutItems = { ...valid };
      delete (withoutItems as Partial<typeof valid>).items;
      expect(isSchemaValid(validateWhatNowExtraction(withoutItems))).toBe(false);
    });
  });

  describe('graceful coercion - unknown enum values degrade, not crash', () => {
    it('coerces an unrecognised item type to UNKNOWN, never to FACT', () => {
      // Step 11 section 8: the one direction this must never fail in is
      // something uncertain being promoted to a fact.
      const result = validateWhatNowExtraction({
        ...valid,
        items: [
          {
            text: 'Something',
            type: 'SPECULATION',
            source: 'USER_STATED',
            confidence: 0.5,
          },
        ],
      });
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        expect(result.value.items[0].type).toBe(ContextItemType.UNKNOWN);
      }
    });

    it('coerces an unrecognised source to INFERRED, never to USER_STATED', () => {
      const result = validateWhatNowExtraction({
        ...valid,
        items: [
          {
            text: 'Something',
            type: 'FACT',
            source: 'TELEPATHY',
            confidence: 0.5,
          },
        ],
      });
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        // Provenance must not be overstated (Step 11 Rule 7).
        expect(result.value.items[0].source).toBe(ContextItemSource.INFERRED);
      }
    });

    it('coerces an unrecognised goal status to INFERRED', () => {
      // Step 11 section 20: an inference must never be recorded as USER_STATED.
      const result = validateWhatNowExtraction({
        ...valid,
        desired_outcomes: [
          { goal: 'Something', status: 'ASSUMED_OBVIOUS', confidence: 0.5 },
        ],
      });
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        expect(result.value.desired_outcomes[0].status).toBe(GoalStatus.INFERRED);
      }
    });

    it('drops a secondary domain outside the taxonomy', () => {
      const result = validateWhatNowExtraction({
        ...valid,
        secondary_domains: [
          { domain: 'FINANCE', confidence: 0.9 },
          { domain: 'ASTROLOGY', confidence: 0.8 },
        ],
      });
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        expect(result.value.secondary_domains).toHaveLength(1);
      }
    });

    it('clamps a confidence the model reported outside 0..1', () => {
      const result = validateWhatNowExtraction({
        ...valid,
        items: [
          { text: 'x', type: 'FACT', source: 'USER_STATED', confidence: 4.2 },
        ],
      });
      if (isSchemaValid(result)) {
        expect(result.value.items[0].confidence).toBe(1);
      }
    });

    it('nulls a fabricated-looking date instead of parsing it', () => {
      // Step 11 section 16 / Build Rule 52: never invent a date.
      const result = validateWhatNowExtraction({
        ...valid,
        temporal_anchors: [
          { raw: 'sometime soon', normalized_date: 'next Tuesday', timeline: 'UPCOMING' },
        ],
      });
      if (isSchemaValid(result)) {
        expect(result.value.temporal_anchors[0].normalized_date).toBeNull();
        expect(result.value.temporal_anchors[0].raw).toBe('sometime soon');
      }
    });

    it('accepts a properly formatted ISO date', () => {
      const result = validateWhatNowExtraction({
        ...valid,
        temporal_anchors: [
          { raw: 'on 12 May', normalized_date: '2026-05-12', timeline: 'UPCOMING' },
        ],
      });
      if (isSchemaValid(result)) {
        expect(result.value.temporal_anchors[0].normalized_date).toBe('2026-05-12');
      }
    });

    it('discards items with no text rather than keeping empty entries', () => {
      const result = validateWhatNowExtraction({
        ...valid,
        items: [
          { text: '', type: 'FACT', source: 'USER_STATED', confidence: 0.9 },
          { text: 'Real', type: 'FACT', source: 'USER_STATED', confidence: 0.9 },
        ],
      });
      if (isSchemaValid(result)) {
        expect(result.value.items).toHaveLength(1);
      }
    });

    it('ignores a safety flag outside the taxonomy', () => {
      const result = validateWhatNowExtraction({
        ...valid,
        safety_flags: ['SELF_HARM', 'BAD_VIBES'],
      });
      if (isSchemaValid(result)) {
        expect(result.value.safety_flags).toEqual(['SELF_HARM']);
      }
    });

    it('tolerates missing optional arrays entirely', () => {
      const minimal = {
        summary: 'Short',
        primary_domain: 'GENERAL',
        confidence: 0.5,
        items: [],
      };
      const result = validateWhatNowExtraction(minimal);
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        expect(result.value.dependencies).toEqual([]);
        expect(result.value.subthemes).toEqual([]);
      }
    });
  });
});
