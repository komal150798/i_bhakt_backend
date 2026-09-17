import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';

import { ZunoPlan } from '../entities/zuno-plan.entity';
import { ZunoPlanItem } from '../entities/zuno-plan-item.entity';
import { ZunoPlanItemEvent } from '../entities/zuno-plan-item-event.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoMkaItem } from '../../mka/entities/zuno-mka-item.entity';
import { ZunoMkaProgram } from '../../mka/entities/zuno-mka-program.entity';
import { MkaService } from '../../mka/services/mka.service';
import { MkaPeriodType, MkaPriority } from '../../mka/enums/mka.enum';
import {
  MkaPlanAggregateType,
  MkaPlanEventType,
} from '../../mka/enums/mka-plan-event.enum';
import { enqueueMkaPlanEvent } from '../../mka/enums/mka-plan-outbox';

import { SafetyService } from '../../safety/services/safety.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { ChallengeStatus, MkaDimension, ZunoDomain } from '../../common/enums';

import {
  canTransitionPlan,
  canTransitionPlanItem,
  CAPACITY_CONSUMING_STATUSES,
  PLAN_ENGINE_VERSION,
  PLAN_ITEM_PRIORITY_RANK,
  PlanItemCategory,
  PlanItemEventSource,
  PlanItemEventType,
  PlanItemPriority,
  PlanItemRealignmentPolicy,
  PlanItemScenarioScope,
  PlanItemSource,
  PlanItemStatus,
  PlanReviewTrigger,
  PlanStatus,
  PlanType,
} from '../enums/plan.enum';
import {
  CapacityUsage,
  measureCapacity,
  PlanCapacityLimits,
  planCapacityFor,
  wouldExceedCapacity,
} from '../enums/plan-capacity';

export interface GeneratePlanParams {
  user: ZunoUser;
  challengeId: string;
  planType?: PlanType;
  /** Forces a new version even when an equivalent plan is already active. */
  regenerate?: boolean;
  reason?: string;
}

export interface PlanWithItems {
  plan: ZunoPlan;
  items: ZunoPlanItem[];
}

export interface TransitionItemParams {
  user: ZunoUser;
  itemId: string;
  to: PlanItemStatus;
  reason?: string;
  note?: string;
  /** For DEFERRED. Step 16 section 58: the user may reschedule. */
  deferredTo?: string;
  source?: PlanItemEventSource;
  expectedVersion?: number;
}

/** A plan item that has been selected but not yet persisted. */
interface PlanItemCandidate {
  title: string;
  description: string | null;
  whyThisMatters: string | null;
  category: PlanItemCategory;
  priority: PlanItemPriority;
  isPractice: boolean;
  estimatedMinutes: number | null;
  sourceType: PlanItemSource;
  sourceRefId: string | null;
  mkaItemId: string | null;
  scenarioScope: PlanItemScenarioScope;
  karmaEligible: boolean;
  realignmentPolicy: PlanItemRealignmentPolicy;
  scheduledDate: string | null;
  dueAt: Date | null;
}

/**
 * The Plan Engine.
 * Step 16 Plan Engine Specification, Step 20 Data Model sections 39-43.
 *
 * Turns a challenge and its MKA programme into an executable plan for one
 * horizon, and owns the action lifecycle from there on.
 *
 * WHAT THE ENGINE OWNS AND WHAT IT DOES NOT.
 * Step 16 section 94 draws the line: an LLM may help word a task, but ids,
 * statuses, versions, priority constraints, recurrence, dependencies,
 * deadlines, MKA provenance, safety constraints and audit history belong to the
 * software. Nothing in this class calls a model. Every task it creates is
 * either an MKA practice the MKA engine already produced, or text the user's
 * own understanding already contained.
 *
 * CAPACITY IS ENFORCED, NOT SUGGESTED.
 * Step 16 section 27 caps a TODAY plan at 1-3 meaningful actions and a WEEK at
 * 3-7, with MKA micro-practices sitting alongside. `enforceCapacity` below is
 * the only place items become part of the active horizon, and it cannot be
 * bypassed: `generate` routes every candidate through it, and `addItem` calls
 * the same check before a user-created task can join a full plan.
 *
 * THE LIFECYCLE IS A STATE MACHINE.
 * `transitionItem` is the single write path for status. An illegal move raises
 * a ZUNO CONFLICT - never a silent no-op - because the distinctions Step 16
 * section 17 draws (MISSED vs CANCELLED_BY_REALIGNMENT vs SKIPPED) only mean
 * anything if they cannot be quietly overwritten.
 */
