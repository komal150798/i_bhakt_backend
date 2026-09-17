import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  DataSource,
  EntityManager,
  FindOptionsWhere,
  IsNull,
  LessThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';

import { ZunoKarmaEntry } from '../entities/zuno-karma-entry.entity';
import { ZunoKarmaEntryRevision } from '../entities/zuno-karma-entry-revision.entity';
import { ZunoKarmaPattern } from '../entities/zuno-karma-pattern.entity';
import {
  KarmaActionOutcome,
  KarmaCategory,
  KarmaClassification,
  KarmaEffort,
  KarmaEntrySource,
  KarmaEntryStatus,
  KarmaIngestResult,
  KarmaIntent,
  KarmaPatternStatus,
  KarmaPatternType,
  KarmaRelevance,
  KarmaRevisionActor,
  KarmaVisibility,
  NON_PENALISING_OUTCOMES,
  SYSTEM_KARMA_SOURCES,
  SYSTEM_SOURCED_CLASSIFICATIONS,
} from '../enums/karma.enum';
import {
  KARMA_CLASSIFIER,
  KarmaClassificationResult,
  KarmaClassifierPort,
} from '../ports/karma-classifier.port';
import {
  KARMA_ACTION_LABEL_MAX_LENGTH,
  KARMA_SOURCE_PORT,
  KarmaActionCompletedPayload,
  KarmaSourcePort,
  validateActionCompletedPayload,
} from '../ports/karma-source.port';
import {
  KARMA_SCORING_V1,
  KarmaScoreBreakdown,
  calculateKarmaPoints,
  requiresUserConfirmation,
  withConfidenceFloor,
} from '../scoring/karma-scoring';
import {
  KARMA_COPY,
  KARMA_POINTS_LABEL,
  KARMA_SCORE_FRAMING,
  assertNeutralCopy,
} from '../neutrality';

import {
  SafetyAssessment,
  SafetyService,
} from '../../safety/services/safety.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { ZunoAggregateType, ZunoEventType } from '../../common/enums';

/**
 * Domain events this module publishes. Step 17 section 90.
 *
 * Declared here as strings and cast at the enqueue site because
 * `common/enums/event.enum.ts` is owned by the platform phase and frozen for
 * this work package. WIRING.md lists them as the values to add when it next
 * opens, at which point the casts below disappear. The wire format is
 * unaffected either way - the outbox stores the string.
 */
export const KARMA_EMITTED_EVENTS = {
  ENTRY_CREATED: 'zuno.karma.entry_created',
  ENTRY_CLASSIFIED: 'zuno.karma.entry_classified',
  ENTRY_CORRECTED: 'zuno.karma.entry_corrected',
  ENTRY_DELETED: 'zuno.karma.entry_deleted',
  PATTERN_DETECTED: 'zuno.karma.pattern_detected',
} as const;

const KARMA_AGGREGATE = 'KARMA_ENTRY' as unknown as ZunoAggregateType;

/** Step 17 section 75: a pattern needs enough evidence to be worth stating. */
export const KARMA_MIN_PATTERN_EVIDENCE = 3;
const PATTERN_WINDOW_DAYS = 30;
/** How far back the scorer looks for repetition and the daily cap. */
const SCORING_LOOKBACK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface CreateKarmaEntryParams {
  userId: string;
  text: string;
  occurredAt?: Date | null;
  challengeId?: string | null;
}

export interface ListKarmaParams {
  userId: string;
  category?: KarmaCategory;
  classification?: KarmaClassification;
  source?: KarmaEntrySource;
  challengeId?: string;
  from?: Date;
  to?: Date;
  limit: number;
  cursor?: string;
}

export interface CorrectKarmaEntryParams {
  classification?: KarmaClassification;
  category?: KarmaCategory;
  intent?: KarmaIntent;
  text?: string;
  accepted?: boolean;
  comment?: string;
  version?: number;
}

export interface KarmaIngestOutcome {
  result: KarmaIngestResult;
  entryId?: string;
  /** Neutral, user-safe explanation of what happened. Never a reprimand. */
  message: string;
}

export interface KarmaSummary {
  pointsLabel: string;
  framing: string;
  today: { entriesRecorded: number; points: number };
  thisWeek: {
    entriesRecorded: number;
    points: number;
    daysActive: number;
    topCategory: KarmaCategory | null;
    repairActions: number;
  };
  patterns: {
    patternType: KarmaPatternType;
    evidenceCount: number;
    lastObservedAt: string;
  }[];
}

/**
 * The Karma Ledger.
 *
 * Step 17 section 52 states the division this class implements:
 *
 *   > AI interprets the action. ZUNO software owns the Ledger.
 *
 * So everything that decides anything lives here - eligibility, duplicate
 * detection, the scoring call, bounds, status, visibility, provenance, user
 * overrides, audit and events. The only thing delegated is the reading of what
 * a sentence means, and that goes through KARMA_CLASSIFIER.
 *
 * The pipeline is Step 17 section 50, in order:
 *
 *   eligible event -> SAFETY -> normalise -> category -> context ->
 *   constructiveness -> score factors -> deterministic scoring ->
 *   confirmation if needed -> ledger entry
 *
 * Safety runs before classification and before scoring, unconditionally
 * (sections 30-31, Rule 8, Build Rule 69). A dangerous action described
 * positively must not collect points on its way to being noticed.
 *
 * NEUTRALITY (Roadmap section 55). Enforced structurally, not by tone alone:
 *   - points are non-negative by construction; `assertNonPunitive` throws
 *     rather than allowing a deduction, and the table has a CHECK constraint
 *   - a non-completed action produces no entry at all, so there is nothing to
 *     deduct from (sections 28, 48, 49)
 *   - a system-sourced completion can never be labelled UNCONSTRUCTIVE
 *   - every ZUNO-authored string passes `assertNeutralCopy` before leaving
 *
 * PRIVACY (Roadmap section 56). Also structural:
 *   - every read and write goes through ZunoOwnershipService, and a
 *     cross-user id returns NOT_FOUND rather than FORBIDDEN
 *   - raw_text is never logged, never enqueued, never aggregated
 *   - outbox payloads carry ids and labels only (Build Rule 113)
 *   - deletion nulls raw_text and stamps redacted_at
 */
