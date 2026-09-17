import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { ZunoRealignment } from '../entities/zuno-realignment.entity';
import { ZunoRealignmentChange } from '../entities/zuno-realignment-change.entity';
import { ZunoRealignmentAssumption } from '../entities/zuno-realignment-assumption.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoLifeSignal } from '../../signals/entities/zuno-life-signal.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { LifeSignalService } from '../../signals/services/life-signal.service';
import { SafetyService } from '../../safety/services/safety.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { canTransitionChallenge, ChallengeStatus } from '../../common/enums';
import {
  asZunoAggregateType,
  asZunoEventType,
  isConfirmedSignal,
  LifeSignalMateriality,
  LifeSignalStatus,
  LifeSignalType,
  MATERIALITY_RANK,
  RealignmentReasonCode,
} from '../../signals/enums';
import {
  AssumptionStatus,
  canTransitionRealignment,
  PLAN_PATCH_MAX_CHANGED_COMPONENTS,
  PlanChangeMode,
  REALIGNMENT_AGGREGATE,
  REALIGNMENT_EVENT_TYPES,
  REALIGNMENT_LEVEL_RANK,
  RealignmentChangeType,
  RealignmentEntityType,
  RealignmentLevel,
  RealignmentScope,
  RealignmentStatus,
  RealignmentTrigger,
} from '../enums';
import {
  REALIGNMENT_TARGET,
  RealignmentTarget,
  RealignmentTargetContext,
} from '../ports/realignment-target.port';

export const REALIGNMENT_ENGINE_VERSION = 'realignment-engine@1.0.0';

export interface EvaluateRealignmentParams {
  user: ZunoUser;
  challengeId: string;
  triggerSignalId?: string | null;
  trigger?: RealignmentTrigger;
}

export interface RealignmentDecision {
  realignment: ZunoRealignment;
  changes: ZunoRealignmentChange[];
  /** True when the row already existed for this trigger (Step 14 section 85). */
  idempotentReplay: boolean;
}

export interface ApplyRealignmentParams {
  user: ZunoUser;
  realignmentId: string;
  /** The user agreeing, where agreement is required (Step 14 section 65). */
  userConfirmed?: boolean;
  expectedVersion?: number;
}

export interface AppliedRealignment {
  realignment: ZunoRealignment;
  cancelledItemIds: string[];
  suppressedReminderIds: string[];
  supersededProgramId: string | null;
  newPlanId: string | null;
  /** False when no REALIGNMENT_TARGET is bound: a decision with no plan effect. */
  targetApplied: boolean;
}

/**
 * The Realignment Engine. Step 14.
 *
 * It answers "given what has changed, what should ZUNO change now?" and then
 * has the owning engines perform it (Step 14 Rule 8). It never writes a plan
 * row itself - everything that touches a plan, an MKA programme or a reminder
 * goes through REALIGNMENT_TARGET, which the Plan/MKA module binds.
 *
 * ATOMICITY - THE POINT OF THIS CLASS
 *
 * `apply()` performs the whole realignment inside a single
 * `dataSource.transaction`, and hands the enclosing EntityManager to the target
 * so its writes join the same transaction. Roadmap section 63 states the
 * requirement plainly - "the user cannot end up with contradictory current
 * Plans" - and Step 14 sections 87-88 spell out the failure mode: a partial
 * apply leaves obsolete items live next to their replacements, reminders firing
 * for work that has been withdrawn, and an MKA programme built on a strategy
 * that no longer exists. There is no ordering of these writes that is safe when
 * one of them fails; the only safe design is that none of them survive.
 *
 * On failure the transaction rolls back and this method rethrows. It
 * deliberately does NOT write a FAILED row afterwards: that would be a second
 * transaction, and the realignment would then claim to have been attempted
 * against a plan that was never touched. Step 14 section 87 asks instead to
 * "retain existing state, flag reassessment pending, retry safely" - which is
 * exactly a realignment left in EVALUATED.
 */
@Injectable()
export class RealignmentService {
  private readonly logger = new Logger(RealignmentService.name);

  constructor(
    @InjectRepository(ZunoRealignment)
    private readonly realignments: Repository<ZunoRealignment>,
    @InjectRepository(ZunoChallenge)
    private readonly challenges: Repository<ZunoChallenge>,
    @InjectRepository(ZunoLifeSignal)
    private readonly signals: Repository<ZunoLifeSignal>,
    @Inject(REALIGNMENT_TARGET)
    private readonly target: RealignmentTarget,
    private readonly lifeSignals: LifeSignalService,
    private readonly safety: SafetyService,
    private readonly rulebook: RulebookRepositoryService,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
  ) {}

  // ------------------------------------------------------------- evaluation

