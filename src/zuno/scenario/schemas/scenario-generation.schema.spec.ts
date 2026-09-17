import { validateScenarioGeneration } from './scenario-generation.schema';
import { validateWhatIfExploration } from './what-if-exploration.schema';
import { isSchemaValid } from '../../ai/services/zuno-ai-gateway.service';
import {
  DecisionReadiness,
  PreparationClass,
  ScenarioEvidenceClass,
  ScenarioHorizon,
  ScenarioImpact,
  ScenarioRelevance,
  ScenarioType,
  WhatIfAssumptionType,
  WHAT_IF_MAX_CASCADE_DEPTH,
} from '../enums/scenario.enum';

/**
 * Master Index rule 11 and Build Rule 84: model output never becomes trusted
 * structured data because it happened to parse. These are the tests for the
 * gate that enforces it.
 */

function validCandidate(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Stay in the current role',
    summary: 'Employment continues while the company completes restructuring.',
    scenario_type: ScenarioType.CONTINUITY,
    horizon: ScenarioHorizon.NEAR_TERM,
    impact: ScenarioImpact.MODERATE,
    relevance: ScenarioRelevance.HIGH,
    confidence: 0.8,
    basis: [
      {
        type: ScenarioEvidenceClass.CURRENT_REALITY,
        reference: 'Still employed while restructuring is underway',
      },
    ],
    signals_for: ['Manager reassurance'],
    signals_against: ['Responsibility reduced'],
    dependencies: [{ from: 'Employment', to: 'Monthly income' }],
    risks: [],
    opportunities: [],
    controllable_factors: ['Delivery quality'],
    impact_areas: ['CAREER', 'FINANCE'],
    scenario_specific_preparation: ['Increase internal visibility'],
    benefits: [],
    constraints: [],
    reversibility: null,
    option_ref: null,
    ...overrides,
  };
}

function validGeneration(overrides: Record<string, unknown> = {}) {
  return {
    seeds: ['Current job continues'],
    scenarios: [validCandidate()],
    shared_preparation: ['Refresh the CV'],
    watch_signals: ['Formal restructuring notice'],
    comparison: [],
    decision_readiness: DecisionReadiness.READY,
    safety_flags: [],
    ...overrides,
  };
}

