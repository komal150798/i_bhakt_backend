"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const whatnow_service_1 = require("./whatnow.service");
const whatnow_port_1 = require("../engines/whatnow.port");
const enums_1 = require("../../common/enums");
class StubWhatNowEngine {
    constructor(extraction) {
        this.extraction = extraction;
    }
    async extract() {
        return {
            extraction: this.extraction,
            extractorVersion: 'test-engine-1.0.0',
            aiGenerationRunId: 'run-1',
        };
    }
}
function baseExtraction(overrides = {}) {
    return {
        summary: 'A situation the person is working through.',
        primary_domain: enums_1.ZunoDomain.GENERAL,
        secondary_domains: [],
        theme: null,
        subthemes: [],
        items: [],
        dependencies: [],
        desired_outcomes: [],
        decisions: [],
        controllable: [],
        external: [],
        temporal_anchors: [],
        missing_information: [],
        emotional_signals: [],
        emotional_intensity: enums_1.EmotionalIntensity.MODERATE,
        urgency: enums_1.Urgency.MEDIUM,
        safety_flags: [],
        confidence: 0.9,
        ...overrides,
    };
}
async function buildService(extraction) {
    const moduleRef = await testing_1.Test.createTestingModule({
        providers: [
            whatnow_service_1.WhatNowService,
            { provide: whatnow_port_1.WHATNOW_ENGINE, useValue: new StubWhatNowEngine(extraction) },
        ],
    }).compile();
    return moduleRef.get(whatnow_service_1.WhatNowService);
}
describe('WhatNowService', () => {
    describe('Golden: career uncertainty (the Ashish reference case)', () => {
        const extraction = baseExtraction({
            summary: 'Layoffs at work have put your income, your home loan and your life in Dubai in the same question.',
            primary_domain: enums_1.ZunoDomain.CAREER,
            secondary_domains: [
                { domain: enums_1.ZunoDomain.FINANCE, confidence: 0.94 },
                { domain: enums_1.ZunoDomain.FOREIGN_RESIDENCE, confidence: 0.72 },
            ],
            theme: 'JOB_SECURITY',
            subthemes: ['LAYOFF_RISK', 'FINANCIAL_DEPENDENCY'],
            items: [
                {
                    text: 'Layoffs are occurring at the employer',
                    type: enums_1.ContextItemType.FACT,
                    source: enums_1.ContextItemSource.USER_STATED,
                    confidence: 0.95,
                },
                {
                    text: 'They have a home loan',
                    type: enums_1.ContextItemType.FACT,
                    source: enums_1.ContextItemSource.USER_STATED,
                    confidence: 0.98,
                },
                {
                    text: 'They may lose their job',
                    type: enums_1.ContextItemType.FEAR,
                    source: enums_1.ContextItemSource.USER_STATED,
                    confidence: 0.97,
                },
            ],
            dependencies: [
                { from: 'Employment', to: 'Monthly income' },
                { from: 'Monthly income', to: 'Home loan servicing' },
            ],
            desired_outcomes: [
                {
                    goal: 'Maintain financial stability',
                    status: enums_1.GoalStatus.INFERRED,
                    confidence: 0.85,
                },
            ],
            controllable: ['CV readiness', 'Networking', 'Loan contingency planning'],
            external: ['Employer restructuring', 'Job market'],
            emotional_signals: [enums_1.EmotionalSignal.WORRIED],
            emotional_intensity: enums_1.EmotionalIntensity.HIGH,
            urgency: enums_1.Urgency.HIGH,
            confidence: 0.91,
        });
        it('classifies the primary domain and keeps every secondary domain', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'irrelevant, engine is stubbed' });
            expect(result.primaryDomain).toBe(enums_1.ZunoDomain.CAREER);
            expect(result.secondaryDomains.map((d) => d.domain)).toEqual([
                enums_1.ZunoDomain.FINANCE,
                enums_1.ZunoDomain.FOREIGN_RESIDENCE,
            ]);
        });
        it('carries the per-domain risk class, not one risk for the whole challenge', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'x' });
            expect(result.domainRisk.get(enums_1.ZunoDomain.CAREER)).toBe(enums_1.ZunoRiskClass.MODERATE_RISK);
            expect(result.domainRisk.get(enums_1.ZunoDomain.FOREIGN_RESIDENCE)).toBe(enums_1.ZunoRiskClass.HIGH_STAKES);
        });
        it('never converts a fear into a fact', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'x' });
            const jobLoss = result.payload.items.find((item) => item.text.includes('may lose their job'));
            expect(jobLoss?.type).toBe(enums_1.ContextItemType.FEAR);
            expect(result.payload.items.filter((i) => i.type === enums_1.ContextItemType.FACT)).toHaveLength(2);
        });
        it('enters PREPARE mode when the concern is a fear rather than a loss', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'x' });
            expect(result.mode).toBe(enums_1.ChallengeMode.PREPARE);
        });
        it('routes to scenario, life-signal and realignment engines', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'x' });
            expect(result.routing.scenario_engine).toBe(true);
            expect(result.routing.life_signal_engine).toBe(true);
            expect(result.routing.realignment_engine).toBe(true);
            expect(result.routing.plan_engine).toBe(true);
        });
        it('does not ask for clarification when confidence is high', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'x' });
            expect(result.clarificationRequired).toBe(false);
        });
        it('produces a human title, not a classification code', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'x' });
            expect(result.title).not.toMatch(/CAREER|JOB_SECURITY|FOREIGN_RESIDENCE/);
            expect(result.title.length).toBeGreaterThan(0);
            expect(result.title.length).toBeLessThanOrEqual(80);
        });
    });
    describe('Golden: ambiguous challenge', () => {
        const extraction = baseExtraction({
            summary: 'Something feels stuck, but it is not yet clear what.',
            primary_domain: enums_1.ZunoDomain.GENERAL,
            confidence: 0.31,
            missing_information: [
                {
                    question: 'What feels most stuck right now - work, money, relationships, or health?',
                    information_gain: 0.95,
                    rationale: 'determines which domain we are even in',
                },
                {
                    question: 'How long has it felt this way?',
                    information_gain: 0.4,
                    rationale: 'affects urgency',
                },
            ],
            emotional_signals: [enums_1.EmotionalSignal.CONFUSED],
        });
        it('asks for clarification instead of guessing a domain', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'Nothing is working.' });
            expect(result.clarificationRequired).toBe(true);
            expect(result.mode).toBe(enums_1.ChallengeMode.UNDERSTAND);
        });
        it('ranks clarification questions by information gain', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'Nothing is working.' });
            expect(result.payload.missing_information[0].question).toContain('most stuck');
        });
        it('does not run downstream engines on an understanding we admit is incomplete', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'Nothing is working.' });
            expect(result.routing.plan_engine).toBe(false);
            expect(result.routing.scenario_engine).toBe(false);
            expect(result.routing.astrology).toBe(false);
        });
    });
    describe('Golden: simple decision', () => {
        const extraction = baseExtraction({
            summary: 'You are weighing leaving a salaried role to start a business.',
            primary_domain: enums_1.ZunoDomain.CAREER,
            secondary_domains: [
                { domain: enums_1.ZunoDomain.BUSINESS, confidence: 0.9 },
                { domain: enums_1.ZunoDomain.FINANCE, confidence: 0.88 },
            ],
            decisions: [
                {
                    question: 'Stay employed or start the business?',
                    options: ['Stay employed', 'Start the business', 'Transition gradually'],
                    confidence: 0.93,
                },
            ],
            controllable: ['Runway calculation', 'Client pipeline'],
            confidence: 0.88,
        });
        it('enters DECIDE mode when a real decision is on the table', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'x' });
            expect(result.mode).toBe(enums_1.ChallengeMode.DECIDE);
            expect(result.routing.scenario_engine).toBe(true);
        });
    });
    describe('Golden: student preparation', () => {
        const extraction = baseExtraction({
            summary: 'Your exam is a few months out and focus keeps slipping.',
            primary_domain: enums_1.ZunoDomain.EDUCATION,
            theme: 'COMPETITIVE_EXAM',
            items: [
                {
                    text: 'The exam is roughly four months away',
                    type: enums_1.ContextItemType.FACT,
                    source: enums_1.ContextItemSource.USER_STATED,
                    confidence: 0.9,
                },
                {
                    text: 'They fear not clearing it',
                    type: enums_1.ContextItemType.FEAR,
                    source: enums_1.ContextItemSource.USER_STATED,
                    confidence: 0.92,
                },
            ],
            temporal_anchors: [
                {
                    raw: 'four months away',
                    normalized_date: null,
                    timeline: enums_1.ChallengeTimeline.UPCOMING,
                },
            ],
            controllable: ['Study consistency', 'Mock tests', 'Routine'],
            confidence: 0.87,
        });
        it('preserves an unresolvable date as null rather than guessing one', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'x' });
            expect(result.payload.temporal_anchors[0].normalized_date).toBeNull();
            expect(result.payload.temporal_anchors[0].raw).toBe('four months away');
        });
    });
    describe('Golden: relationship uncertainty', () => {
        const extraction = baseExtraction({
            summary: 'Four years in, the arguments have become the pattern.',
            primary_domain: enums_1.ZunoDomain.RELATIONSHIP,
            theme: 'RELATIONSHIP_CONTINUITY',
            decisions: [
                {
                    question: 'Continue, repair, or end it?',
                    options: ['Continue', 'Repair', 'End'],
                    confidence: 0.8,
                },
            ],
            emotional_signals: [enums_1.EmotionalSignal.UNCERTAIN],
            emotional_intensity: enums_1.EmotionalIntensity.HIGH,
            confidence: 0.82,
        });
        it('handles the relationship domain through the same framework', async () => {
            const service = await buildService(extraction);
            const result = await service.analyze({ statement: 'x' });
            expect(result.primaryDomain).toBe(enums_1.ZunoDomain.RELATIONSHIP);
            expect(result.mode).toBe(enums_1.ChallengeMode.DECIDE);
            expect(result.clarificationRequired).toBe(false);
        });
    });
    describe('deterministic invariants', () => {
        it('demotes an INFERRED item that the model labelled as FACT', async () => {
            const service = await buildService(baseExtraction({
                primary_domain: enums_1.ZunoDomain.CAREER,
                items: [
                    {
                        text: 'Their employer is in financial trouble',
                        type: enums_1.ContextItemType.FACT,
                        source: enums_1.ContextItemSource.INFERRED,
                        confidence: 0.7,
                    },
                ],
            }));
            const result = await service.analyze({ statement: 'x' });
            expect(result.payload.items[0].type).toBe(enums_1.ContextItemType.ASSUMPTION);
        });
        it('removes the primary domain if the model repeated it as secondary', async () => {
            const service = await buildService(baseExtraction({
                primary_domain: enums_1.ZunoDomain.CAREER,
                secondary_domains: [
                    { domain: enums_1.ZunoDomain.CAREER, confidence: 0.9 },
                    { domain: enums_1.ZunoDomain.FINANCE, confidence: 0.8 },
                ],
            }));
            const result = await service.analyze({ statement: 'x' });
            expect(result.secondaryDomains).toHaveLength(1);
            expect(result.secondaryDomains[0].domain).toBe(enums_1.ZunoDomain.FINANCE);
        });
        it('reduces response depth when the person is highly distressed', async () => {
            const service = await buildService(baseExtraction({
                primary_domain: enums_1.ZunoDomain.FAMILY,
                emotional_intensity: enums_1.EmotionalIntensity.VERY_HIGH,
            }));
            const result = await service.analyze({ statement: 'x' });
            expect(result.responseDepth).toBe(enums_1.ResponseDepth.QUICK);
        });
        it('enters RECOVER mode once the feared event is a confirmed fact', async () => {
            const service = await buildService(baseExtraction({
                primary_domain: enums_1.ZunoDomain.CAREER,
                items: [
                    {
                        text: 'Their employment was terminated on Friday',
                        type: enums_1.ContextItemType.FACT,
                        source: enums_1.ContextItemSource.USER_STATED,
                        confidence: 0.99,
                    },
                ],
            }));
            const result = await service.analyze({ statement: 'x' });
            expect(result.mode).toBe(enums_1.ChallengeMode.RECOVER);
        });
        it('keeps at most three clarification questions', async () => {
            const service = await buildService(baseExtraction({
                confidence: 0.4,
                missing_information: Array.from({ length: 7 }, (_, i) => ({
                    question: `Question ${i}`,
                    information_gain: i / 10,
                    rationale: 'test',
                })),
            }));
            const result = await service.analyze({ statement: 'x' });
            expect(result.payload.missing_information.length).toBeLessThanOrEqual(3);
            expect(result.payload.missing_information[0].question).toBe('Question 6');
        });
    });
});
//# sourceMappingURL=whatnow.service.spec.js.map