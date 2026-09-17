import { FutureSelfService } from './future-self.service';
import {
  FutureSelfGenerationRequest,
  FutureSelfGenerationResult,
  IFutureSelfEngine,
} from '../engines/future-self.port';
import {
  IPlanProgressProvider,
  NullPlanProgressProvider,
  PlanSnapshot,
  ProgressSnapshot,
} from '../ports/plan-progress.port';
import { FutureSelfMode } from '../enums/future-self.enum';
import { ZunoFutureSelfNarrative } from '../entities/zuno-future-self-narrative.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../../challenges/entities/zuno-challenge-context.entity';
import { MemoryService } from '../../memory/services/memory.service';
import { ZunoMemory } from '../../memory/entities/zuno-memory.entity';
import { ZunoMemoryCandidate } from '../../memory/entities/zuno-memory-candidate.entity';
import { ZunoMemoryEvidence } from '../../memory/entities/zuno-memory-evidence.entity';
import { ZunoMemoryConflict } from '../../memory/entities/zuno-memory-conflict.entity';
import {
  MemoryEvidenceType,
  MemoryFactuality,
  MemoryRetentionClass,
  MemoryScope,
  MemorySensitivity,
  MemorySource,
  MemoryStatus,
  MemoryType,
} from '../../memory/enums/memory.enum';
import {
  FakeRepository,
  fakeDataSource,
  InMemoryStore,
  RecordingAudit,
  RecordingOutbox,
} from '../../memory/testing/memory-test-harness';
import { SafetyService } from '../../safety/services/safety.service';
import { SafetySignalDetector } from '../../safety/services/safety-signal-detector';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { FixedClockService } from '../../common/services/clock.service';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { ChallengeStatus, ZunoDomain } from '../../common/enums';

/**
 * Roadmap sections 70-71 and the section 73 acceptance list, at the service
 * level.
 *
 * Two things are being proved here that the boundary unit tests cannot prove on
 * their own:
 *
 *   1. the boundary is actually wired into generation - a narrative that
 *      crosses it never becomes a persisted row and never reaches a caller;
 *   2. safety runs in the right order - pre-check before the model, post-check
 *      after. This repository shipped that backwards once, so it is asserted
 *      directly rather than assumed from reading the code.
 */

const USER = 'user-a';
const OTHER_USER = 'user-b';
const CHALLENGE = 'ch-1';
const NOW = new Date('2026-09-17T09:00:00.000Z');

/** Records what it was asked for, so the prompt context can be inspected. */
class RecordingEngine implements IFutureSelfEngine {
  calls: FutureSelfGenerationRequest[] = [];

  constructor(
    private readonly reply: Partial<FutureSelfGenerationResult['narrative']>,
  ) {}

