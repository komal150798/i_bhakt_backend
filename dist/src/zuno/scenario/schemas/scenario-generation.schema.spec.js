"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scenario_generation_schema_1 = require("./scenario-generation.schema");
const what_if_exploration_schema_1 = require("./what-if-exploration.schema");
const zuno_ai_gateway_service_1 = require("../../ai/services/zuno-ai-gateway.service");
const scenario_enum_1 = require("../enums/scenario.enum");
function validCandidate(overrides = {}) {
    return {
        title: 'Stay in the current role',
        summary: 'Employment continues while the company completes restructuring.',
        scenario_type: scenario_enum_1.ScenarioType.CONTINUITY,
        horizon: scenario_enum_1.ScenarioHorizon.NEAR_TERM,
        impact: scenario_enum_1.ScenarioImpact.MODERATE,
        relevance: scenario_enum_1.ScenarioRelevance.HIGH,
        confidence: 0.8,
        basis: [
            {
                type: scenario_enum_1.ScenarioEvidenceClass.CURRENT_REALITY,
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
function validGeneration(overrides = {}) {
    return {
        seeds: ['Current job continues'],
        scenarios: [validCandidate()],
        shared_preparation: ['Refresh the CV'],
        watch_signals: ['Formal restructuring notice'],
        comparison: [],
        decision_readiness: scenario_enum_1.DecisionReadiness.READY,
        safety_flags: [],
        ...overrides,
    };
}
describe('validateScenarioGeneration', () => {
    describe('structural failures are hard failures', () => {
        it('rejects a non-object root', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)('not json at all');
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
        });
        it('rejects a missing scenarios array', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)({ seeds: [] });
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
            if (!(0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.errors[0]).toContain('scenarios must be an array');
            }
        });
        it('rejects a response whose scenarios all lack a title or summary', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)({
                scenarios: [{ confidence: 0.9 }, { summary: 'something' }],
            });
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
            if (!(0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.errors.join(' ')).toContain('no usable entry');
            }
        });
    });
    describe('unknown enum values degrade, they do not crash (Step 21 section 19)', () => {
        it('coerces an unrecognised scenario_type to CHANGE, not to something flattering', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                scenarios: [validCandidate({ scenario_type: 'MIRACLE' })],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.scenarios[0].scenario_type).toBe(scenario_enum_1.ScenarioType.CHANGE);
            }
        });
        it('coerces an unrecognised relevance to CONTINGENCY', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                scenarios: [validCandidate({ relevance: 'VERY_LIKELY' })],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.scenarios[0].relevance).toBe(scenario_enum_1.ScenarioRelevance.CONTINGENCY);
            }
        });
        it('labels an unrecognised basis type as SYSTEM_INFERENCE rather than as evidence', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                scenarios: [
                    validCandidate({
                        basis: [{ type: 'VIBES', reference: 'a hunch' }],
                    }),
                ],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.scenarios[0].basis[0].type).toBe(scenario_enum_1.ScenarioEvidenceClass.SYSTEM_INFERENCE);
            }
        });
        it('drops an impact area that is not a ZUNO domain', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                scenarios: [validCandidate({ impact_areas: ['CAREER', 'ASTRAL_PLANE'] })],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.scenarios[0].impact_areas).toEqual(['CAREER']);
            }
        });
        it('clamps an out-of-range confidence rather than persisting it', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({ scenarios: [validCandidate({ confidence: 7 })] }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.scenarios[0].confidence).toBe(1);
            }
        });
        it('accepts preparation as plain strings or as structured entries', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                scenarios: [
                    validCandidate({
                        scenario_specific_preparation: [
                            'Increase internal visibility',
                            { action: 'Talk to the lender', classification: scenario_enum_1.PreparationClass.CONTINGENCY_ONLY },
                        ],
                    }),
                ],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                const prep = result.value.scenarios[0].scenario_specific_preparation;
                expect(prep).toHaveLength(2);
                expect(prep[0].classification).toBe(scenario_enum_1.PreparationClass.SCENARIO_SPECIFIC);
                expect(prep[1].classification).toBe(scenario_enum_1.PreparationClass.CONTINGENCY_ONLY);
            }
        });
    });
    describe('the deterministic-claim boundary is a hard failure', () => {
        it('rejects a scenario summary that predicts an outcome', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                scenarios: [
                    validCandidate({ summary: 'You will lose your job in November.' }),
                ],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
            if (!(0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.errors[0]).toContain('deterministic claim');
                expect(result.errors[0]).toContain('PREDICTION');
            }
        });
        it('rejects a fabricated probability anywhere in the response', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                watch_signals: ['Termination notice - 72% chance this quarter'],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
            if (!(0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.errors[0]).toContain('NUMERIC_PROBABILITY');
            }
        });
        it('rejects a guarantee buried in shared preparation', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                shared_preparation: ['Refreshing the CV is guaranteed to get you hired'],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
        });
        it('rejects fatalism in a risk entry', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                scenarios: [
                    validCandidate({ risks: ['There is nothing you can do about it.'] }),
                ],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
            if (!(0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.errors[0]).toContain('FATALISM');
            }
        });
        it('accepts the specification\'s own canonical scenario set', () => {
            const result = (0, scenario_generation_schema_1.validateScenarioGeneration)(validGeneration({
                scenarios: [
                    validCandidate({
                        title: 'Stay in Current Role',
                        summary: 'Employment continues while restructuring settles.',
                    }),
                    validCandidate({
                        title: 'Role Restructures',
                        summary: 'Role or responsibilities materially change.',
                        scenario_type: scenario_enum_1.ScenarioType.CHANGE,
                    }),
                    validCandidate({
                        title: 'Transition Out',
                        summary: 'Current employment ends.',
                        scenario_type: scenario_enum_1.ScenarioType.TRANSITION,
                    }),
                ],
                shared_preparation: [
                    'Update CV',
                    'Strengthen network',
                    'Understand loan options',
                ],
            }));
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
        });
    });
});
describe('validateWhatIfExploration', () => {
    function validExploration(overrides = {}) {
        return {
            assumption: 'Employment ends next month',
            assumptions: [
                { text: 'Employment ends next month', type: scenario_enum_1.WhatIfAssumptionType.USER_STATED },
            ],
            implications: [
                {
                    text: 'The main income source would pause',
                    layer: 1,
                    basis: scenario_enum_1.ScenarioEvidenceClass.DEPENDENCY,
                    dependency_reference: 'Employment -> Monthly income',
                },
            ],
            controllable_actions: ['Prepare employment documents'],
            existing_preparation_that_helps: ['Updated CV'],
            preparation: ['Clarify the loan contingency'],
            impact_areas: ['CAREER'],
            impact: scenario_enum_1.ScenarioImpact.HIGH,
            reversibility: null,
            safety_flags: [],
            confidence: 0.8,
            ...overrides,
        };
    }
    it('accepts a well-formed exploration', () => {
        const result = (0, what_if_exploration_schema_1.validateWhatIfExploration)(validExploration());
        expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
    });
    it('rejects an exploration with no assumption', () => {
        const result = (0, what_if_exploration_schema_1.validateWhatIfExploration)(validExploration({ assumption: undefined }));
        expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
    });
    it('holds the possibility boundary even though the premise is hypothetical', () => {
        const result = (0, what_if_exploration_schema_1.validateWhatIfExploration)(validExploration({
            implications: [
                {
                    text: 'Your partner will leave you within the month.',
                    layer: 1,
                    basis: scenario_enum_1.ScenarioEvidenceClass.SYSTEM_INFERENCE,
                    dependency_reference: null,
                },
            ],
        }));
        expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
    });
    it('truncates a cascade beyond the permitted depth instead of failing', () => {
        const result = (0, what_if_exploration_schema_1.validateWhatIfExploration)(validExploration({
            implications: [
                { text: 'Income would pause', layer: 1, basis: scenario_enum_1.ScenarioEvidenceClass.DEPENDENCY },
                { text: 'Loan servicing becomes sensitive', layer: 2, basis: scenario_enum_1.ScenarioEvidenceClass.DEPENDENCY },
                { text: 'Housing decisions come into view', layer: 3, basis: scenario_enum_1.ScenarioEvidenceClass.DEPENDENCY },
                { text: 'Family relationships come under strain', layer: 4, basis: scenario_enum_1.ScenarioEvidenceClass.SYSTEM_INFERENCE },
                { text: 'Health declines', layer: 5, basis: scenario_enum_1.ScenarioEvidenceClass.SYSTEM_INFERENCE },
            ],
        }));
        expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
        if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
            expect(result.value.implications).toHaveLength(scenario_enum_1.WHAT_IF_MAX_CASCADE_DEPTH);
            expect(result.value.implications.every((entry) => entry.layer <= scenario_enum_1.WHAT_IF_MAX_CASCADE_DEPTH)).toBe(true);
        }
    });
    it('fails when every implication sits beyond the depth bound', () => {
        const result = (0, what_if_exploration_schema_1.validateWhatIfExploration)(validExploration({
            implications: [{ text: 'Health declines', layer: 9 }],
        }));
        expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
    });
    it('defaults an unlabelled implication to SYSTEM_INFERENCE', () => {
        const result = (0, what_if_exploration_schema_1.validateWhatIfExploration)(validExploration({ implications: ['Income would pause'] }));
        expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
        if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
            expect(result.value.implications[0].basis).toBe(scenario_enum_1.ScenarioEvidenceClass.SYSTEM_INFERENCE);
            expect(result.value.implications[0].layer).toBe(1);
        }
    });
});
//# sourceMappingURL=scenario-generation.schema.spec.js.map