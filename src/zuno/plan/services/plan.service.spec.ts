import { PlanService } from './plan.service';
import { MkaService } from '../../mka/services/mka.service';
import {
  FakeEntityManager,
  FakeRepository,
  fakeDataSource,
  fakeRulebook,
  fixedClock,
  realAudit,
  realOutbox,
  realOwnership,
  realSafety,
} from '../../mka/services/mka-plan.test-harness';

import { ZunoPlan } from '../entities/zuno-plan.entity';
import { ZunoPlanItem } from '../entities/zuno-plan-item.entity';
import { ZunoPlanItemEvent } from '../entities/zuno-plan-item-event.entity';
import { ZunoMkaProgram } from '../../mka/entities/zuno-mka-program.entity';
import { ZunoMkaItem } from '../../mka/entities/zuno-mka-item.entity';
import { ZunoMkaCompletion } from '../../mka/entities/zuno-mka-completion.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../../challenges/entities/zuno-challenge-context.entity';
import { ZunoResponse } from '../../responses/entities/zuno-response.entity';
import { ZunoEventOutbox } from '../../common/entities/zuno-event-outbox.entity';
import { ZunoAuditEvent } from '../../common/entities/zuno-audit-event.entity';
import { ZunoSafetyDecision } from '../../safety/entities/zuno-safety-decision.entity';
import { ZunoSafetyIncident } from '../../safety/entities/zuno-safety-incident.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';

import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import {
  ChallengeStatus,
  EmotionalIntensity,
  ZunoDomain,
} from '../../common/enums';
import {
  PLAN_ITEM_STATUS_TRANSITIONS,
  PlanItemPriority,
  PlanItemStatus,
  PlanStatus,
  PlanType,
} from '../enums/plan.enum';
import { planCapacityFor } from '../enums/plan-capacity';
import { MkaPlanEventType } from '../../mka/enums/mka-plan-event.enum';

/**
 * Plan engine tests.
 *
 * The three rules under test are the ones a future refactor is most likely to
 * quietly break:
 *
 *   CAPACITY   Step 16 section 27. A plan that grows past the ceiling looks
 *              fine in code review and wrong on a phone at 7am.
 *   LIFECYCLE  Step 16 sections 17, 47 and 109, Golden Test 100. Every illegal
 *              move is asserted, not a sample of them.
 *   OWNERSHIP  Step 20 section 85, Step 21 Golden Contract Test 125.
 */