  /**
   * Decides what should change, and persists the decision without applying it.
   * Step 14 sections 80-82.
   *
   * A decision is recorded even when the answer is "nothing changes"
   * (section 63). That looks like noise until you need to answer why ZUNO did
   * not react to something - "we looked, and it did not move the direction" is
   * a better answer than silence, and section 93 counts the false-realignment
   * rate as a quality metric, which needs the negatives.
   */
  async evaluate(params: EvaluateRealignmentParams): Promise<RealignmentDecision> {
    const challenge = await this.findOwnedChallenge(
      params.user.id,
      params.challengeId,
    );

    const trigger = params.triggerSignalId
      ? await this.loadTriggerSignal(params.user.id, params.triggerSignalId)
      : null;

    // Step 14 section 22 / Rule 9: safety takes precedence, and ordinary
    // optimisation must not proceed until safety handling is complete.
    const assessment = this.safety.preCheck({
      operation: 'REALIGNMENT_EVALUATE',
      userId: params.user.id,
      challengeId: challenge.id,
      text: challenge.raw_user_statement,
      domains: challenge.primary_domain ? [challenge.primary_domain] : [],
    });
    if (assessment.blocked) {
      await this.dataSource.transaction(async (manager) => {
        const decision = await this.safety.recordDecision(manager, {
          userId: params.user.id,
          challengeId: challenge.id,
          operation: 'REALIGNMENT_EVALUATE',
          assessment,
        });
        await this.safety.recordIncident(manager, {
          userId: params.user.id,
          safetyDecisionId: decision.id,
          source: 'REALIGNMENT_EVALUATE_PRECHECK',
          domain: assessment.domains[0] ?? null,
          severity: assessment.riskLevel,
          violations: [],
        });
      });
      throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
        message:
          assessment.boundaryMessage ??
          'Before we change anything, there is something here I would rather not work around.',
        safety: { disposition: assessment.disposition },
      });
    }

    // Only confirmed, active, non-stale signals may drive a realignment.
    // Step 13 Rule 3 and section 60; the filtering itself lives in the Life
    // Signal Engine so there is one definition of "actionable".
    const actionable = await this.lifeSignals.actionableSignals(
      params.user.id,
      challenge.id,
    );
    const driving =
      trigger && actionable.some((row) => row.id === trigger.id)
        ? actionable
        : trigger
          ? [] // the named trigger is not actionable: nothing drives this
          : actionable;

    const fingerprint = this.triggerFingerprint(
      challenge.id,
      trigger?.id ?? null,
      challenge.context_version,
    );

    // Step 14 section 85: the same trigger against unchanged state yields the
    // existing decision, not a second contradictory one.
    const existing = await this.realignments.findOne({
      where: {
        user_id: params.user.id,
        challenge_id: challenge.id,
        trigger_fingerprint: fingerprint,
        status: In([
          RealignmentStatus.EVALUATED,
          RealignmentStatus.AWAITING_USER_CONFIRMATION,
          RealignmentStatus.APPLIED,
        ]),
        deleted_at: IsNull(),
      },
      order: { created_at: 'DESC' },
    });
    if (existing) {
      const changes = await this.dataSource
        .getRepository(ZunoRealignmentChange)
        .find({ where: { realignment_id: existing.id } });
      return { realignment: existing, changes, idempotentReplay: true };
    }

    const level = this.level(driving);
    const reasonCodes = this.reasonCodes(driving);
    const scope = this.scope(level, driving);
    const planMode = this.planChangeMode(level, driving);
    const now = this.clock.now();

    // Step 14 section 46: approved timing may inform, never override, and there
    // is no active Rulebook, so this stays null and nothing astrological enters
    // the decision (Build Rule 51, Step 20 section 125 fail-closed).
    const activeRulebook = await this.rulebook.getActive();

    const saved = await this.dataSource.transaction(async (manager) => {
      // Step 14 section 86: when several material signals arrive close
      // together, prefer ONE consolidated realignment against the latest known
      // state. A challenge with two applicable realignments is the direct route
      // to the contradictory plans Roadmap section 63 forbids, so the earlier
      // decision is retired here rather than left to race with this one. The
      // partial unique index in the migration enforces the same rule at the
      // schema level.
      const inFlight = await manager.find(ZunoRealignment, {
        where: {
          user_id: params.user.id,
          challenge_id: challenge.id,
          status: In([
            RealignmentStatus.PENDING,
            RealignmentStatus.EVALUATED,
            RealignmentStatus.AWAITING_USER_CONFIRMATION,
          ]),
          deleted_at: IsNull(),
        },
      });
      for (const prior of inFlight) {
        prior.status = this.transition(prior.status, RealignmentStatus.SUPERSEDED);
        await manager.save(ZunoRealignment, prior);
      }

      const realignment = manager.create(ZunoRealignment, {
        user_id: params.user.id,
        challenge_id: challenge.id,
        trigger_type:
          params.trigger ??
          (trigger ? RealignmentTrigger.LIFE_SIGNAL : RealignmentTrigger.USER_REQUEST),
        trigger_signal_id: trigger?.id ?? null,
        level,
        scope,
        status: RealignmentStatus.EVALUATED,
        reason: this.explain(level, driving),
        reason_codes: reasonCodes,
        previous_state_ref: {
          challenge_id: challenge.id,
          context_version: challenge.context_version,
          challenge_status: challenge.status,
        },
        new_state_ref: {},
        previous_context_version: challenge.context_version,
        current_context_version: challenge.context_version,
        plan_change_mode: planMode,
        scenario_reassessment_required:
          REALIGNMENT_LEVEL_RANK[level] >=
          REALIGNMENT_LEVEL_RANK[RealignmentLevel.PARTIAL],
        mka_refresh_required: this.mkaRefreshRequired(level, reasonCodes),
        user_confirmation_required: this.confirmationRequired(level, reasonCodes),
        safety_review_required: false,
        trigger_fingerprint: fingerprint,
        superseded_by_id: null,
        rulebook_version_id: activeRulebook?.versionId ?? null,
        engine_version: REALIGNMENT_ENGINE_VERSION,
        applied_at: null,
        completed_at: null,
      });
      const row = await manager.save(ZunoRealignment, realignment);

      // Now that the successor has an id, point the retired decisions at it so
      // the chain in Step 14 section 57 stays traceable.
      for (const prior of inFlight) {
        prior.superseded_by_id = row.id;
        await manager.save(ZunoRealignment, prior);
      }

      if (row.user_confirmation_required) {
        row.status = this.transition(
          row.status,
          RealignmentStatus.AWAITING_USER_CONFIRMATION,
        );
        await manager.save(ZunoRealignment, row);
      }

      const changeRows = await this.writeDiff(manager, row, driving);
      await this.writeAssumptions(manager, row, driving);

      await this.audit.record(manager, {
        actorType: 'SYSTEM',
        userId: params.user.id,
        action: 'REALIGNMENT_EVALUATED',
        entityType: 'ZunoRealignment',
        entityId: row.id,
        after: { level: row.level, status: row.status, scope: row.scope },
        metadata: { reason_codes: row.reason_codes },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: asZunoAggregateType(REALIGNMENT_AGGREGATE),
        aggregateId: row.id,
        eventType: asZunoEventType(REALIGNMENT_EVENT_TYPES.REALIGNMENT_EVALUATED),
        payload: {
          realignment_id: row.id,
          user_id: params.user.id,
          challenge_id: challenge.id,
          level: row.level,
          trigger_signal_id: row.trigger_signal_id,
        },
      });

      if (row.user_confirmation_required) {
        await this.outbox.enqueue(manager, {
          aggregateType: asZunoAggregateType(REALIGNMENT_AGGREGATE),
          aggregateId: row.id,
          eventType: asZunoEventType(
            REALIGNMENT_EVENT_TYPES.REALIGNMENT_CONFIRMATION_REQUIRED,
          ),
          payload: {
            realignment_id: row.id,
            user_id: params.user.id,
            challenge_id: challenge.id,
          },
        });
      }

      // Step 11 section 33 / Step 14: a challenge with a pending realignment is
      // in REALIGNMENT_REQUIRED, so the rest of the system can see it without
      // joining to this table.
      if (
        REALIGNMENT_LEVEL_RANK[level] >
        REALIGNMENT_LEVEL_RANK[RealignmentLevel.NONE]
      ) {
        this.moveChallenge(challenge, ChallengeStatus.REALIGNMENT_REQUIRED, now);
        await manager.save(ZunoChallenge, challenge);
      }

      return { row, changeRows };
    });

    return {
      realignment: saved.row,
      changes: saved.changeRows,
      idempotentReplay: false,
    };
  }

  // ----------------------------------------------------------- application

  /**
   * Applies an evaluated realignment. ATOMIC: all of it, or none of it.
   *
   * Everything below runs in one transaction, and the target receives that
   * transaction's EntityManager so its writes are part of it. If the plan is
   * patched but the MKA programme cannot be superseded, or a reminder write
   * fails after items were cancelled, the rollback removes all of it - the user
   * keeps a coherent, if outdated, plan rather than a self-contradicting one
   * (Roadmap section 63, Step 14 sections 87-88).
   */
  async apply(params: ApplyRealignmentParams): Promise<AppliedRealignment> {
    const loaded = await this.findOwned(params.user.id, params.realignmentId);
    this.ownership.assertVersion(loaded, params.expectedVersion);

    if (loaded.status === RealignmentStatus.APPLIED) {
      // Step 14 section 85: re-applying is a no-op, not a second realignment.
      return {
        realignment: loaded,
        cancelledItemIds: [],
        suppressedReminderIds: [],
        supersededProgramId: null,
        newPlanId: (loaded.new_state_ref?.plan_id as string) ?? null,
        targetApplied: false,
      };
    }

    if (
      loaded.status === RealignmentStatus.AWAITING_USER_CONFIRMATION &&
      !params.userConfirmed
    ) {
      // Step 14 section 65: the plan stays exactly as it is until the user
      // agrees. Silently applying would be Anti-Pattern 109.
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: 'This one is your call. Confirm it and I will make the change.',
        internalDetail: `realignment ${loaded.id} requires user confirmation`,
      });
    }

    if (
      loaded.status !== RealignmentStatus.EVALUATED &&
      loaded.status !== RealignmentStatus.AWAITING_USER_CONFIRMATION
    ) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `realignment ${loaded.id} is ${loaded.status}`,
      });
    }

    if (loaded.level === RealignmentLevel.NONE) {
      // Step 14 section 62: "Our plan still holds" is a valid outcome, and
      // applying nothing must not touch the plan at all.
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: 'Nothing here changes our direction yet.',
        internalDetail: `realignment ${loaded.id} has level NONE`,
      });
    }

    const now = this.clock.now();

    // ---- THE ATOMIC BOUNDARY -------------------------------------------
    // One transaction. Every write below - the target's plan/MKA/reminder
    // writes included - happens through `manager`, so a throw anywhere undoes
    // all of it.
    return this.dataSource.transaction(async (manager) => {
      const realignment = await manager.findOne(ZunoRealignment, {
        where: { id: loaded.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!realignment) {
        throw ZunoException.notFound(`realignment ${loaded.id} vanished`);
      }
      if (realignment.status === RealignmentStatus.APPLIED) {
        throw new ZunoException(ZunoErrorCode.CONFLICT, {
          internalDetail: `realignment ${realignment.id} already applied`,
        });
      }

      const ctx: RealignmentTargetContext = {
        manager,
        userId: params.user.id,
        challengeId: realignment.challenge_id,
        realignmentId: realignment.id,
        occurredAt: now,
      };

      const direction = await this.target.loadCurrentDirection(ctx);

      // 1. Retire work the change made pointless - as CANCELLED_BY_REALIGNMENT,
      //    never as MISSED. Step 14 sections 53 and 74: the Karma Ledger must
      //    not penalise the user for work ZUNO withdrew.
      const cancelled = await this.target.cancelPendingItems(ctx, {
        itemIds: direction.pendingItemIds,
        reasonCode: 'CANCELLED_BY_REALIGNMENT',
        reason: realignment.reason,
      });

      // 2. Stop the reminders that would otherwise fire for that retired work.
      //    Roadmap section 66: "notifications for obsolete actions suppressed".
      const suppressed = await this.target.suppressPendingReminders(ctx, {
        reminderIds: direction.pendingReminderIds,
        reason: realignment.reason,
      });

      // 3. Refresh the MKA programme only if it no longer fits. Step 14
      //    section 52: do not change remedies to look dynamic.
      const programme = await this.target.supersedeProgramme(ctx, {
        mkaProgramId: direction.mkaProgramId,
        reason: realignment.reason,
        refreshRequired: realignment.mka_refresh_required,
      });

      // 4. Patch or regenerate the plan, preserving what still works
      //    (Step 14 sections 13, 35).
      const plan = await this.target.activateSuccessorPlan(ctx, {
        mode:
          realignment.plan_change_mode === PlanChangeMode.REGENERATE
            ? 'REGENERATE'
            : 'PATCH',
        previousPlanId: direction.planId,
        reason: realignment.reason,
        preserveItemIds: [],
      });

      await this.recordAppliedChanges(manager, realignment, {
        cancelled: cancelled.cancelledItemIds,
        suppressed: suppressed.suppressedReminderIds,
        supersededProgramId: programme.supersededProgramId,
        planId: plan.planId,
        previousPlanId: direction.planId,
      });

      realignment.status = this.transition(
        realignment.status,
        RealignmentStatus.APPLIED,
      );
      realignment.applied_at = now;
      realignment.completed_at = now;
      realignment.previous_state_ref = {
        ...realignment.previous_state_ref,
        plan_id: direction.planId,
        plan_version: direction.planVersion,
        mka_program_id: direction.mkaProgramId,
      };
      realignment.new_state_ref = {
        plan_id: plan.planId,
        plan_version: plan.planVersion,
        mka_program_id: programme.successorProgramId,
        cancelled_item_count: cancelled.cancelledItemIds.length,
        suppressed_reminder_count: suppressed.suppressedReminderIds.length,
        // Honest about the no-op default rather than implying a plan changed.
        target_bound: direction.available,
      };
      await manager.save(ZunoRealignment, realignment);

      // The triggering signal has done its work; it must not keep asking.
      // Step 14 section 108: no endless adaptation from one event.
      await this.settleTriggerSignals(manager, realignment);

      const challenge = await manager.findOne(ZunoChallenge, {
        where: { id: realignment.challenge_id },
      });
      if (challenge) {
        this.moveChallenge(challenge, ChallengeStatus.ACTIVE, now);
        await manager.save(ZunoChallenge, challenge);
      }

      await this.audit.record(manager, {
        actorType: params.userConfirmed ? 'USER' : 'SYSTEM',
        actorId: params.user.id,
        userId: params.user.id,
        action: 'REALIGNMENT_APPLIED',
        entityType: 'ZunoRealignment',
        entityId: realignment.id,
        before: { status: RealignmentStatus.EVALUATED },
        after: { status: realignment.status, level: realignment.level },
        metadata: {
          cancelled_items: cancelled.cancelledItemIds.length,
          target_bound: direction.available,
        },
      });

      await this.outbox.enqueueMany(manager, [
        {
          aggregateType: asZunoAggregateType(REALIGNMENT_AGGREGATE),
          aggregateId: realignment.id,
          eventType: asZunoEventType(REALIGNMENT_EVENT_TYPES.REALIGNMENT_APPLIED),
          payload: {
            realignment_id: realignment.id,
            user_id: params.user.id,
            challenge_id: realignment.challenge_id,
            level: realignment.level,
            plan_id: plan.planId,
          },
        },
        {
          aggregateType: asZunoAggregateType(REALIGNMENT_AGGREGATE),
          aggregateId: realignment.id,
          eventType: asZunoEventType(
            REALIGNMENT_EVENT_TYPES.REALIGNMENT_COMPLETED,
          ),
          payload: {
            realignment_id: realignment.id,
            user_id: params.user.id,
            challenge_id: realignment.challenge_id,
          },
        },
      ]);

      return {
        realignment,
        cancelledItemIds: cancelled.cancelledItemIds,
        suppressedReminderIds: suppressed.suppressedReminderIds,
        supersededProgramId: programme.supersededProgramId,
        newPlanId: plan.planId,
        targetApplied:
          cancelled.applied ||
          suppressed.applied ||
          programme.applied ||
          plan.applied,
      };
    });
  }

  // ------------------------------------------------------------------ reads

  async findOwned(userId: string, realignmentId: string): Promise<ZunoRealignment> {
    const row = await this.realignments.findOne({
      where: { id: realignmentId, deleted_at: IsNull() },
    });
    return this.ownership.require(row, userId, 'realignment');
  }

  async list(
    userId: string,
    challengeId: string,
    limit = 20,
  ): Promise<ZunoRealignment[]> {
    return this.realignments.find({
      where: { user_id: userId, challenge_id: challengeId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      take: Math.min(limit, 100),
    });
  }

  async changesFor(realignmentId: string): Promise<ZunoRealignmentChange[]> {
    return this.dataSource
      .getRepository(ZunoRealignmentChange)
      .find({ where: { realignment_id: realignmentId } });
  }

  // -------------------------------------------------------------- internals

  private async findOwnedChallenge(
    userId: string,
    challengeId: string,
  ): Promise<ZunoChallenge> {
    const challenge = await this.challenges.findOne({
      where: { id: challengeId, deleted_at: IsNull() },
    });
    return this.ownership.require(challenge, userId, 'challenge');
  }

  private async loadTriggerSignal(
    userId: string,
    signalId: string,
  ): Promise<ZunoLifeSignal> {
    const signal = await this.signals.findOne({
      where: { id: signalId, deleted_at: IsNull() },
    });
    return this.ownership.require(signal, userId, 'life signal');
  }

  /**
   * Step 14 section 7, driven by materiality rather than by volume.
   *
   * The ordering matters: a single CRITICAL confirmed change outranks any
   * number of medium ones, because section 21 is about the primary strategy
   * becoming invalid, not about how much has been reported.
   */
  private level(signals: ZunoLifeSignal[]): RealignmentLevel {
    if (signals.length === 0) return RealignmentLevel.NONE;

    const worst = signals.reduce(
      (rank, signal) => Math.max(rank, MATERIALITY_RANK[signal.materiality]),
      -1,
    );
    if (worst >= MATERIALITY_RANK[LifeSignalMateriality.CRITICAL]) {
      return RealignmentLevel.CRITICAL;
    }

    const invalidating = signals.some((signal) =>
      [
        LifeSignalType.STATUS_CHANGE,
        LifeSignalType.GOAL_CHANGE,
        LifeSignalType.SETBACK,
      ].includes(signal.signal_type),
    );
    if (worst >= MATERIALITY_RANK[LifeSignalMateriality.HIGH]) {
      // Step 14 Rule 3 and section 17: prefer the smallest useful change. A
      // high-materiality signal that does not invalidate the strategy is a
      // partial realignment, not a full one.
      return invalidating ? RealignmentLevel.MAJOR : RealignmentLevel.PARTIAL;
    }
    if (worst >= MATERIALITY_RANK[LifeSignalMateriality.MEDIUM]) {
      return RealignmentLevel.MICRO;
    }
    return RealignmentLevel.NONE;
  }

  private scope(
    level: RealignmentLevel,
    signals: ZunoLifeSignal[],
  ): RealignmentScope {
    switch (level) {
      case RealignmentLevel.NONE:
      case RealignmentLevel.MICRO:
        return RealignmentScope.TASK;
      case RealignmentLevel.PARTIAL:
        return RealignmentScope.WEEK;
      case RealignmentLevel.MAJOR:
        return signals.some(
          (signal) => signal.signal_type === LifeSignalType.GOAL_CHANGE,
        )
          ? RealignmentScope.GOAL
          : RealignmentScope.THIRTY_DAY_PLAN;
      case RealignmentLevel.CRITICAL:
        return RealignmentScope.CHALLENGE;
    }
  }

  private reasonCodes(signals: ZunoLifeSignal[]): RealignmentReasonCode[] {
    const codes = new Set<RealignmentReasonCode>();
    for (const signal of signals) {
      for (const code of signal.reason_codes ?? []) codes.add(code);
    }
    if (
      signals.some(
        (signal) => signal.signal_type === LifeSignalType.STATUS_CHANGE,
      )
    ) {
      codes.add(RealignmentReasonCode.PRIMARY_STRATEGY_INVALIDATED);
    }
    return Array.from(codes);
  }

  /**
   * Step 14 sections 31-34. Patch while the core strategy holds; regenerate
   * when it does not. The threshold is a named constant rather than a number
   * inside a prompt, because section 34 says so explicitly.
   */
  private planChangeMode(
    level: RealignmentLevel,
    signals: ZunoLifeSignal[],
  ): PlanChangeMode {
    if (level === RealignmentLevel.NONE) return PlanChangeMode.NONE;
    if (
      REALIGNMENT_LEVEL_RANK[level] >=
      REALIGNMENT_LEVEL_RANK[RealignmentLevel.MAJOR]
    ) {
      return PlanChangeMode.REGENERATE;
    }
    return signals.length > PLAN_PATCH_MAX_CHANGED_COMPONENTS
      ? PlanChangeMode.REGENERATE
      : PlanChangeMode.PATCH;
  }

  /** Step 14 section 51. */
  private mkaRefreshRequired(
    level: RealignmentLevel,
    codes: RealignmentReasonCode[],
  ): boolean {
    if (
      REALIGNMENT_LEVEL_RANK[level] >=
      REALIGNMENT_LEVEL_RANK[RealignmentLevel.MAJOR]
    ) {
      return true;
    }
    return codes.some((code) =>
      [
        RealignmentReasonCode.GOAL_CHANGED,
        RealignmentReasonCode.SAFETY_CHANGED,
        RealignmentReasonCode.ASTRO_TIMING_CHANGED,
      ].includes(code),
    );
  }

  /**
   * Step 14 sections 64-66.
   *
   * NEW_FACT short-circuits everything: if the user has just told ZUNO they
   * were terminated, asking "would you like me to treat you as terminated?" is
   * absurd (section 66). Confirmation is for choices - dropping a path the user
   * picked, changing a stated goal - not for reality.
   */
  private confirmationRequired(
    level: RealignmentLevel,
    codes: RealignmentReasonCode[],
  ): boolean {
    if (codes.includes(RealignmentReasonCode.NEW_FACT)) return false;
    if (
      codes.includes(RealignmentReasonCode.GOAL_CHANGED) ||
      codes.includes(RealignmentReasonCode.PREFERENCE_CHANGED)
    ) {
      return true;
    }
    return (
      REALIGNMENT_LEVEL_RANK[level] >=
      REALIGNMENT_LEVEL_RANK[RealignmentLevel.MAJOR]
    );
  }

  /**
   * The human-readable "why". Step 14 sections 60-61.
   *
   * Deliberately plain and non-clinical, and it never names an internal id or
   * version. It is also not generated by a model: section 90 wants a concise
   * rationale grounded in the user's own facts, and a template over the stored
   * signals is grounded by construction.
   */
  private explain(level: RealignmentLevel, signals: ZunoLifeSignal[]): string {
    if (level === RealignmentLevel.NONE || signals.length === 0) {
      return 'Nothing here changes our direction yet. Let us stay with the plan.';
    }
    const count = signals.length;
    switch (level) {
      case RealignmentLevel.MICRO:
        return 'Small adjustment: the plan still holds, we are just changing the timing.';
      case RealignmentLevel.PARTIAL:
        return `Part of the plan needs to change. ${count === 1 ? 'What you told me' : 'What you have told me'} affects one area; the rest stays as it is.`;
      case RealignmentLevel.MAJOR:
        return 'This changes our focus. We are keeping what still helps and moving the priority to where it now matters.';
      case RealignmentLevel.CRITICAL:
        return 'This needs our attention now. We are re-shaping the plan around what has just happened.';
    }
  }

  /**
   * The Preserve / Modify / Remove / Add diff. Step 14 sections 12 and 59.
   *
   * With no REALIGNMENT_TARGET bound there are no plan items to classify, so
   * what is recorded is the decision itself rather than an invented list of
   * tasks. Build Rule 128: a fabricated diff would be worse than an honest
   * empty one, and section 102's anti-pattern is regenerating everything.
   */
  private async writeDiff(
    manager: EntityManager,
    realignment: ZunoRealignment,
    signals: ZunoLifeSignal[],
  ): Promise<ZunoRealignmentChange[]> {
    const rows: ZunoRealignmentChange[] = [];

    if (realignment.level === RealignmentLevel.NONE) return rows;

    rows.push(
      manager.create(ZunoRealignmentChange, {
        realignment_id: realignment.id,
        user_id: realignment.user_id,
        entity_type: RealignmentEntityType.CHALLENGE,
        entity_id: realignment.challenge_id,
        change_type: RealignmentChangeType.PRESERVE,
        before_value: null,
        after_value: { note: 'Progress and completed work are kept.' },
        reason:
          'Step 14 section 35: regeneration preserves completed actions, user commitments and known constraints.',
        redacted_at: null,
      }),
    );

    for (const signal of signals) {
      rows.push(
        manager.create(ZunoRealignmentChange, {
          realignment_id: realignment.id,
          user_id: realignment.user_id,
          entity_type: RealignmentEntityType.SCENARIO,
          entity_id: null,
          change_type:
            signal.signal_type === LifeSignalType.OPPORTUNITY
              ? RealignmentChangeType.ADD
              : RealignmentChangeType.MODIFY,
          before_value: null,
          after_value: {
            signal_id: signal.id,
            signal_type: signal.signal_type,
            materiality: signal.materiality,
          },
          reason: realignment.reason,
          redacted_at: null,
        }),
      );
    }

    if (realignment.plan_change_mode === PlanChangeMode.REGENERATE) {
      rows.push(
        manager.create(ZunoRealignmentChange, {
          realignment_id: realignment.id,
          user_id: realignment.user_id,
          entity_type: RealignmentEntityType.PLAN,
          entity_id: null,
          change_type: RealignmentChangeType.REMOVE,
          before_value: { note: 'Actions that no longer fit the situation.' },
          after_value: null,
          reason:
            'Step 14 section 15: actions that are no longer useful are retired, not carried forward.',
          redacted_at: null,
        }),
      );
    }

    return manager.save(ZunoRealignmentChange, rows);
  }

  /**
   * Records which assumptions stopped holding. Step 14 sections 24-25.
   *
   * Only signals that actually invalidate something produce a row - an
   * assumption list padded with things that still hold would make the real
   * invalidation harder to see, not easier.
   */
  private async writeAssumptions(
    manager: EntityManager,
    realignment: ZunoRealignment,
    signals: ZunoLifeSignal[],
  ): Promise<void> {
    const rows = signals
      .filter((signal) =>
        [
          LifeSignalType.STATUS_CHANGE,
          LifeSignalType.GOAL_CHANGE,
          LifeSignalType.PLAN_BLOCKER,
          LifeSignalType.PREFERENCE_CHANGE,
        ].includes(signal.signal_type),
      )
      .map((signal) =>
        manager.create(ZunoRealignmentAssumption, {
          realignment_id: realignment.id,
          user_id: realignment.user_id,
          assumption_key: `SIGNAL_${signal.signal_type}`,
          statement: this.assumptionStatement(signal.signal_type),
          source: 'CURRENT_REALITY',
          status: AssumptionStatus.INVALIDATED,
          invalidated_by_signal_id: signal.id,
          affected_components: [],
          redacted_at: null,
        }),
      );
    if (rows.length > 0) {
      await manager.save(ZunoRealignmentAssumption, rows);
    }
  }

  private assumptionStatement(type: LifeSignalType): string {
    switch (type) {
      case LifeSignalType.STATUS_CHANGE:
        return 'The situation this plan was built around has not changed.';
      case LifeSignalType.GOAL_CHANGE:
        return 'The goal this plan works towards is still the one you want.';
      case LifeSignalType.PLAN_BLOCKER:
        return 'The route this plan takes is still open.';
      case LifeSignalType.PREFERENCE_CHANGE:
        return 'The kinds of action in this plan are ones you are willing to take.';
      default:
        return 'A condition this plan depended on.';
    }
  }

  private async recordAppliedChanges(
    manager: EntityManager,
    realignment: ZunoRealignment,
    applied: {
      cancelled: string[];
      suppressed: string[];
      supersededProgramId: string | null;
      planId: string | null;
      previousPlanId: string | null;
    },
  ): Promise<void> {
    const rows: ZunoRealignmentChange[] = [];

    if (applied.cancelled.length > 0) {
      rows.push(
        manager.create(ZunoRealignmentChange, {
          realignment_id: realignment.id,
          user_id: realignment.user_id,
          entity_type: RealignmentEntityType.PLAN_ITEM,
          entity_id: null,
          change_type: RealignmentChangeType.ITEMS_CANCELLED,
          before_value: { item_ids: applied.cancelled },
          after_value: { status: 'CANCELLED_BY_REALIGNMENT' },
          reason:
            'Step 14 section 74: cancelled because the situation changed, never counted as missed.',
          redacted_at: null,
        }),
      );
    }

    if (applied.suppressed.length > 0) {
      rows.push(
        manager.create(ZunoRealignmentChange, {
          realignment_id: realignment.id,
          user_id: realignment.user_id,
          entity_type: RealignmentEntityType.REMINDER,
          entity_id: null,
          change_type: RealignmentChangeType.REMINDERS_SUPPRESSED,
          before_value: { reminder_ids: applied.suppressed },
          after_value: null,
          reason:
            'Roadmap section 66: notifications for obsolete actions are suppressed.',
          redacted_at: null,
        }),
      );
    }

    if (applied.supersededProgramId) {
      rows.push(
        manager.create(ZunoRealignmentChange, {
          realignment_id: realignment.id,
          user_id: realignment.user_id,
          entity_type: RealignmentEntityType.MKA_PROGRAM,
          entity_id: applied.supersededProgramId,
          change_type: RealignmentChangeType.MKA_SUPERSEDED,
          before_value: { mka_program_id: applied.supersededProgramId },
          after_value: null,
          reason: 'Step 14 section 51: the emotional and timing context changed.',
          redacted_at: null,
        }),
      );
    }

    if (applied.planId) {
      rows.push(
        manager.create(ZunoRealignmentChange, {
          realignment_id: realignment.id,
          user_id: realignment.user_id,
          entity_type: RealignmentEntityType.PLAN,
          entity_id: applied.planId,
          change_type:
            realignment.plan_change_mode === PlanChangeMode.REGENERATE
              ? RealignmentChangeType.PLAN_REPLACED
              : RealignmentChangeType.PLAN_PATCHED,
          before_value: { plan_id: applied.previousPlanId },
          after_value: { plan_id: applied.planId },
          reason: realignment.reason,
          redacted_at: null,
        }),
      );
    }

    if (rows.length > 0) {
      await manager.save(ZunoRealignmentChange, rows);
    }
  }

  /**
   * Clears `realignment_required` on the signals this realignment answered.
   * Step 14 section 108: the same event must not keep driving changes.
   */
  private async settleTriggerSignals(
    manager: EntityManager,
    realignment: ZunoRealignment,
  ): Promise<void> {
    const pending = await manager.find(ZunoLifeSignal, {
      where: {
        user_id: realignment.user_id,
        challenge_id: realignment.challenge_id,
        status: LifeSignalStatus.ACTIVE,
        realignment_required: true,
        deleted_at: IsNull(),
      },
    });
    for (const signal of pending) {
      if (!isConfirmedSignal(signal.confirmation_status)) continue;
      signal.realignment_required = false;
      signal.processed_at = this.clock.now();
      await manager.save(ZunoLifeSignal, signal);
    }
  }

  private moveChallenge(
    challenge: ZunoChallenge,
    to: ChallengeStatus,
    now: Date,
  ): void {
    if (challenge.status === to) return;
    if (!canTransitionChallenge(challenge.status, to)) {
      // Not fatal: a resolved or archived challenge simply does not move. The
      // realignment record itself is still valid and still worth keeping.
      this.logger.debug(
        `Challenge ${challenge.id} stays ${challenge.status}; ${to} is not reachable from there.`,
      );
      return;
    }
    challenge.status = to;
    challenge.updated_at = now;
  }

  private transition(
    from: RealignmentStatus,
    to: RealignmentStatus,
  ): RealignmentStatus {
    if (from === to) return to;
    if (!canTransitionRealignment(from, to)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `illegal realignment transition ${from} -> ${to}`,
      });
    }
    return to;
  }

  /** Step 14 section 85: trigger + context version identify one decision. */
  private triggerFingerprint(
    challengeId: string,
    triggerSignalId: string | null,
    contextVersion: number,
  ): string {
    return createHash('sha256')
      .update(`${challengeId}|${triggerSignalId ?? 'none'}|${contextVersion}`)
      .digest('hex')
      .slice(0, 64);
  }
}