describe('validateScenarioGeneration', () => {
  describe('structural failures are hard failures', () => {
    it('rejects a non-object root', () => {
      const result = validateScenarioGeneration('not json at all');
      expect(isSchemaValid(result)).toBe(false);
    });

    it('rejects a missing scenarios array', () => {
      const result = validateScenarioGeneration({ seeds: [] });
      expect(isSchemaValid(result)).toBe(false);
      if (!isSchemaValid(result)) {
        expect(result.errors[0]).toContain('scenarios must be an array');
      }
    });

    it('rejects a response whose scenarios all lack a title or summary', () => {
      // Step 12 section 81: a card needs a title and one concise meaning. An
      // entry with neither cannot be padded into existence.
      const result = validateScenarioGeneration({
        scenarios: [{ confidence: 0.9 }, { summary: 'something' }],
      });
      expect(isSchemaValid(result)).toBe(false);
      if (!isSchemaValid(result)) {
        expect(result.errors.join(' ')).toContain('no usable entry');
      }
    });
  });

  describe('unknown enum values degrade, they do not crash (Step 21 section 19)', () => {
    it('coerces an unrecognised scenario_type to CHANGE, not to something flattering', () => {
      const result = validateScenarioGeneration(
        validGeneration({
          scenarios: [validCandidate({ scenario_type: 'MIRACLE' })],
        }),
      );
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        // CHANGE claims a material change without claiming a direction, so an
        // unknown label cannot silently become an OPPORTUNITY or a RECOVERY.
        expect(result.value.scenarios[0].scenario_type).toBe(ScenarioType.CHANGE);
      }
    });

    it('coerces an unrecognised relevance to CONTINGENCY', () => {
      const result = validateScenarioGeneration(
        validGeneration({
          scenarios: [validCandidate({ relevance: 'VERY_LIKELY' })],
        }),
      );
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        expect(result.value.scenarios[0].relevance).toBe(
          ScenarioRelevance.CONTINGENCY,
        );
      }
    });

    it('labels an unrecognised basis type as SYSTEM_INFERENCE rather than as evidence', () => {
      // Step 12 section 14: guessing USER_STATED here would launder an
      // inference into evidence, and the support rule downstream depends on
      // this label being honest.
      const result = validateScenarioGeneration(
        validGeneration({
          scenarios: [
            validCandidate({
              basis: [{ type: 'VIBES', reference: 'a hunch' }],
            }),
          ],
        }),
      );
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        expect(result.value.scenarios[0].basis[0].type).toBe(
          ScenarioEvidenceClass.SYSTEM_INFERENCE,
        );
      }
    });

    it('drops an impact area that is not a ZUNO domain', () => {
      const result = validateScenarioGeneration(
        validGeneration({
          scenarios: [validCandidate({ impact_areas: ['CAREER', 'ASTRAL_PLANE'] })],
        }),
      );
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        expect(result.value.scenarios[0].impact_areas).toEqual(['CAREER']);
      }
    });

    it('clamps an out-of-range confidence rather than persisting it', () => {
      const result = validateScenarioGeneration(
        validGeneration({ scenarios: [validCandidate({ confidence: 7 })] }),
      );
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        expect(result.value.scenarios[0].confidence).toBe(1);
      }
    });

    it('accepts preparation as plain strings or as structured entries', () => {
      const result = validateScenarioGeneration(
        validGeneration({
          scenarios: [
            validCandidate({
              scenario_specific_preparation: [
                'Increase internal visibility',
                { action: 'Talk to the lender', classification: PreparationClass.CONTINGENCY_ONLY },
              ],
            }),
          ],
        }),
      );
      expect(isSchemaValid(result)).toBe(true);
      if (isSchemaValid(result)) {
        const prep = result.value.scenarios[0].scenario_specific_preparation;
        expect(prep).toHaveLength(2);
        expect(prep[0].classification).toBe(PreparationClass.SCENARIO_SPECIFIC);
        expect(prep[1].classification).toBe(PreparationClass.CONTINGENCY_ONLY);
      }
    });
  });

  describe('the deterministic-claim boundary is a hard failure', () => {
    it('rejects a scenario summary that predicts an outcome', () => {
      const result = validateScenarioGeneration(
        validGeneration({
          scenarios: [
            validCandidate({ summary: 'You will lose your job in November.' }),
          ],
        }),
      );
      expect(isSchemaValid(result)).toBe(false);
      if (!isSchemaValid(result)) {
        expect(result.errors[0]).toContain('deterministic claim');
        expect(result.errors[0]).toContain('PREDICTION');
      }
    });

    it('rejects a fabricated probability anywhere in the response', () => {
      const result = validateScenarioGeneration(
        validGeneration({
          watch_signals: ['Termination notice - 72% chance this quarter'],
        }),
      );
      expect(isSchemaValid(result)).toBe(false);
      if (!isSchemaValid(result)) {
        expect(result.errors[0]).toContain('NUMERIC_PROBABILITY');
      }
    });

    it('rejects a guarantee buried in shared preparation', () => {
      const result = validateScenarioGeneration(
        validGeneration({
          shared_preparation: ['Refreshing the CV is guaranteed to get you hired'],
        }),
      );
      expect(isSchemaValid(result)).toBe(false);
    });

    it('rejects fatalism in a risk entry', () => {
      const result = validateScenarioGeneration(
        validGeneration({
          scenarios: [
            validCandidate({ risks: ['There is nothing you can do about it.'] }),
          ],
        }),
      );
      expect(isSchemaValid(result)).toBe(false);
      if (!isSchemaValid(result)) {
        expect(result.errors[0]).toContain('FATALISM');
      }
    });

    it('accepts the specification\'s own canonical scenario set', () => {
      // Step 12 sections 94-95. If the guard rejected these, it would be
      // rejecting the product.
      const result = validateScenarioGeneration(
        validGeneration({
          scenarios: [
            validCandidate({
              title: 'Stay in Current Role',
              summary: 'Employment continues while restructuring settles.',
            }),
            validCandidate({
              title: 'Role Restructures',
              summary: 'Role or responsibilities materially change.',
              scenario_type: ScenarioType.CHANGE,
            }),
            validCandidate({
              title: 'Transition Out',
              summary: 'Current employment ends.',
              scenario_type: ScenarioType.TRANSITION,
            }),
          ],
          shared_preparation: [
            'Update CV',
            'Strengthen network',
            'Understand loan options',
          ],
        }),
      );
      expect(isSchemaValid(result)).toBe(true);
    });
  });
});

