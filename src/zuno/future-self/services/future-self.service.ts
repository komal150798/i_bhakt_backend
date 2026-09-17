import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  FUTURE_SELF_ENGINE,
  FutureSelfGenerationRequest,
  IFutureSelfEngine,
} from '../engines/future-self.port';
import {
  IPlanProgressProvider,
  PLAN_PROGRESS_PROVIDER,
  PlanSnapshot,
  ProgressSnapshot,
} from '../ports/plan-progress.port';
import { ZunoFutureSelfNarrative } from '../entities/zuno-future-self-narrative.entity';
import { ZunoFutureSelfSource } from '../entities/zuno-future-self-source.entity';
import {
  FutureSelfMode,
  FutureSelfViolation,
  MODE_LOOKBACK_DAYS,
} from '../enums/future-self.enum';
import {
  buildGroundingSet,
  checkFutureSelfBoundary,
  GroundingSource,
} from '../grounding/future-self-boundary';
import { MemoryService } from '../../memory/services/memory.service';
import { ScoredMemory } from '../../memory/retrieval/memory-relevance';
import {
  MemoryRequestContext,
  MemoryType,
} from '../../memory/enums/memory.enum';
import {
  asAggregateType,
  asEventType,
  MemoryAggregateType,
  MemoryEventType,
} from '../../memory/events/memory-events';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../../challenges/entities/zuno-challenge-context.entity';
import { SafetyService } from '../../safety/services/safety.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { ChallengeStatus, ZunoDomain } from '../../common/enums';

/**
 * Version of the section 71 boundary a narrative was cleared against. Bump this
 * whenever `future-self-boundary.ts` changes in a way that would reject
 * something it previously allowed.
 */
export const FUTURE_SELF_BOUNDARY_VERSION = 'fs-boundary-1.0.0';

/** Memory budget for a Future Self generation. Step 18 sections 33 and 88. */
const FUTURE_SELF_MEMORY_MAX_ITEMS = 10;

export interface GenerateFutureSelfParams {
  userId: string;
  challengeId?: string | null;
  mode: FutureSelfMode;
}

export interface GenerateFutureSelfResult {
  narrative: ZunoFutureSelfNarrative;
  sources: ZunoFutureSelfSource[];
}

/**
 * Future Self orchestration. Roadmap sections 70-71, Step 18 section 86.
 *
 * The pipeline is Step 18 section 86, in order:
 *   identify relevant challenge -> retrieve authoritative state ->
 *   retrieve relevant memory -> retrieve progress + ledger patterns ->
 *   retrieve current plan/MKA -> grounding filter -> generate ->
 *   fact/safety check -> display
 *
 * SAFETY ORDERING
 *
 * Pre-check runs before the model call, post-check after it. This repository
 * shipped the two the wrong way round once and recorded it as a design error;
 * `challenge.service.ts` is the corrected reference and this follows it exactly.
 * The reason is not ceremony. A person in crisis writes a challenge; if the
 * model runs first, that text reaches a provider before ZUNO has looked at it,
 * the call is paid for, and the result has to be thrown away anyway. Post-check
 * cannot substitute, because it only sees what came back.
 *
 * THE BOUNDARY
 *
 * Between generation and the post-check sits `checkFutureSelfBoundary`, which
 * is what makes roadmap section 71 real. It is not a rewrite step: a narrative
 * that invents an employer, a partner, a salary or a guarantee is discarded and
 * the caller gets an honest failure. Build Rule 128 forbids returning a
 * fabricated success, and quietly stripping the offending sentence would leave
 * a narrative whose remaining claims came from the same untrusted generation.
 */
@Injectable()
export class FutureSelfService {
  private readonly logger = new Logger(FutureSelfService.name);

  constructor(
    @Inject(FUTURE_SELF_ENGINE) private readonly engine: IFutureSelfEngine,
    @Inject(PLAN_PROGRESS_PROVIDER)
    private readonly planProgress: IPlanProgressProvider,
    @InjectRepository(ZunoFutureSelfNarrative)
    private readonly narratives: Repository<ZunoFutureSelfNarrative>,
    @InjectRepository(ZunoChallenge)
    private readonly challenges: Repository<ZunoChallenge>,
    @InjectRepository(ZunoChallengeContext)
    private readonly contexts: Repository<ZunoChallengeContext>,
    private readonly memory: MemoryService,
    private readonly safety: SafetyService,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
    @Optional() private readonly rulebook?: RulebookRepositoryService,
  ) {}