@Injectable()
export class KarmaService {
  private readonly logger = new Logger(KarmaService.name);

  constructor(
    @InjectRepository(ZunoKarmaEntry)
    private readonly entries: Repository<ZunoKarmaEntry>,
    @InjectRepository(ZunoKarmaPattern)
    private readonly patterns: Repository<ZunoKarmaPattern>,
    @Inject(KARMA_CLASSIFIER)
    private readonly classifier: KarmaClassifierPort,
    @Inject(KARMA_SOURCE_PORT)
    private readonly source: KarmaSourcePort,
    private readonly safety: SafetyService,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly rulebook: RulebookRepositoryService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
  ) {}

  // -------------------------------------------------------------------------
  // Write path: the user's own entry
  // -------------------------------------------------------------------------

  /**
   * Records an action the user described themselves.
   * Step 17 sections 5 and 29, Step 21 section 55.
   */
  async createUserEntry(
    params: CreateKarmaEntryParams,
  ): Promise<{ entry: ZunoKarmaEntry; confirmationRequired: boolean; explanation: string }> {
    const text = (params.text ?? '').trim();
    if (text.length === 0) {
      throw ZunoException.validation([{ field: 'text', code: 'REQUIRED' }]);
    }
    if (text.length > 5000) {
      throw ZunoException.validation([{ field: 'text', code: 'TOO_LONG' }]);
    }

    // Step 17 section 30: "Safety & Trust must run before ordinary
    // scoring/classification." Before, not alongside.
    const assessment = this.safety.preCheck({
      operation: 'KARMA_ENTRY_CREATE',
      userId: params.userId,
      text,
      domains: [],
    });

    if (assessment.blocked) {
      await this.routeToSafety(params.userId, assessment, 'KARMA_ENTRY_CREATE');
    }

    const occurredAt = params.occurredAt ?? this.clock.now();

    // Step 17 sections 57 and 99: the same action arriving from the user and
    // from a Plan event must not be scored twice.
    const duplicate = await this.findUserTextDuplicate(
      params.userId,
      text,
      occurredAt,
    );
    if (duplicate) {
      return {
        entry: duplicate,
        confirmationRequired: false,
        explanation: KARMA_COPY.alreadyRecorded,
      };
    }

    const interpretation = await this.classifier.classify({
      text,
      source: KarmaEntrySource.USER_CREATED,
    });

    return this.dataSource.transaction(async (manager) => {
      const entry = await this.record(manager, {
        userId: params.userId,
        source: KarmaEntrySource.USER_CREATED,
        sourceEventId: null,
        challengeId: params.challengeId ?? null,
        planItemId: null,
        mkaItemId: null,
        rawText: text,
        occurredAt,
        interpretation,
        allowUnconstructive: true,
      });
      return {
        entry,
        confirmationRequired: !entry.user_confirmed,
        explanation: this.explanationFor(entry),
      };
    });
  }

  // -------------------------------------------------------------------------
  // Write path: an upstream action completed
  // -------------------------------------------------------------------------

