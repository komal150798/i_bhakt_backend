import { MemoryService } from './memory.service';
import { ZunoMemory } from '../entities/zuno-memory.entity';
import { ZunoMemoryCandidate } from '../entities/zuno-memory-candidate.entity';
import { ZunoMemoryEvidence } from '../entities/zuno-memory-evidence.entity';
import { ZunoMemoryConflict } from '../entities/zuno-memory-conflict.entity';
import {
  MemoryEvidenceType,
  MemoryFactuality,
  MemoryRejectionReason,
  MemoryRequestContext,
  MemoryRetentionClass,
  MemoryScope,
  MemorySensitivity,
  MemorySource,
  MemoryStatus,
  MemoryType,
} from '../enums/memory.enum';
import { MemoryEventType } from '../events/memory-events';
import {
  FakeRepository,
  fakeDataSource,
  InMemoryStore,
  RecordingAudit,
  RecordingOutbox,
} from '../testing/memory-test-harness';
import { SafetyService } from '../../safety/services/safety.service';
import { SafetySignalDetector } from '../../safety/services/safety-signal-detector';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { FixedClockService } from '../../common/services/clock.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';

/**
 * Roadmap section 73 is the acceptance list for Phase 10, and it is the
 * skeleton of this file:
 *
 *   [ ] relevant memory improves continuity
 *   [ ] stale memory superseded
 *   [ ] deletion removes retrieval influence
 *   [ ] private context protected
 *   [ ] ownership rejection (Step 21 Golden Contract Test 125)
 *
 * Written in the style of `safety.service.spec.ts`, and for the same reason
 * given there: these are release gates, not backlog (Build Rules 99-100).
 * Deletion in particular is not a feature test - it is the promise the product
 * makes to the user in Step 24 section 165, and a regression in it would be a
 * privacy failure rather than a bug.
 */

const USER = 'user-a';
const OTHER_USER = 'user-b';
const CHALLENGE = 'challenge-1';
const OTHER_CHALLENGE = 'challenge-2';
const NOW = new Date('2026-09-17T09:00:00.000Z');