  async generate(
    request: FutureSelfGenerationRequest,
  ): Promise<FutureSelfGenerationResult> {
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

class StubPlanProgress implements IPlanProgressProvider {
  constructor(
    private readonly plan: PlanSnapshot | null,
    private readonly progress: ProgressSnapshot,
  ) {}

  async getCurrentPlan(): Promise<PlanSnapshot | null> {
    return this.plan;
  }

  async getProgress(): Promise<ProgressSnapshot> {
    return this.progress;
  }
}

describe('FutureSelfService', () => {
  let store: InMemoryStore;
  let outbox: RecordingOutbox;
  let audit: RecordingAudit;
  let memoryService: MemoryService;
  let narratives: FakeRepository<ZunoFutureSelfNarrative>;

  beforeEach(() => {
    store = new InMemoryStore();
    outbox = new RecordingOutbox();
    audit = new RecordingAudit();
    narratives = new FakeRepository<ZunoFutureSelfNarrative>(
      store,
      'ZunoFutureSelfNarrative',
    );

    memoryService = new MemoryService(
      new FakeRepository<ZunoMemory>(store, 'ZunoMemory') as never,
      new FakeRepository<ZunoMemoryCandidate>(store, 'ZunoMemoryCandidate') as never,
      new FakeRepository<ZunoMemoryEvidence>(store, 'ZunoMemoryEvidence') as never,
      new FakeRepository<ZunoMemoryConflict>(store, 'ZunoMemoryConflict') as never,
      new SafetyService(new SafetySignalDetector()),
      outbox as never,
      audit as never,
      new ZunoOwnershipService(),
      new FixedClockService(NOW),
      fakeDataSource(store) as never,
    );

    seedChallenge();
  });

  function seedChallenge(
    overrides: Partial<ZunoChallenge> = {},
    contextSummary = 'Career uncertainty in Dubai with home loan exposure.',
  ): void {
    store.rows('ZunoChallenge').push({
      id: CHALLENGE,
      user_id: USER,
      title: 'Career uncertainty in Dubai',
      raw_user_statement:
        'Many people have been laid off at my company and I have a home loan.',
      primary_domain: ZunoDomain.CAREER,
      status: ChallengeStatus.ACTIVE,
      context_version: 1,
      opened_at: NOW,
      resolved_at: null,
      deleted_at: null,
      version: 1,
      ...overrides,
    } as never);

    store.rows('ZunoChallengeContext').push({
      id: 'ctx-1',
      challenge_id: CHALLENGE,
      user_id: USER,
      version_number: 1,
      summary: contextSummary,
      deleted_at: null,
    } as never);
  }

  function seedMemory(overrides: Partial<ZunoMemory>): ZunoMemory {
    const row: Partial<ZunoMemory> = {
      user_id: USER,
      challenge_id: CHALLENGE,
      scope: MemoryScope.CHALLENGE,
      memory_type: MemoryType.DECISION,
      memory_key: 'k',
      memory_value: { statement: 'Something grounded.' },
      factuality: MemoryFactuality.DECISION,
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

  function buildService(
    engine: IFutureSelfEngine,
    planProgress: IPlanProgressProvider = new NullPlanProgressProvider(),
  ): FutureSelfService {
    return new FutureSelfService(
      engine,
      planProgress,
      narratives as never,
      new FakeRepository<ZunoChallenge>(store, 'ZunoChallenge') as never,
      new FakeRepository<ZunoChallengeContext>(store, 'ZunoChallengeContext') as never,
      memoryService,
      new SafetyService(new SafetySignalDetector()),
      outbox as never,
      audit as never,
      new ZunoOwnershipService(),
      new FixedClockService(NOW),
      fakeDataSource(store) as never,
      undefined, // no Rulebook bound - fail closed, see the timing-context test
    );
  }

  // =======================================================================
  // Roadmap section 70: grounded generation
  // =======================================================================

  describe('grounded generation', () => {
    it('persists a grounded narrative with its source rows', async () => {
      const memory = seedMemory({
        id: 'mem-1',
        memory_value: {
          statement: 'Will not resign before another offer is secured.',
        },
      });
      const engine = new RecordingEngine({
        summary:
          'We have clarified where we stand and decided not to resign before another offer. The uncertainty is still there, but our dependence on one outcome has reduced.',
        next_focus: ['Keep strengthening the position'],
        source_refs: [`ZunoMemory:${memory.id}`, `ZunoChallenge:${CHALLENGE}`],
      });
      const service = buildService(engine);

      const { narrative, sources } = await service.generate({
        userId: USER,
        challengeId: CHALLENGE,
        mode: FutureSelfMode.WEEKLY,
      });

      expect(narrative.summary).toContain('not to resign');
      expect(narrative.mode).toBe(FutureSelfMode.WEEKLY);
      expect(narrative.boundary_version).toBeTruthy();
      // Step 20 section 55: grounding rows are written with the narrative.
      expect(sources.map((s) => s.source_entity_id).sort()).toEqual(
        [CHALLENGE, 'mem-1'].sort(),
      );
      expect(outbox.types()).toContain('zuno.future_self.generated');
      expect(audit.actions).toContain('FUTURE_SELF_GENERATED');
    });

    it('sends only relevant memory to the engine, not the whole store', async () => {
      // Roadmap section 69 / Step 18 section 87.
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
          memory_type: MemoryType.PROGRESS,
          retention_class: MemoryRetentionClass.CHALLENGE_LIFETIME,
          memory_value: { statement: `Routine step number ${i} completed.` },
        });
      }

      const engine = new RecordingEngine({ summary: 'A grounded reflection.' });
      const service = buildService(engine);
      await service.generate({
        userId: USER,
        challengeId: CHALLENGE,
        mode: FutureSelfMode.WEEKLY,
      });

      const sent = engine.calls[0].context.relevantMemory;
      expect(store.rows('ZunoMemory').length).toBe(16);
      expect(sent.length).toBeLessThanOrEqual(10);
      expect(sent.join(' ')).toContain('not resign before another offer');
    });

    it('degrades to challenge and memory when no Plan module is bound', async () => {
      // Build Rule 173 / Step 21 section 99: a missing dependency produces a
      // thinner narrative, not an error and not invented plan data.
      seedMemory({ id: 'mem-1' });
      const engine = new RecordingEngine({ summary: 'A grounded reflection.' });
      const service = buildService(engine, new NullPlanProgressProvider());

      const { narrative } = await service.generate({
        userId: USER,
        challengeId: CHALLENGE,
        mode: FutureSelfMode.WEEKLY,
      });

      expect(narrative.id).toBeTruthy();
      expect(engine.calls[0].context.planTitle).toBeNull();
      expect(engine.calls[0].context.completedActions).toEqual([]);
    });

    it('includes plan and progress when a provider is bound', async () => {
      const engine = new RecordingEngine({ summary: 'A grounded reflection.' });
      const service = buildService(
        engine,
        new StubPlanProgress(
          {
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
          },
          {
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
          },
        ),
      );

      await service.generate({
        userId: USER,
        challengeId: CHALLENGE,
        mode: FutureSelfMode.WEEKLY,
      });

      const context = engine.calls[0].context;
      expect(context.planTitle).toBe('Reduce dependence on one outcome');
      expect(context.openPlanItems).toContain('Prepare questions for the bank');
      expect(context.completedActions).toContain('Update the CV');
      expect(context.openLoops).toContain('Recruiter outreach');
    });

    it('sends no timing context when no Rulebook is active (fail closed)', async () => {
      // Step 20 section 125 / Build Rule 51. There is deliberately no
      // substitute string - a plausible-sounding one would be an unsourced
      // astrological claim.
      const engine = new RecordingEngine({ summary: 'A grounded reflection.' });
      const service = buildService(engine);
      await service.generate({
        userId: USER,
        challengeId: CHALLENGE,
        mode: FutureSelfMode.WEEKLY,
      });
      expect(engine.calls[0].context.timingContext).toBeNull();
    });
  });

  // =======================================================================
  // Roadmap section 71: the boundary, wired in
  // =======================================================================

  describe('the section 71 boundary is enforced on real output', () => {
    const adversarial: [string, string][] = [
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

    it.each(adversarial)(
      'refuses an invented %s rather than shipping it',
      async (_label, summary) => {
        seedMemory({ id: 'mem-1' });
        const service = buildService(new RecordingEngine({ summary }));

        await expect(
          service.generate({
            userId: USER,
            challengeId: CHALLENGE,
            mode: FutureSelfMode.WEEKLY,
          }),
        ).rejects.toMatchObject({
          code: ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE,
        });

        // Build Rule 128: no fabricated success, and nothing persisted.
        expect(store.rows('ZunoFutureSelfNarrative')).toHaveLength(0);
        expect(store.rows('ZunoFutureSelfSource')).toHaveLength(0);
      },
    );

    it('catches an invention hidden in a list item rather than the summary', async () => {
      seedMemory({ id: 'mem-1' });
      const service = buildService(
        new RecordingEngine({
          summary: 'We have made real progress on the things we control.',
          next_focus: ['Accept the offer from Meridian Consulting'],
        }),
      );

      await expect(
        service.generate({
          userId: USER,
          challengeId: CHALLENGE,
          mode: FutureSelfMode.WEEKLY,
        }),
      ).rejects.toMatchObject({
        code: ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE,
      });
      expect(store.rows('ZunoFutureSelfNarrative')).toHaveLength(0);
    });

    it('records the refusal so the unsupported-claim rate can be measured', async () => {
      // Step 18 section 83.
      seedMemory({ id: 'mem-1' });
      const service = buildService(
        new RecordingEngine({ summary: 'Trust me, everything works out.' }),
      );
      await expect(
        service.generate({
          userId: USER,
          challengeId: CHALLENGE,
          mode: FutureSelfMode.WEEKLY,
        }),
      ).rejects.toBeDefined();

      expect(audit.actions).toContain('FUTURE_SELF_BOUNDARY_REFUSAL');
    });

    it('refuses a fabricated source reference', async () => {
      // Step 18 section 38: every statement traceable to a stored fact.
      seedMemory({ id: 'mem-1' });
      const service = buildService(
        new RecordingEngine({
          summary: 'We have made progress on the things we control.',
          source_refs: ['ZunoMemory:not-a-real-memory'],
        }),
      );

      await expect(
        service.generate({
          userId: USER,
          challengeId: CHALLENGE,
          mode: FutureSelfMode.WEEKLY,
        }),
      ).rejects.toMatchObject({
        code: ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE,
      });
    });
  });

  // =======================================================================
  // Safety ordering
  // =======================================================================

  describe('safety ordering', () => {
    it('runs the pre-check BEFORE the model call, and never calls it when blocked', async () => {
      // Step 11 section 67 / Step 19 section 50. Asserting on the engine's call
      // count is the only way to prove ordering from the outside.
      store.clear();
      seedChallenge(
        {
          raw_user_statement:
            'I do not want to live anymore, there is no point to any of this.',
        },
        'The person is in acute distress.',
      );

      const engine = new RecordingEngine({ summary: 'anything' });
      const service = buildService(engine);

      await expect(
        service.generate({
          userId: USER,
          challengeId: CHALLENGE,
          mode: FutureSelfMode.WEEKLY,
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

      expect(engine.calls).toHaveLength(0);
      expect(store.rows('ZunoFutureSelfNarrative')).toHaveLength(0);
      // The decision and the incident are still recorded.
      expect(store.rows('ZunoSafetyDecision').length).toBeGreaterThan(0);
      expect(store.rows('ZunoSafetyIncident').length).toBeGreaterThan(0);
    });

    it('runs the post-check AFTER the model call and blocks fatalistic output', async () => {
      seedMemory({ id: 'mem-1' });
      const engine = new RecordingEngine({
        summary:
          'There is nothing you can do about the restructuring, and it cannot be avoided.',
      });
      const service = buildService(engine);

      await expect(
        service.generate({
          userId: USER,
          challengeId: CHALLENGE,
          mode: FutureSelfMode.WEEKLY,
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

      // The model WAS called - that is what makes this the post-check.
      expect(engine.calls).toHaveLength(1);
      expect(store.rows('ZunoFutureSelfNarrative')).toHaveLength(0);
    });
  });

  // =======================================================================
  // Roadmap section 73: deletion removes retrieval influence, end to end
  // =======================================================================

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
        mode: FutureSelfMode.WEEKLY,
      });
      expect(engine.calls[0].context.relevantMemory.join(' ')).toContain(
        'marriage',
      );

      // The user asks ZUNO to forget it.
      await memoryService.deleteMemory(USER, doomed.id, 'USER_REQUESTED');

      await service.generate({
        userId: USER,
        challengeId: CHALLENGE,
        mode: FutureSelfMode.WEEKLY,
      });

      // Build Rule 38 / Step 24 section 165: it stops entering AI context.
      const secondContext = engine.calls[1].context.relevantMemory.join(' ');
      expect(secondContext).not.toContain('marriage');
      expect(secondContext).toContain('not resign before another offer');
    });
  });

  // =======================================================================
  // Ownership
  // =======================================================================

  describe('ownership', () => {
    it('refuses to generate against another user\'s challenge', async () => {
      const engine = new RecordingEngine({ summary: 'anything' });
      const service = buildService(engine);

      await expect(
        service.generate({
          userId: OTHER_USER,
          challengeId: CHALLENGE,
          mode: FutureSelfMode.WEEKLY,
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });

      expect(engine.calls).toHaveLength(0);
    });

    it('refuses to read another user\'s narrative, as NOT_FOUND', async () => {
      seedMemory({ id: 'mem-1' });
      const service = buildService(
        new RecordingEngine({ summary: 'A grounded reflection.' }),
      );
      const { narrative } = await service.generate({
        userId: USER,
        challengeId: CHALLENGE,
        mode: FutureSelfMode.WEEKLY,
      });

      await expect(
        service.findOwned(OTHER_USER, narrative.id),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
      await expect(service.findOwned(USER, narrative.id)).resolves.toBeTruthy();
    });

    it('never lists another user\'s narratives', async () => {
      seedMemory({ id: 'mem-1' });
      const service = buildService(
        new RecordingEngine({ summary: 'A grounded reflection.' }),
      );
      await service.generate({
        userId: USER,
        challengeId: CHALLENGE,
        mode: FutureSelfMode.WEEKLY,
      });

      expect(await service.listForUser(OTHER_USER)).toHaveLength(0);
      expect(await service.listForUser(USER)).toHaveLength(1);
    });
  });
});