describe('validateWhatIfExploration', () => {
  function validExploration(overrides: Record<string, unknown> = {}) {
    return {
      assumption: 'Employment ends next month',
      assumptions: [
        { text: 'Employment ends next month', type: WhatIfAssumptionType.USER_STATED },
      ],
      implications: [
        {
          text: 'The main income source would pause',
          layer: 1,
          basis: ScenarioEvidenceClass.DEPENDENCY,
          dependency_reference: 'Employment -> Monthly income',
        },
      ],
      controllable_actions: ['Prepare employment documents'],
      existing_preparation_that_helps: ['Updated CV'],
      preparation: ['Clarify the loan contingency'],
      impact_areas: ['CAREER'],
      impact: ScenarioImpact.HIGH,
      reversibility: null,
      safety_flags: [],
      confidence: 0.8,
      ...overrides,
    };
  }

  it('accepts a well-formed exploration', () => {
    const result = validateWhatIfExploration(validExploration());
    expect(isSchemaValid(result)).toBe(true);
  });

  it('rejects an exploration with no assumption', () => {
    const result = validateWhatIfExploration(
      validExploration({ assumption: undefined }),
    );
    expect(isSchemaValid(result)).toBe(false);
  });

  it('holds the possibility boundary even though the premise is hypothetical', () => {
    // Step 12 section 73 and Step 19 section 106: accepting the premise does
    // not license predicting what another person does.
    const result = validateWhatIfExploration(
      validExploration({
        implications: [
          {
            text: 'Your partner will leave you within the month.',
            layer: 1,
            basis: ScenarioEvidenceClass.SYSTEM_INFERENCE,
            dependency_reference: null,
          },
        ],
      }),
    );
    expect(isSchemaValid(result)).toBe(false);
  });

  it('truncates a cascade beyond the permitted depth instead of failing', () => {
    // Step 12 sections 43-44: "lose job -> lose home -> marriage breaks down ->
    // health deteriorates" is the named anti-pattern. The early layers are
    // still useful, so the deep ones are dropped rather than the whole result.
    const result = validateWhatIfExploration(
      validExploration({
        implications: [
          { text: 'Income would pause', layer: 1, basis: ScenarioEvidenceClass.DEPENDENCY },
          { text: 'Loan servicing becomes sensitive', layer: 2, basis: ScenarioEvidenceClass.DEPENDENCY },
          { text: 'Housing decisions come into view', layer: 3, basis: ScenarioEvidenceClass.DEPENDENCY },
          { text: 'Family relationships come under strain', layer: 4, basis: ScenarioEvidenceClass.SYSTEM_INFERENCE },
          { text: 'Health declines', layer: 5, basis: ScenarioEvidenceClass.SYSTEM_INFERENCE },
        ],
      }),
    );
    expect(isSchemaValid(result)).toBe(true);
    if (isSchemaValid(result)) {
      expect(result.value.implications).toHaveLength(WHAT_IF_MAX_CASCADE_DEPTH);
      expect(
        result.value.implications.every(
          (entry) => entry.layer <= WHAT_IF_MAX_CASCADE_DEPTH,
        ),
      ).toBe(true);
    }
  });

  it('fails when every implication sits beyond the depth bound', () => {
    const result = validateWhatIfExploration(
      validExploration({
        implications: [{ text: 'Health declines', layer: 9 }],
      }),
    );
    expect(isSchemaValid(result)).toBe(false);
  });

  it('defaults an unlabelled implication to SYSTEM_INFERENCE', () => {
    const result = validateWhatIfExploration(
      validExploration({ implications: ['Income would pause'] }),
    );
    expect(isSchemaValid(result)).toBe(true);
    if (isSchemaValid(result)) {
      expect(result.value.implications[0].basis).toBe(
        ScenarioEvidenceClass.SYSTEM_INFERENCE,
      );
      expect(result.value.implications[0].layer).toBe(1);
    }
  });
});