  /**
   * Consumes an "action was completed" event from Plan or MKA.
   *
   * This is the outbox handler. It is written to be called with a plain payload
   * object so it can be driven by a relay, a queue consumer or a test without
   * any of them needing the transport. It never throws for an ordinary
   * business outcome - a duplicate, an ineligible action and a missed action
   * are all normal, and a consumer that threw on them would retry forever
   * (Build Rule 79).
   *
   * Idempotent by (user_id, source_event_id) and by the upstream item id.
   * Step 17 section 91 and Step 21 Golden Contract Test 126.
   */
  async handleActionCompleted(
    payload: unknown,
  ): Promise<KarmaIngestOutcome> {
    const problems = validateActionCompletedPayload(payload);
    if (problems.length > 0) {
      // The payload is never logged - only which fields were unusable.
      this.logger.warn(
        `Rejected a karma action-completed event: invalid ${problems.join(',')}`,
      );
      return {
        result: KarmaIngestResult.INVALID_EVENT,
        message: KARMA_COPY.notLedgerEligible,
      };
    }
    const event = payload as KarmaActionCompletedPayload;

    // Re-read the authoritative row where an adapter is bound. The event says
    // something happened; the owning module says what it currently is. When no
    // adapter is bound the null implementation returns null and we fall back to
    // the event's own assertions (Build Rule 173).
    const confirmed = await this.source.describeCompletedAction(event.user_id, {
      source: event.source,
      planItemId: event.plan_item_id ?? null,
      mkaItemId: event.mka_item_id ?? null,
    });

    if (confirmed && confirmed.userId !== event.user_id) {
      // The event claims an action that belongs to someone else. Refuse, and
      // say nothing that would confirm the action exists.
      this.logger.warn(
        'Rejected a karma action-completed event whose owner did not match the upstream record',
      );
      return {
        result: KarmaIngestResult.INVALID_EVENT,
        message: KARMA_COPY.notLedgerEligible,
      };
    }

    const outcome = confirmed?.outcome ?? event.outcome;
    const eligible = confirmed?.karmaLedgerEligible ?? event.karma_ledger_eligible;
    const astrologyDerived =
      confirmed?.astrologyDerived ?? event.astrology_derived ?? false;

    // Step 17 sections 28, 48, 49 and Rules 4-5. This branch is the whole
    // reason those rules can be called non-negotiable: there is no code path
    // from a non-completed action to a score, because the function returns
    // before scoring exists.
    if (NON_PENALISING_OUTCOMES.includes(outcome)) {
      return {
        result: KarmaIngestResult.NO_PENALTY,
        message: this.nonPenalisingMessage(outcome),
      };
    }
    if (outcome !== KarmaActionOutcome.COMPLETED) {
      return {
        result: KarmaIngestResult.NO_PENALTY,
        message: KARMA_COPY.actionNotCompleted,
      };
    }

    // Step 17 sections 6, 25, 26 and 108: eligibility is explicit, and "Open
    // settings page" is not karma. A missing flag means not eligible.
    if (eligible !== true) {
      return {
        result: KarmaIngestResult.NOT_ELIGIBLE,
        message: KARMA_COPY.notLedgerEligible,
      };
    }

    // Step 17 section 27 with Build Rules 50-51 and 130. An astrology-derived
    // practice is only interpretable against an approved Rulebook. There is
    // none active, so `isAstrologyAvailable()` is false and we fail closed:
    // nothing recorded, nothing implied, and - critically - nothing deducted.
    if (astrologyDerived) {
      const available = await this.isInterpretationAvailable();
      if (!available) {
        this.logger.debug(
          'Skipped an astrology-derived karma candidate: no approved Rulebook is active',
        );
        return {
          result: KarmaIngestResult.INTERPRETATION_UNAVAILABLE,
          message: KARMA_COPY.interpretationUnavailable,
        };
      }
    }

    // Step 17 sections 57, 62, 91. Two independent keys, because they catch
    // different failures: the event id catches a retry of the same emission,
    // the item id catches the same action emitted twice or also entered by
    // hand. Cross-challenge double-scoring (section 62) is prevented by the
    // item id, since one action has one item regardless of how many challenges
    // it supports.
    const existing = await this.findIngestDuplicate(event);
    if (existing) {
      return {
        result: KarmaIngestResult.DUPLICATE,
        entryId: existing.id,
        message: KARMA_COPY.alreadyRecorded,
      };
    }

    const label = this.truncateLabel(
      confirmed?.actionLabel ?? event.action_label ?? null,
    );

    // Safety still runs, even on a system-sourced label. Step 17 section 31:
    // dangerous activity must not be gamified regardless of how it is framed,
    // and the label is free text written by whoever created the plan item.
    if (label) {
      const assessment = this.safety.preCheck({
        operation: 'KARMA_ACTION_COMPLETED',
        userId: event.user_id,
        text: label,
        domains: [],
      });
      if (assessment.blocked) {
        await this.dataSource.transaction(async (manager) => {
          const decision = await this.safety.recordDecision(manager, {
            userId: event.user_id,
            operation: 'KARMA_ACTION_COMPLETED',
            assessment,
          });
          await this.safety.recordIncident(manager, {
            userId: event.user_id,
            safetyDecisionId: decision.id,
            source: 'KARMA_ACTION_COMPLETED',
            severity: assessment.riskLevel,
            violations: [],
          });
        });
        return {
          result: KarmaIngestResult.SAFETY_ROUTED,
          message: KARMA_COPY.safetyRouted,
        };
      }
    }

    const interpretation = await this.classifier.classify({
      text: label ?? '',
      source: event.source,
      suggestedCategory: confirmed?.suggestedCategory ?? event.suggested_category,
      effortHint: confirmed?.effort ?? event.effort,
      relevanceHint: confirmed?.relevance ?? event.relevance,
    });

    // Step 17 section 27: a completed astrology-derived practice is recorded as
    // consistency and intentional practice. It is never recorded as protection,
    // merit or a changed outcome.
    const shaped: KarmaClassificationResult = astrologyDerived
      ? {
          ...interpretation,
          category: KarmaCategory.CONSISTENCY,
          intent: KarmaIntent.INTENTIONAL_PRACTICE,
        }
      : interpretation;

    const entry = await this.dataSource.transaction(async (manager) =>
      this.record(manager, {
        userId: event.user_id,
        source: event.source,
        sourceEventId: event.event_id,
        challengeId: confirmed?.challengeId ?? event.challenge_id ?? null,
        planItemId: event.plan_item_id ?? null,
        mkaItemId: event.mka_item_id ?? null,
        rawText: label,
        occurredAt: new Date(event.completed_at),
        interpretation: shaped,
        // Step 17 Rule 2 / section 9: completing a planned action can never be
        // turned into a judgement, so this source cannot reach UNCONSTRUCTIVE.
        allowUnconstructive: false,
      }),
    );

    return {
      result: KarmaIngestResult.RECORDED,
      entryId: entry.id,
      message: this.explanationFor(entry),
    };
  }

  // -------------------------------------------------------------------------
  // Shared recording path
  // -------------------------------------------------------------------------

