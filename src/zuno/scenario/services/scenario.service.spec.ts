import { randomUUID } from 'crypto';
import { ScenarioService } from './scenario.service';
import { SafetyService } from '../../safety/services/safety.service';
import { SafetySignalDetector } from '../../safety/services/safety-signal-detector';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { FixedClockService } from '../../common/services/clock.service';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ChallengeMode, ZunoDomain } from '../../common/enums';
import {
  ScenarioCandidate,
  ScenarioGenerationResult,
} from '../ports/scenario.port';
import {
  PreparationClass,
  ScenarioEvidenceClass,
  ScenarioHorizon,
  ScenarioImpact,
  ScenarioRelevance,
  ScenarioStatus,
  ScenarioType,
  SCENARIO_MAX_USER_FACING,
  DecisionReadiness,
} from '../enums/scenario.enum';

/**
 * ScenarioService tests.
 *
 * The first describe block is the one that matters most. Safety ordering in
 * this repository was previously shipped the wrong way round and logged as a
 * design error, so it is asserted here twice over - once as a readable call
 * log, once against Jest's own invocation ordering - and once more negatively,
 * by proving the engine is never reached when the pre-check blocks.
 */

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';

const user = { id: USER_ID } as any;

function candidate(overrides: Partial<ScenarioCandidate> = {}): ScenarioCandidate {
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
    impact_areas: [ZunoDomain.CAREER],
    scenario_specific_preparation: [
      { action: 'Increase internal visibility', classification: PreparationClass.SCENARIO_SPECIFIC },
    ],
    benefits: [],
    constraints: [],
    reversibility: null,
    option_ref: null,
    ...overrides,
  };
}

function generationResult(
  scenarios: ScenarioCandidate[],
  overrides: Partial<ScenarioGenerationResult['generation']> = {},
): ScenarioGenerationResult {
  return {
    generation: {
      seeds: ['Current job continues'],
      scenarios,
      shared_preparation: [
        { action: 'Refresh the CV', classification: PreparationClass.COMMON },
      ],
      watch_signals: ['Formal restructuring notice'],
      comparison: [],
      decision_readiness: DecisionReadiness.READY,
      safety_flags: [],
      ...overrides,
    },
    engineVersion: 'test-scenario-engine-1.0.0',
    promptVersion: 'test-prompt-1.0.0',
    aiGenerationRunId: 'run-1',
  };
}

function projection(overrides: Record<string, unknown> = {}) {
  return {
    challenge: {
      id: CHALLENGE_ID,
      user_id: USER_ID,
      mode: ChallengeMode.PREPARE,
      raw_user_statement:
        'Layoffs are happening at my company and I have a home loan.',
    },
    context: { version_number: 2 },
    domains: [ZunoDomain.CAREER, ZunoDomain.FINANCE],
    summary: 'Layoffs at work have put income and the home loan in one question.',
    facts: ['Layoffs are occurring at the employer', 'They have a home loan'],
    concerns: ['They may lose their job'],
    dependencies: [
      { from: 'Employment', to: 'Monthly income', description: null },
      { from: 'Monthly income', to: 'Home loan servicing', description: null },
    ],
    decisions: [],
    controllable: ['CV readiness'],
    external: ['Employer restructuring'],
    temporalAnchors: [],
    safetyText:
      'Layoffs are happening at my company and I have a home loan. They may lose their job.',
    ...overrides,
  };
}

interface Harness {
  service: ScenarioService;
  safety: SafetyService;
  engine: { generate: jest.Mock };
  outbox: { enqueue: jest.Mock; enqueueMany: jest.Mock };
  audit: { record: jest.Mock };
  context: {
    project: jest.Mock;
    requireOwnedChallenge: jest.Mock;
    loadAstroContext: jest.Mock;
  };
  scenarioRepo: { find: jest.Mock; findOne: jest.Mock };
  /** Readable call log, appended to by the spies below. */
  order: string[];
  preSpy: jest.SpyInstance;
  postSpy: jest.SpyInstance;
}

