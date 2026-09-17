import { DataSource, Repository } from 'typeorm';
import { RealignmentService } from './realignment.service';
import { LifeSignalService } from '../../signals/services/life-signal.service';
import { SignalClassifierService } from '../../signals/services/signal-classifier.service';
import { SafetyService } from '../../safety/services/safety.service';
import { SafetySignalDetector } from '../../safety/services/safety-signal-detector';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { FixedClockService } from '../../common/services/clock.service';
import { RequestContextService } from '../../common/services/request-context.service';
import { ZunoRealignment } from '../entities/zuno-realignment.entity';
import { ZunoRealignmentChange } from '../entities/zuno-realignment-change.entity';
import { ZunoRealignmentAssumption } from '../entities/zuno-realignment-assumption.entity';
import { ZunoLifeSignal } from '../../signals/entities/zuno-life-signal.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoEventOutbox } from '../../common/entities/zuno-event-outbox.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ChallengeStatus, ZunoDomain } from '../../common/enums';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { NoopRealignmentTarget } from '../ports/noop-realignment-target';
import {
  ActivateSuccessorPlanResult,
  CancelPendingItemsResult,
  CurrentDirection,
  RealignmentTarget,
  RealignmentTargetContext,
  SupersedeProgrammeResult,
  SuppressRemindersResult,
} from '../ports/realignment-target.port';
import { PlanChangeMode, RealignmentLevel, RealignmentStatus } from '../enums';
import { FakeDataSource } from '../../signals/testing/fake-datasource';

/**
 * Realignment Engine tests.
 *
 * The centre of gravity is the atomicity suite. Roadmap section 63 - "ensure
 * the user cannot end up with contradictory current Plans" - is the one
 * requirement in Phase 9 whose failure is silent, permanent and visible to the
 * user as a plan that argues with itself, so it gets a test that forces a
 * failure at each step and proves nothing survived.
 */