  /**
   * Generates and persists one Future Self narrative.
   *
   * Throws rather than degrading when the boundary is crossed. Step 21 section
   * 99 asks for graceful degradation when a dependency is missing - which is
   * why a missing Plan provider or an inactive Rulebook produces a thinner
   * narrative rather than an error - but a narrative that invented something is
   * not a degraded success, it is a wrong answer.
   */
  async generate(
    params: GenerateFutureSelfParams,
  ): Promise<GenerateFutureSelfResult> {
    const now = this.clock.now();

    // ---- 1. Identify the relevant challenge, ownership-checked -----------
    const challenge = params.challengeId
      ? await this.findOwnedChallenge(params.userId, params.challengeId)
      : null;

    if (challenge && challenge.status === ChallengeStatus.ARCHIVED) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: 'cannot generate Future Self for an archived challenge',
      });
    }

    // ---- 2. Authoritative state ------------------------------------------
    const context = challenge ? await this.latestContext(challenge.id) : null;

    // ---- 3. SAFETY PRE-CHECK, BEFORE ANY MODEL CALL ----------------------
    //
    // Step 11 section 67 and Step 19 section 50: the pre-check happens before
    // orchestration because it can change the entire execution path. The text
    // examined is the user's own words, which is the only user-authored input
    // in this flow.
    const preCheckText = [
      challenge?.raw_user_statement ?? '',
      context?.summary ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const domains: ZunoDomain[] = challenge?.primary_domain
      ? [challenge.primary_domain]
      : [];

    const assessment = this.safety.preCheck({
      operation: 'FUTURE_SELF_GENERATE',
      userId: params.userId,
      challengeId: challenge?.id ?? null,
      text: preCheckText,
      domains,
    });

    if (assessment.blocked) {
      await this.recordBlocked(params.userId, challenge?.id ?? null, assessment);
      throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
        message:
          assessment.boundaryMessage ??
          'I am not able to reflect on this one here, and I would rather say so plainly.',
        safety: {
          disposition: assessment.disposition,
          domain: assessment.domains[0],
        },
      });
    }

    // ---- 4. Relevant memory only -----------------------------------------
    //
    // Roadmap section 69 / Step 18 section 87. The retrieval query names the
    // purpose, so the relevance filter has something concrete to be relevant
    // *to*. It does not request sensitive or hypothetical rows, which is what
    // makes Step 18 sections 110 and 45 the default rather than a special case.
    const since = new Date(
      now.getTime() - (MODE_LOOKBACK_DAYS[params.mode] ?? 7) * 86_400_000,
    );

    const closedChallengeIds = await this.closedChallengeIds(params.userId);

    const retrieval = await this.memory.retrieve({
      userId: params.userId,
      requestContext: requestContextForMode(params.mode),
      challengeId: challenge?.id ?? null,
      closedChallengeIds,
      maxItems: FUTURE_SELF_MEMORY_MAX_ITEMS,
      queryTerms: deriveQueryTerms(challenge, context),
      now,
    });

    // ---- 5. Plan and progress, through the port --------------------------
    const plan = await this.safelyGetPlan(params.userId, challenge?.id ?? null);
    const progress = await this.safelyGetProgress(
      params.userId,
      challenge?.id ?? null,
      since,
    );

    // ---- 6. Timing context, fail-closed ----------------------------------
    const timingContext = await this.timingContext(challenge);

    // ---- 7. The grounding set --------------------------------------------
    //
    // Assembled from exactly the sources Step 18 section 38 permits, and from
    // nothing else. This is the vocabulary the narrative is allowed to use;
    // anything outside it is, by construction, invented.
    const groundingSources = this.groundingSources(
      challenge,
      context,
      retrieval.items,
      plan,
      progress,
    );
    const grounding = buildGroundingSet(groundingSources);

    // ---- 8. Generate ------------------------------------------------------
    const request: FutureSelfGenerationRequest = {
      mode: params.mode,
      context: {
        challengeTitle: challenge?.title ?? null,
        challengeSummary: context?.summary ?? null,
        relevantMemory: retrieval.items.map(
          (entry) => entry.memory.memory_value?.statement ?? '',
        ),
        planTitle: plan?.title ?? null,
        openPlanItems: (plan?.activeItems ?? []).map((item) => item.title),
        completedActions: progress.completedActions.map((a) => a.title),
        openLoops: progress.openLoops,
        observedPatterns: progress.observedPatterns,
        timingContext,
        periodStart: toDateOnly(since),
        periodEnd: toDateOnly(now),
      },
    };

    const generated = await this.engine.generate(request);
    const narrative = generated.narrative;

    // ---- 9. THE SECTION 71 BOUNDARY --------------------------------------
    const candidateText = [
      narrative.summary,
      ...narrative.progress_themes,
      ...narrative.open_loops,
      ...narrative.strengths_observed,
      ...narrative.next_focus,
    ].join('\n');

    const boundary = checkFutureSelfBoundary({
      mode: params.mode,
      candidateText,
      summary: narrative.summary,
      grounding,
      claimedSourceRefs: narrative.source_refs,
    });

    if (!boundary.allowed) {
      // Labels only. The offending fragments come from a private narrative
      // about this person and are never logged (Build Rule 34).
      this.logger.warn(
        `Future Self generation refused by the grounding boundary: ${boundary.violations.join(',')}`,
      );
      await this.recordBoundaryRefusal(
        params.userId,
        challenge?.id ?? null,
        boundary.violations,
      );
      throw new ZunoException(ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE, {
        message:
          'I could not put this together in a way I was confident was true. Nothing has been lost - let us try again shortly.',
        internalDetail: `future self boundary violations: ${boundary.violations.join(',')}`,
      });
    }

    // ---- 10. SAFETY POST-CHECK, AFTER THE MODEL CALL ---------------------
    //
    // Step 19 section 51 / Step 21 section 69. The boundary check above is
    // about invention; this is about tone, certainty, fatalism and unapproved
    // remedies. They overlap and that is intentional - neither is a substitute
    // for the other, and the cost of running both is nil.
    const postCheck = this.safety.postCheck({
      userId: params.userId,
      challengeId: challenge?.id ?? null,
      candidateText,
      assessment,
    });

    return this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: params.userId,
        challengeId: challenge?.id ?? null,
        operation: 'FUTURE_SELF_GENERATE',
        assessment,
      });

      if (!postCheck.allowed) {
        await this.safety.recordIncident(manager, {
          userId: params.userId,
          safetyDecisionId: decision.id,
          source: 'FUTURE_SELF_POST_CHECK',
          domain: challenge?.primary_domain ?? null,
          severity: assessment.riskLevel,
          violations: postCheck.violations,
        });
        this.logger.warn(
          `Future Self post-check blocked a narrative: ${postCheck.violations.join(',')}`,
        );
        throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
          message:
            'I could not put this in a way I was comfortable sending. Let us try approaching it differently.',
          safety: { disposition: assessment.disposition },
        });
      }

      const row = manager.create(ZunoFutureSelfNarrative, {
        user_id: params.userId,
        challenge_id: challenge?.id ?? null,
        mode: params.mode,
        period_start: toDateOnly(since),
        period_end: toDateOnly(now),
        summary: narrative.summary,
        progress_themes: narrative.progress_themes,
        open_loops: narrative.open_loops,
        strengths_observed: narrative.strengths_observed,
        next_focus: narrative.next_focus,
        generation_model_version: generated.modelVersion,
        engine_version: generated.engineVersion,
        prompt_template_version: null,
        ai_generation_run_id: generated.aiGenerationRunId,
        safety_decision_id: decision.id,
        boundary_version: FUTURE_SELF_BOUNDARY_VERSION,
        version: 1,
        redacted_at: null,
      });
      const savedNarrative = await manager.save(ZunoFutureSelfNarrative, row);

      // Step 20 section 55 and section 2580: sources are written in the same
      // transaction, and only for entities belonging to this user - the
      // grounding set was built from this user's rows, so membership in it is
      // the authorisation check.
      const sourceRows: ZunoFutureSelfSource[] = [];
      for (const ref of unique(narrative.source_refs)) {
        if (!grounding.sourceRefs.has(ref)) continue; // already refused above
        const [entityType, entityId] = splitRef(ref);
        if (!entityType || !entityId) continue;
        sourceRows.push(
          manager.create(ZunoFutureSelfSource, {
            future_self_narrative_id: savedNarrative.id,
            source_entity_type: entityType,
            source_entity_id: entityId,
            redacted_at: null,
          }),
        );
      }
      const savedSources =
        sourceRows.length > 0
          ? await manager.save(ZunoFutureSelfSource, sourceRows)
          : [];

      await this.audit.record(manager, {
        actorType: 'SYSTEM',
        userId: params.userId,
        action: 'FUTURE_SELF_GENERATED',
        entityType: 'ZunoFutureSelfNarrative',
        entityId: savedNarrative.id,
        after: { mode: params.mode, source_count: savedSources.length },
        metadata: {
          boundary_version: FUTURE_SELF_BOUNDARY_VERSION,
          memory_items_used: retrieval.items.length,
          memory_items_considered: retrieval.consideredCount,
        },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: asAggregateType(MemoryAggregateType.FUTURE_SELF),
        aggregateId: savedNarrative.id,
        eventType: asEventType(MemoryEventType.FUTURE_SELF_GENERATED),
        payload: {
          future_self_id: savedNarrative.id,
          user_id: params.userId,
          challenge_id: challenge?.id ?? null,
          mode: params.mode,
          source_count: savedSources.length,
        },
      });

      return { narrative: savedNarrative, sources: savedSources };
    });
  }

  /** Step 21 section 61: `GET /api/v1/future-self/{futureSelfId}`. */
  async findOwned(
    userId: string,
    narrativeId: string,
  ): Promise<ZunoFutureSelfNarrative> {
    const row = await this.narratives.findOne({
      where: { id: narrativeId, deleted_at: IsNull() },
    });
    return this.ownership.require(row, userId, 'future self narrative');
  }

  async listForUser(
    userId: string,
    filters: { challengeId?: string; mode?: FutureSelfMode; limit?: number } = {},
  ): Promise<ZunoFutureSelfNarrative[]> {
    return this.narratives.find({
      where: {
        user_id: userId,
        deleted_at: IsNull(),
        redacted_at: IsNull(),
        ...(filters.challengeId ? { challenge_id: filters.challengeId } : {}),
        ...(filters.mode ? { mode: filters.mode } : {}),
      },
      order: { created_at: 'DESC' },
      take: Math.min(filters.limit ?? 20, 50),
    });
  }

  /** Step 18 section 93 `future_self.viewed`. */
  async markViewed(userId: string, narrativeId: string): Promise<void> {
    const row = await this.findOwned(userId, narrativeId);
    await this.dataSource.transaction(async (manager) => {
      await this.outbox.enqueue(manager, {
        aggregateType: asAggregateType(MemoryAggregateType.FUTURE_SELF),
        aggregateId: row.id,
        eventType: asEventType(MemoryEventType.FUTURE_SELF_VIEWED),
        payload: { future_self_id: row.id, user_id: userId },
      });
    });
  }

  // =========================================================================
  // Internals
  // =========================================================================

  /**
   * The permitted grounding sources. Step 18 section 38.
   *
   * Note what is absent: the user's raw statement is *not* a grounding source
   * for entity names even though it is the most quotable text available. Step 18
   * section 12 says challenge memory must use the structured Challenge Context
   * rather than relying on raw chat text, and the context summary carries the
   * same names having been through extraction and validation.
   */
  private groundingSources(
    challenge: ZunoChallenge | null,
    context: ZunoChallengeContext | null,
    memories: ScoredMemory[],
    plan: PlanSnapshot | null,
    progress: ProgressSnapshot,
  ): GroundingSource[] {
    const sources: GroundingSource[] = [];

    if (challenge) {
      sources.push({
        entityType: 'ZunoChallenge',
        entityId: challenge.id,
        text: [challenge.title ?? '', context?.summary ?? ''].join(' '),
      });
    }
    for (const entry of memories) {
      sources.push({
        entityType: 'ZunoMemory',
        entityId: entry.memory.id,
        text: [
          entry.memory.memory_value?.statement ?? '',
          entry.memory.memory_value?.label ?? '',
        ].join(' '),
      });
    }
    if (plan) {
      sources.push({
        entityType: 'ZunoPlan',
        entityId: plan.planId,
        text: [plan.title, ...plan.activeItems.map((i) => i.title)].join(' '),
      });
    }
    for (const action of progress.completedActions) {
      sources.push({
        entityType: action.sourceEntityType,
        entityId: action.sourceEntityId,
        text: action.title,
      });
    }
    // Open loops and observed patterns contribute vocabulary but have no entity
    // of their own to cite, so they are attached to the challenge (or dropped
    // when there is no challenge, which is the conservative direction).
    if (challenge && (progress.openLoops.length || progress.observedPatterns.length)) {
      sources.push({
        entityType: 'ZunoChallenge',
        entityId: challenge.id,
        text: [...progress.openLoops, ...progress.observedPatterns].join(' '),
      });
    }
    return sources;
  }

  /**
   * Approved timing language, or nothing.
   *
   * Step 20 section 125 and Build Rule 51: fail closed. The Rulebook repository
   * currently has no active version and `requireActive()` throws
   * RULEBOOK_UNAVAILABLE - which is the correct behaviour, not a bug to work
   * around. Future Self degrades to a narrative with no timing context rather
   * than asking the model to supply one, because a model inventing astrological
   * timing is precisely what Step 21 section 101 forbids.
   *
   * There is deliberately no fallback string here. "This is a period of change"
   * would look harmless and would be an unsourced astrological claim.
   */
  private async timingContext(
    challenge: ZunoChallenge | null,
  ): Promise<string | null> {
    if (!this.rulebook || !challenge?.primary_domain) return null;

    try {
      if (!(await this.rulebook.isAstrologyAvailable())) {
        this.logger.debug(
          'No active Rulebook; Future Self proceeds without timing context (fail closed).',
        );
        return null;
      }

      const rules = await this.rulebook.findRules({
        domains: [challenge.primary_domain],
      });
      const keys = rules
        .map((rule) => rule.interpretation_key)
        .filter((key): key is string => Boolean(key));
      if (keys.length === 0) return null;

      const interpretations = await this.rulebook.findInterpretations(keys);
      // `user_safe_summary` is the only field cleared for user-facing wording;
      // `meaning` is SME-internal and Step 18 section 48 forbids copying raw SME
      // rules into user-facing memory or narrative.
      const safe = Array.from(interpretations.values())
        .map((row) => row.user_safe_summary)
        .filter((text): text is string => Boolean(text))
        .slice(0, 2);

      return safe.length > 0 ? safe.join(' ') : null;
    } catch (error) {
      // RULEBOOK_UNAVAILABLE is the expected path today. Degrade, do not fail
      // the whole generation - Step 20 section 125 says to continue safe
      // non-astrology functionality where possible.
      this.logger.debug(
        `Rulebook unavailable for timing context; continuing without it: ${
          error instanceof Error ? error.name : 'unknown'
        }`,
      );
      return null;
    }
  }

  private async safelyGetPlan(
    userId: string,
    challengeId: string | null,
  ): Promise<PlanSnapshot | null> {
    try {
      return await this.planProgress.getCurrentPlan(userId, challengeId);
    } catch (error) {
      // Step 18 section 96: a failure in a supporting system should not fail
      // the user's action. A thinner narrative is a better outcome than none.
      this.logger.warn(
        'Plan provider failed; Future Self continues without plan context.',
      );
      return null;
    }
  }

  private async safelyGetProgress(
    userId: string,
    challengeId: string | null,
    since: Date,
  ): Promise<ProgressSnapshot> {
    try {
      return await this.planProgress.getProgress(userId, challengeId, since);
    } catch {
      this.logger.warn(
        'Progress provider failed; Future Self continues without progress context.',
      );
      return { completedActions: [], openLoops: [], observedPatterns: [] };
    }
  }

  private async findOwnedChallenge(
    userId: string,
    challengeId: string,
  ): Promise<ZunoChallenge> {
    const challenge = await this.challenges.findOne({
      where: { id: challengeId, deleted_at: IsNull() },
    });
    return this.ownership.require(challenge, userId, 'challenge');
  }

  private async latestContext(
    challengeId: string,
  ): Promise<ZunoChallengeContext | null> {
    return this.contexts.findOne({
      where: { challenge_id: challengeId },
      order: { version_number: 'DESC' },
    });
  }

  /**
   * Challenges whose memory has become historical. Step 18 sections 65 and 109.
   *
   * Passed into retrieval so a resolved career challenge stops injecting its
   * anxiety into an unrelated question months later.
   */
  private async closedChallengeIds(userId: string): Promise<string[]> {
    const rows = await this.challenges.find({
      where: [
        { user_id: userId, status: ChallengeStatus.RESOLVED },
        { user_id: userId, status: ChallengeStatus.ARCHIVED },
      ],
      select: ['id'],
      take: 200,
    });
    return rows.map((row) => row.id);
  }

  private async recordBlocked(
    userId: string,
    challengeId: string | null,
    assessment: Parameters<SafetyService['recordDecision']>[1]['assessment'],
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId,
        challengeId,
        operation: 'FUTURE_SELF_GENERATE',
        assessment,
      });
      await this.safety.recordIncident(manager, {
        userId,
        safetyDecisionId: decision.id,
        source: 'FUTURE_SELF_PRECHECK',
        domain: assessment.domains[0] ?? null,
        severity: assessment.riskLevel,
        violations: [],
      });
    });
  }

  /**
   * Records a boundary refusal so the "unsupported claim rate" metric from
   * Step 18 section 83 has something to count. Labels only - never the text.
   */
  private async recordBoundaryRefusal(
    userId: string,
    challengeId: string | null,
    violations: FutureSelfViolation[],
  ): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        await this.audit.record(manager, {
          actorType: 'SYSTEM',
          userId,
          action: 'FUTURE_SELF_BOUNDARY_REFUSAL',
          entityType: 'ZunoFutureSelfNarrative',
          entityId: null,
          metadata: {
            challenge_id: challengeId,
            violations,
            boundary_version: FUTURE_SELF_BOUNDARY_VERSION,
          },
        });
      });
    } catch {
      // The refusal itself must stand even if recording it fails.
      this.logger.warn('Could not record a Future Self boundary refusal.');
    }
  }
}