  private async record(
    manager: EntityManager,
    input: {
      userId: string;
      source: KarmaEntrySource;
      sourceEventId: string | null;
      challengeId: string | null;
      planItemId: string | null;
      mkaItemId: string | null;
      rawText: string | null;
      occurredAt: Date;
      interpretation: KarmaClassificationResult;
      allowUnconstructive: boolean;
    },
  ): Promise<ZunoKarmaEntry> {
    const now = this.clock.now();
    const interpretation = input.interpretation;

    // Step 17 sections 13 and 53: a thin reading is reported as UNCERTAIN
    // rather than asserted, and a low-confidence label never gets to speak
    // firmly.
    let classification = withConfidenceFloor(
      interpretation.classification,
      interpretation.confidence,
    );
    if (
      !input.allowUnconstructive &&
      !SYSTEM_SOURCED_CLASSIFICATIONS.includes(classification)
    ) {
      classification = KarmaClassification.NEUTRAL;
    }

    const recent = await this.recentEntriesFor(manager, input.userId, now);
    const breakdown = this.score(
      classification,
      interpretation,
      recent,
      now,
    );

    const entry = manager.create(ZunoKarmaEntry, {
      user_id: input.userId,
      challenge_id: input.challengeId,
      plan_item_id: input.planItemId,
      mka_item_id: input.mkaItemId,
      source: input.source,
      source_event_id: input.sourceEventId,
      raw_text: input.rawText,
      classification,
      category: interpretation.category,
      intent: interpretation.intent,
      impact_scope: interpretation.impactScope,
      points: breakdown.points,
      confidence: interpretation.confidence.toFixed(3),
      // Step 17 section 54: high confidence stands on its own; anything lower
      // is offered back to the user before it settles.
      user_confirmed: !requiresUserConfirmation(interpretation.confidence),
      visibility: KarmaVisibility.PRIVATE,
      scoring_model_version: breakdown.scoringModelVersion,
      classification_model_version: interpretation.modelVersion,
      score_factors: breakdown.factors,
      evidence: interpretation.evidence,
      status: KarmaEntryStatus.ACTIVE,
      occurred_at: input.occurredAt,
      redacted_at: null,
    });
    const saved = await manager.save(ZunoKarmaEntry, entry);

    await this.audit.record(manager, {
      actorType: SYSTEM_KARMA_SOURCES.includes(input.source) ? 'SYSTEM' : 'USER',
      actorId: input.userId,
      userId: input.userId,
      action: 'KARMA_ENTRY_CREATED',
      entityType: 'ZunoKarmaEntry',
      entityId: saved.id,
      // Labels only. The audit table outlives the ledger row, so the user's
      // words must not be copied into it (Build Rule 34, Step 17 section 70).
      after: {
        classification: saved.classification,
        category: saved.category,
        points: saved.points,
      },
      metadata: {
        scoringModelVersion: saved.scoring_model_version,
        classificationModelVersion: saved.classification_model_version,
      },
    });

    // Step 17 section 70 and Build Rule 36: structured labels, never raw text.
    await this.outbox.enqueueMany(manager, [
      {
        aggregateType: KARMA_AGGREGATE,
        aggregateId: saved.id,
        eventType: KARMA_EMITTED_EVENTS.ENTRY_CREATED as unknown as ZunoEventType,
        payload: {
          karma_entry_id: saved.id,
          user_id: saved.user_id,
          source: saved.source,
          source_event_id: saved.source_event_id,
          challenge_id: saved.challenge_id,
        },
      },
      {
        aggregateType: KARMA_AGGREGATE,
        aggregateId: saved.id,
        eventType:
          KARMA_EMITTED_EVENTS.ENTRY_CLASSIFIED as unknown as ZunoEventType,
        payload: {
          karma_entry_id: saved.id,
          user_id: saved.user_id,
          classification: saved.classification,
          category: saved.category,
          points: saved.points,
          scoring_model_version: saved.scoring_model_version,
          classification_model_version: saved.classification_model_version,
        },
      },
    ]);

    await this.refreshPatterns(manager, input.userId, [...recent, saved], now);

    return saved;
  }

  /**
   * Deterministic scoring. Step 17 sections 20-21 and Rule 3.
   *
   * The two contextual inputs are counted here rather than inside the pure
   * scorer, so that the scorer stays a function of its arguments and can be
   * reasoned about on its own.
   */
  private score(
    classification: KarmaClassification,
    interpretation: KarmaClassificationResult,
    recent: ZunoKarmaEntry[],
    now: Date,
  ): KarmaScoreBreakdown {
    const dayStart = startOfUtcDay(now);
    const windowStart = new Date(
      now.getTime() - KARMA_SCORING_V1.repetitionWindowDays * DAY_MS,
    );

    const pointsRecordedToday = recent
      .filter((entry) => entry.created_at >= dayStart && countsTowardProgress(entry))
      .reduce((total, entry) => total + (entry.points ?? 0), 0);

    const priorInCategoryInWindow = recent.filter(
      (entry) =>
        entry.category === interpretation.category &&
        entry.created_at >= windowStart &&
        countsTowardProgress(entry),
    ).length;

    return calculateKarmaPoints(
      {
        classification,
        category: interpretation.category,
        intent: interpretation.intent,
        effort: interpretation.effort,
        relevance: interpretation.relevance,
        priorInCategoryInWindow,
        pointsRecordedToday,
      },
      KARMA_SCORING_V1,
    );
  }

  // -------------------------------------------------------------------------
  // Read path
  // -------------------------------------------------------------------------

