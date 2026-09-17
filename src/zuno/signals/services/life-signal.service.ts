import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { ZunoLifeSignal } from '../entities/zuno-life-signal.entity';
import { ZunoLifeSignalSource } from '../entities/zuno-life-signal-source.entity';
import { ZunoLifeSignalConfirmation } from '../entities/zuno-life-signal-confirmation.entity';
import { ZunoLifeSignalImpact } from '../entities/zuno-life-signal-impact.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { SafetyService } from '../../safety/services/safety.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import {
  ACCEPTED_LIFE_SIGNAL_SOURCES,
  asZunoAggregateType,
  asZunoEventType,
  canTransitionLifeSignal,
  isConfirmedSignal,
  LIFE_SIGNAL_AGGREGATE,
  LifeSignalMateriality,
  LifeSignalOrigin,
  LifeSignalRelevance,
  LifeSignalReliability,
  LifeSignalSource,
  LifeSignalStatus,
  LifeSignalType,
  MATERIALITY_RANK,
  RealignmentReasonCode,
  SIGNAL_EVENT_TYPES,
  SignalConfirmationActor,
  SignalConfirmationStatus,
  SignalImpactEntityType,
  SignalImpactType,
  UrgencyChange,
} from '../enums';
import {
  Classification,
  SignalClassifierService,
  SIGNAL_DETECTOR_VERSION,
} from './signal-classifier.service';

export interface RecordSignalParams {
  user: ZunoUser;
  challengeId: string | null;
  signalType?: LifeSignalType;
  source?: LifeSignalSource;
  origin?: LifeSignalOrigin;
  statement: string;
  occurredAt?: Date | null;
  sourceEventId?: string | null;
}

export interface RecordSignalResult {
  signal: ZunoLifeSignal | null;
  /** True when the input was conversation rather than change (Step 13 s.5). */
  ignoredAsNoise: boolean;
  noiseReason: string | null;
  /** True when this collapsed into an existing signal (Step 13 s.20). */
  deduplicated: boolean;
  realignmentRecommended: boolean;
  clarificationRequired: boolean;
  /** Set when astrology interpretation was requested but is unavailable. */
  interpretationUnavailable: boolean;
}

export interface ListSignalsParams {
  userId: string;
  challengeId?: string | null;
  status?: LifeSignalStatus;
  limit: number;
}

/**
 * Separated view of a user's signals.
 *
 * Step 13 Rule 3 and section 82 make this a structural requirement rather than
 * a presentation preference: an unconfirmed inference and a confirmed fact must
 * not arrive in the same list for the client to tell apart by reading a flag it
 * may forget to read. Two arrays make the mistake impossible.
 */
export interface SeparatedSignals {
  confirmed: ZunoLifeSignal[];
  unconfirmed: ZunoLifeSignal[];
}

/**
 * The Life Signal Engine. Step 13.
 *
 * It answers one question - "what has changed since we last understood the
 * situation?" - and deliberately stops there. Step 13 Rule 10: "Life Signals
 * inform Realignment; they do not directly rewrite the user's plan." Nothing in
 * this file touches a plan, an MKA programme or a reminder; it raises
 * `realignment_required` and emits an event, and the Realignment Engine decides
 * what that is worth.
 *
 * The pipeline is Step 13 section 49, in order:
 *   candidate detection -> safety pre-check -> normalise -> identify challenge
 *   -> deduplicate/update -> reliability -> materiality -> impacts
 *   -> contradiction -> consequence
 *
 * Safety runs before ordinary processing, not after (section 71). "I lost my
 * job and I don't see any reason to continue living" must not be filed as
 * CAREER_SETBACK and passed on.
 */
@Injectable()
export class LifeSignalService {
  private readonly logger = new Logger(LifeSignalService.name);

  constructor(
    @InjectRepository(ZunoLifeSignal)
    private readonly signals: Repository<ZunoLifeSignal>,
    @InjectRepository(ZunoChallenge)
    private readonly challenges: Repository<ZunoChallenge>,
    private readonly classifier: SignalClassifierService,
    private readonly safety: SafetyService,
    private readonly rulebook: RulebookRepositoryService,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
  ) {}