describe('PlanService', () => {
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
  const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';

  let plans: FakeRepository;
  let items: FakeRepository;
  let itemEvents: FakeRepository;
  let challenges: FakeRepository;
  let mkaPrograms: FakeRepository;
  let mkaItems: FakeRepository;
  let contexts: FakeRepository;
  let outboxRows: FakeRepository;
  let service: PlanService;

  const user = { id: USER_ID, timezone: 'Asia/Dubai' } as ZunoUser;

  beforeEach(() => {
    delete process.env.ZUNO_PLAN_CAPACITY_JSON;
    build();
  });

  afterEach(() => {
    delete process.env.ZUNO_PLAN_CAPACITY_JSON;
  });

  function build(): void {
    plans = new FakeRepository();
    items = new FakeRepository();
    itemEvents = new FakeRepository();
    challenges = new FakeRepository();
    mkaPrograms = new FakeRepository();
    mkaItems = new FakeRepository();
    contexts = new FakeRepository();
    outboxRows = new FakeRepository();
    const mkaCompletions = new FakeRepository();
    const responses = new FakeRepository();

    const registry = new Map<unknown, FakeRepository>([
      [ZunoPlan, plans],
      [ZunoPlanItem, items],
      [ZunoPlanItemEvent, itemEvents],
      [ZunoChallenge, challenges],
      [ZunoMkaProgram, mkaPrograms],
      [ZunoMkaItem, mkaItems],
      [ZunoMkaCompletion, mkaCompletions],
      [ZunoChallengeContext, contexts],
      [ZunoResponse, responses],
      [ZunoEventOutbox, outboxRows],
      [ZunoAuditEvent, new FakeRepository()],
      [ZunoSafetyDecision, new FakeRepository()],
      [ZunoSafetyIncident, new FakeRepository()],
    ]);
    const manager = new FakeEntityManager(registry);
    const dataSource = fakeDataSource(manager);

    // The real MKA service, not a mock: a plan built on a mocked MKA would not
    // prove that capacity is applied to what the MKA engine actually produces.
    const mka = new MkaService(
      mkaPrograms.asRepository(),
      mkaItems.asRepository(),
      mkaCompletions.asRepository(),
      challenges.asRepository(),
      contexts.asRepository(),
      responses.asRepository(),
      fakeRulebook({ active: null }),
      realSafety(),
      realOutbox(),
      realAudit(),
      realOwnership(),
      fixedClock(),
      dataSource,
    );

    service = new PlanService(
      plans.asRepository(),
      items.asRepository(),
      itemEvents.asRepository(),
      challenges.asRepository(),
      mka,
      realSafety(),
      realOutbox(),
      realAudit(),
      realOwnership(),
      fixedClock(),
      dataSource,
    );
  }

  function seedChallenge(overrides: Record<string, unknown> = {}): void {
    challenges.rows.push({
      id: CHALLENGE_ID,
      user_id: USER_ID,
      title: 'Career and financial resilience',
      raw_user_statement:
        'There have been layoffs at my company and I have a home loan to think about.',
      primary_domain: ZunoDomain.CAREER,
      status: ChallengeStatus.ACTIVE,
      emotional_intensity: EmotionalIntensity.HIGH,
      context_version: 1,
      deleted_at: null,
      version: 1,
      ...overrides,
    });
  }

  /** Seeds a challenge context with `count` controllable practical actions. */
  function seedContext(count: number): void {
    contexts.rows.push({
      id: 'ctx-1',
      challenge_id: CHALLENGE_ID,
      user_id: USER_ID,
      version_number: 1,
      summary: 'Career uncertainty with financial exposure.',
      payload: {
        summary: 'Career uncertainty with financial exposure.',
        items: [],
        dependencies: [],
        desired_outcomes: [],
        decisions: [],
        factors: {
          controllable: Array.from(
            { length: count },
            (_, index) => `Practical step ${index + 1}`,
          ),
          external: [],
        },
        temporal_anchors: [],
        missing_information: [],
        emotional_signals: [],
        subthemes: [],
      },
    });
  }

  /**
   * Bypasses MKA generation so a test can put an arbitrary number of
   * candidates in front of the capacity rule. The MKA engine caps itself at
   * three actions (Step 15 section 26), which is below every plan ceiling -
   * useful in production, useless for testing the WEEKLY ceiling of seven.
   */
  function seedMkaProgram(
    actionCount: number,
    options: { essentials?: number; practices?: boolean } = {},
  ): void {
    const programId = 'mka-prog-1';
    mkaPrograms.rows.push({
      id: programId,
      user_id: USER_ID,
      challenge_id: CHALLENGE_ID,
      status: 'ACTIVE',
      plan_id: null,
      deleted_at: null,
      version: 1,
    });

    const essentials = options.essentials ?? actionCount;
    for (let index = 0; index < actionCount; index += 1) {
      mkaItems.rows.push({
        id: `mka-action-${index}`,
        mka_program_id: programId,
        user_id: USER_ID,
        dimension: 'ACTION',
        title: `Practical step ${index + 1}`,
        description: 'Something concrete and useful.',
        purpose: 'Move the situation forward.',
        priority: index < essentials ? 'ESSENTIAL' : 'IMPORTANT',
        duration_minutes: 30,
        plan_eligible: true,
        karma_eligible: true,
        status: 'ACTIVE',
        display_order: index,
        deleted_at: null,
      });
    }

    if (options.practices !== false) {
      mkaItems.rows.push(
        {
          id: 'mka-mind-1',
          mka_program_id: programId,
          user_id: USER_ID,
          dimension: 'MIND',
          title: 'Stay with facts, not fear',
          description: 'Five quiet minutes each morning.',
          purpose: 'Start the day from facts.',
          priority: 'ESSENTIAL',
          duration_minutes: 5,
          plan_eligible: true,
          karma_eligible: false,
          status: 'ACTIVE',
          display_order: 100,
          deleted_at: null,
        },
        {
          id: 'mka-karma-1',
          mka_program_id: programId,
          user_id: USER_ID,
          dimension: 'KARMA',
          title: 'One small commitment, kept',
          description: 'The same small thing, daily.',
          purpose: 'Something steady and within your control.',
          priority: 'IMPORTANT',
          duration_minutes: 10,
          plan_eligible: true,
          karma_eligible: true,
          status: 'ACTIVE',
          display_order: 101,
          deleted_at: null,
        },
      );
    }
  }

  const activeItems = () =>
    items.rows.filter((row) => row.status === PlanItemStatus.PENDING);

  // -------------------------------------------------------------------------
  // CAPACITY - Step 16 section 27
  // -------------------------------------------------------------------------
  describe('plan capacity', () => {
    it('caps a TODAY plan at three meaningful actions', async () => {
      seedChallenge();
      seedMkaProgram(8);

      await service.generate({ user, challengeId: CHALLENGE_ID, planType: PlanType.TODAY });

      const actions = activeItems().filter((row) => !row.is_practice);
      expect(actions).toHaveLength(planCapacityFor(PlanType.TODAY).maxActions);
      expect(actions).toHaveLength(3);
    });

    it('caps a WEEKLY plan at seven meaningful actions', async () => {
      seedChallenge();
      seedMkaProgram(15);

      await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.WEEKLY,
      });

      const actions = activeItems().filter((row) => !row.is_practice);
      expect(actions).toHaveLength(7);
    });

    it('defers the overflow rather than discarding it', async () => {
      // Step 16 sections 54-55: unfinished work is reassessed, not deleted.
      seedChallenge();
      seedMkaProgram(8);

      await service.generate({ user, challengeId: CHALLENGE_ID, planType: PlanType.TODAY });

      const deferred = items.rows.filter(
        (row) => row.status === PlanItemStatus.DEFERRED,
      );
      expect(deferred.length).toBe(5);
      // And the reason is recorded, so a reader does not mistake it for the
      // user's own deferral.
      const events = itemEvents.rows.filter(
        (row) => row.event_type === 'CAPACITY_DEFERRED',
      );
      expect(events.length).toBe(5);
    });

    it('lets MKA practices sit alongside the action budget', async () => {
      // Step 16 sections 27 and 41: a 5-minute grounding practice must not
      // consume one of the three action slots.
      seedChallenge();
      seedMkaProgram(3);

      await service.generate({ user, challengeId: CHALLENGE_ID, planType: PlanType.TODAY });

      const active = activeItems();
      expect(active.filter((row) => !row.is_practice)).toHaveLength(3);
      expect(active.filter((row) => row.is_practice)).toHaveLength(2);
      expect(active).toHaveLength(5);
    });

    it('caps practices separately, and defers the surplus', async () => {
      seedChallenge();
      seedMkaProgram(0, { practices: true });
      // A third practice, beyond the TODAY ceiling of two.
      mkaItems.rows.push({
        id: 'mka-mind-2',
        mka_program_id: 'mka-prog-1',
        user_id: USER_ID,
        dimension: 'MIND',
        title: 'Close the day honestly',
        description: 'One line at the end of the day.',
        purpose: 'Keep a clear view of progress.',
        priority: 'OPTIONAL',
        duration_minutes: 3,
        plan_eligible: true,
        karma_eligible: false,
        status: 'ACTIVE',
        display_order: 102,
        deleted_at: null,
      });

      await service.generate({ user, challengeId: CHALLENGE_ID, planType: PlanType.TODAY });

      expect(activeItems().filter((row) => row.is_practice)).toHaveLength(2);
      expect(
        items.rows.filter((row) => row.status === PlanItemStatus.DEFERRED),
      ).toHaveLength(1);
    });

    it('admits only one ESSENTIAL action and demotes the rest', async () => {
      // Step 16 section 15: essential means essential. The surplus keeps its
      // place in the plan but loses the emphasis.
      seedChallenge();
      seedMkaProgram(3, { essentials: 3, practices: false });

      await service.generate({ user, challengeId: CHALLENGE_ID, planType: PlanType.TODAY });

      const active = activeItems();
      const essentials = active.filter(
        (row) => row.priority === PlanItemPriority.ESSENTIAL,
      );
      expect(essentials).toHaveLength(1);
      expect(active).toHaveLength(3);
      expect(
        active.filter((row) => row.priority === PlanItemPriority.IMPORTANT),
      ).toHaveLength(2);
      // The rank column must agree with the label (enforced by a CHECK
      // constraint in the migration, asserted here at the service boundary).
      for (const row of active) {
        expect(row.priority_rank).toBe(
          row.priority === PlanItemPriority.ESSENTIAL ? 1 : 2,
        );
      }
    });

    it('honours the configurable override', async () => {
      // Step 16 section 27: "exact limits should be configurable".
      process.env.ZUNO_PLAN_CAPACITY_JSON = JSON.stringify({
        TODAY: { maxActions: 1, maxPractices: 0 },
      });
      seedChallenge();
      seedMkaProgram(5);

      await service.generate({ user, challengeId: CHALLENGE_ID, planType: PlanType.TODAY });

      const active = activeItems();
      expect(active.filter((row) => !row.is_practice)).toHaveLength(1);
      expect(active.filter((row) => row.is_practice)).toHaveLength(0);
    });

    it('ignores a nonsensical override rather than emptying the plan', async () => {
      process.env.ZUNO_PLAN_CAPACITY_JSON = JSON.stringify({
        TODAY: { maxActions: 0 },
      });
      expect(planCapacityFor(PlanType.TODAY).maxActions).toBe(3);
    });

    it('refuses a user-added task when the plan is already full', async () => {
      // Step 16 sections 56-58: ZUNO must not silently delete the user's own
      // work, so it refuses loudly instead of quietly over-filling the plan.
      seedChallenge();
      seedMkaProgram(5);
      const { plan } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });

      await expect(
        service.addItem(user, plan.id, { title: 'Call the bank' }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
    });

    it('accepts a user-added task when there is room', async () => {
      seedChallenge();
      seedMkaProgram(1, { practices: false });
      const { plan } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });

      const added = await service.addItem(user, plan.id, {
        title: 'Call the bank tomorrow',
        isCommitment: true,
      });

      expect(added.source_type).toBe('USER_COMMITMENT');
      expect(added.status).toBe(PlanItemStatus.PENDING);
    });

    it('refuses to activate a plan that is over capacity', async () => {
      seedChallenge();
      seedMkaProgram(2, { practices: false });
      const { plan } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });

      // Tighten the configuration after the plan was built - the situation an
      // activation check exists for (Step 16 section 85).
      process.env.ZUNO_PLAN_CAPACITY_JSON = JSON.stringify({
        TODAY: { maxActions: 1 },
      });

      await expect(
        service.activate(user, plan.id),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
    });

    it('activates a plan that fits', async () => {
      seedChallenge();
      seedMkaProgram(2, { practices: false });
      const { plan } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });

      const activated = await service.activate(user, plan.id);
      expect(activated.status).toBe(PlanStatus.ACTIVE);
      expect(activated.activated_at).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // ACTION LIFECYCLE - every illegal transition
  // -------------------------------------------------------------------------
  describe('action lifecycle', () => {
    const allStatuses = Object.values(PlanItemStatus);

    /**
     * Exhaustive, not a sample. Every ordered pair of distinct statuses that is
     * NOT in `PLAN_ITEM_STATUS_TRANSITIONS` must raise a ZUNO exception. That is
     * 132 pairs minus the legal ones, and it is the only way to be sure a later
     * edit to the map cannot open a hole nobody notices.
     */
    const illegalPairs: [PlanItemStatus, PlanItemStatus][] = [];
    for (const from of allStatuses) {
      for (const to of allStatuses) {
        if (from === to) continue;
        if (!PLAN_ITEM_STATUS_TRANSITIONS[from].includes(to)) {
          illegalPairs.push([from, to]);
        }
      }
    }

    it('has illegal transitions to test', () => {
      expect(illegalPairs.length).toBeGreaterThan(0);
    });

    it.each(illegalPairs)('refuses %s -> %s', (from, to) => {
      expect(() => service.assertTransition(from, to)).toThrow(ZunoException);
      try {
        service.assertTransition(from, to);
      } catch (error) {
        expect((error as ZunoException).code).toBe(ZunoErrorCode.CONFLICT);
      }
    });

    it('never silently passes an illegal transition', () => {
      // The failure mode this guards against is a no-op returning the old
      // status, which would read as success at every call site.
      expect(() =>
        service.assertTransition(PlanItemStatus.DONE, PlanItemStatus.PENDING),
      ).toThrow(ZunoException);
    });

    it('keeps completed work safe from a realignment', () => {
      // Step 16 Rule 6 and section 109.
      expect(() =>
        service.assertTransition(
          PlanItemStatus.DONE,
          PlanItemStatus.CANCELLED_BY_REALIGNMENT,
        ),
      ).toThrow(ZunoException);
    });

    it('never lets a realignment cancellation become a missed task', () => {
      // Golden Test 100 and Rule 5.
      expect(() =>
        service.assertTransition(
          PlanItemStatus.CANCELLED_BY_REALIGNMENT,
          PlanItemStatus.MISSED,
        ),
      ).toThrow(ZunoException);
    });

    it('will not complete a dormant conditional action', () => {
      // Step 16 section 24: it has to be activated by a confirmed trigger
      // first.
      expect(() =>
        service.assertTransition(PlanItemStatus.CONDITIONAL, PlanItemStatus.DONE),
      ).toThrow(ZunoException);
    });

    it.each([
      [PlanItemStatus.PENDING, PlanItemStatus.IN_PROGRESS],
      [PlanItemStatus.PENDING, PlanItemStatus.DONE],
      [PlanItemStatus.IN_PROGRESS, PlanItemStatus.DONE],
      [PlanItemStatus.MISSED, PlanItemStatus.PENDING],
      [PlanItemStatus.SKIPPED, PlanItemStatus.PENDING],
      [PlanItemStatus.BLOCKED, PlanItemStatus.DONE],
      [PlanItemStatus.CONDITIONAL, PlanItemStatus.PENDING],
    ])('allows %s -> %s', (from, to) => {
      expect(service.assertTransition(from, to)).toBe(to);
    });

    it('rejects an illegal transition end to end, leaving the row untouched', async () => {
      seedChallenge();
      seedMkaProgram(1, { practices: false });
      const { plan, items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });
      await service.activate(user, plan.id);
      const item = created[0];
      await service.completeItem(user, item.id);

      await expect(
        service.deferItem(user, item.id),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });

      expect(items.rows.find((row) => row.id === item.id).status).toBe(
        PlanItemStatus.DONE,
      );
    });

    it('writes an immutable event row for every status change', async () => {
      // Step 20 section 43.
      seedChallenge();
      seedMkaProgram(1, { practices: false });
      const { plan, items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });
      await service.activate(user, plan.id);
      const item = created[0];

      await service.startItem(user, item.id);
      await service.completeItem(user, item.id);

      const history = itemEvents.rows.filter(
        (row) => row.plan_item_id === item.id,
      );
      expect(history.map((row) => row.new_status)).toEqual([
        PlanItemStatus.PENDING,
        PlanItemStatus.IN_PROGRESS,
        PlanItemStatus.DONE,
      ]);
    });

    it('emits the completion event the Karma Ledger consumes', async () => {
      seedChallenge();
      seedMkaProgram(1, { practices: false });
      const { plan, items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });
      await service.activate(user, plan.id);
      outboxRows.rows.length = 0;

      await service.completeItem(user, created[0].id);

      const event = outboxRows.rows.find(
        (row) => row.event_type === MkaPlanEventType.PLAN_ITEM_COMPLETED,
      );
      expect(event).toBeDefined();
      expect(event.payload.karma_eligible).toBe(true);
      expect(event.payload.plan_item_id).toBe(created[0].id);
      // Build Rule 113: ids and flags only, never content.
      expect(event.payload.title).toBeUndefined();
    });

    it('emits no event for a missed task', async () => {
      // Step 16 section 18 and Build Rule 64: there is no consumer that should
      // be reacting to a missed task, and publishing would invite one.
      seedChallenge();
      seedMkaProgram(1, { practices: false });
      const { plan, items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });
      await service.activate(user, plan.id);
      outboxRows.rows.length = 0;

      await service.transitionItem({
        user,
        itemId: created[0].id,
        to: PlanItemStatus.MISSED,
      });

      expect(outboxRows.rows).toHaveLength(0);
      // But it is still in the item's own history.
      expect(
        itemEvents.rows.some((row) => row.new_status === PlanItemStatus.MISSED),
      ).toBe(true);
    });

    it('asks for a plan-fit review after repeated deferral, not a nudge', async () => {
      // Step 16 section 80 and Rule 8.
      seedChallenge();
      seedMkaProgram(1, { practices: false });
      const { plan, items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });
      await service.activate(user, plan.id);
      const item = created[0];

      for (let round = 0; round < 3; round += 1) {
        await service.deferItem(user, item.id);
        await service.transitionItem({
          user,
          itemId: item.id,
          to: PlanItemStatus.PENDING,
        });
      }

      expect(
        outboxRows.rows.some(
          (row) => row.event_type === MkaPlanEventType.PLAN_FIT_REVIEW,
        ),
      ).toBe(true);
    });

    it('will not start an item whose dependency is unfinished', async () => {
      // Step 16 sections 31-32.
      seedChallenge();
      seedMkaProgram(2, { practices: false });
      const { plan, items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });
      await service.activate(user, plan.id);

      const [first, second] = created;
      items.rows.find((row) => row.id === second.id).depends_on_item_ids = [
        first.id,
      ];

      await expect(
        service.startItem(user, second.id),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });

      await service.completeItem(user, first.id);
      const started = await service.startItem(user, second.id);
      expect(started.status).toBe(PlanItemStatus.IN_PROGRESS);
    });

    it('will not accept progress against a superseded plan', async () => {
      // Build Rule 46.
      seedChallenge();
      seedMkaProgram(1, { practices: false });
      const first = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });
      const item = first.items[0];
      await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
        regenerate: true,
      });

      await expect(
        service.completeItem(user, item.id),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
    });

    it('cancels open items on supersede without marking them missed', async () => {
      // Step 16 section 47 and Golden Test 100.
      seedChallenge();
      seedMkaProgram(2, { practices: false });
      const first = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });
      await service.activate(user, first.plan.id);
      await service.completeItem(user, first.items[0].id);

      await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
        regenerate: true,
      });

      const completed = items.rows.find((row) => row.id === first.items[0].id);
      const open = items.rows.find((row) => row.id === first.items[1].id);
      expect(completed.status).toBe(PlanItemStatus.DONE);
      expect(open.status).toBe(PlanItemStatus.CANCELLED_BY_REALIGNMENT);
      expect(open.status).not.toBe(PlanItemStatus.MISSED);
    });
  });

  // -------------------------------------------------------------------------
  // OWNERSHIP
  // -------------------------------------------------------------------------
  describe('ownership', () => {
    it('refuses to generate a plan for someone else\'s challenge', async () => {
      seedChallenge({ user_id: OTHER_USER_ID });

      await expect(
        service.generate({ user, challengeId: CHALLENGE_ID }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
      expect(plans.rows).toHaveLength(0);
    });

    it('refuses to complete someone else\'s plan item, and changes nothing', async () => {
      items.rows.push({
        id: 'item-x',
        plan_id: 'plan-x',
        user_id: OTHER_USER_ID,
        status: PlanItemStatus.PENDING,
        deleted_at: null,
      });

      await expect(
        service.completeItem(user, 'item-x'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
      expect(items.rows[0].status).toBe(PlanItemStatus.PENDING);
      expect(itemEvents.rows).toHaveLength(0);
    });

    it('refuses to read someone else\'s plan', async () => {
      plans.rows.push({ id: 'plan-x', user_id: OTHER_USER_ID, deleted_at: null });

      await expect(
        service.findOwnedPlan(USER_ID, 'plan-x'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
    });

    it('refuses to add an item to someone else\'s plan', async () => {
      plans.rows.push({
        id: 'plan-x',
        user_id: OTHER_USER_ID,
        plan_type: PlanType.TODAY,
        status: PlanStatus.ACTIVE,
        deleted_at: null,
      });

      await expect(
        service.addItem(user, 'plan-x', { title: 'Sneak this in' }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
      expect(items.rows).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // NO RULEBOOK
  // -------------------------------------------------------------------------
  describe('when no rulebook is active', () => {
    it('still builds a usable plan, generating the MKA programme it needs', async () => {
      // Step 20 section 125 and Step 15 section 51: fail closed for astrology,
      // keep the safe functionality working.
      seedChallenge();
      seedContext(3);

      const { plan, items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });

      expect(plan.status).toBe(PlanStatus.DRAFT);
      expect(created.length).toBeGreaterThan(0);
      expect(created.some((item) => !item.is_practice)).toBe(true);
      // The MKA programme was created for it, and knows which plan schedules it.
      expect(mkaPrograms.rows).toHaveLength(1);
      expect(mkaPrograms.rows[0].plan_id).toBe(plan.id);
    });

    it('records the capacity that was in force', async () => {
      seedChallenge();
      seedContext(2);

      const { plan } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });

      expect(plan.capacity_snapshot.maxActions).toBe(3);
      expect(plan.capacity_snapshot.maxPractices).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // SAFETY
  // -------------------------------------------------------------------------
  describe('safety', () => {
    it('builds nothing when the pre-check blocks', async () => {
      seedChallenge({
        raw_user_statement:
          'I am thinking about killing myself, none of this matters',
      });

      await expect(
        service.generate({ user, challengeId: CHALLENGE_ID }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

      expect(plans.rows).toHaveLength(0);
      expect(items.rows).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // OPTIMISTIC CONCURRENCY
  // -------------------------------------------------------------------------
  describe('optimistic concurrency', () => {
    it('refuses a stale write with 409', async () => {
      // Step 21 section 108 / Golden Contract Test 130.
      seedChallenge();
      seedMkaProgram(1, { practices: false });
      const { plan } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
        planType: PlanType.TODAY,
      });
      plans.rows[0].version = 5;

      await expect(
        service.patch(user, plan.id, { title: 'Stale', version: 4 }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
    });
  });
});
