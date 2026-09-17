"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memory_service_1 = require("./memory.service");
const memory_enum_1 = require("../enums/memory.enum");
const memory_events_1 = require("../events/memory-events");
const memory_test_harness_1 = require("../testing/memory-test-harness");
const safety_service_1 = require("../../safety/services/safety.service");
const safety_signal_detector_1 = require("../../safety/services/safety-signal-detector");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const USER = 'user-a';
const OTHER_USER = 'user-b';
const CHALLENGE = 'challenge-1';
const OTHER_CHALLENGE = 'challenge-2';
const NOW = new Date('2026-09-17T09:00:00.000Z');
describe('MemoryService', () => {
    let store;
    let service;
    let outbox;
    let audit;
    let memories;
    let candidates;
    beforeEach(() => {
        store = new memory_test_harness_1.InMemoryStore();
        outbox = new memory_test_harness_1.RecordingOutbox();
        audit = new memory_test_harness_1.RecordingAudit();
        memories = new memory_test_harness_1.FakeRepository(store, 'ZunoMemory');
        candidates = new memory_test_harness_1.FakeRepository(store, 'ZunoMemoryCandidate');
        service = new memory_service_1.MemoryService(memories, candidates, new memory_test_harness_1.FakeRepository(store, 'ZunoMemoryEvidence'), new memory_test_harness_1.FakeRepository(store, 'ZunoMemoryConflict'), new safety_service_1.SafetyService(new safety_signal_detector_1.SafetySignalDetector()), outbox, audit, new zuno_ownership_service_1.ZunoOwnershipService(), new clock_service_1.FixedClockService(NOW), (0, memory_test_harness_1.fakeDataSource)(store));
    });
    function seedMemory(overrides = {}) {
        const row = {
            id: overrides.id ?? `mem-${store.rows('ZunoMemory').length + 1}`,
            user_id: USER,
            challenge_id: null,
            scope: memory_enum_1.MemoryScope.GLOBAL,
            memory_type: memory_enum_1.MemoryType.PREFERENCE,
            memory_key: 'guidance_style',
            memory_value: { statement: 'Prefers practical guidance first.' },
            factuality: memory_enum_1.MemoryFactuality.PREFERENCE,
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
    describe('retrieval returns what is relevant, not everything', () => {
        beforeEach(() => {
            seedMemory({
                id: 'mem-decision',
                memory_type: memory_enum_1.MemoryType.DECISION,
                memory_key: 'resignation_stance',
                scope: memory_enum_1.MemoryScope.CHALLENGE,
                challenge_id: CHALLENGE,
                factuality: memory_enum_1.MemoryFactuality.DECISION,
                retention_class: memory_enum_1.MemoryRetentionClass.UNTIL_SUPERSEDED,
                memory_value: {
                    statement: 'Will not resign before another offer is secured.',
                },
            });
            seedMemory({
                id: 'mem-other-challenge',
                scope: memory_enum_1.MemoryScope.CHALLENGE,
                challenge_id: OTHER_CHALLENGE,
                memory_type: memory_enum_1.MemoryType.DECISION,
                memory_key: 'study_stance',
                memory_value: { statement: 'Studying for the exam in the evenings.' },
            });
            seedMemory({
                id: 'mem-expired',
                memory_type: memory_enum_1.MemoryType.TEMPORARY_CONTEXT,
                memory_key: 'interview_tomorrow',
                retention_class: memory_enum_1.MemoryRetentionClass.SHORT_TERM,
                expires_at: new Date(NOW.getTime() - 3_600_000),
                memory_value: { statement: 'Interview tomorrow morning.' },
            });
            seedMemory({
                id: 'mem-hypothetical',
                memory_type: memory_enum_1.MemoryType.DECISION,
                memory_key: 'relocation_scenario',
                factuality: memory_enum_1.MemoryFactuality.HYPOTHETICAL,
                memory_value: { statement: 'Explored moving back to India.' },
            });
            seedMemory({
                id: 'mem-sensitive',
                memory_type: memory_enum_1.MemoryType.PROFILE,
                memory_key: 'birth_details',
                sensitivity_class: memory_enum_1.MemorySensitivity.RESTRICTED,
                memory_value: { statement: 'Born at 04:15 in a coastal city.' },
            });
            seedMemory({
                id: 'mem-lowconf',
                memory_type: memory_enum_1.MemoryType.PATTERN,
                memory_key: 'morning_person',
                evidence_type: memory_enum_1.MemoryEvidenceType.INFERRED,
                confidence: '0.150',
                memory_value: { statement: 'Might prefer mornings.' },
            });
            for (let i = 0; i < 8; i++) {
                seedMemory({
                    id: `mem-progress-${i}`,
                    memory_type: memory_enum_1.MemoryType.PROGRESS,
                    memory_key: `progress_${i}`,
                    scope: memory_enum_1.MemoryScope.CHALLENGE,
                    challenge_id: CHALLENGE,
                    retention_class: memory_enum_1.MemoryRetentionClass.CHALLENGE_LIFETIME,
                    memory_value: { statement: `Completed routine step number ${i}.` },
                });
            }
        });
        it('surfaces the relevant decision, and does not dump the whole store', async () => {
            const result = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CAREER_WEEKLY_REVIEW,
                challengeId: CHALLENGE,
                now: NOW,
            });
            const ids = result.items.map((entry) => entry.memory.id);
            expect(ids).toContain('mem-decision');
            expect(ids[0]).toBe('mem-decision');
            expect(store.rows('ZunoMemory').length).toBe(14);
            expect(result.items.length).toBeLessThan(store.rows('ZunoMemory').length);
            expect(result.items.length).toBeLessThanOrEqual(12);
        });
        it('excludes another challenge, an expired note, a hypothetical, a sensitive fact and a weak inference', async () => {
            const result = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CAREER_WEEKLY_REVIEW,
                challengeId: CHALLENGE,
                now: NOW,
            });
            const ids = result.items.map((entry) => entry.memory.id);
            expect(ids).not.toContain('mem-other-challenge');
            expect(ids).not.toContain('mem-expired');
            expect(ids).not.toContain('mem-hypothetical');
            expect(ids).not.toContain('mem-sensitive');
            expect(ids).not.toContain('mem-lowconf');
        });
        it('caps any one memory type at half the result, so progress cannot crowd out the decision', async () => {
            const result = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CAREER_WEEKLY_REVIEW,
                challengeId: CHALLENGE,
                maxItems: 6,
                now: NOW,
            });
            const progressCount = result.items.filter((entry) => entry.memory.memory_type === memory_enum_1.MemoryType.PROGRESS).length;
            expect(progressCount).toBeLessThanOrEqual(3);
            expect(result.items.map((e) => e.memory.id)).toContain('mem-decision');
        });
        it('returns nothing rather than padding when nothing clears the floor', async () => {
            const result = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.FUTURE_SELF_REFLECTION,
                challengeId: CHALLENGE,
                minScore: 0.95,
                now: NOW,
            });
            expect(result.items).toHaveLength(0);
        });
        it('returns a sensitive memory only when the purpose asks for it by name', async () => {
            const withoutOptIn = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE,
                challengeId: CHALLENGE,
                now: NOW,
            });
            expect(withoutOptIn.items.map((e) => e.memory.id)).not.toContain('mem-sensitive');
            const withOptIn = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE,
                challengeId: CHALLENGE,
                maxSensitivity: memory_enum_1.MemorySensitivity.RESTRICTED,
                memoryTypes: [memory_enum_1.MemoryType.PROFILE],
                now: NOW,
            });
            expect(withOptIn.items.map((e) => e.memory.id)).toContain('mem-sensitive');
        });
    });
    describe('private context protection', () => {
        it('refuses to store an inferred sensitive attribute at all', async () => {
            const result = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PROFILE,
                key: 'religion',
                value: { statement: 'The user is probably Hindu based on their habits.' },
                source: memory_enum_1.MemorySource.SYSTEM_DERIVED,
                evidenceType: memory_enum_1.MemoryEvidenceType.INFERRED,
                confidence: 0.9,
            });
            expect(result.memory).toBeNull();
            expect(result.rejectedReason).toBe(memory_enum_1.MemoryRejectionReason.SENSITIVE_ATTRIBUTE_INFERENCE);
            expect(store.rows('ZunoMemory')).toHaveLength(0);
        });
        it('will not keep a sensitive memory without the user confirming it', async () => {
            const result = await service.proposeCandidate({
                userId: USER,
                challengeId: CHALLENGE,
                type: memory_enum_1.MemoryType.CONSTRAINT,
                key: 'loan_exposure',
                value: { statement: 'Carries a home loan with monthly EMI commitments.' },
                source: memory_enum_1.MemorySource.WHATNOW_ENGINE,
                evidenceType: memory_enum_1.MemoryEvidenceType.EXPLICIT,
                confidence: 0.95,
            });
            expect(result.confirmationReason).toBe('SENSITIVE_CLASSIFICATION');
            expect(result.memory).toBeNull();
            expect(store.rows('ZunoMemory')).toHaveLength(0);
            expect(result.candidate.status).toBe('AWAITING_CONFIRMATION');
        });
        it('does not turn a single deferral into a behavioural pattern', async () => {
            const result = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PATTERN,
                key: 'defers_financial_tasks',
                value: { statement: 'Tends to defer financial tasks.' },
                source: memory_enum_1.MemorySource.SYSTEM_DERIVED,
                evidenceType: memory_enum_1.MemoryEvidenceType.DERIVED,
                confidence: 0.8,
                evidenceCount: 1,
            });
            expect(result.rejectedReason).toBe(memory_enum_1.MemoryRejectionReason.INSUFFICIENT_PATTERN_EVIDENCE);
        });
        it('does not persist a trivial acknowledgement', async () => {
            const result = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PROFILE,
                key: 'ack',
                value: { statement: 'Okay' },
                source: memory_enum_1.MemorySource.USER_EXPLICIT,
                evidenceType: memory_enum_1.MemoryEvidenceType.EXPLICIT,
                confidence: 1,
            });
            expect(result.rejectedReason).toBe(memory_enum_1.MemoryRejectionReason.TRIVIAL);
            expect(store.rows('ZunoMemory')).toHaveLength(0);
        });
        it('refuses to record a hypothetical as a fact', async () => {
            const result = await service.proposeCandidate({
                userId: USER,
                challengeId: CHALLENGE,
                type: memory_enum_1.MemoryType.DECISION,
                key: 'resignation',
                value: { statement: 'What if I resign and move back home?' },
                source: memory_enum_1.MemorySource.WHATNOW_ENGINE,
                evidenceType: memory_enum_1.MemoryEvidenceType.INFERRED,
                confidence: 0.9,
                factuality: memory_enum_1.MemoryFactuality.FACT,
            });
            expect(result.rejectedReason).toBe(memory_enum_1.MemoryRejectionReason.HYPOTHETICAL_AS_FACT);
        });
        it('refuses to record a prediction as a fact', async () => {
            const result = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.LIFE_EVENT,
                key: 'career_transition',
                value: { statement: 'The user will get a new job next quarter.' },
                source: memory_enum_1.MemorySource.SYSTEM_DERIVED,
                evidenceType: memory_enum_1.MemoryEvidenceType.DERIVED,
                confidence: 0.9,
                factuality: memory_enum_1.MemoryFactuality.FACT,
            });
            expect(result.rejectedReason).toBe(memory_enum_1.MemoryRejectionReason.PREDICTION_AS_FACT);
        });
    });
    describe('supersession', () => {
        it('supersedes the old memory when the user corrects it', async () => {
            const original = seedMemory({
                id: 'mem-relocate',
                memory_type: memory_enum_1.MemoryType.DECISION,
                memory_key: 'relocation',
                factuality: memory_enum_1.MemoryFactuality.DECISION,
                source: memory_enum_1.MemorySource.WHATNOW_ENGINE,
                evidence_type: memory_enum_1.MemoryEvidenceType.INFERRED,
                memory_value: { statement: 'Plans to relocate away from Dubai.' },
            });
            const corrected = await service.correct({
                userId: USER,
                memoryId: original.id,
                statement: 'Decided to stay in Dubai while employment is stable.',
            });
            expect(corrected.id).not.toBe(original.id);
            expect(corrected.status).toBe(memory_enum_1.MemoryStatus.ACTIVE);
            expect(corrected.source).toBe(memory_enum_1.MemorySource.USER_CORRECTION);
            expect(corrected.supersedes_memory_id).toBe(original.id);
            const stale = await memories.findOne({ where: { id: original.id } });
            expect(stale.status).toBe(memory_enum_1.MemoryStatus.SUPERSEDED);
            expect(stale.superseded_by_memory_id).toBe(corrected.id);
            expect(stale.superseded_at).toBeTruthy();
            expect(outbox.types()).toContain(memory_events_1.MemoryEventType.CORRECTED);
            expect(outbox.types()).toContain(memory_events_1.MemoryEventType.SUPERSEDED);
        });
        it('stops the superseded memory influencing retrieval', async () => {
            const original = seedMemory({
                id: 'mem-relocate',
                memory_type: memory_enum_1.MemoryType.DECISION,
                memory_key: 'relocation',
                factuality: memory_enum_1.MemoryFactuality.DECISION,
                memory_value: { statement: 'Plans to relocate away from Dubai.' },
            });
            const corrected = await service.correct({
                userId: USER,
                memoryId: original.id,
                statement: 'Decided to stay in Dubai while employment is stable.',
            });
            const result = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE,
                challengeId: CHALLENGE,
                closedChallengeIds: [],
                now: NOW,
            });
            const ids = result.items.map((entry) => entry.memory.id);
            expect(ids).toContain(corrected.id);
            expect(ids).not.toContain(original.id);
            expect(result.items.some((e) => (e.memory.memory_value.statement ?? '').includes('relocate away'))).toBe(false);
        });
        it('preserves the supersession chain for audit', async () => {
            const original = seedMemory({
                id: 'mem-role',
                memory_type: memory_enum_1.MemoryType.LIFE_EVENT,
                memory_key: 'employment_status',
                memory_value: { statement: 'Currently employed in a stable role.' },
            });
            const corrected = await service.correct({
                userId: USER,
                memoryId: original.id,
                statement: 'Employment ended this month.',
            });
            const chain = await service.supersessionChain(USER, corrected.id);
            expect(chain.map((row) => row.id)).toEqual([corrected.id, original.id]);
        });
        it('refuses a weaker source overwriting an explicit user statement', async () => {
            const incumbent = seedMemory({
                id: 'mem-pref',
                source: memory_enum_1.MemorySource.USER_EXPLICIT,
                memory_key: 'guidance_style',
                memory_value: { statement: 'Prefers practical guidance first.' },
            });
            const result = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PREFERENCE,
                key: 'guidance_style',
                value: { statement: 'Prefers long, detailed explanations.' },
                source: memory_enum_1.MemorySource.SYSTEM_DERIVED,
                evidenceType: memory_enum_1.MemoryEvidenceType.INFERRED,
                confidence: 0.99,
                factuality: memory_enum_1.MemoryFactuality.PREFERENCE,
            });
            expect(result.confirmationReason).toBe('CONTRADICTS_ACTIVE_MEMORY');
            const unchanged = await memories.findOne({ where: { id: incumbent.id } });
            expect(unchanged.status).toBe(memory_enum_1.MemoryStatus.ACTIVE);
            expect(unchanged.memory_value.statement).toContain('practical');
            expect(outbox.types()).toContain(memory_events_1.MemoryEventType.CONFLICT_DETECTED);
        });
        it('re-observing a known preference updates confirmation rather than duplicating it', async () => {
            seedMemory({
                id: 'mem-pref',
                memory_key: 'guidance_style',
                memory_value: { statement: 'Prefers practical guidance first.' },
                confirmation_count: 1,
            });
            const result = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PREFERENCE,
                key: 'guidance_style',
                value: { statement: 'Prefers practical guidance first.' },
                source: memory_enum_1.MemorySource.USER_EXPLICIT,
                evidenceType: memory_enum_1.MemoryEvidenceType.EXPLICIT,
                confidence: 0.9,
                factuality: memory_enum_1.MemoryFactuality.PREFERENCE,
            });
            expect(result.merged).toBe(true);
            expect(store.rows('ZunoMemory')).toHaveLength(1);
            expect(result.memory.confirmation_count).toBe(2);
        });
    });
    describe('deletion removes retrieval influence', () => {
        const DELETED_TEXT = 'Considering leaving the marriage.';
        beforeEach(() => {
            seedMemory({
                id: 'mem-to-delete',
                memory_type: memory_enum_1.MemoryType.DECISION,
                memory_key: 'relationship_stance',
                scope: memory_enum_1.MemoryScope.CHALLENGE,
                challenge_id: CHALLENGE,
                factuality: memory_enum_1.MemoryFactuality.DECISION,
                memory_value: { statement: DELETED_TEXT, label: 'Relationship' },
            });
            seedMemory({
                id: 'mem-keeps',
                memory_type: memory_enum_1.MemoryType.DECISION,
                memory_key: 'career_stance',
                scope: memory_enum_1.MemoryScope.CHALLENGE,
                challenge_id: CHALLENGE,
                factuality: memory_enum_1.MemoryFactuality.DECISION,
                memory_value: { statement: 'Will not resign before another offer.' },
            });
        });
        it('returns the memory before deletion', async () => {
            const before = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE,
                challengeId: CHALLENGE,
                now: NOW,
            });
            expect(before.items.map((e) => e.memory.id)).toContain('mem-to-delete');
        });
        it('never returns it afterwards, and never returns its text', async () => {
            await service.deleteMemory(USER, 'mem-to-delete', 'USER_REQUESTED');
            const after = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE,
                challengeId: CHALLENGE,
                now: NOW,
            });
            expect(after.items.map((e) => e.memory.id)).not.toContain('mem-to-delete');
            const allText = after.items
                .map((e) => JSON.stringify(e.memory.memory_value))
                .join(' ');
            expect(allText).not.toContain('marriage');
            expect(after.items.map((e) => e.memory.id)).toContain('mem-keeps');
        });
        it('raises all three barriers, so no single forgotten predicate can expose it', async () => {
            await service.deleteMemory(USER, 'mem-to-delete');
            const row = store
                .rows('ZunoMemory')
                .find((r) => r.id === 'mem-to-delete');
            expect(row.status).toBe(memory_enum_1.MemoryStatus.DELETED);
            expect(row.redacted_at).toBeTruthy();
            expect(row.deleted_at).toBeTruthy();
            expect(row.memory_value.statement).toBe('');
        });
        it('holds even when a caller hands the raw row straight to the filter', async () => {
            await service.deleteMemory(USER, 'mem-to-delete');
            const deletedRow = store
                .rows('ZunoMemory')
                .find((r) => r.id === 'mem-to-delete');
            const { selectRelevantMemories, admissibility } = require('../retrieval/memory-relevance');
            expect(admissibility(deletedRow, {
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE,
                challengeId: CHALLENGE,
            }, NOW)).toBe('NOT_ACTIVE');
            const forced = selectRelevantMemories([deletedRow], {
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE,
                challengeId: CHALLENGE,
                now: NOW,
            });
            expect(forced.items).toHaveLength(0);
        });
        it('does not show it on the user memory screen either', async () => {
            await service.deleteMemory(USER, 'mem-to-delete');
            const summary = await service.summaryForUser(USER);
            const ids = summary.flatMap((group) => group.items.map((i) => i.id));
            expect(ids).not.toContain('mem-to-delete');
            expect(ids).toContain('mem-keeps');
        });
        it('cancels a pending candidate that would re-create it', async () => {
            store.rows('ZunoMemoryCandidate').push({
                id: 'cand-1',
                user_id: USER,
                challenge_id: CHALLENGE,
                memory_key: 'relationship_stance',
                status: 'AWAITING_CONFIRMATION',
                proposed_value: { statement: DELETED_TEXT },
                deleted_at: null,
            });
            await service.deleteMemory(USER, 'mem-to-delete');
            const candidate = await candidates.findOne({ where: { id: 'cand-1' } });
            expect(candidate.status).toBe('REJECTED');
            expect(candidate.proposed_value).toBeNull();
        });
        it('publishes a deletion event carrying the downstream invalidation flag', async () => {
            await service.deleteMemory(USER, 'mem-to-delete');
            expect(outbox.types()).toContain(memory_events_1.MemoryEventType.DELETED);
            expect(audit.actions).toContain('MEMORY_DELETED');
        });
    });
    describe('expiry', () => {
        it('refuses an expired memory at read time, before any sweep has run', async () => {
            seedMemory({
                id: 'mem-temp',
                memory_type: memory_enum_1.MemoryType.TEMPORARY_CONTEXT,
                memory_key: 'interview',
                retention_class: memory_enum_1.MemoryRetentionClass.SHORT_TERM,
                expires_at: new Date(NOW.getTime() - 1000),
                memory_value: { statement: 'Interview tomorrow at the bank.' },
                status: memory_enum_1.MemoryStatus.ACTIVE,
            });
            const result = await service.retrieve({
                userId: USER,
                requestContext: memory_enum_1.MemoryRequestContext.FUTURE_SELF_DAILY,
                challengeId: CHALLENGE,
                now: NOW,
            });
            expect(result.items).toHaveLength(0);
        });
        it('sweeps due memories to EXPIRED', async () => {
            seedMemory({
                id: 'mem-temp',
                memory_type: memory_enum_1.MemoryType.TEMPORARY_CONTEXT,
                memory_key: 'interview',
                retention_class: memory_enum_1.MemoryRetentionClass.SHORT_TERM,
                expires_at: new Date(NOW.getTime() - 1000),
                memory_value: { statement: 'Interview tomorrow at the bank.' },
            });
            seedMemory({ id: 'mem-durable', expires_at: null });
            const count = await service.expireDue({ userId: USER, now: NOW });
            expect(count).toBe(1);
            const expired = await memories.findOne({ where: { id: 'mem-temp' } });
            expect(expired.status).toBe(memory_enum_1.MemoryStatus.EXPIRED);
            const durable = await memories.findOne({ where: { id: 'mem-durable' } });
            expect(durable.status).toBe(memory_enum_1.MemoryStatus.ACTIVE);
            expect(outbox.types()).toContain(memory_events_1.MemoryEventType.EXPIRED);
        });
        it('turns challenge-lifetime memory historical when the challenge closes', async () => {
            seedMemory({
                id: 'mem-challenge',
                scope: memory_enum_1.MemoryScope.CHALLENGE,
                challenge_id: CHALLENGE,
                retention_class: memory_enum_1.MemoryRetentionClass.CHALLENGE_LIFETIME,
                memory_type: memory_enum_1.MemoryType.CHALLENGE,
                memory_key: 'career_anxiety',
                memory_value: { statement: 'Worried about restructuring at work.' },
            });
            seedMemory({
                id: 'mem-global',
                retention_class: memory_enum_1.MemoryRetentionClass.UNTIL_SUPERSEDED,
            });
            const closed = await service.closeChallengeMemory(USER, CHALLENGE);
            expect(closed).toBe(1);
            const row = await memories.findOne({ where: { id: 'mem-challenge' } });
            expect(row.status).toBe(memory_enum_1.MemoryStatus.EXPIRED);
            const global = await memories.findOne({ where: { id: 'mem-global' } });
            expect(global.status).toBe(memory_enum_1.MemoryStatus.ACTIVE);
        });
    });
    describe('candidate lifecycle', () => {
        it('stores an explicit, non-sensitive statement without asking', async () => {
            const result = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PREFERENCE,
                key: 'guidance_style',
                value: { statement: 'Prefers short, practical guidance.' },
                source: memory_enum_1.MemorySource.USER_EXPLICIT,
                evidenceType: memory_enum_1.MemoryEvidenceType.EXPLICIT,
                confidence: 1,
                factuality: memory_enum_1.MemoryFactuality.PREFERENCE,
            });
            expect(result.confirmationReason).toBeNull();
            expect(result.memory.status).toBe(memory_enum_1.MemoryStatus.ACTIVE);
            expect(outbox.types()).toContain(memory_events_1.MemoryEventType.CANDIDATE_CREATED);
            expect(outbox.types()).toContain(memory_events_1.MemoryEventType.CREATED);
        });
        it('asks before keeping a low-confidence inference', async () => {
            const result = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PREFERENCE,
                key: 'study_time',
                value: { statement: 'Seems to prefer studying in the morning.' },
                source: memory_enum_1.MemorySource.SYSTEM_DERIVED,
                evidenceType: memory_enum_1.MemoryEvidenceType.INFERRED,
                confidence: 0.6,
                factuality: memory_enum_1.MemoryFactuality.PREFERENCE,
            });
            expect(result.confirmationReason).toBe('LOW_CONFIDENCE_INFERENCE');
            expect(store.rows('ZunoMemory')).toHaveLength(0);
        });
        it('promotes a confirmed candidate with explicit user authority', async () => {
            const proposed = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PREFERENCE,
                key: 'study_time',
                value: { statement: 'Seems to prefer studying in the morning.' },
                source: memory_enum_1.MemorySource.SYSTEM_DERIVED,
                evidenceType: memory_enum_1.MemoryEvidenceType.INFERRED,
                confidence: 0.6,
                factuality: memory_enum_1.MemoryFactuality.PREFERENCE,
            });
            const memory = await service.confirmCandidate(USER, proposed.candidate.id);
            expect(memory.status).toBe(memory_enum_1.MemoryStatus.ACTIVE);
            expect(memory.source).toBe(memory_enum_1.MemorySource.USER_EXPLICIT);
            expect(memory.evidence_type).toBe(memory_enum_1.MemoryEvidenceType.EXPLICIT);
            expect(audit.actions).toContain('MEMORY_CANDIDATE_CONFIRMED');
        });
        it('stores nothing when the user rejects, and keeps no content', async () => {
            const proposed = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PREFERENCE,
                key: 'study_time',
                value: { statement: 'Seems to prefer studying in the morning.' },
                source: memory_enum_1.MemorySource.SYSTEM_DERIVED,
                evidenceType: memory_enum_1.MemoryEvidenceType.INFERRED,
                confidence: 0.6,
                factuality: memory_enum_1.MemoryFactuality.PREFERENCE,
            });
            const rejected = await service.rejectCandidate(USER, proposed.candidate.id);
            expect(rejected.status).toBe('REJECTED');
            expect(rejected.proposed_value).toBeNull();
            expect(store.rows('ZunoMemory')).toHaveLength(0);
        });
        it('is idempotent for the same source event', async () => {
            const first = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.LIFE_EVENT,
                key: 'employment_ended',
                value: { statement: 'Employment with the current company ended.' },
                source: memory_enum_1.MemorySource.WHATNOW_ENGINE,
                evidenceType: memory_enum_1.MemoryEvidenceType.EXPLICIT,
                confidence: 1,
                sourceEventId: 'evt-9',
            });
            const second = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.LIFE_EVENT,
                key: 'employment_ended',
                value: { statement: 'Employment with the current company ended.' },
                source: memory_enum_1.MemorySource.WHATNOW_ENGINE,
                evidenceType: memory_enum_1.MemoryEvidenceType.EXPLICIT,
                confidence: 1,
                sourceEventId: 'evt-9',
            });
            expect(second.merged).toBe(true);
            expect(second.memory.id).toBe(first.memory.id);
            expect(store.rows('ZunoMemory')).toHaveLength(1);
        });
        it('refuses a candidate that the safety pre-check blocks', async () => {
            const result = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.CHALLENGE,
                key: 'state_of_mind',
                value: { statement: 'I do not want to live anymore, there is no point.' },
                source: memory_enum_1.MemorySource.WHATNOW_ENGINE,
                evidenceType: memory_enum_1.MemoryEvidenceType.EXPLICIT,
                confidence: 1,
            });
            expect(result.rejectedReason).toBe(memory_enum_1.MemoryRejectionReason.SAFETY_BLOCKED);
            expect(store.rows('ZunoMemory')).toHaveLength(0);
            expect(store.rows('ZunoMemoryCandidate')).toHaveLength(0);
        });
    });
    describe('ownership', () => {
        beforeEach(() => {
            seedMemory({
                id: 'mem-a',
                user_id: USER,
                memory_value: { statement: 'Belongs to user A.' },
            });
        });
        it('never returns another user\'s memory from retrieval', async () => {
            const result = await service.retrieve({
                userId: OTHER_USER,
                requestContext: memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE,
                challengeId: CHALLENGE,
                now: NOW,
            });
            expect(result.items).toHaveLength(0);
        });
        it('reports NOT_FOUND - never FORBIDDEN - when another user reads it', async () => {
            await expect(service.findOwned(OTHER_USER, 'mem-a')).rejects.toThrow(zuno_exception_1.ZunoException);
            try {
                await service.findOwned(OTHER_USER, 'mem-a');
                fail('expected a rejection');
            }
            catch (error) {
                expect(error.code).toBe(error_codes_enum_1.ZunoErrorCode.NOT_FOUND);
            }
        });
        it('refuses a correction from another user', async () => {
            await expect(service.correct({
                userId: OTHER_USER,
                memoryId: 'mem-a',
                statement: 'Rewriting someone else\'s memory.',
            })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            const untouched = await memories.findOne({ where: { id: 'mem-a' } });
            expect(untouched.memory_value.statement).toBe('Belongs to user A.');
            expect(untouched.status).toBe(memory_enum_1.MemoryStatus.ACTIVE);
        });
        it('refuses a deletion from another user', async () => {
            await expect(service.deleteMemory(OTHER_USER, 'mem-a')).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            const untouched = await memories.findOne({ where: { id: 'mem-a' } });
            expect(untouched.status).toBe(memory_enum_1.MemoryStatus.ACTIVE);
            expect(untouched.redacted_at).toBeNull();
        });
        it('refuses to confirm another user\'s candidate', async () => {
            const proposed = await service.proposeCandidate({
                userId: USER,
                type: memory_enum_1.MemoryType.PREFERENCE,
                key: 'study_time',
                value: { statement: 'Seems to prefer studying in the morning.' },
                source: memory_enum_1.MemorySource.SYSTEM_DERIVED,
                evidenceType: memory_enum_1.MemoryEvidenceType.INFERRED,
                confidence: 0.6,
                factuality: memory_enum_1.MemoryFactuality.PREFERENCE,
            });
            await expect(service.confirmCandidate(OTHER_USER, proposed.candidate.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            expect(store.rows('ZunoMemory')).toHaveLength(1);
        });
        it('rejects a stale optimistic-lock correction with 409', async () => {
            await expect(service.correct({
                userId: USER,
                memoryId: 'mem-a',
                statement: 'A newer truth.',
                expectedVersion: 99,
            })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
        });
    });
    describe('user memory controls', () => {
        it('groups memory into readable categories without exposing internals', async () => {
            seedMemory({
                id: 'mem-1',
                memory_type: memory_enum_1.MemoryType.PREFERENCE,
                memory_key: 'guidance_style',
            });
            seedMemory({
                id: 'mem-2',
                memory_type: memory_enum_1.MemoryType.DECISION,
                memory_key: 'resignation_stance',
                memory_value: { statement: 'Will not resign before another offer.' },
            });
            const summary = await service.summaryForUser(USER);
            const serialised = JSON.stringify(summary);
            expect(summary.length).toBe(2);
            expect(summary.every((group) => group.label.length > 0)).toBe(true);
            expect(summary[0].items[0].why.length).toBeGreaterThan(0);
            expect(serialised).not.toContain('confidence');
            expect(serialised).not.toContain('evidence_type');
            expect(serialised).not.toContain('supersedes');
        });
    });
});
//# sourceMappingURL=memory.service.spec.js.map