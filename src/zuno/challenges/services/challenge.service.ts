import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { ZunoChallenge } from '../entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../entities/zuno-challenge-context.entity';
import { ZunoChallengeDomain } from '../entities/zuno-challenge-domain.entity';
import { ZunoResponse } from '../../responses/entities/zuno-response.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoUserProfile } from '../../identity/entities/zuno-user-profile.entity';
import { WhatNowService } from '../../whatnow/services/whatnow.service';
import {
  ResponseComposerService,
  RESPONSE_COMPOSER_VERSION,
} from '../../responses/services/response-composer.service';
import { SafetyService, SafetyAssessment } from '../../safety/services/safety.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import {
  canTransitionChallenge,
  ChallengeStatus,
  ResponseType,
  ZunoAggregateType,
  ZunoDomain,
  ZunoEventType,
} from '../../common/enums';

export interface CreateChallengeParams {
  user: ZunoUser;
  statement: string;
}

export interface ListChallengesParams {
  userId: string;
  status?: ChallengeStatus;
  limit: number;
  cursor?: string;
}

/**
 * Owns the WhatNow challenge lifecycle.
 *
 * This is the Node-side orchestration Step 21 section 4 describes: request
 * validation, ownership, lifecycle, transactions, safety enforcement, event
 * publication and response assembly. The intelligence itself lives behind
 * WhatNowService.
 *
 * The pipeline it implements is Step 11 section 67, in order:
 *   safety pre-check -> extraction -> deterministic validation -> domain
 *   classification -> confidence evaluation -> context version -> routing
 *
 * Safety runs first and unconditionally, before any model call. Build Rule 163:
 * safety is integrated from the beginning, not bolted on before production.
 */
@Injectable()
export class ChallengeService {
  private readonly logger = new Logger(ChallengeService.name);

  constructor(
    @InjectRepository(ZunoChallenge)
    private readonly challenges: Repository<ZunoChallenge>,
    @InjectRepository(ZunoChallengeContext)
    private readonly contexts: Repository<ZunoChallengeContext>,
    @InjectRepository(ZunoResponse)
    private readonly responses: Repository<ZunoResponse>,
    @InjectRepository(ZunoUserProfile)
    private readonly profiles: Repository<ZunoUserProfile>,
    private readonly whatNow: WhatNowService,
    private readonly composer: ResponseComposerService,
    private readonly safety: SafetyService,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a challenge from the user's own words.
   *
   * Deliberately does NOT analyse. Step 21 section 25 has creation return
   * `{ challengeId, status: PROCESSING }` and section 26 makes analysis a
   * separate call, so the write is fast and the expensive path is explicit.
   *
   * The safety pre-check still runs here, because a critical signal must be
   * caught at the moment of writing, not deferred to whenever analysis happens.
   */
  async create(params: CreateChallengeParams): Promise<ZunoChallenge> {
    const statement = params.statement.trim();
    if (statement.length === 0) {
      throw ZunoException.validation([
        { field: 'statement', code: 'REQUIRED' },
      ]);
    }

    const assessment = this.safety.preCheck({
      operation: 'CHALLENGE_CREATE',
      userId: params.user.id,
      text: statement,
      domains: [],
    });

    return this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: params.user.id,
        operation: 'CHALLENGE_CREATE',
        assessment,
      });