  /** Step 21 section 54: GET /api/v1/karma, with the filters of section 72. */
  async list(
    params: ListKarmaParams,
  ): Promise<{ items: ZunoKarmaEntry[]; nextCursor: string | null }> {
    const where: FindOptionsWhere<ZunoKarmaEntry> = {
      user_id: params.userId,
      deleted_at: IsNull(),
      status: Not(KarmaEntryStatus.DELETED),
    };
    if (params.category) where.category = params.category;
    if (params.classification) where.classification = params.classification;
    if (params.source) where.source = params.source;
    if (params.challengeId) where.challenge_id = params.challengeId;

    const cursorDate = params.cursor ? decodeCursor(params.cursor) : null;
    const upperBound = cursorDate ?? params.to ?? null;
    if (upperBound && params.from) {
      where.created_at = betweenExclusiveUpper(params.from, upperBound);
    } else if (upperBound) {
      where.created_at = LessThan(upperBound);
    } else if (params.from) {
      where.created_at = MoreThanOrEqual(params.from);
    }

    const rows = await this.entries.find({
      where,
      order: { created_at: 'DESC', id: 'DESC' },
      take: params.limit + 1,
    });

    const hasMore = rows.length > params.limit;
    const items = hasMore ? rows.slice(0, params.limit) : rows;
    const nextCursor = hasMore
      ? encodeCursor(items[items.length - 1].created_at)
      : null;
    return { items, nextCursor };
  }

  /**
   * Ownership-checked fetch. Step 21 section 106 / Roadmap section 56.
   *
   * A cross-user id produces NOT_FOUND rather than FORBIDDEN, so the endpoint
   * cannot be used to discover that someone else's entry exists.
   */
  async findOwned(userId: string, entryId: string): Promise<ZunoKarmaEntry> {
    const entry = await this.entries.findOne({
      where: { id: entryId, deleted_at: IsNull() },
    });
    const owned = this.ownership.require(entry, userId, 'karma entry');
    if (owned.status === KarmaEntryStatus.DELETED) {
      throw ZunoException.notFound('karma entry is deleted');
    }
    return owned;
  }

  /**
   * Step 17 sections 35-37 and Step 21 section 54: GET /api/v1/karma/summary.
   *
   * Computed per request from entries the caller owns. There is no stored
   * total, because a stored total is the first step towards a number that can
   * be compared between people (Step 17 sections 38, 61, 68).
   */
  async summary(userId: string): Promise<KarmaSummary> {
    const now = this.clock.now();
    const weekStart = new Date(startOfUtcDay(now).getTime() - 6 * DAY_MS);
    const dayStart = startOfUtcDay(now);

    const rows = await this.entries.find({
      where: {
        user_id: userId,
        deleted_at: IsNull(),
        status: Not(KarmaEntryStatus.DELETED),
        created_at: MoreThanOrEqual(weekStart),
      },
      order: { created_at: 'DESC' },
    });

    const week = rows.filter(countsTowardProgress);
    const today = week.filter((entry) => entry.created_at >= dayStart);

    const categoryTotals = new Map<KarmaCategory, number>();
    for (const entry of week) {
      categoryTotals.set(
        entry.category,
        (categoryTotals.get(entry.category) ?? 0) + 1,
      );
    }
    let topCategory: KarmaCategory | null = null;
    let topCount = 0;
    for (const [category, count] of categoryTotals) {
      if (count > topCount) {
        topCategory = category;
        topCount = count;
      }
    }

    const daysActive = new Set(
      week.map((entry) => entry.created_at.toISOString().slice(0, 10)),
    ).size;

    const observed = await this.patterns.find({
      where: { user_id: userId, status: KarmaPatternStatus.OBSERVED },
      order: { last_observed_at: 'DESC' },
    });

    return {
      pointsLabel: KARMA_POINTS_LABEL,
      framing: KARMA_SCORE_FRAMING,
      today: {
        entriesRecorded: today.length,
        points: today.reduce((total, entry) => total + entry.points, 0),
      },
      thisWeek: {
        entriesRecorded: week.length,
        points: week.reduce((total, entry) => total + entry.points, 0),
        daysActive,
        topCategory,
        repairActions: week.filter(
          (entry) => entry.category === KarmaCategory.REPAIR,
        ).length,
      },
      patterns: observed.map((pattern) => ({
        patternType: pattern.pattern_type,
        evidenceCount: pattern.evidence_count,
        lastObservedAt: pattern.last_observed_at.toISOString(),
      })),
    };
  }

  // -------------------------------------------------------------------------
  // Correction and erasure
  // -------------------------------------------------------------------------

