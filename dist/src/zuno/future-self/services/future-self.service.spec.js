"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const future_self_service_1 = require("./future-self.service");
const plan_progress_port_1 = require("../ports/plan-progress.port");
const future_self_enum_1 = require("../enums/future-self.enum");
const memory_service_1 = require("../../memory/services/memory.service");
const memory_enum_1 = require("../../memory/enums/memory.enum");
const memory_test_harness_1 = require("../../memory/testing/memory-test-harness");
const safety_service_1 = require("../../safety/services/safety.service");
const safety_signal_detector_1 = require("../../safety/services/safety-signal-detector");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
const USER = 'user-a';
const OTHER_USER = 'user-b';
const CHALLENGE = 'ch-1';
const NOW = new Date('2026-09-17T09:00:00.000Z');
class RecordingEngine {
    constructor(reply) {
        this.reply = reply;
        this.calls = [];
    }
    async generate(request) {
        this.calls.push(request);
        return {
            narrative: {
                summary: 'placeholder',
                progress_themes: [],
                open_loops: [],
                strengths_observed: [],
                next_focus: [],
                source_refs: [],
                ...this.reply,
            },
            engineVersion: 'test-engine-1.0.0',
            modelVersion: 'test/model',
            aiGenerationRunId: 'run-1',
        };
    }
}
class StubPlanProgress {
    constructor(plan, progress) {
        this.plan = plan;
        this.progress = progress;
    }
    async getCurrentPlan() {
        return this.plan;
    }
    async getProgress() {
        return this.progress;
    }
}
describe('FutureSelfService', () => {
    let store;
    let outbox;
    let audit;
    let memoryService;
    let narratives;
    beforeEach(() => {
        store = new memory_test_harness_1.InMemoryStore();
        outbox = new memory_test_harness_1.RecordingOutbox();
        audit = new memory_test_harness_1.RecordingAudit();
        narratives = new memory_test_harness_1.FakeRepository(store, 'ZunoFutureSelfNarrative');
        memoryService = new memory_service_1.MemoryService(new memory_test_harness_1.FakeRepository(store, 'ZunoMemory'), new memory_test_harness_1.FakeRepository(store, 'ZunoMemoryCandidate'), new memory_test_harness_1.FakeRepository(store, 'ZunoMemoryEvidence'), new memory_test_harness_1.FakeRepository(store, 'ZunoMemoryConflict'), new safety_service_1.SafetyService(new safety_signal_detector_1.SafetySignalDetector()), outbox, audit, new zuno_ownership_service_1.ZunoOwnershipService(), new clock_service_1.FixedClockService(NOW), (0, memory_test_harness_1.fakeDataSource)(store));
        seedChallenge();
    });
    function seedChallenge(overrides = {}, contextSummary = 'Career uncertainty in Dubai with home loan exposure.') {
        store.rows('ZunoChallenge').push({
            id: CHALLENGE,
            user_id: USER,
            title: 'Career uncertainty in Dubai',
            raw_user_statement: 'Many people have been laid off at my company and I have a home loan.',
            primary_domain: enums_1.ZunoDomain.CAREER,
            status: enums_1.ChallengeStatus.ACTIVE,
            context_version: 1,
            opened_at: NOW,
            resolved_at: null,
            deleted_at: null,
            version: 1,
            ...overrides,
        });
        store.rows('ZunoChallengeContext').push({
            id: 'ctx-1',
            challenge_id: CHALLENGE,
            user_id: USER,
            version_number: 1,
            summary: contextSummary,
            deleted_at: null,
        });
    }
    function seedMemory(overrides) {
        const row = {
            user_id: USER,
            challenge_id: CHALLENGE,
            scope: memory_enum_1.MemoryScope.CHALLENGE,
            memory_type: memory_enum_1.MemoryType.DECISION,
            memory_key: 'k',
            memory_value: { statement: 'Something grounded.' },
            factuality: memory_enum_1.MemoryFactuality.DECISION,
            source: memory_enum_1.MemorySource.USER_EXPLICIT,
            source_event_id: null,
            evidence_type: memory_enum_1.MemoryEvidenceType.EXPLICIT,
            confidence: '0.950',
            retention_class: memory_enum_1.MemoryRetentionClass.UNTIL_SUPERSEDED,
            sensitivity_class: memory_enum_1.MemorySensitivity.STANDARD,
            status: memory_enum_1.MemoryStatus.ACTIVE,
            last_confirmed_at: new Date(NOW.getTime() - 86_400_000),
            confirmation_count: 1,
            expires_at: null,
            supersedes_memory_id: null,
            superseded_by_memory_id: null,
            superseded_at: null,
            redacted_at: null,
            deletion_reason: null,
            version: 1,
            created_at: new Date(NOW.getTime() - 86_400_000),
            updated_at: new Date(NOW.getTime() - 86_400_000),
            deleted_at: null,
            ...overrides,
        };
        store.rows('ZunoMemory').push(row);
        return row;
    }
    function buildService(engine, planProgress = new plan_progress_port_1.NullPlanProgressProvider()) {
        return new future_self_service_1.FutureSelfService(engine, planProgress, narratives, new memory_test_harness_1.FakeRepository(store, 'ZunoChallenge'), new memory_test_harness_1.FakeRepository(store, 'ZunoChallengeContext'), memoryService, new safety_service_1.SafetyService(new safety_signal_detector_1.SafetySignalDetector()), outbox, audit, new zuno_ownership_service_1.ZunoOwnershipService(), new clock_service_1.FixedClockService(NOW), (0, memory_test_harness_1.fakeDataSource)(store), undefined);
    }
    describe('grounded generation', () => {
        it('persists a grounded narrative with its source rows', async () => {
            const memory = seedMemory({
                id: 'mem-1',
                memory_value: {
                    statement: 'Will not resign before another offer is secured.',
                },
            });
            const engine = new RecordingEngine({
                summary: 'We have clarified where we stand and decided not to resign before another offer. The uncertainty is still there, but our dependence on one outcome has reduced.',
                next_focus: ['Keep strengthening the position'],
                source_refs: [`ZunoMemory:${memory.id}`, `ZunoChallenge:${CHALLENGE}`],
            });
            const service = buildService(engine);
            const { narrative, sources } = await service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            });
            expect(narrative.summary).toContain('not to resign');
            expect(narrative.mode).toBe(future_self_enum_1.FutureSelfMode.WEEKLY);
            expect(narrative.boundary_version).toBeTruthy();
            expect(sources.map((s) => s.source_entity_id).sort()).toEqual([CHALLENGE, 'mem-1'].sort());
            expect(outbox.types()).toContain('zuno.future_self.generated');
            expect(audit.actions).toContain('FUTURE_SELF_GENERATED');
        });
        it('sends only relevant memory to the engine, not the whole store', async () => {
            seedMemory({
                id: 'mem-relevant',
                memory_value: {
                    statement: 'Will not resign before another offer is secured.',
                },
            });
            for (let i = 0; i < 15; i++) {
                seedMemory({
                    id: `mem-noise-${i}`,
                    memory_key: `noise_${i}`,
                    memory_type: memory_enum_1.MemoryType.PROGRESS,
                    retention_class: memory_enum_1.MemoryRetentionClass.CHALLENGE_LIFETIME,
                    memory_value: { statement: `Routine step number ${i} completed.` },
                });
            }
            const engine = new RecordingEngine({ summary: 'A grounded reflection.' });
            const service = buildService(engine);
            await service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            });
            const sent = engine.calls[0].context.relevantMemory;
            expect(store.rows('ZunoMemory').length).toBe(16);
            expect(sent.length).toBeLessThanOrEqual(10);
            expect(sent.join(' ')).toContain('not resign before another offer');
        });
        it('degrades to challenge and memory when no Plan module is bound', async () => {
            seedMemory({ id: 'mem-1' });
            const engine = new RecordingEngine({ summary: 'A grounded reflection.' });
            const service = buildService(engine, new plan_progress_port_1.NullPlanProgressProvider());
            const { narrative } = await service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            });
            expect(narrative.id).toBeTruthy();
            expect(engine.calls[0].context.planTitle).toBeNull();
            expect(engine.calls[0].context.completedActions).toEqual([]);
        });
        it('includes plan and progress when a provider is bound', async () => {
            const engine = new RecordingEngine({ summary: 'A grounded reflection.' });
            const service = buildService(engine, new StubPlanProgress({
                planId: 'plan-1',
                title: 'Reduce dependence on one outcome',
                status: 'ACTIVE',
                activeItems: [
                    {
                        id: 'pi-1',
                        title: 'Prepare questions for the bank',
                        status: 'OPEN',
                        dueAt: null,
                    },
                ],
            }, {
                completedActions: [
                    {
                        id: 'pi-0',
                        title: 'Update the CV',
                        completedAt: NOW,
                        sourceEntityType: 'ZunoPlanItem',
                        sourceEntityId: 'pi-0',
                    },
                ],
                openLoops: ['Recruiter outreach'],
                observedPatterns: ['Completes short actions consistently'],
            }));
            await service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            });
            const context = engine.calls[0].context;
            expect(context.planTitle).toBe('Reduce dependence on one outcome');
            expect(context.openPlanItems).toContain('Prepare questions for the bank');
            expect(context.completedActions).toContain('Update the CV');
            expect(context.openLoops).toContain('Recruiter outreach');
        });
        it('sends no timing context when no Rulebook is active (fail closed)', async () => {
            const engine = new RecordingEngine({ summary: 'A grounded reflection.' });
            const service = buildService(engine);
            await service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            });
            expect(engine.calls[0].context.timingContext).toBeNull();
        });
    });
    describe('the section 71 boundary is enforced on real output', () => {
        const adversarial = [
            [
                'future employer',
                'Our work is paying off. By next quarter we will be settled at Emirates Global Logistics.',
            ],
            [
                'future partner',
                'A year from now, marrying Priya Sharma will feel like the obvious next step.',
            ],
            [
                'future salary',
                'The role we are preparing for pays around AED 45,000 a month.',
            ],
            ['guaranteed outcome', 'Trust me, everything works out.'],
            [
                'literal future knowledge',
                'I am you in December 2026, and I can tell you this settles down.',
            ],
        ];
        it.each(adversarial)('refuses an invented %s rather than shipping it', async (_label, summary) => {
            seedMemory({ id: 'mem-1' });
            const service = buildService(new RecordingEngine({ summary }));
            await expect(service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            })).rejects.toMatchObject({
                code: error_codes_enum_1.ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE,
            });
            expect(store.rows('ZunoFutureSelfNarrative')).toHaveLength(0);
            expect(store.rows('ZunoFutureSelfSource')).toHaveLength(0);
        });
        it('catches an invention hidden in a list item rather than the summary', async () => {
            seedMemory({ id: 'mem-1' });
            const service = buildService(new RecordingEngine({
                summary: 'We have made real progress on the things we control.',
                next_focus: ['Accept the offer from Meridian Consulting'],
            }));
            await expect(service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            })).rejects.toMatchObject({
                code: error_codes_enum_1.ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE,
            });
            expect(store.rows('ZunoFutureSelfNarrative')).toHaveLength(0);
        });
        it('records the refusal so the unsupported-claim rate can be measured', async () => {
            seedMemory({ id: 'mem-1' });
            const service = buildService(new RecordingEngine({ summary: 'Trust me, everything works out.' }));
            await expect(service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            })).rejects.toBeDefined();
            expect(audit.actions).toContain('FUTURE_SELF_BOUNDARY_REFUSAL');
        });
        it('refuses a fabricated source reference', async () => {
            seedMemory({ id: 'mem-1' });
            const service = buildService(new RecordingEngine({
                summary: 'We have made progress on the things we control.',
                source_refs: ['ZunoMemory:not-a-real-memory'],
            }));
            await expect(service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            })).rejects.toMatchObject({
                code: error_codes_enum_1.ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE,
            });
        });
    });
    describe('safety ordering', () => {
        it('runs the pre-check BEFORE the model call, and never calls it when blocked', async () => {
            store.clear();
            seedChallenge({
                raw_user_statement: 'I do not want to live anymore, there is no point to any of this.',
            }, 'The person is in acute distress.');
            const engine = new RecordingEngine({ summary: 'anything' });
            const service = buildService(engine);
            await expect(service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED });
            expect(engine.calls).toHaveLength(0);
            expect(store.rows('ZunoFutureSelfNarrative')).toHaveLength(0);
            expect(store.rows('ZunoSafetyDecision').length).toBeGreaterThan(0);
            expect(store.rows('ZunoSafetyIncident').length).toBeGreaterThan(0);
        });
        it('runs the post-check AFTER the model call and blocks fatalistic output', async () => {
            seedMemory({ id: 'mem-1' });
            const engine = new RecordingEngine({
                summary: 'There is nothing you can do about the restructuring, and it cannot be avoided.',
            });
            const service = buildService(engine);
            await expect(service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED });
            expect(engine.calls).toHaveLength(1);
            expect(store.rows('ZunoFutureSelfNarrative')).toHaveLength(0);
        });
    });
    describe('deleted memory never reaches the Future Self prompt', () => {
        it('drops it from the generation context after deletion', async () => {
            const doomed = seedMemory({
                id: 'mem-doomed',
                memory_key: 'relationship_stance',
                memory_value: { statement: 'Considering leaving the marriage.' },
            });
            seedMemory({
                id: 'mem-keeps',
                memory_key: 'career_stance',
                memory_value: {
                    statement: 'Will not resign before another offer is secured.',
                },
            });
            const engine = new RecordingEngine({ summary: 'A grounded reflection.' });
            const service = buildService(engine);
            await service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            });
            expect(engine.calls[0].context.relevantMemory.join(' ')).toContain('marriage');
            await memoryService.deleteMemory(USER, doomed.id, 'USER_REQUESTED');
            await service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            });
            const secondContext = engine.calls[1].context.relevantMemory.join(' ');
            expect(secondContext).not.toContain('marriage');
            expect(secondContext).toContain('not resign before another offer');
        });
    });
    describe('ownership', () => {
        it('refuses to generate against another user\'s challenge', async () => {
            const engine = new RecordingEngine({ summary: 'anything' });
            const service = buildService(engine);
            await expect(service.generate({
                userId: OTHER_USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            expect(engine.calls).toHaveLength(0);
        });
        it('refuses to read another user\'s narrative, as NOT_FOUND', async () => {
            seedMemory({ id: 'mem-1' });
            const service = buildService(new RecordingEngine({ summary: 'A grounded reflection.' }));
            const { narrative } = await service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            });
            await expect(service.findOwned(OTHER_USER, narrative.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            await expect(service.findOwned(USER, narrative.id)).resolves.toBeTruthy();
        });
        it('never lists another user\'s narratives', async () => {
            seedMemory({ id: 'mem-1' });
            const service = buildService(new RecordingEngine({ summary: 'A grounded reflection.' }));
            await service.generate({
                userId: USER,
                challengeId: CHALLENGE,
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
            });
            expect(await service.listForUser(OTHER_USER)).toHaveLength(0);
            expect(await service.listForUser(USER)).toHaveLength(1);
        });
    });
});
//# sourceMappingURL=future-self.service.spec.js.map