import { randomUUID } from 'crypto';
import {
  WhatIfService,
  WHAT_IF_HYPOTHETICAL_NOTICE,
} from './what-if.service';
import { SafetyService } from '../../safety/services/safety.service';
import { SafetySignalDetector } from '../../safety/services/safety-signal-detector';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { FixedClockService } from '../../common/services/clock.service';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { ChallengeMode, ZunoDomain } from '../../common/enums';
import { WhatIfExplorationResult } from '../ports/what-if.port';
import {
  PreparationClass,
  Reversibility,
  ScenarioEvidenceClass,
  ScenarioImpact,
  WhatIfAssumptionType,
  WhatIfSessionStatus,
  WHAT_IF_MAX_CASCADE_DEPTH,
} from '../enums/scenario.enum';

/**
 * WhatIfService tests.
 *
 * Roadmap section 45 makes "What-If does not mutate factual state" an
 * acceptance criterion for Phase 6, and Step 12 section 102 names silent state
 * change as the anti-pattern. Those are asserted here directly: the service is
 * built with factual-state repositories that fail loudly if touched.
 */

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';
const user = { id: USER_ID } as any;

function exploration(
  overrides: Partial<WhatIfExplorationResult['exploration']> = {},
): WhatIfExplorationResult {
  return {
    exploration: {
      assumption: 'Employment ends next month',
      assumptions: [
        {
          text: 'Employment ends next month',
          type: WhatIfAssumptionType.USER_STATED,
          dependency_reference: null,
        },
        {
          text: 'The primary salary pauses at the same time',
          type: WhatIfAssumptionType.DERIVED_DEPENDENCY,
          dependency_reference: 'Employment -> Monthly income',
        },
      ],
      implications: [
        {
          text: 'The main income source would pause',
          layer: 1,
          basis: ScenarioEvidenceClass.DEPENDENCY,
          dependency_reference: 'Employment -> Monthly income',
        },
        {
          text: 'Loan servicing would become more sensitive to timing',
          layer: 2,
          basis: ScenarioEvidenceClass.DEPENDENCY,
          dependency_reference: 'Monthly income -> Home loan servicing',
        },
      ],
      controllable_actions: ['Prepare employment documents'],
      existing_preparation_that_helps: ['Refresh the CV'],
      preparation: [
        {
          action: 'Clarify the loan contingency terms',
          classification: PreparationClass.CONTINGENCY_ONLY,
        },
      ],
      impact_areas: [ZunoDomain.CAREER, ZunoDomain.FINANCE],
      impact: ScenarioImpact.HIGH,
      reversibility: Reversibility.MEDIUM,
      safety_flags: [],
      confidence: 0.8,
      ...overrides,
    },
    engineVersion: 'test-what-if-engine-1.0.0',
    promptVersion: 'test-what-if-prompt-1.0.0',
    aiGenerationRunId: 'run-2',
  };
}

function projection(overrides: Record<string, unknown> = {}) {
  return {
    challenge: {
      id: CHALLENGE_ID,
      user_id: USER_ID,
      mode: ChallengeMode.PREPARE,
      raw_user_statement: 'Layoffs are happening at my company.',
    },
    context: { version_number: 3 },
    domains: [ZunoDomain.CAREER, ZunoDomain.FINANCE],
    summary: 'Layoffs at work have put income and the home loan in one question.',
    facts: ['Layoffs are occurring at the employer'],
    concerns: ['They may lose their job'],
    dependencies: [
      { from: 'Employment', to: 'Monthly income', description: null },
      { from: 'Monthly income', to: 'Home loan servicing', description: null },
    ],
    decisions: [],
    controllable: ['CV readiness'],
    external: ['Employer restructuring'],
    temporalAnchors: [],
    safetyText: 'Layoffs are happening at my company.',
    ...overrides,
  };
}