  /**
   * Applies a user correction. Step 17 sections 14, 55, 101, 109 and Rule 7;
   * Step 21 section 57.
   *
   * Two rules govern what happens to the points:
   *
   *   1. Points already recorded are never taken away. Step 17 section 41
   *      ("streak broken != karma lost") and section 18 rule out a deduction,
   *      and a correction that cost the user points would teach them not to
   *      correct.
   *   2. A correction may raise them once, using the same scoring version the
   *      entry already carries, so the arithmetic stays explainable. Repeated
   *      corrections change the labels only - Step 17 section 63's caps exist
   *      precisely so that editing cannot be farmed.
   */
  async correct(
    userId: string,
    entryId: string,
    params: CorrectKarmaEntryParams,
  ): Promise<ZunoKarmaEntry> {
    const entry = await this.findOwned(userId, entryId);
    this.ownership.assertVersion(entry, params.version);

    const before = snapshot(entry);
    const firstCorrection = entry.status === KarmaEntryStatus.ACTIVE;

    if (params.classification) entry.classification = params.classification;
    if (params.category) entry.category = params.category;
    if (params.intent) entry.intent = params.intent;

    const textChanged =
      typeof params.text === 'string' && params.text.trim() !== entry.raw_text;
    if (typeof params.text === 'string') {
      const text = params.text.trim();
      if (text.length === 0) {
        throw ZunoException.validation([{ field: 'text', code: 'REQUIRED' }]);
      }
      if (text.length > 5000) {
        throw ZunoException.validation([{ field: 'text', code: 'TOO_LONG' }]);
      }
      // Step 17 section 30: edited text is new content and gets a fresh
      // safety pass, not a pass because the entry already existed.
      const assessment = this.safety.preCheck({
        operation: 'KARMA_ENTRY_CORRECT',
        userId,
        text,
        domains: [],
      });
      if (assessment.blocked) {
        await this.routeToSafety(userId, assessment, 'KARMA_ENTRY_CORRECT');
      }
      entry.raw_text = text;
    }

    // The user has now seen and acted on the classification. `accepted: false`
    // still counts as confirmed, because the active value is now theirs.
    entry.user_confirmed = true;
    entry.status = KarmaEntryStatus.EDITED;

    const now = this.clock.now();
    return this.dataSource.transaction(async (manager) => {
      if (firstCorrection && params.classification) {
        const recent = await this.recentEntriesFor(manager, userId, now);
        const recomputed = calculateKarmaPoints(
          {
            classification: entry.classification,
            category: entry.category,
            intent: entry.intent ?? KarmaIntent.UNKNOWN,
            effort: effortFromFactors(entry),
            relevance: relevanceFromFactors(entry),
            priorInCategoryInWindow: recent.filter(
              (row) =>
                row.id !== entry.id &&
                row.category === entry.category &&
                countsTowardProgress(row),
            ).length,
            pointsRecordedToday: recent
              .filter(
                (row) =>
                  row.id !== entry.id &&
                  row.created_at >= startOfUtcDay(now) &&
                  countsTowardProgress(row),
              )
              .reduce((total, row) => total + row.points, 0),
          },
          KARMA_SCORING_V1,
        );
        // Never downwards. Nothing already recorded is taken away.
        entry.points = Math.max(entry.points, recomputed.points);
        entry.score_factors = [
          ...recomputed.factors,
          { factor: 'USER_CORRECTION', value: 1 },
        ];
      }

      const saved = await manager.save(ZunoKarmaEntry, entry);

      // Step 17 section 89: corrections are preserved in audit history.
      const revision = manager.create(ZunoKarmaEntryRevision, {
        karma_entry_id: saved.id,
        user_id: userId,
        previous_value: before,
        new_value: snapshot(saved),
        changed_by: KarmaRevisionActor.USER,
        reason: params.comment ?? null,
        raw_text_changed: textChanged,
        redacted_at: null,
      });
      await manager.save(ZunoKarmaEntryRevision, revision);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: userId,
        userId,
        action: 'KARMA_ENTRY_CORRECTED',
        entityType: 'ZunoKarmaEntry',
        entityId: saved.id,
        before,
        after: snapshot(saved),
      });

      await this.outbox.enqueue(manager, {
        aggregateType: KARMA_AGGREGATE,
        aggregateId: saved.id,
        eventType:
          KARMA_EMITTED_EVENTS.ENTRY_CORRECTED as unknown as ZunoEventType,
        payload: {
          karma_entry_id: saved.id,
          user_id: userId,
          classification: saved.classification,
          category: saved.category,
          accepted: params.accepted ?? null,
        },
      });

      return saved;
    });
  }

  /**
   * Erases an entry. Step 17 sections 56 and 71, Build Rule 143.
   *
   * Deletion is a real erasure of the sensitive part, not a hidden flag: the
   * row survives so the ledger's own history stays coherent, but raw_text is
   * nulled and redacted_at is stamped, and the entry stops counting towards
   * every summary and pattern from that moment.
   */
  async remove(userId: string, entryId: string): Promise<void> {
    const entry = await this.findOwned(userId, entryId);
    const before = snapshot(entry);
    const now = this.clock.now();

    await this.dataSource.transaction(async (manager) => {
      entry.status = KarmaEntryStatus.DELETED;
      entry.raw_text = null;
      entry.redacted_at = now;
      entry.deleted_at = now;
      const saved = await manager.save(ZunoKarmaEntry, entry);

      const revision = manager.create(ZunoKarmaEntryRevision, {
        karma_entry_id: saved.id,
        user_id: userId,
        previous_value: before,
        new_value: snapshot(saved),
        changed_by: KarmaRevisionActor.USER,
        reason: null,
        raw_text_changed: true,
        redacted_at: null,
      });
      await manager.save(ZunoKarmaEntryRevision, revision);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: userId,
        userId,
        action: 'KARMA_ENTRY_DELETED',
        entityType: 'ZunoKarmaEntry',
        entityId: saved.id,
        before,
        after: snapshot(saved),
      });

      await this.outbox.enqueue(manager, {
        aggregateType: KARMA_AGGREGATE,
        aggregateId: saved.id,
        eventType:
          KARMA_EMITTED_EVENTS.ENTRY_DELETED as unknown as ZunoEventType,
        payload: { karma_entry_id: saved.id, user_id: userId },
      });
    });
  }

  // -------------------------------------------------------------------------
  // Patterns
  // -------------------------------------------------------------------------

  /**
   * Derives behavioural patterns. Step 17 sections 74-77.
   *
   * Every rule below needs KARMA_MIN_PATTERN_EVIDENCE supporting entries, so
   * one action can never produce "You are now highly disciplined"
   * (section 75). Every pattern name describes a direction of behaviour, and
   * none of them describes a deficit - section 77 requires an unhelpful
   * pattern to be raised as something to look at, not as decline.
   */
  private async refreshPatterns(
    manager: EntityManager,
    userId: string,
    entries: ZunoKarmaEntry[],
    now: Date,
  ): Promise<void> {
    const windowStart = new Date(now.getTime() - PATTERN_WINDOW_DAYS * DAY_MS);
    const considered = entries.filter(
      (entry) => entry.created_at >= windowStart && countsTowardProgress(entry),
    );
    if (considered.length < KARMA_MIN_PATTERN_EVIDENCE) return;

    const counts: { type: KarmaPatternType; evidence: number }[] = [
      {
        type: KarmaPatternType.FOLLOW_THROUGH_INCREASING,
        evidence: considered.filter(
          (entry) => entry.intent === KarmaIntent.FOLLOW_THROUGH,
        ).length,
      },
      {
        type: KarmaPatternType.SERVICE_CONSISTENT,
        evidence: considered.filter(
          (entry) => entry.category === KarmaCategory.SERVICE,
        ).length,
      },
      {
        type: KarmaPatternType.REPAIR_BEHAVIOUR_INCREASING,
        evidence: considered.filter(
          (entry) => entry.category === KarmaCategory.REPAIR,
        ).length,
      },
      {
        type: KarmaPatternType.STUDY_DISCIPLINE_IMPROVING,
        evidence: considered.filter(
          (entry) => entry.category === KarmaCategory.LEARNING,
        ).length,
      },
      {
        type: KarmaPatternType.CONSISTENCY_STEADY,
        evidence: new Set(
          considered.map((entry) => entry.created_at.toISOString().slice(0, 10)),
        ).size,
      },
    ];

    for (const candidate of counts) {
      if (candidate.evidence < KARMA_MIN_PATTERN_EVIDENCE) continue;

      const existing = await manager.findOne(ZunoKarmaPattern, {
        where: { user_id: userId, pattern_type: candidate.type },
      });

      if (existing) {
        existing.evidence_count = candidate.evidence;
        existing.last_observed_at = now;
        existing.status = KarmaPatternStatus.OBSERVED;
        existing.confidence = patternConfidence(candidate.evidence);
        await manager.save(ZunoKarmaPattern, existing);
        continue;
      }

      const pattern = manager.create(ZunoKarmaPattern, {
        user_id: userId,
        challenge_id: null,
        pattern_type: candidate.type,
        evidence_count: candidate.evidence,
        confidence: patternConfidence(candidate.evidence),
        status: KarmaPatternStatus.OBSERVED,
        first_observed_at: now,
        last_observed_at: now,
      });
      const saved = await manager.save(ZunoKarmaPattern, pattern);

      await this.outbox.enqueue(manager, {
        aggregateType: KARMA_AGGREGATE,
        aggregateId: saved.id,
        eventType:
          KARMA_EMITTED_EVENTS.PATTERN_DETECTED as unknown as ZunoEventType,
        payload: {
          karma_pattern_id: saved.id,
          user_id: userId,
          pattern_type: saved.pattern_type,
          evidence_count: saved.evidence_count,
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Fails closed when no approved Rulebook is active.
   *
   * `RulebookRepositoryService.isAstrologyAvailable()` currently returns false
   * because nothing has been activated. Build Rule 118 wants the rest of the
   * product to keep working, so this returns a boolean rather than throwing,
   * and the caller records nothing rather than inventing a meaning.
   */
  private async isInterpretationAvailable(): Promise<boolean> {
    try {
      return await this.rulebook.isAstrologyAvailable();
    } catch (error) {
      // An unavailable rulebook is a reason to record nothing, never a reason
      // to fail the user's action. Build Rule 116: classified, not swallowed.
      this.logger.warn(
        `Rulebook availability check failed; treating astrology-derived karma as unavailable: ${
          error instanceof Error ? error.name : 'unknown'
        }`,
      );
      return false;
    }
  }

  private async routeToSafety(
    userId: string,
    assessment: SafetyAssessment,
    operation: string,
  ): Promise<never> {
    await this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId,
        operation,
        assessment,
      });
      await this.safety.recordIncident(manager, {
        userId,
        safetyDecisionId: decision.id,
        source: operation,
        severity: assessment.riskLevel,
        violations: [],
      });
    });

    // Step 17 section 100: safety routing, no reward. No entry is written, so
    // there is nothing to score and nothing to gamify.
    throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
      message: assessment.boundaryMessage ?? KARMA_COPY.safetyRouted,
      safety: {
        disposition: assessment.disposition,
        domain: assessment.domains[0],
      },
    });
  }

  private async findIngestDuplicate(
    event: KarmaActionCompletedPayload,
  ): Promise<ZunoKarmaEntry | null> {
    const byEvent = await this.entries.findOne({
      where: {
        user_id: event.user_id,
        source_event_id: event.event_id,
        deleted_at: IsNull(),
      },
    });
    if (byEvent) return byEvent;

    if (event.plan_item_id) {
      return this.entries.findOne({
        where: {
          user_id: event.user_id,
          plan_item_id: event.plan_item_id,
          deleted_at: IsNull(),
        },
      });
    }
    if (event.mka_item_id) {
      return this.entries.findOne({
        where: {
          user_id: event.user_id,
          mka_item_id: event.mka_item_id,
          deleted_at: IsNull(),
        },
      });
    }
    return null;
  }

  /**
   * Step 17 sections 57 and 99: the user typing out an action they already
   * recorded, or a double-submit, should not score twice.
   *
   * Matched on the same normalised text on the same day. Semantic similarity
   * beyond this needs an embedding the ledger does not have; when the match is
   * not exact the entry is created and the user can merge or delete it, which
   * section 99 permits ("Deduplicate or ask user").
   */
  private async findUserTextDuplicate(
    userId: string,
    text: string,
    occurredAt: Date,
  ): Promise<ZunoKarmaEntry | null> {
    const dayStart = startOfUtcDay(occurredAt);
    const rows = await this.entries.find({
      where: {
        user_id: userId,
        deleted_at: IsNull(),
        occurred_at: MoreThanOrEqual(dayStart),
      },
    });
    const normalised = normaliseText(text);
    return (
      rows.find(
        (row) =>
          row.status !== KarmaEntryStatus.DELETED &&
          row.raw_text !== null &&
          normaliseText(row.raw_text) === normalised,
      ) ?? null
    );
  }

  private async recentEntriesFor(
    manager: EntityManager,
    userId: string,
    now: Date,
  ): Promise<ZunoKarmaEntry[]> {
    const since = new Date(now.getTime() - SCORING_LOOKBACK_DAYS * DAY_MS);
    return manager.find(ZunoKarmaEntry, {
      where: {
        user_id: userId,
        deleted_at: IsNull(),
        created_at: MoreThanOrEqual(since),
      },
    });
  }

  /** Rebuilds the explanation for an entry, neutrality-checked before use. */
  private explanationFor(entry: ZunoKarmaEntry): string {
    const text =
      entry.points > 0
        ? `${entry.points} ${KARMA_POINTS_LABEL} recorded for this action.`
        : 'Recorded in your ledger.';
    assertNeutralCopy(text, 'KarmaService.explanationFor');
    return text;
  }

  private nonPenalisingMessage(outcome: KarmaActionOutcome): string {
    switch (outcome) {
      case KarmaActionOutcome.CANCELLED_BY_REALIGNMENT:
        return KARMA_COPY.cancelledByRealignment;
      case KarmaActionOutcome.DEFERRED:
        return KARMA_COPY.actionDeferred;
      default:
        return KARMA_COPY.actionNotCompleted;
    }
  }

  private truncateLabel(label: string | null): string | null {
    if (!label) return null;
    const trimmed = label.trim();
    if (trimmed.length === 0) return null;
    return trimmed.slice(0, KARMA_ACTION_LABEL_MAX_LENGTH);
  }
}