describe('RealignmentService', () => {
  const NOW = new Date('2026-09-17T09:00:00.000Z');
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
  const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';
  const PLAN_ID = '44444444-4444-4444-8444-444444444444';
  const MKA_ID = '55555555-5555-4555-8555-555555555555';

  let db: FakeDataSource;
  let clock: FixedClockService;
  let signals: LifeSignalService;
  let service: RealignmentService;
  let target: RecordingTarget;

  const user = { id: USER_ID } as ZunoUser;

  /**
   * A target that records what it was asked to do and can be told to fail at a
   * chosen step. It writes through `ctx.manager`, as the port contract
   * requires, so its writes are part of the caller's transaction - which is
   * what makes the rollback assertions meaningful.
   */
  class RecordingTarget implements RealignmentTarget {
    failAt: keyof RealignmentTarget | null = null;
    calls: string[] = [];

    async loadCurrentDirection(
      ctx: RealignmentTargetContext,
    ): Promise<CurrentDirection> {
      this.calls.push('loadCurrentDirection');
      if (this.failAt === 'loadCurrentDirection') throw new Error('plan read failed');
      return {
        planId: PLAN_ID,
        planVersion: 1,
        mkaProgramId: MKA_ID,
        pendingItemIds: ['item-1', 'item-2'],
        pendingReminderIds: ['reminder-1'],
        assumptions: [
          { key: 'EMPLOYMENT_CONTINUES', statement: 'Current employment continues' },
        ],
        available: true,
      };
    }

    async cancelPendingItems(
      ctx: RealignmentTargetContext,
    ): Promise<CancelPendingItemsResult> {
      this.calls.push('cancelPendingItems');
      // A stand-in for the real module's write, made through the caller's
      // manager exactly as the port demands.
      await ctx.manager.save(ZunoRealignmentChange, [
        ctx.manager.create(ZunoRealignmentChange, {
          realignment_id: ctx.realignmentId,
          user_id: ctx.userId,
          entity_type: 'PLAN_ITEM' as never,
          entity_id: null,
          change_type: 'ITEMS_CANCELLED' as never,
          before_value: { item_ids: ['item-1', 'item-2'] },
          after_value: null,
          reason: 'target write',
          redacted_at: null,
        }),
      ]);
      if (this.failAt === 'cancelPendingItems') throw new Error('cancel failed');
      return { cancelledItemIds: ['item-1', 'item-2'], applied: true };
    }

    async suppressPendingReminders(
      ctx: RealignmentTargetContext,
    ): Promise<SuppressRemindersResult> {
      this.calls.push('suppressPendingReminders');
      if (this.failAt === 'suppressPendingReminders') {
        throw new Error('reminder suppression failed');
      }
      return { suppressedReminderIds: ['reminder-1'], applied: true };
    }

    async supersedeProgramme(
      ctx: RealignmentTargetContext,
    ): Promise<SupersedeProgrammeResult> {
      this.calls.push('supersedeProgramme');
      if (this.failAt === 'supersedeProgramme') throw new Error('mka failed');
      return {
        supersededProgramId: MKA_ID,
        successorProgramId: null,
        applied: true,
      };
    }

    async activateSuccessorPlan(
      ctx: RealignmentTargetContext,
    ): Promise<ActivateSuccessorPlanResult> {
      this.calls.push('activateSuccessorPlan');
      if (this.failAt === 'activateSuccessorPlan') throw new Error('plan write failed');
      return {
        planId: 'new-plan',
        planVersion: 2,
        archivedPlanId: PLAN_ID,
        applied: true,
      };
    }
  }

  function seedChallenge(ownerId = USER_ID): ZunoChallenge {
    return db.store.seed(ZunoChallenge, {
      id: CHALLENGE_ID,
      user_id: ownerId,
      title: 'Job security',
      raw_user_statement: 'There have been layoffs at my company.',
      primary_domain: ZunoDomain.CAREER,
      theme: 'JOB_SECURITY',
      status: ChallengeStatus.ACTIVE,
      mode: null,
      urgency: null,
      emotional_intensity: null,
      priority: null,
      context_version: 1,
      opened_at: NOW,
      resolved_at: null,
      resolution_note: null,
      version: 1,
      created_at: NOW,
      updated_at: NOW,
      deleted_at: null,
    } as ZunoChallenge);
  }

  function build(realignmentTarget: RealignmentTarget): RealignmentService {
    return new RealignmentService(
      db.repositoryFor(ZunoRealignment) as unknown as Repository<ZunoRealignment>,
      db.repositoryFor(ZunoChallenge) as unknown as Repository<ZunoChallenge>,
      db.repositoryFor(ZunoLifeSignal) as unknown as Repository<ZunoLifeSignal>,
      realignmentTarget,
      signals,
      new SafetyService(new SafetySignalDetector()),
      { getActive: jest.fn().mockResolvedValue(null) } as unknown as RulebookRepositoryService,
      new OutboxService(new RequestContextService()),
      new ZunoAuditService(new RequestContextService()),
      new ZunoOwnershipService(),
      clock,
      db as unknown as DataSource,
    );
  }

  beforeEach(() => {
    db = new FakeDataSource();
    clock = new FixedClockService(NOW);
    signals = new LifeSignalService(
      db.repositoryFor(ZunoLifeSignal) as unknown as Repository<ZunoLifeSignal>,
      db.repositoryFor(ZunoChallenge) as unknown as Repository<ZunoChallenge>,
      new SignalClassifierService(),
      new SafetyService(new SafetySignalDetector()),
      { getActive: jest.fn().mockResolvedValue(null) } as unknown as RulebookRepositoryService,
      new OutboxService(new RequestContextService()),
      new ZunoAuditService(new RequestContextService()),
      new ZunoOwnershipService(),
      clock,
      db as unknown as DataSource,
    );
    target = new RecordingTarget();
    service = build(target);
  });

  /** Files a confirmed, material signal the way a real user would. */
  async function confirmedTermination(): Promise<ZunoLifeSignal> {
    const created = await signals.record({
      user,
      challengeId: CHALLENGE_ID,
      statement: 'HR gave me my termination letter. My last working day is next month.',
    });
    return signals.confirm(user, created.signal!.id);
  }

  // ------------------------------------------------------------- evaluation

  describe('evaluation', () => {
    beforeEach(() => seedChallenge());

    it('produces a MAJOR realignment for a confirmed termination', async () => {
      // Step 14 section 21 / Ashish stage 5: the primary strategy changes from
      // protecting the role to executing a transition.
      const signal = await confirmedTermination();
      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });

      expect(decision.realignment.level).toBe(RealignmentLevel.MAJOR);
      expect(decision.realignment.plan_change_mode).toBe(PlanChangeMode.REGENERATE);
      expect(decision.realignment.mka_refresh_required).toBe(true);
      // Step 14 section 66: an explicit fact needs no artificial confirmation.
      expect(decision.realignment.user_confirmation_required).toBe(false);
    });

    it('records what stays as well as what changes', async () => {
      // Step 14 Rule 2 and section 77: "what stays the same" is part of the
      // answer, not an omission.
      const signal = await confirmedTermination();
      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });

      expect(decision.changes.some((row) => row.change_type === 'PRESERVE')).toBe(
        true,
      );
    });

    it('names the assumption that stopped holding', async () => {
      const signal = await confirmedTermination();
      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });

      const assumptions = db.store
        .rows(ZunoRealignmentAssumption)
        .filter((row) => row.realignment_id === decision.realignment.id);
      expect(assumptions).toHaveLength(1);
      expect(assumptions[0].status).toBe('INVALIDATED');
      expect(assumptions[0].invalidated_by_signal_id).toBe(signal.id);
    });

    it('returns NONE when the trigger signal is only an inference', async () => {
      // Step 13 Rule 3 carried into Step 14: an unconfirmed possibility is not
      // grounds to change a plan.
      const created = await signals.record({
        user,
        challengeId: CHALLENGE_ID,
        statement: 'I think my role might be at risk in the restructuring.',
      });

      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: created.signal!.id,
      });
      expect(decision.realignment.level).toBe(RealignmentLevel.NONE);
    });

    it('returns NONE when the only confirmed signal has gone stale', async () => {
      // An opportunity is an EVENT, so it decays (Step 13 section 60). A
      // termination would not, because Step 13 section 61 makes it a standing
      // state fact - which is exactly why the two are modelled differently.
      const created = await signals.record({
        user,
        challengeId: CHALLENGE_ID,
        statement: 'I received an interview invitation from another company.',
      });
      const signal = await signals.confirm(user, created.signal!.id);
      expect(signal.realignment_required).toBe(true);

      clock.advanceMs(365 * 24 * 60 * 60 * 1000);

      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });
      expect(decision.realignment.level).toBe(RealignmentLevel.NONE);
    });

    it('does not over-trigger on plan progress', async () => {
      // Roadmap section 66: "minor signal does not over-trigger."
      // Step 13 section 53 and Step 14 section 6: "I updated my CV" is progress
      // to acknowledge, not a change of direction, so the correct answer is no
      // realignment at all and no plan change.
      const created = await signals.record({
        user,
        challengeId: CHALLENGE_ID,
        statement: 'I updated my CV today.',
      });
      await signals.confirm(user, created.signal!.id);

      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: created.signal!.id,
      });
      expect(decision.realignment.level).toBe(RealignmentLevel.NONE);
      expect(decision.realignment.plan_change_mode).toBe(PlanChangeMode.NONE);
      expect(db.store.count(ZunoRealignmentChange)).toBe(0);
    });

    it('asks the user before dropping a path they chose', async () => {
      // Step 14 section 64: a stated goal change is the user's call.
      const created = await signals.record({
        user,
        challengeId: CHALLENGE_ID,
        statement:
          'I no longer want to stay in this company even if they retain me.',
      });
      await signals.confirm(user, created.signal!.id);

      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: created.signal!.id,
      });
      expect(decision.realignment.user_confirmation_required).toBe(true);
      expect(decision.realignment.status).toBe(
        RealignmentStatus.AWAITING_USER_CONFIRMATION,
      );
    });

    it('returns the same decision for a repeated trigger', async () => {
      // Step 14 section 85: one trigger, one realignment.
      const signal = await confirmedTermination();
      const first = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });
      const second = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });

      expect(second.idempotentReplay).toBe(true);
      expect(second.realignment.id).toBe(first.realignment.id);
      expect(db.store.count(ZunoRealignment)).toBe(1);
    });
  });

  // ---------------------------------------------------- ATOMIC REALIGNMENT

  describe('atomic realignment (Roadmap section 63)', () => {
    beforeEach(() => seedChallenge());

    async function evaluated(): Promise<string> {
      const signal = await confirmedTermination();
      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });
      return decision.realignment.id;
    }

    it('applies plan, MKA and reminders together in ONE transaction', async () => {
      const realignmentId = await evaluated();
      const before = db.transactionCount;

      const applied = await service.apply({ user, realignmentId });

      expect(db.transactionCount - before).toBe(1);
      expect(applied.realignment.status).toBe(RealignmentStatus.APPLIED);
      expect(applied.cancelledItemIds).toEqual(['item-1', 'item-2']);
      expect(applied.suppressedReminderIds).toEqual(['reminder-1']);
      expect(applied.supersededProgramId).toBe(MKA_ID);
      expect(applied.newPlanId).toBe('new-plan');
      expect(target.calls).toEqual([
        'loadCurrentDirection',
        'cancelPendingItems',
        'suppressPendingReminders',
        'supersedeProgramme',
        'activateSuccessorPlan',
      ]);
    });

    /**
     * The rollback proof.
     *
     * Each case forces a failure at a different point in the sequence - after
     * items were cancelled, after reminders were suppressed, after the MKA was
     * superseded, and during the plan write itself - and then asserts that the
     * database is byte-for-byte where it started: the realignment is still
     * EVALUATED, not APPLIED; no change rows were written, including the ones
     * the target itself wrote through the shared manager; no outbox event was
     * emitted; and the challenge status did not move.
     *
     * The failure point matters. A partial apply is only possible if some
     * writes commit before the failing one, so failing at the *last* step is
     * the strongest case: everything before it succeeded, and none of it may
     * survive.
     */
    const failurePoints: (keyof RealignmentTarget)[] = [
      'loadCurrentDirection',
      'cancelPendingItems',
      'suppressPendingReminders',
      'supersedeProgramme',
      'activateSuccessorPlan',
    ];

    it.each(failurePoints)(
      'persists NOTHING when %s fails mid-operation',
      async (failAt) => {
        const realignmentId = await evaluated();

        const changesBefore = db.store.count(ZunoRealignmentChange);
        const outboxBefore = db.store.count(ZunoEventOutbox);
        const challengeBefore = db.store
          .rows(ZunoChallenge)
          .find((row) => row.id === CHALLENGE_ID)!.status;
        const signalBefore = db.store
          .rows(ZunoLifeSignal)
          .map((row) => row.realignment_required);

        target.failAt = failAt;
        await expect(service.apply({ user, realignmentId })).rejects.toThrow();

        const stored = db.store
          .rows(ZunoRealignment)
          .find((row) => row.id === realignmentId)!;

        // 1. The realignment is untouched and still pending - Step 14
        //    section 87: "retain existing state, flag reassessment pending".
        expect(stored.status).toBe(RealignmentStatus.EVALUATED);
        expect(stored.applied_at).toBeNull();
        expect(stored.new_state_ref).toEqual({});

        // 2. No diff rows survived, including the target's own write. This is
        //    the assertion that would fail if the target wrote outside the
        //    transaction, or if the service used more than one.
        expect(db.store.count(ZunoRealignmentChange)).toBe(changesBefore);

        // 3. Nothing was announced. An outbox row for a realignment that did
        //    not happen would make every downstream consumer wrong too.
        expect(db.store.count(ZunoEventOutbox)).toBe(outboxBefore);

        // 4. The challenge did not move on.
        expect(
          db.store.rows(ZunoChallenge).find((row) => row.id === CHALLENGE_ID)!
            .status,
        ).toBe(challengeBefore);

        // 5. The triggering signal still asks for a realignment, so the retry
        //    has something to work from.
        expect(
          db.store.rows(ZunoLifeSignal).map((row) => row.realignment_required),
        ).toEqual(signalBefore);
      },
    );

    it('can be retried successfully after a failure', async () => {
      const realignmentId = await evaluated();

      target.failAt = 'activateSuccessorPlan';
      await expect(service.apply({ user, realignmentId })).rejects.toThrow();

      target.failAt = null;
      const applied = await service.apply({ user, realignmentId });
      expect(applied.realignment.status).toBe(RealignmentStatus.APPLIED);
      expect(applied.newPlanId).toBe('new-plan');
    });

    it('clears the signal that asked for it, so it cannot ask again', async () => {
      // Step 14 section 108: no endless adaptation from one event.
      const realignmentId = await evaluated();
      await service.apply({ user, realignmentId });

      expect(
        db.store.rows(ZunoLifeSignal).every((row) => !row.realignment_required),
      ).toBe(true);
    });

    it('records cancellations as realignment-driven, never as missed', async () => {
      // Step 14 section 74: the Karma Ledger must not penalise the user for
      // work ZUNO withdrew.
      const realignmentId = await evaluated();
      await service.apply({ user, realignmentId });

      const cancelChange = db.store
        .rows(ZunoRealignmentChange)
        .find((row) => row.change_type === 'ITEMS_CANCELLED' && row.after_value);
      expect(cancelChange!.after_value).toEqual({
        status: 'CANCELLED_BY_REALIGNMENT',
      });
    });

    it('refuses to apply while the user has not agreed', async () => {
      const created = await signals.record({
        user,
        challengeId: CHALLENGE_ID,
        statement:
          'I no longer want to stay in this company even if they retain me.',
      });
      await signals.confirm(user, created.signal!.id);
      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: created.signal!.id,
      });

      await expect(
        service.apply({ user, realignmentId: decision.realignment.id }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });

      // Step 14 section 65: the plan is untouched until the user agrees.
      expect(target.calls).toHaveLength(0);
    });

    it('refuses to apply a NONE realignment', async () => {
      // Step 14 section 62: "our plan still holds" must not change the plan.
      const decision = await service.evaluate({ user, challengeId: CHALLENGE_ID });
      expect(decision.realignment.level).toBe(RealignmentLevel.NONE);

      await expect(
        service.apply({ user, realignmentId: decision.realignment.id }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
      expect(target.calls).toHaveLength(0);
    });

    it('is a no-op when applied twice', async () => {
      const realignmentId = await evaluated();
      await service.apply({ user, realignmentId });
      const calls = target.calls.length;

      const second = await service.apply({ user, realignmentId });
      expect(second.realignment.status).toBe(RealignmentStatus.APPLIED);
      expect(target.calls).toHaveLength(calls);
    });
  });

  // ------------------------------------------------------ standalone default

  describe('with no REALIGNMENT_TARGET bound', () => {
    beforeEach(() => seedChallenge());

    it('records the decision honestly and claims no plan change', async () => {
      // Build Rule 128: never return a fabricated success. The default no-op
      // target means the realignment is real and the plan effect is nil, and
      // the response says exactly that.
      const standalone = build(new NoopRealignmentTarget());
      const signal = await confirmedTermination();
      const decision = await standalone.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });

      const applied = await standalone.apply({
        user,
        realignmentId: decision.realignment.id,
      });

      expect(applied.realignment.status).toBe(RealignmentStatus.APPLIED);
      expect(applied.targetApplied).toBe(false);
      expect(applied.newPlanId).toBeNull();
      expect(applied.realignment.new_state_ref.target_bound).toBe(false);
    });
  });

  // -------------------------------------------------------------- ownership

  describe('ownership', () => {
    it('masks another user\'s challenge as not found on evaluate', async () => {
      seedChallenge(OTHER_USER_ID);

      await expect(
        service.evaluate({ user, challengeId: CHALLENGE_ID }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
      expect(db.store.count(ZunoRealignment)).toBe(0);
    });

    it('masks another user\'s realignment as not found on apply', async () => {
      seedChallenge();
      const signal = await confirmedTermination();
      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });

      await expect(
        service.apply({
          user: { id: OTHER_USER_ID } as ZunoUser,
          realignmentId: decision.realignment.id,
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });

      const stored = db.store
        .rows(ZunoRealignment)
        .find((row) => row.id === decision.realignment.id)!;
      expect(stored.status).toBe(RealignmentStatus.EVALUATED);
      expect(target.calls).toHaveLength(0);
    });

    it('rejects a stale optimistic-lock version', async () => {
      seedChallenge();
      const signal = await confirmedTermination();
      const decision = await service.evaluate({
        user,
        challengeId: CHALLENGE_ID,
        triggerSignalId: signal.id,
      });

      // Step 21 section 108: a client holding an older version must get 409
      // rather than silently overwriting newer realignment state.
      await expect(
        service.apply({
          user,
          realignmentId: decision.realignment.id,
          expectedVersion: decision.realignment.version + 5,
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
    });
  });
});