@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(
    @InjectRepository(ZunoPlan)
    private readonly plans: Repository<ZunoPlan>,
    @InjectRepository(ZunoPlanItem)
    private readonly items: Repository<ZunoPlanItem>,
    @InjectRepository(ZunoPlanItemEvent)
    private readonly itemEvents: Repository<ZunoPlanItemEvent>,
    @InjectRepository(ZunoChallenge)
    private readonly challenges: Repository<ZunoChallenge>,
    private readonly mka: MkaService,
    private readonly safety: SafetyService,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
  ) {}

  // -------------------------------------------------------------------------
  // Generation
  // -------------------------------------------------------------------------

  /**
   * Builds a plan for a challenge over one horizon.
   *
   * The pipeline, in order:
   *   ownership -> safety pre-check -> ensure MKA -> candidates -> capacity ->
   *   persist (active items + deferred overflow) -> events
   *
   * Safety runs before anything is assembled, matching `ChallengeService` and
   * `MkaService`. Step 16 section 69 gives Safety & Trust the right to suspend
   * ordinary plan prioritisation entirely, which it can only do if it has
   * spoken first.
   *
   * Idempotent by default (Step 16 section 88): an ACTIVE plan of the same type
   * built from the same MKA programme at the same context version is returned
   * rather than duplicated.
   */
  async generate(params: GeneratePlanParams): Promise<PlanWithItems> {
    const planType = params.planType ?? PlanType.TODAY;
    const challenge = await this.findOwnedChallenge(
      params.user.id,
      params.challengeId,
    );

    if (
      challenge.status === ChallengeStatus.ARCHIVED ||
      challenge.status === ChallengeStatus.RESOLVED
    ) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `cannot build a plan for a ${challenge.status} challenge`,
      });
    }

    // --- SAFETY, BEFORE ANYTHING IS BUILT --------------------------------
    const initial = this.safety.preCheck({
      operation: 'PLAN_GENERATE',
      userId: params.user.id,
      challengeId: challenge.id,
      text: challenge.raw_user_statement,
      domains: [],
    });
    const domains: ZunoDomain[] = challenge.primary_domain
      ? [challenge.primary_domain]
      : [];
    const assessment = this.safety.refineWithDomains(initial, {
      operation: 'PLAN_GENERATE',
      userId: params.user.id,
      challengeId: challenge.id,
      text: challenge.raw_user_statement,
      domains,
    });

    if (assessment.blocked) {
      await this.dataSource.transaction(async (manager) => {
        const decision = await this.safety.recordDecision(manager, {
          userId: params.user.id,
          challengeId: challenge.id,
          operation: 'PLAN_GENERATE',
          assessment,
        });
        await this.safety.recordIncident(manager, {
          userId: params.user.id,
          safetyDecisionId: decision.id,
          source: 'PLAN_GENERATE_PRECHECK',
          domain: domains[0] ?? null,
          severity: assessment.riskLevel,
          violations: [],
        });
      });
      throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
        message:
          assessment.boundaryMessage ??
          'I am not able to build a plan around this one, and I would rather say so plainly.',
        safety: {
          disposition: assessment.disposition,
          domain: assessment.domains[0],
        },
      });
    }

    // --- MKA IS THE INPUT ------------------------------------------------
    // Step 16 section 1 and the architecture in section 112: the Plan Engine
    // schedules what the MKA engine produced. If no programme exists yet, one
    // is generated rather than the plan inventing its own tasks - that would
    // be the "generic productivity app" anti-pattern of section 103.
    let program = await this.mka.findActiveProgram(params.user.id, challenge.id);
    if (!program) {
      const generated = await this.mka.generate({
        user: params.user,
        challengeId: challenge.id,
        period: MkaPeriodType.WEEK,
        reason: 'PLAN_REQUIREMENT',
      });
      program = generated.program;
    }
    const mkaItems = await this.mka.planEligibleItems(program.id);

    const existing = await this.findActivePlan(
      params.user.id,
      challenge.id,
      planType,
    );
    if (
      existing &&
      !params.regenerate &&
      existing.mka_program_id === program.id &&
      existing.context_version === challenge.context_version
    ) {
      return { plan: existing, items: await this.itemsFor(existing.id) };
    }

    const limits = planCapacityFor(planType);
    const { startDate, endDate } = this.horizonWindow(planType);
    const candidates = this.rank(
      this.candidatesFromMka(mkaItems, challenge, startDate),
    );
    const { active, overflow } = this.enforceCapacity(candidates, limits);

    return this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: params.user.id,
        challengeId: challenge.id,
        operation: 'PLAN_GENERATE',
        assessment,
      });

      const previous = existing
        ? await this.supersede(manager, existing, params.user.id)
        : null;

      const plan = manager.create(ZunoPlan, {
        user_id: params.user.id,
        challenge_id: challenge.id,
        mka_program_id: program.id,
        plan_type: planType,
        title: this.planTitle(planType),
        primary_goal: challenge.title ?? null,
        start_date: startDate,
        end_date: endDate,
        status: PlanStatus.DRAFT,
        // Step 16 section 60: persist the zone explicitly where scheduling
        // matters. Taken from the resolved ZUNO user, which is the only place
        // it is authoritative.
        timezone: params.user.timezone ?? null,
        review_trigger:
          planType === PlanType.TODAY
            ? PlanReviewTrigger.END_OF_WEEK
            : PlanReviewTrigger.END_OF_HORIZON,
        review_at: endDate,
        generated_from_realignment_id: null,
        superseded_by_id: null,
        context_version: challenge.context_version,
        safety_decision_id: decision.id,
        engine_version: PLAN_ENGINE_VERSION,
        generated_reason:
          params.reason ?? (previous ? 'REGENERATED' : 'INITIAL_GENERATION'),
        capacity_snapshot: limits,
        activated_at: null,
        completed_at: null,
      });
      const savedPlan = await manager.save(ZunoPlan, plan);

      if (previous) {
        previous.superseded_by_id = savedPlan.id;
        await manager.save(ZunoPlan, previous);
      }

      // Step 15 section 36: the programme records which plan schedules it.
      program.plan_id = savedPlan.id;
      await manager.save(ZunoMkaProgram, program);

      const activeRows = active.map((candidate, index) =>
        this.toRow(manager, savedPlan, candidate, PlanItemStatus.PENDING, index),
      );

      /**
       * Overflow is DEFERRED, never dropped.
       *
       * Step 16 sections 54-55 reassess unfinished work rather than discarding
       * it, and section 29 treats simplification as a valid improvement - but
       * simplification means moving work out of today, not deleting it. A
       * CAPACITY_DEFERRED event records why, so a later reader does not read
       * the deferral as the user's choice.
       */
      const overflowRows = overflow.map((candidate, index) => {
        const row = this.toRow(
          manager,
          savedPlan,
          candidate,
          PlanItemStatus.DEFERRED,
          active.length + index,
        );
        row.scheduled_date = null;
        row.priority = PlanItemPriority.OPTIONAL;
        row.priority_rank = PLAN_ITEM_PRIORITY_RANK[PlanItemPriority.OPTIONAL];
        return row;
      });

      const savedItems = await manager.save(ZunoPlanItem, [
        ...activeRows,
        ...overflowRows,
      ]);

      for (const item of savedItems) {
        await this.recordItemEvent(manager, item, {
          eventType:
            item.status === PlanItemStatus.DEFERRED
              ? PlanItemEventType.CAPACITY_DEFERRED
              : PlanItemEventType.CREATED,
          oldStatus: null,
          newStatus: item.status,
          reason:
            item.status === PlanItemStatus.DEFERRED
              ? 'Outside this horizon to keep the plan realistic.'
              : null,
          source: PlanItemEventSource.PLAN_ENGINE,
        });
      }

      await this.audit.record(manager, {
        actorType: 'SYSTEM',
        userId: params.user.id,
        action: 'PLAN_GENERATED',
        entityType: 'ZunoPlan',
        entityId: savedPlan.id,
        after: {
          status: savedPlan.status,
          plan_type: planType,
          active_items: activeRows.length,
          deferred_items: overflowRows.length,
        },
        metadata: {
          challengeId: challenge.id,
          mkaProgramId: program.id,
          capacity: limits,
        },
      });

      await enqueueMkaPlanEvent(this.outbox, manager, {
        aggregateType: MkaPlanAggregateType.PLAN,
        aggregateId: savedPlan.id,
        eventType: MkaPlanEventType.PLAN_GENERATED,
        payload: {
          plan_id: savedPlan.id,
          challenge_id: challenge.id,
          user_id: params.user.id,
          mka_program_id: program.id,
          plan_type: planType,
          active_item_count: activeRows.length,
          deferred_item_count: overflowRows.length,
        },
      });

      // Step 16 section 27 names a floor as well as a ceiling. Falling short is
      // logged, never corrected by inventing work - section 19 plans from
      // outcomes, and padding to a number is exactly the behaviour it warns
      // against.
      if (activeRows.filter((row) => !row.is_practice).length < limits.minActions) {
        this.logger.log(
          `Plan ${savedPlan.id} has fewer than ${limits.minActions} actions; the challenge context did not support more.`,
        );
      }

      return { plan: savedPlan, items: savedItems };
    });
  }

  // -------------------------------------------------------------------------
  // Capacity - the rule this engine exists to hold
  // -------------------------------------------------------------------------

  /**
   * Splits ranked candidates into what fits this horizon and what does not.
   *
   * Step 16 section 27 for the ceilings, section 15 for the ESSENTIAL cap.
   *
   * Surplus ESSENTIALs are DEMOTED rather than deferred. Losing the action
   * entirely would be worse than losing its emphasis, and section 15's point is
   * that marking everything urgent communicates nothing - the item is still
   * worth doing, it simply is not the one thing that must happen.
   */
  enforceCapacity(
    candidates: PlanItemCandidate[],
    limits: PlanCapacityLimits,
  ): { active: PlanItemCandidate[]; overflow: PlanItemCandidate[] } {
    const active: PlanItemCandidate[] = [];
    const overflow: PlanItemCandidate[] = [];
    let usage: CapacityUsage = {
      actions: 0,
      essentials: 0,
      practices: 0,
      estimatedMinutes: 0,
    };

    for (const candidate of candidates) {
      if (wouldExceedCapacity(usage, limits, candidate)) {
        overflow.push(candidate);
        continue;
      }

      const admitted: PlanItemCandidate =
        !candidate.isPractice &&
        candidate.priority === PlanItemPriority.ESSENTIAL &&
        usage.essentials >= limits.maxEssential
          ? { ...candidate, priority: PlanItemPriority.IMPORTANT }
          : candidate;

      active.push(admitted);
      usage = measureCapacity(active);
    }

    if (usage.estimatedMinutes > limits.maxEstimatedMinutes) {
      // Advisory only. Step 16 section 28 lists excess estimated time as an
      // overload signal to consider, not a hard limit - estimates are rough
      // (section 94 calls them "rough effort suggestions") and refusing to
      // schedule real work on the strength of a guess would be worse.
      this.logger.log(
        `Plan load is ${usage.estimatedMinutes} estimated minutes against a guideline of ${limits.maxEstimatedMinutes}; flagged for plan-fit review.`,
      );
    }

    return { active, overflow };
  }

  /**
   * Current load of a plan, counting only what is actually on the user's list.
   */
  async currentUsage(planId: string): Promise<CapacityUsage> {
    const rows = await this.items.find({
      where: {
        plan_id: planId,
        status: In([...CAPACITY_CONSUMING_STATUSES]),
        deleted_at: IsNull(),
      },
    });
    return measureCapacity(
      rows.map((row) => ({
        priority: row.priority,
        isPractice: row.is_practice,
        estimatedMinutes: row.estimated_minutes,
      })),
    );
  }

  /**
   * Adds a user-created task, subject to the same ceiling.
   *
   * Step 16 sections 56-58 let users add their own work and ZUNO must not
   * silently delete it - so when the plan is already full this refuses loudly
   * with a 409 rather than quietly accepting an over-capacity plan. The user
   * can then complete, defer or remove something first, which is the
   * conversation section 29 wants to have.
   */
  async addItem(
    user: ZunoUser,
    planId: string,
    input: {
      title: string;
      description?: string;
      category?: PlanItemCategory;
      priority?: PlanItemPriority;
      estimatedMinutes?: number;
      scheduledDate?: string;
      isCommitment?: boolean;
    },
  ): Promise<ZunoPlanItem> {
    const plan = await this.findOwnedPlan(user.id, planId);
    if (plan.status !== PlanStatus.ACTIVE && plan.status !== PlanStatus.DRAFT) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `cannot add an item to a ${plan.status} plan`,
      });
    }

    const limits = planCapacityFor(plan.plan_type);
    const usage = await this.currentUsage(plan.id);
    const candidate: PlanItemCandidate = {
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      whyThisMatters: null,
      category: input.category ?? PlanItemCategory.OTHER,
      priority: input.priority ?? PlanItemPriority.IMPORTANT,
      isPractice: false,
      estimatedMinutes: input.estimatedMinutes ?? null,
      sourceType: input.isCommitment
        ? PlanItemSource.USER_COMMITMENT
        : PlanItemSource.USER_CREATED,
      sourceRefId: null,
      mkaItemId: null,
      scenarioScope: PlanItemScenarioScope.SHARED_ACROSS_SCENARIOS,
      karmaEligible: false,
      realignmentPolicy: PlanItemRealignmentPolicy.ALWAYS_PRESERVE,
      scheduledDate: input.scheduledDate ?? plan.start_date,
      dueAt: null,
    };

    if (wouldExceedCapacity(usage, limits, candidate)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message:
          'This plan is already as full as it usefully can be. Finish, move or remove something first.',
        internalDetail: `plan ${plan.id} at capacity: ${usage.actions}/${limits.maxActions} actions, ${usage.practices}/${limits.maxPractices} practices`,
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const order = await manager.count(ZunoPlanItem, {
        where: { plan_id: plan.id },
      });
      const row = this.toRow(
        manager,
        plan,
        candidate,
        PlanItemStatus.PENDING,
        order,
      );
      const saved = await manager.save(ZunoPlanItem, row);
      await this.recordItemEvent(manager, saved, {
        eventType: PlanItemEventType.CREATED,
        oldStatus: null,
        newStatus: saved.status,
        reason: null,
        source: PlanItemEventSource.USER,
      });
      return saved;
    });
  }

  // -------------------------------------------------------------------------
  // Candidate construction and ranking
  // -------------------------------------------------------------------------

  private candidatesFromMka(
    mkaItems: ZunoMkaItem[],
    challenge: ZunoChallenge,
    startDate: string,
  ): PlanItemCandidate[] {
    return mkaItems.map((item) => {
      const isPractice =
        item.dimension === MkaDimension.MIND ||
        item.dimension === MkaDimension.KARMA;
      return {
        title: item.title,
        description: item.description,
        whyThisMatters: item.purpose,
        category: this.categoryFor(item, challenge),
        priority: this.priorityFor(item.priority),
        isPractice,
        estimatedMinutes: item.duration_minutes,
        sourceType: this.sourceFor(item.dimension),
        sourceRefId: item.id,
        mkaItemId: item.id,
        // Every MKA action is shared preparation until the Scenario Engine
        // exists to say otherwise. Step 16 sections 22 and 34 rank shared
        // preparation highest, and treating an unclassified action as
        // scenario-specific would demote work that is useful whatever happens.
        scenarioScope: PlanItemScenarioScope.SHARED_ACROSS_SCENARIOS,
        karmaEligible: item.karma_eligible,
        realignmentPolicy: isPractice
          ? PlanItemRealignmentPolicy.PRESERVE_IF_RELEVANT
          : PlanItemRealignmentPolicy.REPLACEABLE,
        scheduledDate: startDate,
        // Step 16 section 33: never invent a hard deadline. Until a real one is
        // known - from the user, a document, an exam or an offer - there is
        // none.
        dueAt: null,
      };
    });
  }

  /**
   * Ranking. Step 16 section 35 lists the inputs for Today selection.
   *
   * Order: priority, then scenario breadth (shared preparation first, per
   * sections 22 and 34), then a real deadline, then practices last so the
   * action budget is filled from the most useful end.
   */
  private rank(candidates: PlanItemCandidate[]): PlanItemCandidate[] {
    return [...candidates].sort((a, b) => {
      const byPriority =
        PLAN_ITEM_PRIORITY_RANK[a.priority] - PLAN_ITEM_PRIORITY_RANK[b.priority];
      if (byPriority !== 0) return byPriority;

      const byScope = scopeRank(a.scenarioScope) - scopeRank(b.scenarioScope);
      if (byScope !== 0) return byScope;

      const aDue = a.dueAt ? a.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueAt ? b.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
      if (aDue !== bDue) return aDue - bDue;

      return Number(a.isPractice) - Number(b.isPractice);
    });
  }

  private categoryFor(
    item: ZunoMkaItem,
    challenge: ZunoChallenge,
  ): PlanItemCategory {
    if (item.dimension === MkaDimension.MIND) return PlanItemCategory.MIND;
    if (item.dimension === MkaDimension.KARMA) return PlanItemCategory.KARMA;
    return DOMAIN_TO_CATEGORY[challenge.primary_domain ?? ZunoDomain.GENERAL];
  }

  private priorityFor(priority: MkaPriority): PlanItemPriority {
    switch (priority) {
      case MkaPriority.ESSENTIAL:
        return PlanItemPriority.ESSENTIAL;
      case MkaPriority.OPTIONAL:
        return PlanItemPriority.OPTIONAL;
      default:
        return PlanItemPriority.IMPORTANT;
    }
  }

  private sourceFor(dimension: MkaDimension): PlanItemSource {
    switch (dimension) {
      case MkaDimension.MIND:
        return PlanItemSource.MKA_MIND;
      case MkaDimension.KARMA:
        return PlanItemSource.MKA_KARMA;
      default:
        return PlanItemSource.MKA_ACTION;
    }
  }

  private toRow(
    manager: EntityManager,
    plan: ZunoPlan,
    candidate: PlanItemCandidate,
    status: PlanItemStatus,
    order: number,
  ): ZunoPlanItem {
    return manager.create(ZunoPlanItem, {
      plan_id: plan.id,
      user_id: plan.user_id,
      parent_item_id: null,
      title: candidate.title,
      description: candidate.description,
      why_this_matters: candidate.whyThisMatters,
      category: candidate.category,
      priority: candidate.priority,
      priority_rank: PLAN_ITEM_PRIORITY_RANK[candidate.priority],
      is_practice: candidate.isPractice,
      status,
      scheduled_date: candidate.scheduledDate,
      due_at: candidate.dueAt,
      due_source: null,
      estimated_minutes: candidate.estimatedMinutes,
      source_type: candidate.sourceType,
      source_ref_id: candidate.sourceRefId,
      mka_item_id: candidate.mkaItemId,
      scenario_scope: candidate.scenarioScope,
      scenario_refs: [],
      trigger_condition: null,
      depends_on_item_ids: [],
      karma_eligible: candidate.karmaEligible,
      realignment_policy: candidate.realignmentPolicy,
      is_hypothetical: false,
      display_order: order,
      started_at: null,
      completed_at: null,
      deferred_to: null,
      blocked_reason: null,
      deferral_count: 0,
      user_note: null,
    });
  }

  // -------------------------------------------------------------------------
  // Action lifecycle
  // -------------------------------------------------------------------------

  /**
   * The single write path for an item's status.
   *
   * Every rule that makes the lifecycle meaningful is enforced here rather than
   * in the controllers, so there is exactly one place to read and one place to
   * break:
   *
   *   - the transition must be legal (`PLAN_ITEM_STATUS_TRANSITIONS`);
   *   - dependencies must be satisfied before work starts or completes
   *     (Step 16 sections 31-32);
   *   - the plan must be in a state that accepts progress (Build Rule 46: a
   *     superseded plan must not continue behaving as current);
   *   - an immutable event row is written (Step 20 section 43);
   *   - the outbox event the Karma Ledger consumes is emitted in the same
   *     transaction as the state change (Step 20 sections 105-106).
   */
  async transitionItem(params: TransitionItemParams): Promise<ZunoPlanItem> {
    const item = await this.findOwnedItem(params.user.id, params.itemId);
    const plan = await this.findOwnedPlan(params.user.id, item.plan_id);

    if (plan.status !== PlanStatus.ACTIVE && plan.status !== PlanStatus.DRAFT) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `plan ${plan.id} is ${plan.status}; it no longer accepts progress`,
      });
    }

    const from = item.status;
    const to = this.assertTransition(from, params.to);

    if (
      to === PlanItemStatus.IN_PROGRESS ||
      to === PlanItemStatus.DONE
    ) {
      await this.assertDependenciesSatisfied(item);
    }

    if (from === to) return item;

    const now = this.clock.now();

    return this.dataSource.transaction(async (manager) => {
      item.status = to;
      if (to === PlanItemStatus.IN_PROGRESS && !item.started_at) {
        item.started_at = now;
      }
      if (to === PlanItemStatus.DONE) {
        item.completed_at = now;
      }
      if (to === PlanItemStatus.DEFERRED) {
        item.deferred_to = params.deferredTo ?? null;
        item.deferral_count += 1;
      }
      if (to === PlanItemStatus.BLOCKED) {
        item.blocked_reason = params.reason ?? null;
      }
      if (params.note !== undefined) {
        item.user_note = params.note;
      }
      const saved = await manager.save(ZunoPlanItem, item);

      await this.recordItemEvent(manager, saved, {
        eventType: PlanItemEventType.STATUS_CHANGED,
        oldStatus: from,
        newStatus: to,
        reason: params.reason ?? null,
        source: params.source ?? PlanItemEventSource.USER,
      });

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: params.user.id,
        userId: params.user.id,
        action: `PLAN_ITEM_${to}`,
        entityType: 'ZunoPlanItem',
        entityId: saved.id,
        before: { status: from },
        after: { status: to },
      });

      const eventType = ITEM_EVENT_FOR_STATUS[to];
      if (eventType) {
        await enqueueMkaPlanEvent(this.outbox, manager, {
          aggregateType: MkaPlanAggregateType.PLAN_ITEM,
          aggregateId: saved.id,
          eventType,
          payload: {
            plan_item_id: saved.id,
            plan_id: plan.id,
            challenge_id: plan.challenge_id,
            user_id: params.user.id,
            mka_item_id: saved.mka_item_id,
            category: saved.category,
            priority: saved.priority,
            // The Karma Ledger owns scoring. This states eligibility only
            // (Step 15 section 65, Step 16 section 53).
            karma_eligible: saved.karma_eligible,
            from_status: from,
            to_status: to,
          },
        });
      }

      /**
       * Step 16 section 80 and Rule 8: repeated deferral triggers a plan-fit
       * review, not a guilt notification. The threshold is deliberately low -
       * a third deferral is already the system telling us the plan does not fit
       * the user's week.
       */
      if (to === PlanItemStatus.DEFERRED && saved.deferral_count >= 3) {
        await enqueueMkaPlanEvent(this.outbox, manager, {
          aggregateType: MkaPlanAggregateType.PLAN,
          aggregateId: plan.id,
          eventType: MkaPlanEventType.PLAN_FIT_REVIEW,
          payload: {
            plan_id: plan.id,
            user_id: params.user.id,
            plan_item_id: saved.id,
            deferral_count: saved.deferral_count,
            reason: 'REPEATED_DEFERRAL',
          },
        });
      }

      return saved;
    });
  }

  /** Step 21 section 50: `POST /plan-items/{itemId}/complete`. */
  async completeItem(
    user: ZunoUser,
    itemId: string,
    options: { note?: string } = {},
  ): Promise<ZunoPlanItem> {
    return this.transitionItem({
      user,
      itemId,
      to: PlanItemStatus.DONE,
      note: options.note,
    });
  }

  /** Step 21 section 50: `POST /plan-items/{itemId}/defer`. */
  async deferItem(
    user: ZunoUser,
    itemId: string,
    options: { to?: string; reason?: string } = {},
  ): Promise<ZunoPlanItem> {
    return this.transitionItem({
      user,
      itemId,
      to: PlanItemStatus.DEFERRED,
      deferredTo: options.to,
      reason: options.reason,
    });
  }

  /** Step 21 section 50: `POST /plan-items/{itemId}/skip`. */
  async skipItem(
    user: ZunoUser,
    itemId: string,
    options: { reason?: string } = {},
  ): Promise<ZunoPlanItem> {
    return this.transitionItem({
      user,
      itemId,
      to: PlanItemStatus.SKIPPED,
      reason: options.reason,
    });
  }

  async startItem(user: ZunoUser, itemId: string): Promise<ZunoPlanItem> {
    return this.transitionItem({
      user,
      itemId,
      to: PlanItemStatus.IN_PROGRESS,
    });
  }

  /** Step 16 section 79: a material blocker may become a Life Signal. */
  async blockItem(
    user: ZunoUser,
    itemId: string,
    reason: string,
  ): Promise<ZunoPlanItem> {
    return this.transitionItem({
      user,
      itemId,
      to: PlanItemStatus.BLOCKED,
      reason,
    });
  }

  /**
   * Step 16 sections 31-32: sequence dependencies correctly.
   *
   * Enforced rather than displayed. "Speak with the bank" before "collect the
   * loan documents" is not merely out of order - it wastes the appointment.
   */
  private async assertDependenciesSatisfied(item: ZunoPlanItem): Promise<void> {
    const ids = item.depends_on_item_ids ?? [];
    if (ids.length === 0) return;

    const blockers = await this.items.find({
      where: { id: In(ids), user_id: item.user_id },
    });
    const unmet = blockers.filter((b) => b.status !== PlanItemStatus.DONE);
    if (unmet.length > 0) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: 'Something else needs to happen before this one.',
        internalDetail: `plan item ${item.id} depends on unfinished items: ${unmet
          .map((b) => b.id)
          .join(',')}`,
      });
    }
  }

  /** Build Rule 179: an illegal action transition fails loudly. */
  assertTransition(from: PlanItemStatus, to: PlanItemStatus): PlanItemStatus {
    if (from === to) return to;
    if (!canTransitionPlanItem(from, to)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: 'That is not a change we can make to this one.',
        internalDetail: `illegal plan item transition ${from} -> ${to}`,
      });
    }
    return to;
  }

  // -------------------------------------------------------------------------
  // Plan lifecycle
  // -------------------------------------------------------------------------

  /**
   * Step 16 section 85 / Step 21 section 50: activation happens only after the
   * validations pass.
   *
   * The validation that matters is capacity: a plan that would exceed the
   * ceiling must not become the thing the user opens every morning.
   */
  async activate(
    user: ZunoUser,
    planId: string,
    expectedVersion?: number,
  ): Promise<ZunoPlan> {
    const plan = await this.findOwnedPlan(user.id, planId);
    this.ownership.assertVersion(plan, expectedVersion);

    const limits = planCapacityFor(plan.plan_type);
    const usage = await this.currentUsage(plan.id);
    if (usage.actions > limits.maxActions || usage.practices > limits.maxPractices) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: 'This plan is asking for more than a week can hold.',
        internalDetail: `plan ${plan.id} over capacity at activation: ${usage.actions}/${limits.maxActions} actions, ${usage.practices}/${limits.maxPractices} practices`,
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const before = plan.status;
      plan.status = this.assertPlanTransition(before, PlanStatus.ACTIVE);
      plan.activated_at = this.clock.now();
      const saved = await manager.save(ZunoPlan, plan);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'PLAN_ACTIVATED',
        entityType: 'ZunoPlan',
        entityId: plan.id,
        before: { status: before },
        after: { status: saved.status },
      });
      await enqueueMkaPlanEvent(this.outbox, manager, {
        aggregateType: MkaPlanAggregateType.PLAN,
        aggregateId: plan.id,
        eventType: MkaPlanEventType.PLAN_ACTIVATED,
        payload: {
          plan_id: plan.id,
          user_id: user.id,
          challenge_id: plan.challenge_id,
        },
      });
      return saved;
    });
  }

  /** Step 21 section 50: `PATCH /plans/{planId}`. */
  async patch(
    user: ZunoUser,
    planId: string,
    input: {
      title?: string;
      primaryGoal?: string;
      status?: PlanStatus;
      version?: number;
    },
  ): Promise<ZunoPlan> {
    const plan = await this.findOwnedPlan(user.id, planId);
    this.ownership.assertVersion(plan, input.version);

    return this.dataSource.transaction(async (manager) => {
      const before = { status: plan.status, title: plan.title };
      if (input.title !== undefined) plan.title = input.title.trim();
      if (input.primaryGoal !== undefined) {
        plan.primary_goal = input.primaryGoal.trim() || null;
      }
      if (input.status !== undefined) {
        plan.status = this.assertPlanTransition(plan.status, input.status);
        if (input.status === PlanStatus.COMPLETED) {
          plan.completed_at = this.clock.now();
        }
      }
      const saved = await manager.save(ZunoPlan, plan);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'PLAN_PATCHED',
        entityType: 'ZunoPlan',
        entityId: plan.id,
        before,
        after: { status: saved.status, title: saved.title },
      });
      await enqueueMkaPlanEvent(this.outbox, manager, {
        aggregateType: MkaPlanAggregateType.PLAN,
        aggregateId: plan.id,
        eventType:
          saved.status === PlanStatus.COMPLETED
            ? MkaPlanEventType.PLAN_COMPLETED
            : MkaPlanEventType.PLAN_PATCHED,
        payload: {
          plan_id: plan.id,
          user_id: user.id,
          challenge_id: plan.challenge_id,
          status: saved.status,
        },
      });
      return saved;
    });
  }

  /**
   * Retires a plan when a new version takes over.
   *
   * Step 16 section 90: generate, validate, preserve history, activate the new
   * version, supersede the previous one. Completed items are untouched
   * (section 109), and unfinished ones become CANCELLED_BY_REALIGNMENT rather
   * than MISSED (section 47 and Golden Test 100).
   */
  private async supersede(
    manager: EntityManager,
    plan: ZunoPlan,
    userId: string,
  ): Promise<ZunoPlan> {
    const before = plan.status;
    plan.status = this.assertPlanTransition(before, PlanStatus.SUPERSEDED);
    const saved = await manager.save(ZunoPlan, plan);

    const openItems = await manager.find(ZunoPlanItem, {
      where: {
        plan_id: plan.id,
        status: In([
          PlanItemStatus.PENDING,
          PlanItemStatus.IN_PROGRESS,
          PlanItemStatus.DEFERRED,
          PlanItemStatus.BLOCKED,
          PlanItemStatus.CONDITIONAL,
        ]),
      },
    });
    for (const item of openItems) {
      const from = item.status;
      item.status = this.assertTransition(
        from,
        PlanItemStatus.CANCELLED_BY_REALIGNMENT,
      );
      await manager.save(ZunoPlanItem, item);
      await this.recordItemEvent(manager, item, {
        eventType: PlanItemEventType.STATUS_CHANGED,
        oldStatus: from,
        newStatus: item.status,
        reason: 'Replaced by a newer version of this plan.',
        source: PlanItemEventSource.PLAN_ENGINE,
      });
    }

    await this.audit.record(manager, {
      actorType: 'SYSTEM',
      userId,
      action: 'PLAN_SUPERSEDED',
      entityType: 'ZunoPlan',
      entityId: plan.id,
      before: { status: before },
      after: { status: saved.status },
    });
    await enqueueMkaPlanEvent(this.outbox, manager, {
      aggregateType: MkaPlanAggregateType.PLAN,
      aggregateId: plan.id,
      eventType: MkaPlanEventType.PLAN_SUPERSEDED,
      payload: {
        plan_id: plan.id,
        user_id: userId,
        challenge_id: plan.challenge_id,
        cancelled_item_count: openItems.length,
      },
    });
    return saved;
  }

  assertPlanTransition(from: PlanStatus, to: PlanStatus): PlanStatus {
    if (from === to) return to;
    if (!canTransitionPlan(from, to)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `illegal plan transition ${from} -> ${to}`,
      });
    }
    return to;
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  async findOwnedChallenge(
    userId: string,
    challengeId: string,
  ): Promise<ZunoChallenge> {
    const challenge = await this.challenges.findOne({
      where: { id: challengeId, deleted_at: IsNull() },
    });
    return this.ownership.require(challenge, userId, 'challenge');
  }

  async findOwnedPlan(userId: string, planId: string): Promise<ZunoPlan> {
    const plan = await this.plans.findOne({
      where: { id: planId, deleted_at: IsNull() },
    });
    return this.ownership.require(plan, userId, 'plan');
  }

  async findOwnedItem(userId: string, itemId: string): Promise<ZunoPlanItem> {
    const item = await this.items.findOne({
      where: { id: itemId, deleted_at: IsNull() },
    });
    return this.ownership.require(item, userId, 'plan item');
  }

  async findActivePlan(
    userId: string,
    challengeId: string,
    planType: PlanType,
  ): Promise<ZunoPlan | null> {
    return this.plans.findOne({
      where: {
        user_id: userId,
        challenge_id: challengeId,
        plan_type: planType,
        status: In([PlanStatus.DRAFT, PlanStatus.ACTIVE]),
        deleted_at: IsNull(),
      },
      order: { created_at: 'DESC' },
    });
  }

  async itemsFor(planId: string): Promise<ZunoPlanItem[]> {
    return this.items.find({
      where: { plan_id: planId, deleted_at: IsNull() },
      order: { display_order: 'ASC' },
    });
  }

  async detail(user: ZunoUser, planId: string): Promise<PlanWithItems> {
    const plan = await this.findOwnedPlan(user.id, planId);
    return { plan, items: await this.itemsFor(plan.id) };
  }

  async listForChallenge(
    user: ZunoUser,
    challengeId: string,
  ): Promise<ZunoPlan[]> {
    await this.findOwnedChallenge(user.id, challengeId);
    return this.plans.find({
      where: { user_id: user.id, challenge_id: challengeId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async list(userId: string): Promise<ZunoPlan[]> {
    return this.plans.find({
      where: { user_id: userId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async historyFor(
    user: ZunoUser,
    itemId: string,
  ): Promise<ZunoPlanItemEvent[]> {
    await this.findOwnedItem(user.id, itemId);
    return this.itemEvents.find({
      where: { plan_item_id: itemId, user_id: user.id },
      order: { created_at: 'ASC' },
    });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async recordItemEvent(
    manager: EntityManager,
    item: ZunoPlanItem,
    input: {
      eventType: PlanItemEventType;
      oldStatus: PlanItemStatus | null;
      newStatus: PlanItemStatus | null;
      reason: string | null;
      source: PlanItemEventSource;
    },
  ): Promise<void> {
    const row = manager.create(ZunoPlanItemEvent, {
      plan_item_id: item.id,
      plan_id: item.plan_id,
      user_id: item.user_id,
      event_type: input.eventType,
      old_status: input.oldStatus,
      new_status: input.newStatus,
      reason: input.reason,
      source: input.source,
      redacted_at: null,
    });
    await manager.save(ZunoPlanItemEvent, row);
  }

  private horizonWindow(planType: PlanType): {
    startDate: string;
    endDate: string | null;
  } {
    const start = this.clock.now();
    const startDate = start.toISOString().slice(0, 10);
    const days = HORIZON_DAYS[planType];
    if (days === null) return { startDate, endDate: null };
    const end = new Date(start.getTime());
    end.setUTCDate(end.getUTCDate() + days - 1);
    return { startDate, endDate: end.toISOString().slice(0, 10) };
  }

  private planTitle(planType: PlanType): string {
    return PLAN_TITLES[planType];
  }
}

/** Inclusive horizon lengths. LONG_TERM is directional (Step 16 section 7). */
const HORIZON_DAYS: Readonly<Record<PlanType, number | null>> = {
  [PlanType.TODAY]: 1,
  [PlanType.WEEKLY]: 7,
  [PlanType.THIRTY_DAY]: 30,
  [PlanType.LONG_TERM]: 90,
  [PlanType.CUSTOM]: 7,
};

/**
 * Plain, non-urgent titles. Step 16 section 106 forbids manufacturing urgency,
 * and Rule 12 asks that the user understand today's priorities in seconds.
 */
const PLAN_TITLES: Readonly<Record<PlanType, string>> = {
  [PlanType.TODAY]: 'Today',
  [PlanType.WEEKLY]: 'This week',
  [PlanType.THIRTY_DAY]: 'The next 30 days',
  [PlanType.LONG_TERM]: 'The direction from here',
  [PlanType.CUSTOM]: 'Your plan',
};

/**
 * Which statuses publish an outbox event.
 *
 * Only these five are business events other services act on. MISSED,
 * NOT_DONE, CANCELLED_BY_USER, CANCELLED_BY_REALIGNMENT and NO_LONGER_RELEVANT
 * are recorded in `zuno_plan_item_events` but publish nothing - Step 16
 * section 18 and Step 15 section 66 mean there is no consumer that should be
 * reacting to them, and publishing would invite one to build a nudge out of a
 * missed task.
 */
const ITEM_EVENT_FOR_STATUS: Partial<
  Record<PlanItemStatus, MkaPlanEventType>
> = {
  [PlanItemStatus.IN_PROGRESS]: MkaPlanEventType.PLAN_ITEM_STARTED,
  [PlanItemStatus.DONE]: MkaPlanEventType.PLAN_ITEM_COMPLETED,
  [PlanItemStatus.DEFERRED]: MkaPlanEventType.PLAN_ITEM_DEFERRED,
  [PlanItemStatus.SKIPPED]: MkaPlanEventType.PLAN_ITEM_SKIPPED,
  [PlanItemStatus.BLOCKED]: MkaPlanEventType.PLAN_ITEM_BLOCKED,
};

/** Step 16 section 12: a sensible default category per life domain. */
const DOMAIN_TO_CATEGORY: Readonly<Record<ZunoDomain, PlanItemCategory>> = {
  [ZunoDomain.CAREER]: PlanItemCategory.CAREER,
  [ZunoDomain.FINANCE]: PlanItemCategory.FINANCE,
  [ZunoDomain.BUSINESS]: PlanItemCategory.BUSINESS,
  [ZunoDomain.EDUCATION]: PlanItemCategory.EDUCATION,
  [ZunoDomain.RELATIONSHIP]: PlanItemCategory.RELATIONSHIP,
  [ZunoDomain.MARRIAGE]: PlanItemCategory.RELATIONSHIP,
  [ZunoDomain.FAMILY]: PlanItemCategory.FAMILY,
  [ZunoDomain.HEALTH_WELLBEING]: PlanItemCategory.HEALTH_SUPPORT,
  [ZunoDomain.PROPERTY]: PlanItemCategory.PROPERTY,
  [ZunoDomain.LEGAL]: PlanItemCategory.LEGAL_SUPPORT,
  [ZunoDomain.TRAVEL]: PlanItemCategory.PREPARATION,
  [ZunoDomain.FOREIGN_RESIDENCE]: PlanItemCategory.LEGAL_SUPPORT,
  [ZunoDomain.PERSONAL_GROWTH]: PlanItemCategory.PREPARATION,
  [ZunoDomain.GENERAL]: PlanItemCategory.OTHER,
};

function scopeRank(scope: PlanItemScenarioScope): number {
  switch (scope) {
    case PlanItemScenarioScope.SHARED_ACROSS_SCENARIOS:
      return 0;
    case PlanItemScenarioScope.SCENARIO_SPECIFIC:
      return 1;
    default:
      return 2;
  }
}