// ---------------------------------------------------------------------------
// Module-local pure helpers
// ---------------------------------------------------------------------------

/**
 * Whether an entry contributes to totals, repetition and patterns.
 *
 * Deleted entries stop counting the moment they are deleted, which is what
 * makes erasure meaningful rather than cosmetic (Build Rule 38's principle,
 * applied to the ledger).
 */
function countsTowardProgress(entry: ZunoKarmaEntry): boolean {
  return (
    entry.status !== KarmaEntryStatus.DELETED &&
    entry.status !== KarmaEntryStatus.SUPERSEDED &&
    entry.redacted_at === null
  );
}

/**
 * The attribute set a revision records.
 *
 * raw_text is deliberately absent. Step 17 section 70 and Build Rule 34: the
 * audit trail must be able to answer what changed without holding a second,
 * longer-lived copy of the user's private words.
 */
function snapshot(entry: ZunoKarmaEntry): Record<string, unknown> {
  return {
    classification: entry.classification,
    category: entry.category,
    intent: entry.intent,
    impact_scope: entry.impact_scope,
    points: entry.points,
    confidence: entry.confidence,
    status: entry.status,
    user_confirmed: entry.user_confirmed,
    scoring_model_version: entry.scoring_model_version,
    classification_model_version: entry.classification_model_version,
  };
}