function buildHarness(
  options: {
    engineResult?: WhatIfExplorationResult;
    projection?: Record<string, unknown>;
    sharedPreparation?: { action: string; classification: PreparationClass }[];
    session?: Record<string, unknown> | null;
  } = {},
) {
  const order: string[] = [];

  const safety = new SafetyService(new SafetySignalDetector());
  const realPreCheck = safety.preCheck.bind(safety);
  const realPostCheck = safety.postCheck.bind(safety);
  const preSpy = jest.spyOn(safety, 'preCheck').mockImplementation((input) => {
    order.push('SAFETY_PRE');
    return realPreCheck(input);
  });
  const postSpy = jest.spyOn(safety, 'postCheck').mockImplementation((input) => {
    order.push('SAFETY_POST');
    return realPostCheck(input);
  });

  const engineResult = options.engineResult ?? exploration();
  const engine = {
    explore: jest.fn(async () => {
      order.push('ENGINE');
      return engineResult;
    }),
  };

  const context = {
    project: jest.fn(async () => options.projection ?? projection()),
    requireOwnedChallenge: jest.fn(
      async () => (options.projection ?? projection()).challenge,
    ),
    loadAstroContext: jest.fn(async () => null),
  };

  /**
   * The factual-state guard.
   *
   * Every saved row is recorded with the entity it was written against. A test
   * can then assert that nothing outside the two what-if tables was touched -
   * which is a stronger statement than "we did not mean to".
   */
  const savedEntities: string[] = [];
  const manager = {
    create: (entity: { name?: string }, data: Record<string, unknown>) => ({
      id: randomUUID(),
      version: 1,
      created_at: new Date('2026-09-17T00:00:00Z'),
      __entity: entity?.name,
      ...data,
    }),
    save: async (entity: { name?: string }, row: unknown) => {
      savedEntities.push(entity?.name ?? 'UNKNOWN');
      return row;
    },
    find: async () => [],
    softDelete: async (entity: { name?: string }) => {
      savedEntities.push(`softDelete:${entity?.name}`);
      return undefined;
    },
  };
  const dataSource = {
    transaction: async (work: (m: unknown) => Promise<unknown>) => work(manager),
  };

  const sessionRepo = {
    findOne: jest.fn(async () => options.session ?? null),
  };
  const assumptionRepo = { find: jest.fn(async () => []) };

  const scenarioService = {
    currentSet: jest.fn(async () => ({
      shared_preparation:
        options.sharedPreparation ?? [
          { action: 'Refresh the CV', classification: PreparationClass.COMMON },
        ],
    })),
  };

  const outbox = {
    enqueue: jest.fn(async () => undefined),
    enqueueMany: jest.fn(async () => undefined),
  };
  const audit = { record: jest.fn(async () => undefined) };

  const service = new WhatIfService(
    sessionRepo as any,
    assumptionRepo as any,
    engine as any,
    context as any,
    scenarioService as any,
    safety,
    outbox as any,
    audit as any,
    new ZunoOwnershipService(),
    new FixedClockService(new Date('2026-09-17T00:00:00Z')),
    dataSource as any,
  );

  return {
    service,
    engine,
    outbox,
    audit,
    sessionRepo,
    savedEntities,
    order,
    preSpy,
    postSpy,
    scenarioService,
  };
}

afterEach(() => jest.restoreAllMocks());

