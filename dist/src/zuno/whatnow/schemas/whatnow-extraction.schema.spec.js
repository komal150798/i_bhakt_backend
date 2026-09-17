"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const whatnow_extraction_schema_1 = require("./whatnow-extraction.schema");
const zuno_ai_gateway_service_1 = require("../../ai/services/zuno-ai-gateway.service");
const enums_1 = require("../../common/enums");
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
        const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)(valid);
        expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
        if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
            expect(result.value.primary_domain).toBe(enums_1.ZunoDomain.CAREER);
            expect(result.value.items[0].type).toBe(enums_1.ContextItemType.FACT);
        }
    });
    describe('hard failures - a broken contract, not a new vocabulary word', () => {
        it('rejects a non-object', () => {
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)((0, whatnow_extraction_schema_1.validateWhatNowExtraction)('a string'))).toBe(false);
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)((0, whatnow_extraction_schema_1.validateWhatNowExtraction)(null))).toBe(false);
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)((0, whatnow_extraction_schema_1.validateWhatNowExtraction)([1, 2]))).toBe(false);
        });
        it('rejects a missing summary', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({ ...valid, summary: '' });
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
        });
        it('rejects an unknown primary domain rather than guessing one', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
                ...valid,
                primary_domain: 'CRYPTOCURRENCY',
            });
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(false);
            if (!(0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.errors.join(' ')).toContain('CRYPTOCURRENCY');
            }
        });
        it('rejects an out-of-range confidence', () => {
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)((0, whatnow_extraction_schema_1.validateWhatNowExtraction)({ ...valid, confidence: 1.7 }))).toBe(false);
        });
        it('rejects a missing items array', () => {
            const withoutItems = { ...valid };
            delete withoutItems.items;
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)((0, whatnow_extraction_schema_1.validateWhatNowExtraction)(withoutItems))).toBe(false);
        });
    });
    describe('graceful coercion - unknown enum values degrade, not crash', () => {
        it('coerces an unrecognised item type to UNKNOWN, never to FACT', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
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
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.items[0].type).toBe(enums_1.ContextItemType.UNKNOWN);
            }
        });
        it('coerces an unrecognised source to INFERRED, never to USER_STATED', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
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
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.items[0].source).toBe(enums_1.ContextItemSource.INFERRED);
            }
        });
        it('coerces an unrecognised goal status to INFERRED', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
                ...valid,
                desired_outcomes: [
                    { goal: 'Something', status: 'ASSUMED_OBVIOUS', confidence: 0.5 },
                ],
            });
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.desired_outcomes[0].status).toBe(enums_1.GoalStatus.INFERRED);
            }
        });
        it('drops a secondary domain outside the taxonomy', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
                ...valid,
                secondary_domains: [
                    { domain: 'FINANCE', confidence: 0.9 },
                    { domain: 'ASTROLOGY', confidence: 0.8 },
                ],
            });
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.secondary_domains).toHaveLength(1);
            }
        });
        it('clamps a confidence the model reported outside 0..1', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
                ...valid,
                items: [
                    { text: 'x', type: 'FACT', source: 'USER_STATED', confidence: 4.2 },
                ],
            });
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.items[0].confidence).toBe(1);
            }
        });
        it('nulls a fabricated-looking date instead of parsing it', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
                ...valid,
                temporal_anchors: [
                    { raw: 'sometime soon', normalized_date: 'next Tuesday', timeline: 'UPCOMING' },
                ],
            });
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.temporal_anchors[0].normalized_date).toBeNull();
                expect(result.value.temporal_anchors[0].raw).toBe('sometime soon');
            }
        });
        it('accepts a properly formatted ISO date', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
                ...valid,
                temporal_anchors: [
                    { raw: 'on 12 May', normalized_date: '2026-05-12', timeline: 'UPCOMING' },
                ],
            });
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.temporal_anchors[0].normalized_date).toBe('2026-05-12');
            }
        });
        it('discards items with no text rather than keeping empty entries', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
                ...valid,
                items: [
                    { text: '', type: 'FACT', source: 'USER_STATED', confidence: 0.9 },
                    { text: 'Real', type: 'FACT', source: 'USER_STATED', confidence: 0.9 },
                ],
            });
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.items).toHaveLength(1);
            }
        });
        it('ignores a safety flag outside the taxonomy', () => {
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)({
                ...valid,
                safety_flags: ['SELF_HARM', 'BAD_VIBES'],
            });
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
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
            const result = (0, whatnow_extraction_schema_1.validateWhatNowExtraction)(minimal);
            expect((0, zuno_ai_gateway_service_1.isSchemaValid)(result)).toBe(true);
            if ((0, zuno_ai_gateway_service_1.isSchemaValid)(result)) {
                expect(result.value.dependencies).toEqual([]);
                expect(result.value.subthemes).toEqual([]);
            }
        });
    });
});
//# sourceMappingURL=whatnow-extraction.schema.spec.js.map