function patternConfidence(evidence: number): string {
  // Bounded and deliberately unglamorous. Step 17 section 40 forbids implying
  // precision such as "73% karmically positive", so this stays a coarse
  // sufficiency measure of the evidence count, capped below certainty.
  return Math.min(0.9, 0.5 + evidence * 0.05).toFixed(3);
}

/**
 * Recovers the effort label a score was calculated with.
 *
 * Reading it back off the stored factors rather than re-interpreting the text
 * keeps a correction explainable: the recomputed score used the same effort
 * reading as the original, so the only thing that moved is what the user
 * actually changed.
 */
function effortFromFactors(entry: ZunoKarmaEntry): KarmaEffort {
  const factor = entry.score_factors.find((item) =>
    item.factor.startsWith('EFFORT:'),
  );
  const value = factor?.factor.split(':')[1];
  return isEnumValue(KarmaEffort, value) ? value : KarmaEffort.MEDIUM;
}

function relevanceFromFactors(entry: ZunoKarmaEntry): KarmaRelevance {
  const factor = entry.score_factors.find((item) =>
    item.factor.startsWith('RELEVANCE:'),
  );
  const value = factor?.factor.split(':')[1];
  return isEnumValue(KarmaRelevance, value) ? value : KarmaRelevance.MEDIUM;
}

function isEnumValue<T extends Record<string, string>>(
  target: T,
  value: string | undefined,
): value is T[keyof T] {
  return value !== undefined && Object.values(target).includes(value);
}

function normaliseText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function startOfUtcDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/** Half-open range: inclusive lower bound, exclusive upper, so a cursor page
 *  cannot re-emit the row it ended on. */
function betweenExclusiveUpper(from: Date, to: Date) {
  return And(MoreThanOrEqual(from), LessThan(to));
}

function encodeCursor(date: Date): string {
  return Buffer.from(date.toISOString()).toString('base64url');
}

function decodeCursor(cursor: string): Date | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const date = new Date(decoded);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}