describe('WhatIfService', () => {
  describe('safety ordering (Step 12 section 71, Step 19 sections 50-51)', () => {
    it('runs the safety pre-check BEFORE the model call and the post-check AFTER it', async () => {
      const h = buildHarness();
      await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job next month?',
      });
      expect(h.order).toEqual(['SAFETY_PRE', 'ENGINE', 'SAFETY_POST']);
    });

    it('proves the ordering against Jest\'s own invocation counter', async () => {
      const h = buildHarness();
      await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job next month?',
      });

      expect(h.preSpy.mock.invocationCallOrder[0]).toBeLessThan(
        h.engine.explore.mock.invocationCallOrder[0],
      );
      expect(h.engine.explore.mock.invocationCallOrder[0]).toBeLessThan(
        h.postSpy.mock.invocationCallOrder[0],
      );
    });

    it('checks the hypothetical question itself, not only the stored context', async () => {
      // A signal can exist only in the hypothetical. A pre-check reading the
      // old challenge context alone would miss it entirely, which is exactly
      // the gap Step 12 section 71 closes.
      const h = buildHarness();

      await expect(
        h.service.explore({
          user,
          challengeId: CHALLENGE_ID,
          question: 'What if I just end my life instead of dealing with this?',
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

      expect(h.engine.explore).not.toHaveBeenCalled();
      expect(h.order).toEqual(['SAFETY_PRE']);
    });

    it('refuses to persist when the post-check finds a violation', async () => {
      const h = buildHarness({
        engineResult: exploration({
          implications: [
            {
              text: 'Losing the role would be a disaster for the household.',
              layer: 1,
              basis: ScenarioEvidenceClass.DEPENDENCY,
              dependency_reference: null,
            },
          ],
        }),
      });

      await expect(
        h.service.explore({
          user,
          challengeId: CHALLENGE_ID,
          question: 'What if I lose my job?',
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

      expect(h.order).toEqual(['SAFETY_PRE', 'ENGINE', 'SAFETY_POST']);
    });
  });

  describe('isolation (Step 12 sections 39-41, Step 20 Rule 4, Roadmap section 45)', () => {
    it('writes nothing outside the two what-if tables', async () => {
      const h = buildHarness();
      await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job next month?',
      });

      // ZunoSafetyDecision is written because the safety layer records every
      // decision; nothing touching the challenge, its context, a scenario or a
      // plan may appear here.
      expect(new Set(h.savedEntities)).toEqual(
        new Set([
          'ZunoSafetyDecision',
          'ZunoWhatIfSession',
          'ZunoWhatIfAssumption',
        ]),
      );
    });

    it('marks the session hypothetical and the plan unchanged', async () => {
      const h = buildHarness();
      const { session } = await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job next month?',
      });

      expect(session.is_hypothetical).toBe(true);
      expect(session.current_plan_changed).toBe(false);
      expect(session.status).toBe(WhatIfSessionStatus.ACTIVE);
    });

    it('carries the mandatory notice verbatim (Step 12 section 40)', async () => {
      const h = buildHarness();
      const { session } = await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job next month?',
      });

      expect(session.result?.hypothetical_notice).toBe(
        WHAT_IF_HYPOTHETICAL_NOTICE,
      );
      expect(WHAT_IF_HYPOTHETICAL_NOTICE).toBe(
        'This is a hypothetical. Your current plan is unchanged.',
      );
    });

    it('emits an event that states its own isolation', async () => {
      const h = buildHarness();
      await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job next month?',
      });

      expect(h.outbox.enqueue).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'zuno.what_if.explored',
          payload: expect.objectContaining({
            hypothetical: true,
            current_plan_changed: false,
          }),
        }),
      );
    });

    it('records the user\'s premise as USER_STATED, exactly once', async () => {
      // Step 20 section 30: nothing here may become a confirmed challenge fact,
      // and the premise must stay distinguishable from what followed from it.
      const h = buildHarness();
      const { assumptions } = await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job next month?',
      });

      const stated = assumptions.filter(
        (entry) => entry.assumption_type === WhatIfAssumptionType.USER_STATED,
      );
      expect(stated).toHaveLength(1);
      expect(stated[0].assumption_text).toBe('Employment ends next month');

      const derived = assumptions.filter(
        (entry) =>
          entry.assumption_type === WhatIfAssumptionType.DERIVED_DEPENDENCY,
      );
      expect(derived).toHaveLength(1);
      expect(derived[0].value).toEqual({
        dependency_reference: 'Employment -> Monthly income',
      });
    });
  });

  describe('bounded cascades (Step 12 sections 43-44)', () => {
    it('truncates implications past the depth bound', async () => {
      const h = buildHarness({
        engineResult: exploration({
          implications: [
            { text: 'Income would pause', layer: 1, basis: ScenarioEvidenceClass.DEPENDENCY, dependency_reference: null },
            { text: 'Loan servicing tightens', layer: 2, basis: ScenarioEvidenceClass.DEPENDENCY, dependency_reference: null },
            { text: 'Housing decisions come into view', layer: 3, basis: ScenarioEvidenceClass.DEPENDENCY, dependency_reference: null },
            { text: 'Family relationships come under strain', layer: 4, basis: ScenarioEvidenceClass.SYSTEM_INFERENCE, dependency_reference: null },
          ],
        }),
      });

      const { session } = await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job?',
      });

      expect(session.result?.implications).toHaveLength(WHAT_IF_MAX_CASCADE_DEPTH);
    });

    it('drops an implication that predicts another person\'s behaviour', async () => {
      // Step 12 section 73: accepting the premise does not license a verdict on
      // what a partner, employer or bank decides.
      const h = buildHarness({
        engineResult: exploration({
          implications: [
            { text: 'The household budget would need reworking', layer: 1, basis: ScenarioEvidenceClass.DEPENDENCY, dependency_reference: null },
            { text: 'Your partner will leave you within the month.', layer: 2, basis: ScenarioEvidenceClass.SYSTEM_INFERENCE, dependency_reference: null },
          ],
        }),
      });

      const { session } = await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job?',
      });

      const texts = session.result?.implications.map((entry) => entry.text) ?? [];
      expect(texts).toEqual(['The household budget would need reworking']);
    });

    it('fails honestly when nothing survives the bounds', async () => {
      const h = buildHarness({
        engineResult: exploration({
          implications: [
            { text: 'You will lose everything, it is inevitable.', layer: 1, basis: ScenarioEvidenceClass.SYSTEM_INFERENCE, dependency_reference: null },
          ],
        }),
      });

      await expect(
        h.service.explore({
          user,
          challengeId: CHALLENGE_ID,
          question: 'What if I lose my job?',
        }),
      ).rejects.toMatchObject({
        code: ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE,
      });
    });
  });

  describe('grounding (Step 12 section 42, Build Rule 129)', () => {
    it('only reports preparation the user actually has', async () => {
      const h = buildHarness({
        sharedPreparation: [
          { action: 'Refresh the CV', classification: PreparationClass.COMMON },
        ],
        engineResult: exploration({
          existing_preparation_that_helps: [
            'Refresh the CV',
            'Six months of savings already set aside',
          ],
        }),
      });

      const { session } = await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job?',
      });

      // The savings claim was never in the real preparation list, so it is not
      // shown back to the user as something they have done.
      expect(session.result?.existing_preparation_that_helps).toEqual([
        'Refresh the CV',
      ]);
    });

    it('rejects an empty question before anything else happens', async () => {
      const h = buildHarness();
      await expect(
        h.service.explore({ user, challengeId: CHALLENGE_ID, question: '   ' }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.VALIDATION_ERROR });
      expect(h.order).toEqual([]);
    });
  });

  describe('graceful behaviour with no active rulebook', () => {
    it('explores without astrology rather than refusing', async () => {
      const h = buildHarness();
      const { session } = await h.service.explore({
        user,
        challengeId: CHALLENGE_ID,
        question: 'What if I lose my job next month?',
      });

      expect(session.result?.implications.length).toBeGreaterThan(0);
      expect(h.engine.explore).toHaveBeenCalledWith(
        expect.objectContaining({ astro: null }),
      );
    });
  });

  describe('ownership (Step 21 section 106)', () => {
    it('masks another user\'s session as NOT_FOUND', async () => {
      const h = buildHarness({
        session: {
          id: 'session-1',
          user_id: OTHER_USER_ID,
          expires_at: null,
        },
      });

      await expect(
        h.service.findOwnedSession(user, 'session-1'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
    });

    it('reports an expired session as gone rather than serving it stale', async () => {
      const h = buildHarness({
        session: {
          id: 'session-1',
          user_id: USER_ID,
          expires_at: new Date('2026-09-01T00:00:00Z'),
        },
      });

      await expect(
        h.service.findOwnedSession(user, 'session-1'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
    });

    it('refuses to discard a session the caller does not own', async () => {
      const h = buildHarness({
        session: { id: 'session-1', user_id: OTHER_USER_ID, expires_at: null },
      });

      await expect(h.service.discard(user, 'session-1')).rejects.toMatchObject({
        code: ZunoErrorCode.NOT_FOUND,
      });
      expect(h.savedEntities).toEqual([]);
    });

    it('discards an owned session without touching factual state', async () => {
      const h = buildHarness({
        session: {
          id: 'session-1',
          user_id: USER_ID,
          expires_at: null,
          status: WhatIfSessionStatus.ACTIVE,
        },
      });

      await h.service.discard(user, 'session-1');

      expect(h.savedEntities).toEqual([
        'ZunoWhatIfSession',
        'softDelete:ZunoWhatIfSession',
      ]);
    });
  });
});