describe('MemoryService', () => {
  let store: InMemoryStore;
  let service: MemoryService;
  let outbox: RecordingOutbox;
  let audit: RecordingAudit;
  let memories: FakeRepository<ZunoMemory>;
  let candidates: FakeRepository<ZunoMemoryCandidate>;

  beforeEach(() => {
    store = new InMemoryStore();
    outbox = new RecordingOutbox();
    audit = new RecordingAudit();

    memories = new FakeRepository<ZunoMemory>(store, 'ZunoMemory');
    candidates = new FakeRepository<ZunoMemoryCandidate>(
      store,
      'ZunoMemoryCandidate',
    );

    service = new MemoryService(
      memories as never,
      candidates as never,
      new FakeRepository<ZunoMemoryEvidence>(store, 'ZunoMemoryEvidence') as never,
      new FakeRepository<ZunoMemoryConflict>(store, 'ZunoMemoryConflict') as never,
      new SafetyService(new SafetySignalDetector()),
      outbox as never,
      audit as never,
      new ZunoOwnershipService(),
      new FixedClockService(NOW),
      fakeDataSource(store) as never,
    );
  });

  // Convenience: seed an ACTIVE memory directly, bypassing the candidate
  // pipeline, so retrieval tests can set up exactly the store they need.
  function seedMemory(overrides: Partial<ZunoMemory> = {}): ZunoMemory {
    const row: Partial<ZunoMemory> = {
      id: overrides.id ?? `mem-${store.rows('ZunoMemory').length + 1}`,
      user_id: USER,
      challenge_id: null,
      scope: MemoryScope.GLOBAL,
      memory_type: MemoryType.PREFERENCE,
      memory_key: 'guidance_style',
      memory_value: { statement: 'Prefers practical guidance first.' },
      factuality: MemoryFactuality.PREFERENCE,
      source: MemorySource.USER_EXPLICIT,
      source_event_id: null,
      evidence_type: MemoryEvidenceType.EXPLICIT,
      confidence: '0.950',
      retention_class: MemoryRetentionClass.UNTIL_SUPERSEDED,
      sensitivity_class: MemorySensitivity.STANDARD,
      status: MemoryStatus.ACTIVE,
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
    store.rows('ZunoMemory').push(row as never);
    return row as ZunoMemory;
  }

  // =======================================================================
  // Roadmap section 73: relevant memory improves continuity
  // =======================================================================

  describe('retrieval returns what is relevant, not everything', () => {
    beforeEach(() => {
      // The one memory that should surface for a career weekly review.
      seedMemory({
        id: 'mem-decision',
        memory_type: MemoryType.DECISION,
        memory_key: 'resignation_stance',
        scope: MemoryScope.CHALLENGE,
        challenge_id: CHALLENGE,
        factuality: MemoryFactuality.DECISION,
        retention_class: MemoryRetentionClass.UNTIL_SUPERSEDED,
        memory_value: {
          statement: 'Will not resign before another offer is secured.',
        },
      });

      // Noise that must not crowd it out: another challenge, an expired
      // temporary note, a hypothetical, a sensitive fact, a low-confidence
      // inference, and eight ordinary progress rows.
      seedMemory({
        id: 'mem-other-challenge',
        scope: MemoryScope.CHALLENGE,
        challenge_id: OTHER_CHALLENGE,
        memory_type: MemoryType.DECISION,
        memory_key: 'study_stance',
        memory_value: { statement: 'Studying for the exam in the evenings.' },
      });
      seedMemory({
        id: 'mem-expired',
        memory_type: MemoryType.TEMPORARY_CONTEXT,
        memory_key: 'interview_tomorrow',
        retention_class: MemoryRetentionClass.SHORT_TERM,
        expires_at: new Date(NOW.getTime() - 3_600_000),
        memory_value: { statement: 'Interview tomorrow morning.' },
      });
      seedMemory({
        id: 'mem-hypothetical',
        memory_type: MemoryType.DECISION,
        memory_key: 'relocation_scenario',
        factuality: MemoryFactuality.HYPOTHETICAL,
        memory_value: { statement: 'Explored moving back to India.' },
      });
      seedMemory({
        id: 'mem-sensitive',
        memory_type: MemoryType.PROFILE,
        memory_key: 'birth_details',
        sensitivity_class: MemorySensitivity.RESTRICTED,
        memory_value: { statement: 'Born at 04:15 in a coastal city.' },
      });
      seedMemory({
        id: 'mem-lowconf',
        memory_type: MemoryType.PATTERN,
        memory_key: 'morning_person',
        evidence_type: MemoryEvidenceType.INFERRED,
        confidence: '0.150',
        memory_value: { statement: 'Might prefer mornings.' },
      });
      for (let i = 0; i < 8; i++) {
        seedMemory({
          id: `mem-progress-${i}`,
          memory_type: MemoryType.PROGRESS,
          memory_key: `progress_${i}`,
          scope: MemoryScope.CHALLENGE,
          challenge_id: CHALLENGE,
          retention_class: MemoryRetentionClass.CHALLENGE_LIFETIME,
          memory_value: { statement: `Completed routine step number ${i}.` },
        });
      }
    });

    it('surfaces the relevant decision, and does not dump the whole store', async () => {
      const result = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.CAREER_WEEKLY_REVIEW,
        challengeId: CHALLENGE,
        now: NOW,
      });

      const ids = result.items.map((entry) => entry.memory.id);

      // Roadmap section 73: relevant memory improves continuity. The decision
      // that changes the guidance is present, and it ranks first.
      expect(ids).toContain('mem-decision');
      expect(ids[0]).toBe('mem-decision');

      // Roadmap section 69: do not dump all historical user state.
      expect(store.rows('ZunoMemory').length).toBe(14);
      expect(result.items.length).toBeLessThan(
        store.rows('ZunoMemory').length,
      );
      expect(result.items.length).toBeLessThanOrEqual(12);
    });

    it('excludes another challenge, an expired note, a hypothetical, a sensitive fact and a weak inference', async () => {
      const result = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.CAREER_WEEKLY_REVIEW,
        challengeId: CHALLENGE,
        now: NOW,
      });
      const ids = result.items.map((entry) => entry.memory.id);

      expect(ids).not.toContain('mem-other-challenge'); // s.63
      expect(ids).not.toContain('mem-expired'); // s.28
      expect(ids).not.toContain('mem-hypothetical'); // s.45, Rule 4
      expect(ids).not.toContain('mem-sensitive'); // s.110, Rule 11
      expect(ids).not.toContain('mem-lowconf'); // s.25
    });

    it('caps any one memory type at half the result, so progress cannot crowd out the decision', async () => {
      const result = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.CAREER_WEEKLY_REVIEW,
        challengeId: CHALLENGE,
        maxItems: 6,
        now: NOW,
      });
      const progressCount = result.items.filter(
        (entry) => entry.memory.memory_type === MemoryType.PROGRESS,
      ).length;

      expect(progressCount).toBeLessThanOrEqual(3);
      expect(result.items.map((e) => e.memory.id)).toContain('mem-decision');
    });

    it('returns nothing rather than padding when nothing clears the floor', async () => {
      // A purpose none of the seeded types serve, with the floor raised.
      const result = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.FUTURE_SELF_REFLECTION,
        challengeId: CHALLENGE,
        minScore: 0.95,
        now: NOW,
      });
      expect(result.items).toHaveLength(0);
    });

    it('returns a sensitive memory only when the purpose asks for it by name', async () => {
      const withoutOptIn = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.CHALLENGE_GUIDANCE,
        challengeId: CHALLENGE,
        now: NOW,
      });
      expect(
        withoutOptIn.items.map((e) => e.memory.id),
      ).not.toContain('mem-sensitive');

      const withOptIn = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.CHALLENGE_GUIDANCE,
        challengeId: CHALLENGE,
        maxSensitivity: MemorySensitivity.RESTRICTED,
        memoryTypes: [MemoryType.PROFILE],
        now: NOW,
      });
      expect(withOptIn.items.map((e) => e.memory.id)).toContain('mem-sensitive');
    });
  });

  // =======================================================================
  // Roadmap section 73: private context protected
  // =======================================================================

  describe('private context protection', () => {
    it('refuses to store an inferred sensitive attribute at all', async () => {
      // Step 18 section 70 / Rule 7: do not infer religion, politics,
      // orientation or medical diagnosis from indirect behaviour.
      const result = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PROFILE,
        key: 'religion',
        value: { statement: 'The user is probably Hindu based on their habits.' },
        source: MemorySource.SYSTEM_DERIVED,
        evidenceType: MemoryEvidenceType.INFERRED,
        confidence: 0.9,
      });

      expect(result.memory).toBeNull();
      expect(result.rejectedReason).toBe(
        MemoryRejectionReason.SENSITIVE_ATTRIBUTE_INFERENCE,
      );
      expect(store.rows('ZunoMemory')).toHaveLength(0);
    });

    it('will not keep a sensitive memory without the user confirming it', async () => {
      const result = await service.proposeCandidate({
        userId: USER,
        challengeId: CHALLENGE,
        type: MemoryType.CONSTRAINT,
        key: 'loan_exposure',
        value: { statement: 'Carries a home loan with monthly EMI commitments.' },
        source: MemorySource.WHATNOW_ENGINE,
        evidenceType: MemoryEvidenceType.EXPLICIT,
        confidence: 0.95,
      });

      // Step 18 section 50 and Step 24 section 39.
      expect(result.confirmationReason).toBe('SENSITIVE_CLASSIFICATION');
      expect(result.memory).toBeNull();
      expect(store.rows('ZunoMemory')).toHaveLength(0);
      expect(result.candidate.status).toBe('AWAITING_CONFIRMATION');
    });

    it('does not turn a single deferral into a behavioural pattern', async () => {
      // Step 18 sections 18 and 106, Golden Test.
      const result = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PATTERN,
        key: 'defers_financial_tasks',
        value: { statement: 'Tends to defer financial tasks.' },
        source: MemorySource.SYSTEM_DERIVED,
        evidenceType: MemoryEvidenceType.DERIVED,
        confidence: 0.8,
        evidenceCount: 1,
      });

      expect(result.rejectedReason).toBe(
        MemoryRejectionReason.INSUFFICIENT_PATTERN_EVIDENCE,
      );
    });

    it('does not persist a trivial acknowledgement', async () => {
      // Step 18 Golden Test 105 and Rule 1.
      const result = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PROFILE,
        key: 'ack',
        value: { statement: 'Okay' },
        source: MemorySource.USER_EXPLICIT,
        evidenceType: MemoryEvidenceType.EXPLICIT,
        confidence: 1,
      });

      expect(result.rejectedReason).toBe(MemoryRejectionReason.TRIVIAL);
      expect(store.rows('ZunoMemory')).toHaveLength(0);
    });

    it('refuses to record a hypothetical as a fact', async () => {
      // Step 18 Rule 4, section 115, Golden Test 103.
      const result = await service.proposeCandidate({
        userId: USER,
        challengeId: CHALLENGE,
        type: MemoryType.DECISION,
        key: 'resignation',
        value: { statement: 'What if I resign and move back home?' },
        source: MemorySource.WHATNOW_ENGINE,
        evidenceType: MemoryEvidenceType.INFERRED,
        confidence: 0.9,
        factuality: MemoryFactuality.FACT,
      });

      expect(result.rejectedReason).toBe(
        MemoryRejectionReason.HYPOTHETICAL_AS_FACT,
      );
    });

    it('refuses to record a prediction as a fact', async () => {
      // Step 18 Rule 5, section 47, Golden Test 108.
      const result = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.LIFE_EVENT,
        key: 'career_transition',
        value: { statement: 'The user will get a new job next quarter.' },
        source: MemorySource.SYSTEM_DERIVED,
        evidenceType: MemoryEvidenceType.DERIVED,
        confidence: 0.9,
        factuality: MemoryFactuality.FACT,
      });

      expect(result.rejectedReason).toBe(
        MemoryRejectionReason.PREDICTION_AS_FACT,
      );
    });
  });

  // =======================================================================
  // Roadmap section 73: stale memory superseded
  // =======================================================================

  describe('supersession', () => {
    it('supersedes the old memory when the user corrects it', async () => {
      // Step 18 Golden Test 104: stored "user plans to relocate", user says
      // "no, I decided to stay". Current explicit statement wins.
      const original = seedMemory({
        id: 'mem-relocate',
        memory_type: MemoryType.DECISION,
        memory_key: 'relocation',
        factuality: MemoryFactuality.DECISION,
        source: MemorySource.WHATNOW_ENGINE,
        evidence_type: MemoryEvidenceType.INFERRED,
        memory_value: { statement: 'Plans to relocate away from Dubai.' },
      });

      const corrected = await service.correct({
        userId: USER,
        memoryId: original.id,
        statement: 'Decided to stay in Dubai while employment is stable.',
      });

      expect(corrected.id).not.toBe(original.id);
      expect(corrected.status).toBe(MemoryStatus.ACTIVE);
      expect(corrected.source).toBe(MemorySource.USER_CORRECTION);
      expect(corrected.supersedes_memory_id).toBe(original.id);

      // Step 18 section 29: historical context remains auditable.
      const stale = await memories.findOne({ where: { id: original.id } });
      expect(stale.status).toBe(MemoryStatus.SUPERSEDED);
      expect(stale.superseded_by_memory_id).toBe(corrected.id);
      expect(stale.superseded_at).toBeTruthy();

      expect(outbox.types()).toContain(MemoryEventType.CORRECTED);
      expect(outbox.types()).toContain(MemoryEventType.SUPERSEDED);
    });

    it('stops the superseded memory influencing retrieval', async () => {
      const original = seedMemory({
        id: 'mem-relocate',
        memory_type: MemoryType.DECISION,
        memory_key: 'relocation',
        factuality: MemoryFactuality.DECISION,
        memory_value: { statement: 'Plans to relocate away from Dubai.' },
      });
      const corrected = await service.correct({
        userId: USER,
        memoryId: original.id,
        statement: 'Decided to stay in Dubai while employment is stable.',
      });

      const result = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.CHALLENGE_GUIDANCE,
        challengeId: CHALLENGE,
        closedChallengeIds: [],
        now: NOW,
      });
      const ids = result.items.map((entry) => entry.memory.id);

      expect(ids).toContain(corrected.id);
      expect(ids).not.toContain(original.id);
      // Step 18 section 114: do not keep using an old goal after it changed.
      expect(
        result.items.some((e) =>
          (e.memory.memory_value.statement ?? '').includes('relocate away'),
        ),
      ).toBe(false);
    });

    it('preserves the supersession chain for audit', async () => {
      const original = seedMemory({
        id: 'mem-role',
        memory_type: MemoryType.LIFE_EVENT,
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
      // Step 18 section 31: source authority. A SYSTEM_DERIVED inference may
      // not quietly overwrite something the user said.
      const incumbent = seedMemory({
        id: 'mem-pref',
        source: MemorySource.USER_EXPLICIT,
        memory_key: 'guidance_style',
        memory_value: { statement: 'Prefers practical guidance first.' },
      });

      const result = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PREFERENCE,
        key: 'guidance_style',
        value: { statement: 'Prefers long, detailed explanations.' },
        source: MemorySource.SYSTEM_DERIVED,
        evidenceType: MemoryEvidenceType.INFERRED,
        confidence: 0.99,
        factuality: MemoryFactuality.PREFERENCE,
      });

      // It contradicts an active memory from a stronger source, so ZUNO asks
      // rather than assuming (section 30).
      expect(result.confirmationReason).toBe('CONTRADICTS_ACTIVE_MEMORY');
      const unchanged = await memories.findOne({ where: { id: incumbent.id } });
      expect(unchanged.status).toBe(MemoryStatus.ACTIVE);
      expect(unchanged.memory_value.statement).toContain('practical');
      expect(outbox.types()).toContain(MemoryEventType.CONFLICT_DETECTED);
    });

    it('re-observing a known preference updates confirmation rather than duplicating it', async () => {
      // Step 18 section 59: not seventeen separate memories.
      seedMemory({
        id: 'mem-pref',
        memory_key: 'guidance_style',
        memory_value: { statement: 'Prefers practical guidance first.' },
        confirmation_count: 1,
      });

      const result = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PREFERENCE,
        key: 'guidance_style',
        value: { statement: 'Prefers practical guidance first.' },
        source: MemorySource.USER_EXPLICIT,
        evidenceType: MemoryEvidenceType.EXPLICIT,
        confidence: 0.9,
        factuality: MemoryFactuality.PREFERENCE,
      });

      expect(result.merged).toBe(true);
      expect(store.rows('ZunoMemory')).toHaveLength(1);
      expect(result.memory.confirmation_count).toBe(2);
    });
  });

  // =======================================================================
  // Roadmap section 73: DELETION REMOVES RETRIEVAL INFLUENCE
  // Step 24 section 165, Build Rule 38.
  // =======================================================================

  describe('deletion removes retrieval influence', () => {
    const DELETED_TEXT = 'Considering leaving the marriage.';

    beforeEach(() => {
      seedMemory({
        id: 'mem-to-delete',
        memory_type: MemoryType.DECISION,
        memory_key: 'relationship_stance',
        scope: MemoryScope.CHALLENGE,
        challenge_id: CHALLENGE,
        factuality: MemoryFactuality.DECISION,
        memory_value: { statement: DELETED_TEXT, label: 'Relationship' },
      });
      seedMemory({
        id: 'mem-keeps',
        memory_type: MemoryType.DECISION,
        memory_key: 'career_stance',
        scope: MemoryScope.CHALLENGE,
        challenge_id: CHALLENGE,
        factuality: MemoryFactuality.DECISION,
        memory_value: { statement: 'Will not resign before another offer.' },
      });
    });

    it('returns the memory before deletion', async () => {
      const before = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.CHALLENGE_GUIDANCE,
        challengeId: CHALLENGE,
        now: NOW,
      });
      expect(before.items.map((e) => e.memory.id)).toContain('mem-to-delete');
    });

    it('never returns it afterwards, and never returns its text', async () => {
      await service.deleteMemory(USER, 'mem-to-delete', 'USER_REQUESTED');

      const after = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.CHALLENGE_GUIDANCE,
        challengeId: CHALLENGE,
        now: NOW,
      });

      expect(after.items.map((e) => e.memory.id)).not.toContain('mem-to-delete');
      // The stronger assertion: the deleted words do not appear anywhere in the
      // retrieval result, under any id.
      const allText = after.items
        .map((e) => JSON.stringify(e.memory.memory_value))
        .join(' ');
      expect(allText).not.toContain('marriage');
      // The unrelated memory is untouched - deletion is surgical, not a purge.
      expect(after.items.map((e) => e.memory.id)).toContain('mem-keeps');
    });

    it('raises all three barriers, so no single forgotten predicate can expose it', async () => {
      await service.deleteMemory(USER, 'mem-to-delete');
      const row = store
        .rows('ZunoMemory')
        .find((r) => r.id === 'mem-to-delete') as unknown as ZunoMemory;

      expect(row.status).toBe(MemoryStatus.DELETED); // 1. status allow-list
      expect(row.redacted_at).toBeTruthy(); //             2. privacy deletion
      expect(row.deleted_at).toBeTruthy(); //              3. soft delete
      // Content is gone, so even a raw SELECT has nothing to put in a prompt.
      expect(row.memory_value.statement).toBe('');
    });

    it('holds even when a caller hands the raw row straight to the filter', async () => {
      // The scenario this guards against: a future query that forgets the
      // status predicate. Admissibility is re-checked in memory, so the row is
      // still refused.
      await service.deleteMemory(USER, 'mem-to-delete');
      const deletedRow = store
        .rows('ZunoMemory')
        .find((r) => r.id === 'mem-to-delete') as unknown as ZunoMemory;

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { selectRelevantMemories, admissibility } = require('../retrieval/memory-relevance');

      expect(
        admissibility(
          deletedRow,
          {
            userId: USER,
            requestContext: MemoryRequestContext.CHALLENGE_GUIDANCE,
            challengeId: CHALLENGE,
          },
          NOW,
        ),
      ).toBe('NOT_ACTIVE');

      const forced = selectRelevantMemories([deletedRow], {
        userId: USER,
        requestContext: MemoryRequestContext.CHALLENGE_GUIDANCE,
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
      // Without this, confirming a still-queued candidate would resurrect what
      // the user just asked to forget.
      store.rows('ZunoMemoryCandidate').push({
        id: 'cand-1',
        user_id: USER,
        challenge_id: CHALLENGE,
        memory_key: 'relationship_stance',
        status: 'AWAITING_CONFIRMATION',
        proposed_value: { statement: DELETED_TEXT },
        deleted_at: null,
      } as never);

      await service.deleteMemory(USER, 'mem-to-delete');

      const candidate = await candidates.findOne({ where: { id: 'cand-1' } });
      expect(candidate.status).toBe('REJECTED');
      expect(candidate.proposed_value).toBeNull();
    });

    it('publishes a deletion event carrying the downstream invalidation flag', async () => {
      await service.deleteMemory(USER, 'mem-to-delete');
      // Step 24 section 165: downstream indexes and caches must be invalidated.
      expect(outbox.types()).toContain(MemoryEventType.DELETED);
      expect(audit.actions).toContain('MEMORY_DELETED');
    });
  });

  // =======================================================================
  // Expiry
  // =======================================================================

  describe('expiry', () => {
    it('refuses an expired memory at read time, before any sweep has run', async () => {
      seedMemory({
        id: 'mem-temp',
        memory_type: MemoryType.TEMPORARY_CONTEXT,
        memory_key: 'interview',
        retention_class: MemoryRetentionClass.SHORT_TERM,
        expires_at: new Date(NOW.getTime() - 1000),
        memory_value: { statement: 'Interview tomorrow at the bank.' },
        status: MemoryStatus.ACTIVE,
      });

      const result = await service.retrieve({
        userId: USER,
        requestContext: MemoryRequestContext.FUTURE_SELF_DAILY,
        challengeId: CHALLENGE,
        now: NOW,
      });
      expect(result.items).toHaveLength(0);
    });

    it('sweeps due memories to EXPIRED', async () => {
      seedMemory({
        id: 'mem-temp',
        memory_type: MemoryType.TEMPORARY_CONTEXT,
        memory_key: 'interview',
        retention_class: MemoryRetentionClass.SHORT_TERM,
        expires_at: new Date(NOW.getTime() - 1000),
        memory_value: { statement: 'Interview tomorrow at the bank.' },
      });
      seedMemory({ id: 'mem-durable', expires_at: null });

      const count = await service.expireDue({ userId: USER, now: NOW });
      expect(count).toBe(1);

      const expired = await memories.findOne({ where: { id: 'mem-temp' } });
      expect(expired.status).toBe(MemoryStatus.EXPIRED);
      const durable = await memories.findOne({ where: { id: 'mem-durable' } });
      expect(durable.status).toBe(MemoryStatus.ACTIVE);
      expect(outbox.types()).toContain(MemoryEventType.EXPIRED);
    });

    it('turns challenge-lifetime memory historical when the challenge closes', async () => {
      // Step 18 sections 65 and 109.
      seedMemory({
        id: 'mem-challenge',
        scope: MemoryScope.CHALLENGE,
        challenge_id: CHALLENGE,
        retention_class: MemoryRetentionClass.CHALLENGE_LIFETIME,
        memory_type: MemoryType.CHALLENGE,
        memory_key: 'career_anxiety',
        memory_value: { statement: 'Worried about restructuring at work.' },
      });
      seedMemory({
        id: 'mem-global',
        retention_class: MemoryRetentionClass.UNTIL_SUPERSEDED,
      });

      const closed = await service.closeChallengeMemory(USER, CHALLENGE);
      expect(closed).toBe(1);

      const row = await memories.findOne({ where: { id: 'mem-challenge' } });
      expect(row.status).toBe(MemoryStatus.EXPIRED);
      const global = await memories.findOne({ where: { id: 'mem-global' } });
      expect(global.status).toBe(MemoryStatus.ACTIVE);
    });
  });

  // =======================================================================
  // Candidate and confirmation lifecycle
  // =======================================================================

  describe('candidate lifecycle', () => {
    it('stores an explicit, non-sensitive statement without asking', async () => {
      const result = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PREFERENCE,
        key: 'guidance_style',
        value: { statement: 'Prefers short, practical guidance.' },
        source: MemorySource.USER_EXPLICIT,
        evidenceType: MemoryEvidenceType.EXPLICIT,
        confidence: 1,
        factuality: MemoryFactuality.PREFERENCE,
      });

      expect(result.confirmationReason).toBeNull();
      expect(result.memory.status).toBe(MemoryStatus.ACTIVE);
      expect(outbox.types()).toContain(MemoryEventType.CANDIDATE_CREATED);
      expect(outbox.types()).toContain(MemoryEventType.CREATED);
    });

    it('asks before keeping a low-confidence inference', async () => {
      // Step 18 section 24.
      const result = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PREFERENCE,
        key: 'study_time',
        value: { statement: 'Seems to prefer studying in the morning.' },
        source: MemorySource.SYSTEM_DERIVED,
        evidenceType: MemoryEvidenceType.INFERRED,
        confidence: 0.6,
        factuality: MemoryFactuality.PREFERENCE,
      });

      expect(result.confirmationReason).toBe('LOW_CONFIDENCE_INFERENCE');
      expect(store.rows('ZunoMemory')).toHaveLength(0);
    });

    it('promotes a confirmed candidate with explicit user authority', async () => {
      const proposed = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PREFERENCE,
        key: 'study_time',
        value: { statement: 'Seems to prefer studying in the morning.' },
        source: MemorySource.SYSTEM_DERIVED,
        evidenceType: MemoryEvidenceType.INFERRED,
        confidence: 0.6,
        factuality: MemoryFactuality.PREFERENCE,
      });

      const memory = await service.confirmCandidate(
        USER,
        proposed.candidate.id,
      );

      expect(memory.status).toBe(MemoryStatus.ACTIVE);
      expect(memory.source).toBe(MemorySource.USER_EXPLICIT);
      expect(memory.evidence_type).toBe(MemoryEvidenceType.EXPLICIT);
      expect(audit.actions).toContain('MEMORY_CANDIDATE_CONFIRMED');
    });

    it('stores nothing when the user rejects, and keeps no content', async () => {
      const proposed = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PREFERENCE,
        key: 'study_time',
        value: { statement: 'Seems to prefer studying in the morning.' },
        source: MemorySource.SYSTEM_DERIVED,
        evidenceType: MemoryEvidenceType.INFERRED,
        confidence: 0.6,
        factuality: MemoryFactuality.PREFERENCE,
      });

      const rejected = await service.rejectCandidate(
        USER,
        proposed.candidate.id,
      );
      expect(rejected.status).toBe('REJECTED');
      expect(rejected.proposed_value).toBeNull();
      expect(store.rows('ZunoMemory')).toHaveLength(0);
    });

    it('is idempotent for the same source event', async () => {
      // Step 18 section 95.
      const first = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.LIFE_EVENT,
        key: 'employment_ended',
        value: { statement: 'Employment with the current company ended.' },
        source: MemorySource.WHATNOW_ENGINE,
        evidenceType: MemoryEvidenceType.EXPLICIT,
        confidence: 1,
        sourceEventId: 'evt-9',
      });
      const second = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.LIFE_EVENT,
        key: 'employment_ended',
        value: { statement: 'Employment with the current company ended.' },
        source: MemorySource.WHATNOW_ENGINE,
        evidenceType: MemoryEvidenceType.EXPLICIT,
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
        type: MemoryType.CHALLENGE,
        key: 'state_of_mind',
        value: { statement: 'I do not want to live anymore, there is no point.' },
        source: MemorySource.WHATNOW_ENGINE,
        evidenceType: MemoryEvidenceType.EXPLICIT,
        confidence: 1,
      });

      expect(result.rejectedReason).toBe(MemoryRejectionReason.SAFETY_BLOCKED);
      expect(store.rows('ZunoMemory')).toHaveLength(0);
      expect(store.rows('ZunoMemoryCandidate')).toHaveLength(0);
    });
  });

  // =======================================================================
  // Roadmap section 73 / Step 21 Golden Contract Test 125: ownership
  // =======================================================================

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
        requestContext: MemoryRequestContext.CHALLENGE_GUIDANCE,
        challengeId: CHALLENGE,
        now: NOW,
      });
      expect(result.items).toHaveLength(0);
    });

    it('reports NOT_FOUND - never FORBIDDEN - when another user reads it', async () => {
      // A 403 would confirm the id exists and turn the endpoint into an
      // enumeration oracle (Step 21 section 125).
      await expect(service.findOwned(OTHER_USER, 'mem-a')).rejects.toThrow(
        ZunoException,
      );
      try {
        await service.findOwned(OTHER_USER, 'mem-a');
        fail('expected a rejection');
      } catch (error) {
        expect((error as ZunoException).code).toBe(ZunoErrorCode.NOT_FOUND);
      }
    });

    it('refuses a correction from another user', async () => {
      await expect(
        service.correct({
          userId: OTHER_USER,
          memoryId: 'mem-a',
          statement: 'Rewriting someone else\'s memory.',
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });

      const untouched = await memories.findOne({ where: { id: 'mem-a' } });
      expect(untouched.memory_value.statement).toBe('Belongs to user A.');
      expect(untouched.status).toBe(MemoryStatus.ACTIVE);
    });

    it('refuses a deletion from another user', async () => {
      await expect(
        service.deleteMemory(OTHER_USER, 'mem-a'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });

      const untouched = await memories.findOne({ where: { id: 'mem-a' } });
      expect(untouched.status).toBe(MemoryStatus.ACTIVE);
      expect(untouched.redacted_at).toBeNull();
    });

    it('refuses to confirm another user\'s candidate', async () => {
      const proposed = await service.proposeCandidate({
        userId: USER,
        type: MemoryType.PREFERENCE,
        key: 'study_time',
        value: { statement: 'Seems to prefer studying in the morning.' },
        source: MemorySource.SYSTEM_DERIVED,
        evidenceType: MemoryEvidenceType.INFERRED,
        confidence: 0.6,
        factuality: MemoryFactuality.PREFERENCE,
      });

      await expect(
        service.confirmCandidate(OTHER_USER, proposed.candidate.id),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
      expect(store.rows('ZunoMemory')).toHaveLength(1); // only the seeded one
    });

    it('rejects a stale optimistic-lock correction with 409', async () => {
      await expect(
        service.correct({
          userId: USER,
          memoryId: 'mem-a',
          statement: 'A newer truth.',
          expectedVersion: 99,
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
    });
  });

  // =======================================================================
  // The user-facing memory screen
  // =======================================================================

  describe('user memory controls', () => {
    it('groups memory into readable categories without exposing internals', async () => {
      seedMemory({
        id: 'mem-1',
        memory_type: MemoryType.PREFERENCE,
        memory_key: 'guidance_style',
      });
      seedMemory({
        id: 'mem-2',
        memory_type: MemoryType.DECISION,
        memory_key: 'resignation_stance',
        memory_value: { statement: 'Will not resign before another offer.' },
      });

      const summary = await service.summaryForUser(USER);
      const serialised = JSON.stringify(summary);

      expect(summary.length).toBe(2);
      expect(summary.every((group) => group.label.length > 0)).toBe(true);
      expect(summary[0].items[0].why.length).toBeGreaterThan(0);

      // Step 18 section 53 / Rule 13: no embeddings, prompts or reasoning.
      expect(serialised).not.toContain('confidence');
      expect(serialised).not.toContain('evidence_type');
      expect(serialised).not.toContain('supersedes');
    });
  });
});