/** Step 18 section 88: the retrieval purpose follows the Future Self mode. */
export function requestContextForMode(
  mode: FutureSelfMode,
): MemoryRequestContext {
  switch (mode) {
    case FutureSelfMode.DAILY:
      return MemoryRequestContext.FUTURE_SELF_DAILY;
    case FutureSelfMode.WEEKLY:
      return MemoryRequestContext.FUTURE_SELF_WEEKLY;
    case FutureSelfMode.MILESTONE:
      return MemoryRequestContext.FUTURE_SELF_MILESTONE;
    case FutureSelfMode.REALIGNMENT:
      return MemoryRequestContext.FUTURE_SELF_REALIGNMENT;
    case FutureSelfMode.REFLECTION:
      return MemoryRequestContext.FUTURE_SELF_REFLECTION;
    default:
      return MemoryRequestContext.CHALLENGE_GUIDANCE;
  }
}

/**
 * Terms from the current challenge, used as the optional lexical nudge in
 * retrieval. Capped and stop-worded; it contributes at most 0.05 to a score.
 */
function deriveQueryTerms(
  challenge: ZunoChallenge | null,
  context: ZunoChallengeContext | null,
): string[] {
  const text = [challenge?.title ?? '', context?.summary ?? ''].join(' ');
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 5 && !QUERY_STOPWORDS.has(token)),
    ),
  ).slice(0, 12);
}

const QUERY_STOPWORDS = new Set([
  'about', 'after', 'again', 'because', 'before', 'being', 'between', 'could',
  'every', 'might', 'other', 'should', 'their', 'there', 'these', 'thing',
  'things', 'those', 'through', 'where', 'which', 'while', 'would', 'still',
  'something', 'someone', 'really', 'maybe',
]);

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function splitRef(ref: string): [string | null, string | null] {
  const index = ref.indexOf(':');
  if (index <= 0) return [null, null];
  return [ref.slice(0, index), ref.slice(index + 1)];
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

/** Kept exported so tests can assert the memory type set a mode asks for. */
export const FUTURE_SELF_DEFAULT_MEMORY_TYPES: readonly MemoryType[] = [
  MemoryType.DECISION,
  MemoryType.PROGRESS,
  MemoryType.COMMITMENT,
  MemoryType.GOAL,
  MemoryType.CONSTRAINT,
  MemoryType.PREFERENCE,
  MemoryType.PATTERN,
  MemoryType.CHALLENGE,
  MemoryType.LIFE_EVENT,
];