  // --------------------------------------------------------------- detection

  /**
   * Detects, classifies and stores a candidate Life Signal.
   *
   * Returns `ignoredAsNoise` rather than throwing when the input is ordinary
   * conversation. Step 13 section 101 prohibits "every new user message ->
   * regenerate entire response", and an exception here would push callers
   * towards treating every message as exceptional.
   */
  async record(params: RecordSignalParams): Promise<RecordSignalResult> {
    const statement = params.statement.trim();
    if (statement.length === 0) {
      throw ZunoException.validation([{ field: 'statement', code: 'REQUIRED' }]);
    }

    const source = params.source ?? LifeSignalSource.USER_EXPLICIT;
    if (!ACCEPTED_LIFE_SIGNAL_SOURCES.includes(source)) {
      // Step 20 section 32: "External sources require separate trust and
      // consent controls." Those do not exist yet, so the source is refused
      // rather than quietly downgraded to a trusted one.
      throw ZunoException.validation(
        [{ field: 'source', code: 'SOURCE_NOT_ENABLED' }],
        'This kind of update is not connected yet.',
      );
    }

    const challenge = params.challengeId
      ? await this.findOwnedChallenge(params.user.id, params.challengeId)
      : null;

    // Step 13 section 71: safety precedence. Before classification, before
    // storage, before anything downstream can see this text.
    const assessment = this.safety.preCheck({
      operation: 'LIFE_SIGNAL_RECORD',
      userId: params.user.id,
      challengeId: challenge?.id ?? null,
      text: statement,
      domains: challenge?.primary_domain ? [challenge.primary_domain] : [],
    });

    if (assessment.blocked) {
      await this.dataSource.transaction(async (manager) => {
        const decision = await this.safety.recordDecision(manager, {
          userId: params.user.id,
          challengeId: challenge?.id ?? null,
          operation: 'LIFE_SIGNAL_RECORD',
          assessment,
        });
        await this.safety.recordIncident(manager, {
          userId: params.user.id,
          safetyDecisionId: decision.id,
          source: 'LIFE_SIGNAL_PRECHECK',
          domain: assessment.domains[0] ?? null,
          severity: assessment.riskLevel,
          violations: [],
        });
      });
      throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
        message:
          assessment.boundaryMessage ??
          'I would rather not carry on with this here, and I want to say so plainly.',
        safety: {
          disposition: assessment.disposition,
          domain: assessment.domains[0],
        },
      });
    }

    const now = this.clock.now();
    const classification = this.classifier.classify({
      statement,
      declaredType: params.signalType ?? null,
      source,
      origin: params.origin ?? LifeSignalOrigin.USER_MESSAGE,
      domain: challenge?.primary_domain ?? null,
      challengeDomains: challenge?.primary_domain ? [challenge.primary_domain] : [],
      occurredAt: params.occurredAt ?? null,
      detectedAt: now,
    });

    if (!classification.isCandidateSignal) {
      return {
        signal: null,
        ignoredAsNoise: true,
        noiseReason: classification.noiseReason,
        deduplicated: false,
        realignmentRecommended: false,
        clarificationRequired: false,
        interpretationUnavailable: false,
      };
    }

    // Step 13 sections 64-67: astrology timing signals may only be interpreted
    // against an ACTIVE, APPROVED Rulebook. There is none, so the signal is
    // stored with no interpretation and no rulebook version rather than being
    // rejected outright - the user's observation is still theirs to keep.
    let rulebookVersionId: string | null = null;
    let interpretationUnavailable = false;
    if (classification.requiresRulebook) {
      const active = await this.rulebook.getActive();
      if (active) {
        rulebookVersionId = active.versionId;
      } else {
        interpretationUnavailable = true;
        this.logger.log(
          'Astro timing signal stored without interpretation: no active Rulebook (fail-closed).',
        );
      }
    }

    // Step 13 sections 20 and 88. One retried delivery, one signal.
    const existing = await this.signals.findOne({
      where: {
        user_id: params.user.id,
        challenge_id: challenge?.id ?? IsNull(),
        fingerprint: classification.fingerprint,
        status: Not(In([LifeSignalStatus.ARCHIVED, LifeSignalStatus.DISMISSED])),
      },
      order: { detected_at: 'DESC' },
    });

    if (existing) {
      const corroborated = await this.dataSource.transaction(async (manager) =>
        this.appendSource(manager, existing, {
          statement,
          source,
          origin: params.origin ?? LifeSignalOrigin.USER_MESSAGE,
          reliability: classification.reliability,
          sourceEventId: params.sourceEventId ?? null,
          observedAt: now,
        }),
      );
      return {
        signal: corroborated,
        ignoredAsNoise: false,
        noiseReason: null,
        deduplicated: true,
        realignmentRecommended: corroborated.realignment_required,
        clarificationRequired: corroborated.clarification_required,
        interpretationUnavailable,
      };
    }

    const confirmationStatus = this.initialConfirmationStatus(
      source,
      classification,
    );

    const saved = await this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: params.user.id,
        challengeId: challenge?.id ?? null,
        operation: 'LIFE_SIGNAL_RECORD',
        assessment,
      });

      const signal = manager.create(ZunoLifeSignal, {
        user_id: params.user.id,
        challenge_id: challenge?.id ?? null,
        signal_type: classification.signalType,
        source,
        nature: classification.nature,
        domain: challenge?.primary_domain ?? null,
        raw_value: { statement },
        normalized_value: {
          normalized_event: classification.normalizedEvent,
          detector_version: SIGNAL_DETECTOR_VERSION,
        },
        confidence: classification.confidence.toFixed(3),
        reliability: classification.reliability,
        confirmation_status: confirmationStatus,
        materiality: classification.materiality,
        relevance: classification.relevance,
        urgency_change: classification.urgencyChange,
        // Every signal starts as a candidate. Nothing enters ACTIVE without a
        // confirmation step - Roadmap section 60, Step 13 Rule 3.
        status: LifeSignalStatus.CANDIDATE,
        is_inference: classification.isInference,
        clarification_required: classification.clarificationRequired,
        realignment_required: false,
        reason_codes: classification.reasonCodes,
        fingerprint: classification.fingerprint,
        supersedes_signal_id: null,
        occurred_at: params.occurredAt ?? null,
        detected_at: now,
        processed_at: now,
        stale_after: classification.staleAfter,
        rulebook_version_id: rulebookVersionId,
        detector_version: SIGNAL_DETECTOR_VERSION,
        safety_decision_id: decision.id,
      });
      const row = await manager.save(ZunoLifeSignal, signal);

      await this.appendSource(manager, row, {
        statement,
        source,
        origin: params.origin ?? LifeSignalOrigin.USER_MESSAGE,
        reliability: classification.reliability,
        sourceEventId: params.sourceEventId ?? null,
        observedAt: now,
      });

      await manager.save(
        ZunoLifeSignalConfirmation,
        manager.create(ZunoLifeSignalConfirmation, {
          life_signal_id: row.id,
          user_id: params.user.id,
          from_status: SignalConfirmationStatus.UNCONFIRMED,
          to_status: confirmationStatus,
          actor_type:
            source === LifeSignalSource.USER_EXPLICIT
              ? SignalConfirmationActor.USER
              : SignalConfirmationActor.SYSTEM,
          actor_id: params.user.id,
          prompt_text: null,
          response_note: null,
          redacted_at: null,
        }),
      );

      // A system-observed signal is already confirmed by definition, so it can
      // go straight to ACTIVE. A user statement, however explicit, still passes
      // through the confirmation step the roadmap requires.
      if (
        isConfirmedSignal(confirmationStatus) &&
        source !== LifeSignalSource.USER_EXPLICIT
      ) {
        await this.activate(manager, row, params.user.id);
      }

      await this.audit.record(manager, {
        actorType: source === LifeSignalSource.USER_EXPLICIT ? 'USER' : 'SYSTEM',
        actorId: params.user.id,
        userId: params.user.id,
        action: 'LIFE_SIGNAL_DETECTED',
        entityType: 'ZunoLifeSignal',
        entityId: row.id,
        after: {
          status: row.status,
          confirmation_status: row.confirmation_status,
          materiality: row.materiality,
        },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: asZunoAggregateType(LIFE_SIGNAL_AGGREGATE),
        aggregateId: row.id,
        eventType: asZunoEventType(SIGNAL_EVENT_TYPES.LIFE_SIGNAL_DETECTED),
        payload: {
          life_signal_id: row.id,
          user_id: params.user.id,
          challenge_id: row.challenge_id,
          signal_type: row.signal_type,
          materiality: row.materiality,
          confirmation_status: row.confirmation_status,
          is_inference: row.is_inference,
        },
      });

      return row;
    });

    return {
      signal: saved,
      ignoredAsNoise: false,
      noiseReason: null,
      deduplicated: false,
      realignmentRecommended: saved.realignment_required,
      clarificationRequired: saved.clarification_required,
      interpretationUnavailable,
    };
  }

  // ------------------------------------------------------------ confirmation

  /**
   * The user confirms a candidate signal.
   *
   * This is the only path by which a user-reported signal becomes something
   * ZUNO will act on. Step 13 section 19: "HR gave me a termination letter"
   * becomes a confirmed event; "I think they might fire me" does not, and that
   * distinction is enforced here rather than in a prompt.
   */
  async confirm(
    user: ZunoUser,
    signalId: string,
    note?: string,
  ): Promise<ZunoLifeSignal> {
    const signal = await this.findOwned(user.id, signalId);

    if (isConfirmedSignal(signal.confirmation_status)) return signal;
    if (signal.confirmation_status === SignalConfirmationStatus.REJECTED) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `signal ${signalId} was rejected and cannot be confirmed`,
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const from = signal.confirmation_status;
      signal.confirmation_status = SignalConfirmationStatus.CONFIRMED_USER_REPORTED;
      signal.reliability = LifeSignalReliability.USER_CONFIRMED;
      // A confirmed statement is no longer ZUNO's inference; the user has
      // vouched for it. Step 13 section 13: a signal may become a new fact.
      signal.is_inference = false;
      signal.clarification_required = false;

      await this.activate(manager, signal, user.id);

      await manager.save(
        ZunoLifeSignalConfirmation,
        manager.create(ZunoLifeSignalConfirmation, {
          life_signal_id: signal.id,
          user_id: user.id,
          from_status: from,
          to_status: signal.confirmation_status,
          actor_type: SignalConfirmationActor.USER,
          actor_id: user.id,
          prompt_text: null,
          response_note: note ?? null,
          redacted_at: null,
        }),
      );

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'LIFE_SIGNAL_CONFIRMED',
        entityType: 'ZunoLifeSignal',
        entityId: signal.id,
        before: { confirmation_status: from },
        after: { confirmation_status: signal.confirmation_status },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: asZunoAggregateType(LIFE_SIGNAL_AGGREGATE),
        aggregateId: signal.id,
        eventType: asZunoEventType(SIGNAL_EVENT_TYPES.LIFE_SIGNAL_CONFIRMED),
        payload: {
          life_signal_id: signal.id,
          user_id: user.id,
          challenge_id: signal.challenge_id,
          materiality: signal.materiality,
        },
      });

      if (signal.realignment_required) {
        await this.outbox.enqueueMany(manager, [
          {
            aggregateType: asZunoAggregateType(LIFE_SIGNAL_AGGREGATE),
            aggregateId: signal.id,
            eventType: asZunoEventType(SIGNAL_EVENT_TYPES.LIFE_SIGNAL_MATERIAL),
            payload: {
              life_signal_id: signal.id,
              user_id: user.id,
              challenge_id: signal.challenge_id,
              reason_codes: signal.reason_codes,
            },
          },
          {
            aggregateType: asZunoAggregateType(LIFE_SIGNAL_AGGREGATE),
            aggregateId: signal.id,
            eventType: asZunoEventType(SIGNAL_EVENT_TYPES.REALIGNMENT_REQUESTED),
            payload: {
              life_signal_id: signal.id,
              user_id: user.id,
              challenge_id: signal.challenge_id,
            },
          },
        ]);
      }

      return signal;
    });
  }

  /**
   * The user rejects a candidate signal. Roadmap section 66.
   *
   * The row is kept, not deleted. Step 13 section 92 counts the clarification
   * rate as a quality metric, and a rejection is the most informative outcome
   * there is - it says ZUNO read the situation wrong.
   */
  async reject(
    user: ZunoUser,
    signalId: string,
    note?: string,
  ): Promise<ZunoLifeSignal> {
    const signal = await this.findOwned(user.id, signalId);

    if (signal.confirmation_status === SignalConfirmationStatus.REJECTED) {
      return signal;
    }

    return this.dataSource.transaction(async (manager) => {
      const fromStatus = signal.status;
      const fromConfirmation = signal.confirmation_status;

      signal.status = this.transition(fromStatus, LifeSignalStatus.DISMISSED);
      signal.confirmation_status = SignalConfirmationStatus.REJECTED;
      // A rejected signal must not keep asking for a realignment.
      signal.realignment_required = false;
      signal.clarification_required = false;
      await manager.save(ZunoLifeSignal, signal);

      await manager.save(
        ZunoLifeSignalConfirmation,
        manager.create(ZunoLifeSignalConfirmation, {
          life_signal_id: signal.id,
          user_id: user.id,
          from_status: fromConfirmation,
          to_status: SignalConfirmationStatus.REJECTED,
          actor_type: SignalConfirmationActor.USER,
          actor_id: user.id,
          prompt_text: null,
          response_note: note ?? null,
          redacted_at: null,
        }),
      );

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'LIFE_SIGNAL_REJECTED',
        entityType: 'ZunoLifeSignal',
        entityId: signal.id,
        before: { status: fromStatus, confirmation_status: fromConfirmation },
        after: { status: signal.status, confirmation_status: signal.confirmation_status },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: asZunoAggregateType(LIFE_SIGNAL_AGGREGATE),
        aggregateId: signal.id,
        eventType: asZunoEventType(SIGNAL_EVENT_TYPES.LIFE_SIGNAL_REJECTED),
        payload: {
          life_signal_id: signal.id,
          user_id: user.id,
          challenge_id: signal.challenge_id,
        },
      });

      return signal;
    });
  }

  // ------------------------------------------------------------------- reads

  async findOwned(userId: string, signalId: string): Promise<ZunoLifeSignal> {
    const signal = await this.signals.findOne({
      where: { id: signalId, deleted_at: IsNull() },
    });
    return this.ownership.require(signal, userId, 'life signal');
  }

  /**
   * Lists signals split by whether ZUNO actually knows them.
   *
   * Stale signals are excluded from both arrays unless explicitly asked for.
   * Step 13 section 60: a signal that has decayed should not keep shaping the
   * current picture just because nothing has swept it yet.
   */
  async listSeparated(params: ListSignalsParams): Promise<SeparatedSignals> {
    const rows = await this.query(params);
    const now = this.clock.now();
    const live = params.status
      ? rows
      : rows.filter((row) => !this.isStale(row, now));

    return {
      confirmed: live.filter((row) => isConfirmedSignal(row.confirmation_status)),
      unconfirmed: live.filter(
        (row) => !isConfirmedSignal(row.confirmation_status),
      ),
    };
  }

  /**
   * The signals the Realignment Engine is allowed to act on.
   *
   * Three filters, each load-bearing:
   *   confirmed    - Step 13 Rule 3, an inference is not grounds to change a plan
   *   ACTIVE       - candidates and dismissed signals are not in play
   *   not stale    - Step 13 section 60, decayed evidence does not drive change
   */
  async actionableSignals(
    userId: string,
    challengeId: string,
  ): Promise<ZunoLifeSignal[]> {
    const rows = await this.signals.find({
      where: {
        user_id: userId,
        challenge_id: challengeId,
        status: LifeSignalStatus.ACTIVE,
        deleted_at: IsNull(),
      },
      order: { detected_at: 'DESC' },
      take: 200,
    });
    const now = this.clock.now();
    return rows.filter(
      (row) =>
        isConfirmedSignal(row.confirmation_status) && !this.isStale(row, now),
    );
  }

  /** Step 13 section 60. Pure predicate so every reader applies one rule. */
  isStale(signal: ZunoLifeSignal, now: Date): boolean {
    if (signal.status === LifeSignalStatus.STALE) return true;
    if (!signal.stale_after) return false;
    return signal.stale_after.getTime() <= now.getTime();
  }

  // ------------------------------------------------------------ maintenance

  /**
   * Moves decayed signals into STALE. Step 13 section 60.
   *
   * Written as an explicit sweep rather than a read-time side effect: a GET
   * that silently mutates rows is a surprise, and the transition deserves an
   * event so notifications can stop referring to signals that no longer apply.
   */
  async sweepStale(userId: string, challengeId?: string | null): Promise<number> {
    const now = this.clock.now();
    const due = await this.signals.find({
      where: {
        user_id: userId,
        ...(challengeId ? { challenge_id: challengeId } : {}),
        status: In([LifeSignalStatus.ACTIVE, LifeSignalStatus.CANDIDATE]),
        stale_after: LessThan(now),
        deleted_at: IsNull(),
      },
      take: 500,
    });
    if (due.length === 0) return 0;

    await this.dataSource.transaction(async (manager) => {
      for (const signal of due) {
        const from = signal.status;
        signal.status = this.transition(from, LifeSignalStatus.STALE);
        // A stale signal cannot keep requesting a realignment; Step 14
        // section 108 warns against endless adaptation on fluctuating input.
        signal.realignment_required = false;
        await manager.save(ZunoLifeSignal, signal);
        await this.outbox.enqueue(manager, {
          aggregateType: asZunoAggregateType(LIFE_SIGNAL_AGGREGATE),
          aggregateId: signal.id,
          eventType: asZunoEventType(SIGNAL_EVENT_TYPES.LIFE_SIGNAL_STALE),
          payload: {
            life_signal_id: signal.id,
            user_id: signal.user_id,
            challenge_id: signal.challenge_id,
          },
        });
      }
    });
    return due.length;
  }

  // --------------------------------------------------------------- internals

  private async query(params: ListSignalsParams): Promise<ZunoLifeSignal[]> {
    return this.signals.find({
      where: {
        user_id: params.userId,
        ...(params.challengeId ? { challenge_id: params.challengeId } : {}),
        ...(params.status ? { status: params.status } : {}),
        deleted_at: IsNull(),
      },
      order: { detected_at: 'DESC' },
      take: Math.min(params.limit, 100),
    });
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

  /**
   * Promotes a confirmed signal to ACTIVE and works out its consequences.
   *
   * Everything that decides whether the plan may be touched happens here, in
   * one place, inside the caller's transaction: superseding the signal it
   * contradicts (section 22), recording impacts (section 33 of Step 20), and
   * setting `realignment_required` against the threshold (section 26/50).
   */
  private async activate(
    manager: EntityManager,
    signal: ZunoLifeSignal,
    userId: string,
  ): Promise<void> {
    const now = this.clock.now();

    // Step 13 sections 21-22: a later signal about the same thing replaces the
    // earlier one. Both states must never look simultaneously active.
    const candidates = await manager.find(ZunoLifeSignal, {
      where: {
        user_id: userId,
        challenge_id: signal.challenge_id ?? IsNull(),
        status: LifeSignalStatus.ACTIVE,
        id: Not(signal.id),
        deleted_at: IsNull(),
      },
    });
    const superseded = candidates.filter((previous) =>
      this.replaces(signal, previous),
    );
    for (const previous of superseded) {
      if (previous.fingerprint === signal.fingerprint) continue;
      previous.status = this.transition(
        previous.status,
        LifeSignalStatus.SUPERSEDED,
      );
      previous.realignment_required = false;
      await manager.save(ZunoLifeSignal, previous);
      await this.outbox.enqueue(manager, {
        aggregateType: asZunoAggregateType(LIFE_SIGNAL_AGGREGATE),
        aggregateId: previous.id,
        eventType: asZunoEventType(SIGNAL_EVENT_TYPES.LIFE_SIGNAL_SUPERSEDED),
        payload: {
          life_signal_id: previous.id,
          superseded_by: signal.id,
          user_id: userId,
          challenge_id: previous.challenge_id,
        },
      });
      signal.supersedes_signal_id = previous.id;
    }

    signal.status = this.transition(signal.status, LifeSignalStatus.ACTIVE);
    signal.processed_at = now;
    signal.realignment_required = this.requiresRealignment(signal, now);
    if (
      signal.realignment_required &&
      !signal.reason_codes.includes(RealignmentReasonCode.NEW_FACT) &&
      signal.reason_codes.length === 0
    ) {
      signal.reason_codes = [RealignmentReasonCode.NEW_FACT];
    }
    await manager.save(ZunoLifeSignal, signal);

    if (signal.challenge_id) {
      await manager.save(
        ZunoLifeSignalImpact,
        manager.create(ZunoLifeSignalImpact, {
          life_signal_id: signal.id,
          user_id: userId,
          entity_type: SignalImpactEntityType.CHALLENGE,
          entity_id: signal.challenge_id,
          entity_key: null,
          impact_type: this.impactType(signal),
          impact_score: (
            MATERIALITY_RANK[signal.materiality] / 3
          ).toFixed(3),
          redacted_at: null,
        }),
      );
    }

    await this.outbox.enqueue(manager, {
      aggregateType: asZunoAggregateType(LIFE_SIGNAL_AGGREGATE),
      aggregateId: signal.id,
      eventType: asZunoEventType(SIGNAL_EVENT_TYPES.LIFE_SIGNAL_VALIDATED),
      payload: {
        life_signal_id: signal.id,
        user_id: userId,
        challenge_id: signal.challenge_id,
        status: signal.status,
      },
    });
  }

  /**
   * Does the newer signal replace the older one? Step 13 sections 21-22.
   *
   * Two deterministic cases, and no third:
   *
   *   SAME TYPE     - section 21's example. "Interview scheduled Friday" then
   *                   "interview moved to Monday": one interview, one current
   *                   date, and both must never look active at once.
   *
   *   CONTRADICTION - section 22's example. "My manager said my role is safe"
   *                   then "HR has included my role in restructuring" are
   *                   different signal types, so a type match would miss it
   *                   entirely. What identifies them as contradictory is that
   *                   they push urgency in opposite directions within the same
   *                   life domain.
   *
   * Deliberately not attempted here: semantic similarity. Section 48 allows an
   * LLM to assist with that, but section 48 is equally clear that
   * "deterministic logic controls the resulting state transition" - so a model
   * may later propose a pair, and this method still decides.
   */
  private replaces(
    incoming: ZunoLifeSignal,
    previous: ZunoLifeSignal,
  ): boolean {
    if (incoming.signal_type === previous.signal_type) return true;
    if (incoming.domain === null || incoming.domain !== previous.domain) {
      return false;
    }
    if (
      incoming.urgency_change === UrgencyChange.NONE ||
      previous.urgency_change === UrgencyChange.NONE
    ) {
      return false;
    }
    return incoming.urgency_change !== previous.urgency_change;
  }

  /**
   * The realignment threshold. Step 13 sections 26 and 50.
   *
   * Four conditions, all required. Dropping any one of them reintroduces a
   * failure the specification names explicitly:
   *   confirmed  - section 19, a possibility is not a fact
   *   not stale  - section 60, decayed evidence
   *   HIGH+      - section 50, low materiality is stored, not acted on
   *   relevant   - section 16, an unrelated event changes nothing here
   */
  private requiresRealignment(signal: ZunoLifeSignal, now: Date): boolean {
    if (!isConfirmedSignal(signal.confirmation_status)) return false;
    if (this.isStale(signal, now)) return false;
    if (
      MATERIALITY_RANK[signal.materiality] <
      MATERIALITY_RANK[LifeSignalMateriality.HIGH]
    ) {
      return false;
    }
    return (
      signal.relevance === LifeSignalRelevance.DIRECT ||
      signal.relevance === LifeSignalRelevance.INDIRECT
    );
  }

  private impactType(signal: ZunoLifeSignal): SignalImpactType {
    switch (signal.signal_type) {
      case LifeSignalType.PLAN_BLOCKER:
        return SignalImpactType.BLOCKS;
      case LifeSignalType.PLAN_PROGRESS:
        return SignalImpactType.PROGRESSES;
      case LifeSignalType.OPPORTUNITY:
        return SignalImpactType.INTRODUCES;
      case LifeSignalType.STATUS_CHANGE:
      case LifeSignalType.GOAL_CHANGE:
        return SignalImpactType.INVALIDATES;
      default:
        return SignalImpactType.SUPPORTS;
    }
  }

  /**
   * Where a newly detected signal starts on the confirmation axis.
   *
   * A system observation is confirmed because ZUNO watched it happen. A user
   * statement is not, however plainly worded - Roadmap section 66 requires the
   * user be able to reject a candidate, which is only meaningful if the
   * candidate existed. High-impact ambiguity gets the explicit
   * AWAITING_USER_CONFIRMATION state so the client knows to ask (section 82).
   */
  private initialConfirmationStatus(
    source: LifeSignalSource,
    classification: Classification,
  ): SignalConfirmationStatus {
    if (source === LifeSignalSource.ADMIN) {
      return SignalConfirmationStatus.CONFIRMED_ADMIN;
    }
    if (source !== LifeSignalSource.USER_EXPLICIT) {
      return SignalConfirmationStatus.CONFIRMED_SYSTEM_OBSERVED;
    }
    return classification.clarificationRequired
      ? SignalConfirmationStatus.AWAITING_USER_CONFIRMATION
      : SignalConfirmationStatus.UNCONFIRMED;
  }

  private async appendSource(
    manager: EntityManager,
    signal: ZunoLifeSignal,
    input: {
      statement: string;
      source: LifeSignalSource;
      origin: LifeSignalOrigin;
      reliability: LifeSignalReliability;
      sourceEventId: string | null;
      observedAt: Date;
    },
  ): Promise<ZunoLifeSignal> {
    await manager.save(
      ZunoLifeSignalSource,
      manager.create(ZunoLifeSignalSource, {
        life_signal_id: signal.id,
        user_id: signal.user_id,
        source: input.source,
        origin: input.origin,
        reliability: input.reliability,
        source_event_id: input.sourceEventId,
        source_ref: null,
        fingerprint: this.classifier.fingerprintFor(
          signal.signal_type,
          input.statement.slice(0, 120),
          input.observedAt,
        ),
        payload: { statement: input.statement },
        observed_at: input.observedAt,
        redacted_at: null,
      }),
    );
    return signal;
  }

  /** Build Rule 179: an illegal lifecycle move fails loudly. */
  private transition(
    from: LifeSignalStatus,
    to: LifeSignalStatus,
  ): LifeSignalStatus {
    if (from === to) return to;
    if (!canTransitionLifeSignal(from, to)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `illegal life signal transition ${from} -> ${to}`,
      });
    }
    return to;
  }
}