function buildHarness(
  options: {
    engineResult?: ScenarioGenerationResult;
    projection?: Record<string, unknown>;
    astro?: unknown;
    existingScenarios?: unknown[];
  } = {},
): Harness {
  const order: string[] = [];

  const safety = new SafetyService(new SafetySignalDetector());
  const realPreCheck = safety.preCheck.bind(safety);
  const realPostCheck = safety.postCheck.bind(safety);

  const preSpy = jest
    .spyOn(safety, 'preCheck')
    .mockImplementation((input) => {
      order.push('SAFETY_PRE');
      return realPreCheck(input);
    });
  const postSpy = jest
    .spyOn(safety, 'postCheck')
    .mockImplementation((input) => {
      order.push('SAFETY_POST');
      return realPostCheck(input);
    });

  const engineResult =
    options.engineResult ?? generationResult([candidate()]);
  const engine = {
    generate: jest.fn(async () => {
      order.push('ENGINE');
      return engineResult;
    }),
  };

  const context = {
    project: jest.fn(async () => options.projection ?? projection()),
    requireOwnedChallenge: jest.fn(async () =>
      (options.projection ?? projection()).challenge,
    ),
    loadAstroContext: jest.fn(async () => options.astro ?? null),
  };

  const outbox = {
    enqueue: jest.fn(async () => undefined),
    enqueueMany: jest.fn(async () => undefined),
  };
  const audit = { record: jest.fn(async () => undefined) };

  const manager = {
    create: (_entity: unknown, data: Record<string, unknown>) => ({
      id: randomUUID(),
      version: 1,
      created_at: new Date('2026-09-17T00:00:00Z'),
      ...data,
    }),
    save: async (_entity: unknown, row: unknown) => row,
    find: async () => options.existingScenarios ?? [],
    softDelete: async () => undefined,
  };

  const dataSource = {
    transaction: async (work: (m: unknown) => Promise<unknown>) => work(manager),
  };

  const setRepo = { findOne: jest.fn(async () => null) };
  const scenarioRepo = {
    find: jest.fn(async () => options.existingScenarios ?? []),
    findOne: jest.fn(async () => null),
  };
  const conditionRepo = {};

  const service = new ScenarioService(
    setRepo as any,
    scenarioRepo as any,
    conditionRepo as any,
    engine as any,
    context as any,
    safety,
    outbox as any,
    audit as any,
    new ZunoOwnershipService(),
    new FixedClockService(new Date('2026-09-17T00:00:00Z')),
    dataSource as any,
  );

  return {
    service,
    safety,
    engine,
    outbox,
    audit,
    context,
    scenarioRepo,
    order,
    preSpy,
    postSpy,
  };
}