      if (assessment.blocked) {
        await this.safety.recordIncident(manager, {
          userId: params.user.id,
          safetyDecisionId: decision.id,
          source: 'CHALLENGE_CREATE_PRECHECK',
          severity: assessment.riskLevel,
          violations: [],
        });
        await this.outbox.enqueue(manager, {
          aggregateType: ZunoAggregateType.SAFETY_DECISION,
          aggregateId: decision.id,
          eventType: ZunoEventType.SAFETY_CRITICAL_ESCALATION,
          payload: {
            safety_decision_id: decision.id,
            user_id: params.user.id,
            risk_level: assessment.riskLevel,
          },
        });

        // Step 21 section 70: the body carries a stable machine-readable
        // safety disposition so the client can render the right experience.
        throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
          message:
            assessment.boundaryMessage ??
            'I am not able to help with this here, and I would rather say so plainly.',
          safety: {
            disposition: assessment.disposition,
            domain: assessment.domains[0],
          },
        });
      }

      const now = this.clock.now();
      const challenge = manager.create(ZunoChallenge, {
        user_id: params.user.id,
        title: null,
        raw_user_statement: statement,
        primary_domain: null,
        theme: null,
        status: ChallengeStatus.NEW,
        mode: null,
        urgency: null,
        emotional_intensity: null,
        priority: null,
        context_version: 0,
        opened_at: now,
        resolved_at: null,
        resolution_note: null,
      });
      const saved = await manager.save(ZunoChallenge, challenge);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: params.user.id,
        userId: params.user.id,
        action: 'CHALLENGE_CREATED',
        entityType: 'ZunoChallenge',
        entityId: saved.id,
        after: { status: saved.status },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: ZunoAggregateType.CHALLENGE,
        aggregateId: saved.id,
        eventType: ZunoEventType.CHALLENGE_CREATED,
        payload: { challenge_id: saved.id, user_id: params.user.id },
      });

      return saved;
    });
  }

  /**
   * Runs the WhatNow engine and persists a new context version.
   *
   * Re-analysing an already-understood challenge is legitimate - Step 11
   * section 32 shows context evolving across versions - so this appends rather
   * than replacing (Step 11 Rule 8).
   */
  async analyze(user: ZunoUser, challengeId: string): Promise<{
    challenge: ZunoChallenge;
    context: ZunoChallengeContext;
    response: ZunoResponse;
  }> {
    const challenge = await this.findOwned(user.id, challengeId);

    if (
      challenge.status === ChallengeStatus.ARCHIVED ||
      challenge.status === ChallengeStatus.RESOLVED
    ) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `cannot analyze a ${challenge.status} challenge`,
      });
    }

    const profile = await this.profiles.findOne({ where: { user_id: user.id } });
    const previous = await this.latestContext(challenge.id);

    // FIRST safety pass, before any model call.
    //
    // Step 11 section 67 places the safety pre-check ahead of semantic
    // extraction, and Step 19 section 50 says it happens "before full
    // orchestration" because it can alter the entire execution path. Running
    // the engine first would mean a self-harm statement reaching a model
    // provider before ZUNO noticed it - and would still cost the call even
    // though the result must be discarded.
    const initialAssessment = this.safety.preCheck({
      operation: 'CHALLENGE_ANALYZE',
      userId: user.id,
      challengeId: challenge.id,
      text: challenge.raw_user_statement,
      domains: [],
    });

    if (initialAssessment.blocked) {
      return this.handleBlockedAnalysis(user, challenge, initialAssessment);
    }

    const analysis = await this.whatNow.analyze({
      statement: challenge.raw_user_statement,
      countryCode: profile?.country_code ?? null,
      preferredName: profile?.preferred_name ?? null,
      previousSummary: previous?.summary ?? null,
    });

    // SECOND safety pass, now that the domains are known.
    //
    // Domain-driven rules such as SAFE-IMM-001 could not have matched on the
    // first pass, because classification had not happened yet. Refining carries
    // the first pass's flags forward so nothing detected earlier is lost.
    const domains: ZunoDomain[] = [
      analysis.primaryDomain,
      ...analysis.secondaryDomains.map((entry) => entry.domain),
    ];
    const assessment = this.safety.refineWithDomains(initialAssessment, {
      operation: 'CHALLENGE_ANALYZE',
      userId: user.id,
      challengeId: challenge.id,
      text: challenge.raw_user_statement,
      domains,
      modelFlags: analysis.safetyFlags,
    });

    if (assessment.blocked) {
      return this.handleBlockedAnalysis(user, challenge, assessment);
    }

    const payload = this.composer.compose({
      context: analysis.payload,
      clarificationRequired: analysis.clarificationRequired,
      responseDepth: analysis.responseDepth,
      safety: assessment,
      preferredName: profile?.preferred_name ?? null,
    });

    // Step 21 section 69 / Step 19 section 51: validate candidate output before
    // it can reach the user.
    const postCheck = this.safety.postCheck({
      userId: user.id,
      challengeId: challenge.id,
      candidateText: collectText(payload),
      assessment,
    });

    return this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: user.id,
        challengeId: challenge.id,
        operation: 'CHALLENGE_ANALYZE',
        assessment,
      });

      if (!postCheck.allowed) {
        // Build Rule 128 forbids returning a fabricated success. The incident
        // is recorded and the caller is told honestly that we could not produce
        // something we were willing to show.
        await this.safety.recordIncident(manager, {
          userId: user.id,
          safetyDecisionId: decision.id,
          source: 'RESPONSE_POST_CHECK',
          domain: analysis.primaryDomain,
          severity: assessment.riskLevel,
          violations: postCheck.violations,
        });
        this.logger.warn(
          `Post-check blocked a response for challenge ${challenge.id}: ${postCheck.violations.join(',')}`,
        );
        throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
          message:
            'I could not put this in a way I was comfortable sending. Let us try approaching it differently.',
          safety: { disposition: assessment.disposition },
        });
      }

      const nextVersion = challenge.context_version + 1;
      const context = manager.create(ZunoChallengeContext, {
        challenge_id: challenge.id,
        user_id: user.id,
        version_number: nextVersion,
        summary: analysis.payload.summary,
        payload: analysis.payload,
        routing: analysis.routing,
        confidence: analysis.confidence.toFixed(3),
        clarification_required: analysis.clarificationRequired,
        extractor_version: analysis.extractorVersion,
        ai_generation_run_id: analysis.aiGenerationRunId,
        created_reason: previous ? 'REANALYSIS' : 'INITIAL_ANALYSIS',
        redacted_at: null,
      });
      const savedContext = await manager.save(ZunoChallengeContext, context);

      // Domain rows are rewritten each analysis because they describe the
      // *current* classification; the historical classification is preserved in
      // the context version, so nothing is lost.
      await manager.delete(ZunoChallengeDomain, { challenge_id: challenge.id });
      const domainRows = domains.map((domain) =>
        manager.create(ZunoChallengeDomain, {
          challenge_id: challenge.id,
          user_id: user.id,
          domain,
          risk_class:
            analysis.domainRisk.get(domain) ??
            (assessment.riskLevel as ZunoChallengeDomain['risk_class']),
          is_primary: domain === analysis.primaryDomain,
          confidence:
            analysis.secondaryDomains
              .find((entry) => entry.domain === domain)
              ?.confidence?.toFixed(3) ??
            (domain === analysis.primaryDomain
              ? analysis.confidence.toFixed(3)
              : null),
        }),
      );
      await manager.save(ZunoChallengeDomain, domainRows);

      const previousStatus = challenge.status;
      const nextStatus = analysis.clarificationRequired
        ? ChallengeStatus.UNDERSTANDING
        : ChallengeStatus.ACTIVE;

      challenge.primary_domain = analysis.primaryDomain;
      challenge.theme = analysis.theme;
      challenge.title = analysis.title;
      challenge.urgency = analysis.urgency;
      challenge.emotional_intensity = analysis.emotionalIntensity;
      challenge.mode = analysis.mode;
      challenge.context_version = nextVersion;
      challenge.status = this.transition(challenge.status, nextStatus);
      const savedChallenge = await manager.save(ZunoChallenge, challenge);

      const response = manager.create(ZunoResponse, {
        user_id: user.id,
        challenge_id: challenge.id,
        conversation_id: null,
        response_type: analysis.clarificationRequired
          ? ResponseType.CONTEXT_VALIDATION
          : ResponseType.CONTEXT_VALIDATION,
        structured_payload: payload,
        rendered_text: null,
        context_version: nextVersion,
        model_version: null,
        prompt_version: analysis.extractorVersion,
        engine_version: RESPONSE_COMPOSER_VERSION,
        rulebook_version_id: null,
        safety_decision_id: decision.id,
        redacted_at: null,
      });
      const savedResponse = await manager.save(ZunoResponse, response);

      await this.audit.record(manager, {
        actorType: 'SYSTEM',
        userId: user.id,
        action: 'CHALLENGE_ANALYZED',
        entityType: 'ZunoChallenge',
        entityId: challenge.id,
        before: { status: previousStatus, context_version: nextVersion - 1 },
        after: { status: savedChallenge.status, context_version: nextVersion },
        metadata: { confidence: analysis.confidence },
      });

      await this.outbox.enqueueMany(manager, [
        {
          aggregateType: ZunoAggregateType.CHALLENGE,
          aggregateId: challenge.id,
          eventType: ZunoEventType.CHALLENGE_ANALYZED,
          payload: {
            challenge_id: challenge.id,
            user_id: user.id,
            primary_domain: analysis.primaryDomain,
            context_version: nextVersion,
            clarification_required: analysis.clarificationRequired,
          },
        },
        {
          aggregateType: ZunoAggregateType.RESPONSE,
          aggregateId: savedResponse.id,
          eventType: ZunoEventType.RESPONSE_GENERATED,
          payload: {
            response_id: savedResponse.id,
            challenge_id: challenge.id,
            user_id: user.id,
          },
        },
      ]);

      if (analysis.clarificationRequired) {
        await this.outbox.enqueue(manager, {
          aggregateType: ZunoAggregateType.CHALLENGE,
          aggregateId: challenge.id,
          eventType: ZunoEventType.CLARIFICATION_REQUESTED,
          payload: { challenge_id: challenge.id, user_id: user.id },
        });
      }

      return {
        challenge: savedChallenge,
        context: savedContext,
        response: savedResponse,
      };
    });
  }

  /**
   * Records a blocked analysis and refuses, without generating anything.
   *
   * Shared by both safety passes. Step 19 section 16: critical handling
   * overrides the normal response flow entirely - no context version is
   * written, because we did not reach an understanding we are willing to act
   * on, and writing one would imply we had.
   */
  private async handleBlockedAnalysis(
    user: ZunoUser,
    challenge: ZunoChallenge,
    assessment: SafetyAssessment,
  ): Promise<never> {
    await this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: user.id,
        challengeId: challenge.id,
        operation: 'CHALLENGE_ANALYZE',
        assessment,
      });
      await this.safety.recordIncident(manager, {
        userId: user.id,
        safetyDecisionId: decision.id,
        source: 'CHALLENGE_ANALYZE_PRECHECK',
        domain: assessment.domains[0] ?? null,
        severity: assessment.riskLevel,
        violations: [],
      });
      await this.outbox.enqueue(manager, {
        aggregateType: ZunoAggregateType.SAFETY_DECISION,
        aggregateId: decision.id,
        eventType: ZunoEventType.SAFETY_CRITICAL_ESCALATION,
        payload: {
          safety_decision_id: decision.id,
          challenge_id: challenge.id,
          user_id: user.id,
          risk_level: assessment.riskLevel,
        },
      });
    });

    throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
      message:
        assessment.boundaryMessage ??
        'I am not able to work through this one here, and I would rather say so plainly.',
      safety: {
        disposition: assessment.disposition,
        domain: assessment.domains[0],
      },
    });
  }

  /** Most recent response for a challenge. Step 21 section 28. */
  async latestResponse(
    user: ZunoUser,
    challengeId: string,
  ): Promise<ZunoResponse> {
    await this.findOwned(user.id, challengeId);
    const response = await this.responses.findOne({
      where: { challenge_id: challengeId, user_id: user.id },
      order: { created_at: 'DESC' },
    });
    if (!response) {
      // Honest state rather than an empty shell: the challenge exists but has
      // not been analysed yet (Step 21 section 109).
      throw new ZunoException(ZunoErrorCode.PROCESSING, {
        message: 'We have not worked through this one yet.',
        internalDetail: `no response for challenge ${challengeId}`,
      });
    }
    return response;
  }

  async list(params: ListChallengesParams): Promise<{
    items: ZunoChallenge[];
    nextCursor: string | null;
  }> {
    const query = this.challenges
      .createQueryBuilder('challenge')
      .where('challenge.user_id = :userId', { userId: params.userId })
      .andWhere('challenge.deleted_at IS NULL')
      .orderBy('challenge.opened_at', 'DESC')
      .addOrderBy('challenge.id', 'DESC')
      .take(params.limit + 1);

    if (params.status) {
      query.andWhere('challenge.status = :status', { status: params.status });
    }
    if (params.cursor) {
      const decoded = decodeCursor(params.cursor);
      if (decoded) {
        query.andWhere('challenge.opened_at < :openedAt', {
          openedAt: decoded,
        });
      }
    }

    const rows = await query.getMany();
    const hasMore = rows.length > params.limit;
    const items = hasMore ? rows.slice(0, params.limit) : rows;
    const nextCursor = hasMore
      ? encodeCursor(items[items.length - 1].opened_at)
      : null;

    return { items, nextCursor };
  }

  async findOwned(userId: string, challengeId: string): Promise<ZunoChallenge> {
    const challenge = await this.challenges.findOne({
      where: { id: challengeId, deleted_at: IsNull() },
    });
    return this.ownership.require(challenge, userId, 'challenge');
  }

  async latestContext(challengeId: string): Promise<ZunoChallengeContext | null> {
    return this.contexts.findOne({
      where: { challenge_id: challengeId },
      order: { version_number: 'DESC' },
    });
  }

  /** Step 21 section 24: resolve. Step 20 section 113: history stays linked. */
  async resolve(
    user: ZunoUser,
    challengeId: string,
    note: string | undefined,
    expectedVersion: number | undefined,
  ): Promise<ZunoChallenge> {
    const challenge = await this.findOwned(user.id, challengeId);
    this.ownership.assertVersion(challenge, expectedVersion);

    return this.dataSource.transaction(async (manager) => {
      const before = challenge.status;
      challenge.status = this.transition(before, ChallengeStatus.RESOLVED);
      challenge.resolved_at = this.clock.now();
      challenge.resolution_note = note ?? null;
      const saved = await manager.save(ZunoChallenge, challenge);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'CHALLENGE_RESOLVED',
        entityType: 'ZunoChallenge',
        entityId: challenge.id,
        before: { status: before },
        after: { status: saved.status },
      });
      await this.outbox.enqueue(manager, {
        aggregateType: ZunoAggregateType.CHALLENGE,
        aggregateId: challenge.id,
        eventType: ZunoEventType.CHALLENGE_RESOLVED,
        payload: { challenge_id: challenge.id, user_id: user.id },
      });
      return saved;
    });
  }

  /**
   * Step 21 section 24: reopen.
   * Step 20 section 114: reopening must not silently mutate history, so
   * resolved_at is cleared but the resolution note and every context version
   * stay exactly where they are.
   */
  async reopen(
    user: ZunoUser,
    challengeId: string,
    expectedVersion: number | undefined,
  ): Promise<ZunoChallenge> {
    const challenge = await this.findOwned(user.id, challengeId);
    this.ownership.assertVersion(challenge, expectedVersion);

    return this.dataSource.transaction(async (manager) => {
      const before = challenge.status;
      challenge.status = this.transition(before, ChallengeStatus.ACTIVE);
      challenge.resolved_at = null;
      const saved = await manager.save(ZunoChallenge, challenge);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'CHALLENGE_REOPENED',
        entityType: 'ZunoChallenge',
        entityId: challenge.id,
        before: { status: before },
        after: { status: saved.status },
      });
      await this.outbox.enqueue(manager, {
        aggregateType: ZunoAggregateType.CHALLENGE,
        aggregateId: challenge.id,
        eventType: ZunoEventType.CHALLENGE_REOPENED,
        payload: { challenge_id: challenge.id, user_id: user.id },
      });
      return saved;
    });
  }

  /**
   * Guarded status change. Build Rule 179: governed lifecycles use explicit
   * state transitions, so an illegal move fails loudly instead of leaving the
   * challenge in a state no engine knows how to handle.
   */
  private transition(
    from: ChallengeStatus,
    to: ChallengeStatus,
  ): ChallengeStatus {
    if (from === to) return to;
    if (!canTransitionChallenge(from, to)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `illegal challenge transition ${from} -> ${to}`,
      });
    }
    return to;
  }
}

/** Concatenates user-facing strings so the post-check can scan them. */
function collectText(payload: { title: string; sections: unknown[] }): string {
  const parts: string[] = [payload.title];
  const walk = (value: unknown): void => {
    if (typeof value === 'string') {
      parts.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  };
  walk(payload.sections);
  return parts.join(' ');
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