afterEach(() => jest.restoreAllMocks());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScenarioService', () => {
  describe('safety ordering (Step 11 section 67, Step 19 sections 50-51)', () => {
    it('runs the safety pre-check BEFORE the model call and the post-check AFTER it', async () => {
      const h = buildHarness();

      await h.service.generate({ user, challengeId: CHALLENGE_ID });

      // Readable form: the exact sequence, in order.
      expect(h.order).toEqual(['SAFETY_PRE', 'ENGINE', 'SAFETY_POST']);
    });

    it('proves the ordering against Jest\'s own invocation counter, not just a log', async () => {
      const h = buildHarness();

      await h.service.generate({ user, challengeId: CHALLENGE_ID });

      const pre = h.preSpy.mock.invocationCallOrder[0];
      const model = h.engine.generate.mock.invocationCallOrder[0];
      const post = h.postSpy.mock.invocationCallOrder[0];

      expect(pre).toBeLessThan(model);
      expect(model).toBeLessThan(post);
    });

    it('never reaches the model when the pre-check blocks', async () => {
      // The negative case is the one that matters. Step 19 section 50: the
      // pre-check exists to change the execution path, which it can only do if
      // there is still a path left to change.
      const h = buildHarness({
        projection: projection({
          safetyText: 'I do not want to live anymore, there is no point',
        }),
      });

      await expect(
        h.service.generate({ user, challengeId: CHALLENGE_ID }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

      expect(h.engine.generate).not.toHaveBeenCalled();
      expect(h.order).toEqual(['SAFETY_PRE']);
    });

    it('records a decision, an incident and an escalation event when it blocks', async () => {
      const h = buildHarness({
        projection: projection({
          safetyText: 'I am thinking about killing myself',
        }),
      });

      await expect(
        h.service.generate({ user, challengeId: CHALLENGE_ID }),
      ).rejects.toBeInstanceOf(ZunoException);

      expect(h.outbox.enqueue).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'zuno.safety.critical_escalation',
        }),
      );
    });

    it('refuses to persist when the post-check finds a violation', async () => {
      // "disaster" trips SafetyService's fear-amplification check but not the
      // possibility-language guard, so this exercises the post-check itself
      // rather than the earlier layer.
      const h = buildHarness({
        engineResult: generationResult([
          candidate({
            summary:
              'If the role is removed, this would be a disaster for the household.',
          }),
        ]),
      });

      await expect(
        h.service.generate({ user, challengeId: CHALLENGE_ID }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

      // The model still ran - the post-check can only judge text that exists.
      expect(h.order).toEqual(['SAFETY_PRE', 'ENGINE', 'SAFETY_POST']);
    });
  });

  describe('the no-deterministic-claim boundary (Step 12 Rules 1-2)', () => {
    it('drops a scenario that asserts a determined outcome and keeps the rest', async () => {
      const h = buildHarness({
        engineResult: generationResult([
          candidate({ title: 'Stay in the current role' }),
          candidate({
            title: 'Transition out',
            summary: 'You will lose your job in November.',
            scenario_type: ScenarioType.TRANSITION,
          }),
          candidate({
            title: 'External opportunity arrives first',
            summary: 'Another role becomes available before a forced transition.',
            scenario_type: ScenarioType.OPPORTUNITY,
          }),
        ]),
      });

      const { scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      expect(scenarios.map((row) => row.name)).toEqual([
        'Stay in the current role',
        'External opportunity arrives first',
      ]);
      expect(
        scenarios.some((row) => row.description.includes('You will lose')),
      ).toBe(false);
    });

    it('fails honestly rather than shipping a set when every path asserts an outcome', async () => {
      // Build Rule 128: no fabricated success. Producing nothing is recoverable;
      // telling someone their job will end is not.
      const h = buildHarness({
        engineResult: generationResult([
          candidate({ summary: 'You will lose your job in November.' }),
          candidate({
            title: 'Transition out',
            summary: 'Your employment will end, it is inevitable.',
            scenario_type: ScenarioType.TRANSITION,
          }),
        ]),
      });

      await expect(
        h.service.generate({ user, challengeId: CHALLENGE_ID }),
      ).rejects.toMatchObject({
        code: ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE,
      });
    });

    it('stores a qualitative attention label and never a number', async () => {
      const h = buildHarness({
        engineResult: generationResult([
          candidate({ relevance: ScenarioRelevance.HIGH }),
          candidate({
            title: 'Transition out',
            summary: 'Current employment ends.',
            scenario_type: ScenarioType.TRANSITION,
            relevance: ScenarioRelevance.CONTINGENCY,
          }),
        ]),
      });

      const { scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      const labels = scenarios.map((row) => row.probability_label);
      expect(labels).toEqual(['PRIMARY', 'CONTINGENCY']);
      // Step 12 sections 16 and 97: no digit may ever appear here.
      expect(labels.every((label) => !/\d/.test(label ?? ''))).toBe(true);
    });
  });

  describe('deterministic shaping (Step 12 sections 5, 14, 51, 52)', () => {
    it('removes a scenario supported only by system inference', async () => {
      // Step 12 section 14 and Rule 3: nothing rests entirely on inference.
      const h = buildHarness({
        engineResult: generationResult([
          candidate(),
          candidate({
            title: 'Sudden windfall',
            summary: 'An unexpected inheritance changes the picture.',
            scenario_type: ScenarioType.OPPORTUNITY,
            basis: [
              { type: ScenarioEvidenceClass.SYSTEM_INFERENCE, reference: 'a hunch' },
            ],
          }),
          candidate({
            title: 'No basis at all',
            summary: 'Something else happens entirely.',
            scenario_type: ScenarioType.CHANGE,
            basis: [],
          }),
        ]),
      });

      const { scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      expect(scenarios).toHaveLength(1);
      expect(scenarios[0].name).toBe('Stay in the current role');
    });

    it('merges rewordings of the same path (Step 12 sections 52 and 104)', async () => {
      // The specification's own example: "Stay employed", "Remain in current
      // job" and "Continue working" are one scenario, not three.
      const h = buildHarness({
        engineResult: generationResult([
          candidate({
            title: 'Stay employed',
            summary: 'Employment continues without material change.',
          }),
          candidate({
            title: 'Stay employed currently',
            summary: 'Employment continues without any material change.',
          }),
          candidate({
            title: 'Transition out',
            summary: 'Current employment ends.',
            scenario_type: ScenarioType.TRANSITION,
          }),
        ]),
      });

      const { scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      expect(scenarios).toHaveLength(2);
      expect(scenarios.map((row) => row.name)).toEqual([
        'Stay employed',
        'Transition out',
      ]);
    });

    it('keeps materially different paths apart even when they share words', async () => {
      const h = buildHarness({
        engineResult: generationResult([
          candidate({ title: 'Role continues', summary: 'The role continues unchanged.' }),
          candidate({
            title: 'Role changes internally',
            summary: 'The role is restructured into something different.',
            scenario_type: ScenarioType.CHANGE,
          }),
        ]),
      });

      const { scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });
      expect(scenarios).toHaveLength(2);
    });

    it('caps the user-facing set at four without discarding the rest', async () => {
      // Step 12 section 5 caps the primary journey; section 54 keeps the extras
      // available for "show me more possibilities".
      const h = buildHarness({
        engineResult: generationResult(
          Array.from({ length: 6 }, (_, i) =>
            candidate({
              title: `Distinct path number ${i}`,
              summary: `A materially separate future labelled ${i} with its own shape.`,
              scenario_type: [
                ScenarioType.CONTINUITY,
                ScenarioType.CHANGE,
                ScenarioType.TRANSITION,
                ScenarioType.RECOVERY,
                ScenarioType.OPPORTUNITY,
                ScenarioType.DECISION,
              ][i],
            }),
          ),
        ),
      });

      const { set, scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      expect(scenarios).toHaveLength(6);
      expect(scenarios.filter((row) => row.user_facing)).toHaveLength(
        SCENARIO_MAX_USER_FACING,
      );
      expect(set.user_facing_count).toBe(SCENARIO_MAX_USER_FACING);
    });

    it('drops a low-confidence, low-impact path (Step 12 section 51)', async () => {
      const h = buildHarness({
        engineResult: generationResult([
          candidate(),
          candidate({
            title: 'A vague minor change',
            summary: 'Some small adjustment might occur somewhere.',
            scenario_type: ScenarioType.CHANGE,
            confidence: 0.2,
            impact: ScenarioImpact.LOW,
          }),
        ]),
      });

      const { scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });
      expect(scenarios).toHaveLength(1);
    });

    it('keeps a low-confidence, critical-impact path as a CONTINGENCY', async () => {
      // Step 12 sections 32 and 51: not the likely path, too important to
      // ignore. This is how ZUNO prepares without predicting.
      const h = buildHarness({
        engineResult: generationResult([
          candidate(),
          candidate({
            title: 'Transition out',
            summary: 'Current employment ends.',
            scenario_type: ScenarioType.TRANSITION,
            confidence: 0.25,
            impact: ScenarioImpact.CRITICAL,
            relevance: ScenarioRelevance.LOW,
          }),
        ]),
      });

      const { scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      const transition = scenarios.find((row) => row.name === 'Transition out');
      expect(transition).toBeDefined();
      expect(transition!.relevance).toBe(ScenarioRelevance.CONTINGENCY);
      expect(transition!.probability_label).toBe('CONTINGENCY');
    });

    it('derives shared preparation from actions that recur across paths', async () => {
      // Step 12 sections 24-25: an action that helps in several futures IS
      // shared preparation whether or not the model labelled it so.
      const h = buildHarness({
        engineResult: generationResult(
          [
            candidate({
              scenario_specific_preparation: [
                { action: 'Refresh the CV', classification: PreparationClass.SCENARIO_SPECIFIC },
                { action: 'Increase internal visibility', classification: PreparationClass.SCENARIO_SPECIFIC },
              ],
            }),
            candidate({
              title: 'Transition out',
              summary: 'Current employment ends.',
              scenario_type: ScenarioType.TRANSITION,
              scenario_specific_preparation: [
                { action: 'Refresh the CV', classification: PreparationClass.SCENARIO_SPECIFIC },
                { action: 'Understand the settlement terms', classification: PreparationClass.SCENARIO_SPECIFIC },
              ],
            }),
          ],
          { shared_preparation: [] },
        ),
      });

      const { set } = await h.service.generate({ user, challengeId: CHALLENGE_ID });

      expect(set.shared_preparation.map((prep) => prep.action)).toEqual([
        'Refresh the CV',
      ]);
      expect(set.shared_preparation[0].classification).toBe(
        PreparationClass.COMMON,
      );
    });

    it('never marks a generated scenario hypothetical (Step 20 Rule 4)', async () => {
      const h = buildHarness();
      const { scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });
      expect(scenarios.every((row) => row.hypothetical === false)).toBe(true);
    });
  });

  describe('graceful behaviour with no active rulebook (Step 20 section 125)', () => {
    it('still produces a scenario set, marked as carrying no astrology', async () => {
      // RulebookRepositoryService returns nothing today. Step 21 section 117:
      // an unavailable part must not make the rest useless.
      const h = buildHarness({ astro: null });

      const { set, scenarios } = await h.service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      expect(scenarios.length).toBeGreaterThan(0);
      expect(set.provenance.astro_available).toBe(false);
      expect(set.provenance.rulebook_version_id).toBeNull();
    });

    it('passes a null astro context to the engine rather than an empty one', async () => {
      // Step 12 section 100: an empty theme set would read as "astrology found
      // nothing", which is a fabrication. Absent must mean absent.
      const h = buildHarness({ astro: null });
      await h.service.generate({ user, challengeId: CHALLENGE_ID });

      expect(h.engine.generate).toHaveBeenCalledWith(
        expect.objectContaining({ astro: null }),
      );
    });

    it('records the rulebook version on the set when one is active', async () => {
      const h = buildHarness({
        astro: {
          supportive_themes: ['RECOVERY_SUPPORT'],
          caution_themes: ['VOLATILITY'],
          timing_windows: [],
          rule_keys: ['ASTRO-CAREER-001'],
          rulebook_version_id: 'rb-1',
        },
      });

      const { set } = await h.service.generate({ user, challengeId: CHALLENGE_ID });
      expect(set.provenance.astro_available).toBe(true);
      expect(set.provenance.rulebook_version_id).toBe('rb-1');
    });
  });

  describe('provenance and versioning (Step 12 sections 65, 87-88)', () => {
    it('records the context, engine and prompt versions on the set', async () => {
      const h = buildHarness();
      const { set } = await h.service.generate({ user, challengeId: CHALLENGE_ID });

      expect(set.provenance).toMatchObject({
        challenge_context_version: 2,
        scenario_engine_version: 'test-scenario-engine-1.0.0',
        prompt_version: 'test-prompt-1.0.0',
      });
      expect(set.version_number).toBe(1);
      expect(set.ai_generation_run_id).toBe('run-1');
    });

    it('emits a scenario-set-generated event on the challenge aggregate', async () => {
      const h = buildHarness();
      await h.service.generate({ user, challengeId: CHALLENGE_ID });

      expect(h.outbox.enqueue).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'zuno.scenario.set_generated',
          aggregateId: CHALLENGE_ID,
        }),
      );
    });

    it('marks every new scenario as ADDED in the diff when there is no previous set', async () => {
      const h = buildHarness();
      const { set } = await h.service.generate({ user, challengeId: CHALLENGE_ID });
      expect(set.diff).toEqual([
        { scenario_title: 'Stay in the current role', change: 'ADDED' },
      ]);
    });
  });

  describe('ownership (Step 21 section 106, Golden Contract Test 125)', () => {
    it('masks another user\'s scenario as NOT_FOUND rather than FORBIDDEN', async () => {
      const h = buildHarness();
      h.scenarioRepo.findOne.mockResolvedValue({
        id: 'scenario-1',
        user_id: OTHER_USER_ID,
        status: ScenarioStatus.ACTIVE_CANDIDATE,
        version: 1,
      });

      await expect(
        h.service.findOwnedScenario(USER_ID, 'scenario-1'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
    });

    it('refuses a decision on a scenario the caller does not own', async () => {
      const h = buildHarness();
      h.scenarioRepo.findOne.mockResolvedValue({
        id: 'scenario-1',
        user_id: OTHER_USER_ID,
        status: ScenarioStatus.ACTIVE_CANDIDATE,
        version: 1,
      });

      await expect(
        h.service.decide(
          user,
          'scenario-1',
          ScenarioStatus.USER_REJECTED,
          undefined,
          undefined,
        ),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
    });

    it('returns NOT_FOUND when the scenario does not exist at all', async () => {
      const h = buildHarness();
      h.scenarioRepo.findOne.mockResolvedValue(null);

      await expect(
        h.service.findOwnedScenario(USER_ID, 'missing'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
    });

    it('rejects a stale version with 409 rather than overwriting', async () => {
      const h = buildHarness();
      h.scenarioRepo.findOne.mockResolvedValue({
        id: 'scenario-1',
        user_id: USER_ID,
        challenge_id: CHALLENGE_ID,
        status: ScenarioStatus.ACTIVE_CANDIDATE,
        version: 5,
      });

      await expect(
        h.service.decide(user, 'scenario-1', ScenarioStatus.USER_REJECTED, undefined, 4),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
    });
  });

  describe('user decisions (Step 12 sections 68-69, Rule 9)', () => {
    it('records a rejection and stops surfacing the path', async () => {
      const h = buildHarness();
      h.scenarioRepo.findOne.mockResolvedValue({
        id: 'scenario-1',
        user_id: USER_ID,
        challenge_id: CHALLENGE_ID,
        status: ScenarioStatus.ACTIVE_CANDIDATE,
        user_facing: true,
        version: 1,
      });

      const saved = await h.service.decide(
        user,
        'scenario-1',
        ScenarioStatus.USER_REJECTED,
        'I will not start a business.',
        undefined,
      );

      expect(saved.status).toBe(ScenarioStatus.USER_REJECTED);
      expect(saved.user_facing).toBe(false);
      expect(saved.user_decision_note).toBe('I will not start a business.');
    });

    it('refuses an illegal lifecycle move (Build Rule 179)', async () => {
      const h = buildHarness();
      h.scenarioRepo.findOne.mockResolvedValue({
        id: 'scenario-1',
        user_id: USER_ID,
        challenge_id: CHALLENGE_ID,
        // Step 12 section 23: a triggered scenario is reality and is not walked
        // back into candidacy.
        status: ScenarioStatus.ARCHIVED,
        version: 1,
      });

      await expect(
        h.service.decide(user, 'scenario-1', ScenarioStatus.USER_ADOPTED, undefined, undefined),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
    });

    it('promotes a scenario into reality and hands it to the signal flow', async () => {
      // Step 12 sections 22-23, Rule 7: once confirmed it stops being a
      // scenario. This service records and emits; it does not decide what
      // changes next.
      const h = buildHarness();
      h.scenarioRepo.findOne.mockResolvedValue({
        id: 'scenario-1',
        user_id: USER_ID,
        challenge_id: CHALLENGE_ID,
        status: ScenarioStatus.INCREASING,
        version: 1,
      });

      const saved = await h.service.markTriggered(
        user,
        'scenario-1',
        'Termination notice received today.',
        undefined,
      );

      expect(saved.status).toBe(ScenarioStatus.TRIGGERED);
      expect(saved.triggered_at).toEqual(new Date('2026-09-17T00:00:00Z'));
      expect(h.outbox.enqueue).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'zuno.scenario.triggered',
          payload: expect.objectContaining({ became_reality: true }),
        }),
      );
    });

    it('feeds rejected paths back into the next generation', async () => {
      // Step 12 section 105: do not keep surfacing a path the user ruled out.
      const h = buildHarness();
      h.scenarioRepo.find.mockResolvedValue([{ name: 'Start a business' }]);

      await h.service.generate({ user, challengeId: CHALLENGE_ID });

      expect(h.engine.generate).toHaveBeenCalledWith(
        expect.objectContaining({ rejected_paths: ['Start a business'] }),
      );
    });
  });
});
