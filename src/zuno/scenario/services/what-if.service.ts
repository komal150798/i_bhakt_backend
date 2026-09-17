import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoWhatIfSession } from '../entities/zuno-what-if-session.entity';
import { ZunoWhatIfAssumption } from '../entities/zuno-what-if-assumption.entity';
import { WhatIfResultPayload } from '../entities/scenario.types';
import { IWhatIfEngine, WHAT_IF_ENGINE } from '../ports/what-if.port';
import { ScenarioContextService } from './scenario-context.service';
import { ScenarioService } from './scenario.service';
import { SafetyService, SafetyAssessment } from '../../safety/services/safety.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { SCENARIO_EVENT_TYPES, scenarioEvent } from '../scenario.events';
import { ZunoAggregateType, ZunoEventType } from '../../common/enums';
import {
  WhatIfAssumptionType,
  WhatIfSessionStatus,
  WHAT_IF_MAX_CASCADE_DEPTH,
} from '../enums/scenario.enum';
import { findDeterministicClaims } from '../schemas/deterministic-language.guard';

/**
 * Step 12 section 40: mandatory, and mandatory verbatim.
 *
 * The specification requires the user to see "This is a hypothetical. Your
 * current plan is unchanged." It is a constant rather than composed copy so
 * that no code path can produce a What-If result without it, and so the test
 * suite can assert its presence on every response.
 */
export const WHAT_IF_HYPOTHETICAL_NOTICE =
  'This is a hypothetical. Your current plan is unchanged.';

/**
 * How long an unopened exploration stays around.
 * Step 20 section 29 gives `what_if_sessions` an `expires_at` precisely so a
 * hypothetical ages out instead of quietly becoming part of someone's record.
 */
const WHAT_IF_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface ExploreWhatIfParams {
  user: ZunoUser;
  challengeId: string;
  question: string;
}

/**
 * Deterministic control layer over the What-If intelligence engine.
 *
 * THE ENTIRE POINT OF THIS SERVICE IS ISOLATION.
 *
 * Step 12 section 39 lists what a What-If must not do: alter the current Plan,
 * alter active priorities, change WhatNow state, trigger a Life Signal, change
 * the Operating Mode, persist as reality, or trigger notifications. Section 102
 * names silent state change as the anti-pattern; Step 20 Rule 4 and Build
 * Rule 42 say the same from the data and build sides; Step 30 section 45 makes
 * "What-If does not mutate factual state" an acceptance criterion for this
 * phase.
 *
 * That is enforced structurally, not by discipline:
 *
 *   This class injects exactly two repositories - the what-if session and its
 *   assumptions. It has no challenge repository, no context repository, no
 *   scenario repository and no plan repository. There is no object in scope
 *   that it could use to mutate factual state. `ScenarioContextService` is
 *   injected for reads and exposes no write path; `ScenarioService` is used
 *   only to read the current set's shared preparation.
 *
 *   Every session row is `is_hypothetical = true`, backed by a CHECK
 *   constraint, and carries `current_plan_changed = false` as data.
 *
 *   The emitted event is WHAT_IF_EXPLORED with `hypothetical: true` in its
 *   payload, so even a consumer that starts listening cannot mistake it for a
 *   state change.
 *
 * ON SAFETY ORDERING: the pre-check runs BEFORE the model call and the
 * post-check AFTER it, for the reasons set out at length in ScenarioService.
 * Step 12 section 71 is the line that matters most here - "scenario exploration
 * cannot bypass safety rules merely because it is hypothetical". A hypothetical
 * is where someone is most likely to voice something they would not state
 * directly, which makes the pre-check more important on this path, not less.
 */
@Injectable()
export class WhatIfService {
  private readonly logger = new Logger(WhatIfService.name);

  constructor(
    @InjectRepository(ZunoWhatIfSession)
    private readonly sessions: Repository<ZunoWhatIfSession>,
    @InjectRepository(ZunoWhatIfAssumption)
    private readonly assumptions: Repository<ZunoWhatIfAssumption>,
    @Inject(WHAT_IF_ENGINE) private readonly engine: IWhatIfEngine,
    private readonly context: ScenarioContextService,
    private readonly scenarios: ScenarioService,
    private readonly safety: SafetyService,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Explores a hypothetical without changing anything.
   * Step 12 sections 38-44, Step 21 sections 38-40.
   */
  async explore(params: ExploreWhatIfParams): Promise<{
    session: ZunoWhatIfSession;
    assumptions: ZunoWhatIfAssumption[];
  }> {
    const question = params.question.trim();
    if (question.length === 0) {
      throw ZunoException.validation([{ field: 'question', code: 'REQUIRED' }]);
    }

    // 1. Ownership, masked as NOT_FOUND.
    const projection = await this.context.project(
      params.user.id,
      params.challengeId,
    );

    // 2. SAFETY PRE-CHECK - BEFORE ANY MODEL CALL.
    //
    //    The user's question is included in the checked text, not just the
    //    challenge context: "what if I stop taking my medication" is a signal
    //    that exists only in the hypothetical, and a pre-check that read the
    //    old context alone would miss it entirely.
    const assessment = this.safety.preCheck({
      operation: 'WHAT_IF_EXPLORE',
      userId: params.user.id,
      challengeId: projection.challenge.id,
      text: `${question}\n${projection.safetyText}`,
      domains: projection.domains,
    });

    if (assessment.blocked) {
      await this.recordBlocked(
        params.user,
        projection.challenge.id,
        assessment,
        'WHAT_IF_PRECHECK',
      );
      throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
        message:
          assessment.boundaryMessage ??
          'I am not able to explore this one, even hypothetically, and I would rather say so plainly.',
        safety: {
          disposition: assessment.disposition,
          domain: assessment.domains[0],
        },
      });
    }

    // 3. Approved themes, or none. Fails closed gracefully.
    const astro = await this.context.loadAstroContext(projection.domains);

    // 4. Preparation already under way, so section 42's
    //    `existing_preparation_that_helps` is grounded in something real.
    //    Read from the current scenario set, NOT from the Plan Engine - this
    //    module does not import from it.
    const currentSet = await this.scenarios.currentSet(projection.challenge.id);
    const existingPreparation = (currentSet?.shared_preparation ?? []).map(
      (prep) => prep.action,
    );

    // 5. THE MODEL CALL.
    const result = await this.engine.explore({
      question,
      summary: projection.summary,
      facts: projection.facts,
      dependencies: projection.dependencies,
      controllable: projection.controllable,
      external: projection.external,
      existing_preparation: existingPreparation,
      domains: projection.domains,
      astro,
      max_cascade_depth: WHAT_IF_MAX_CASCADE_DEPTH,
    });

    const exploration = result.exploration;

    // 6. Deterministic bounds. Step 12 sections 43-44: the validator already
    //    dropped anything past the depth limit; this is the belt to that
    //    braces, and it also re-applies the possibility-language boundary to
    //    each implication.
    const implications = exploration.implications
      .filter((entry) => entry.layer <= WHAT_IF_MAX_CASCADE_DEPTH)
      .filter((entry) => {
        const claims = findDeterministicClaims(entry.text, 'implication');
        if (claims.length > 0) {
          this.logger.warn(
            `Dropped a what-if implication asserting a determined outcome: ${claims
              .map((claim) => claim.kind)
              .join(',')}`,
          );
          return false;
        }
        return true;
      });

    if (implications.length === 0) {
      throw new ZunoException(ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE, {
        internalDetail:
          'what-if produced no implication within the permitted cascade depth and possibility-language bounds',
      });
    }

    const payload: WhatIfResultPayload = {
      implications,
      controllable_actions: exploration.controllable_actions,
      // Step 12 section 42 and Build Rule 129: only preparation the user
      // actually has may be described as preparation they already have.
      // Anything the model named that is not in the real list is dropped
      // rather than shown back to them as something they have done.
      existing_preparation_that_helps:
        exploration.existing_preparation_that_helps.filter((entry) =>
          existingPreparation.some(
            (actual) => normalise(actual) === normalise(entry),
          ),
        ),
      preparation: exploration.preparation,
      impact_areas: exploration.impact_areas,
      impact: exploration.impact,
      reversibility: exploration.reversibility,
      hypothetical_notice: WHAT_IF_HYPOTHETICAL_NOTICE,
    };

    // 7. SAFETY POST-CHECK - AFTER the model call, before anything is stored
    //    or shown.
    const postCheck = this.safety.postCheck({
      userId: params.user.id,
      challengeId: projection.challenge.id,
      candidateText: collectWhatIfText(payload),
      assessment,
    });

    return this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: params.user.id,
        challengeId: projection.challenge.id,
        operation: 'WHAT_IF_EXPLORE',
        assessment,
      });

      if (!postCheck.allowed) {
        await this.safety.recordIncident(manager, {
          userId: params.user.id,
          safetyDecisionId: decision.id,
          source: 'WHAT_IF_POST_CHECK',
          domain: projection.domains[0] ?? null,
          severity: assessment.riskLevel,
          violations: postCheck.violations,
        });
        throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
          message:
            'I could not think this one through in a way I was comfortable sending. Let us approach it differently.',
          safety: { disposition: assessment.disposition },
        });
      }

      const now = this.clock.now();
      const session = manager.create(ZunoWhatIfSession, {
        user_id: params.user.id,
        challenge_id: projection.challenge.id,
        prompt: question,
        status: WhatIfSessionStatus.ACTIVE,
        // Never a variable, never from a request body. Step 12 section 39.
        is_hypothetical: true,
        result: payload,
        // Step 12 section 41: "NO ACTIVE STATE CHANGE", recorded as data.
        current_plan_changed: false,
        challenge_context_version: projection.context?.version_number ?? null,
        engine_version: result.engineVersion,
        safety_decision_id: decision.id,
        ai_generation_run_id: result.aiGenerationRunId,
        expires_at: new Date(now.getTime() + WHAT_IF_TTL_MS),
      });
      const savedSession = await manager.save(ZunoWhatIfSession, session);

      // The user's own hypothetical is always recorded first and as
      // USER_STATED, so the premise is never confused with a conclusion.
      const assumptionRows = [
        manager.create(ZunoWhatIfAssumption, {
          what_if_session_id: savedSession.id,
          user_id: params.user.id,
          assumption_text: exploration.assumption,
          assumption_type: WhatIfAssumptionType.USER_STATED,
          value: null,
        }),
        ...exploration.assumptions
          // The model may restate the premise; it is already recorded above.
          .filter((entry) => entry.type !== WhatIfAssumptionType.USER_STATED)
          .map((entry) =>
            manager.create(ZunoWhatIfAssumption, {
              what_if_session_id: savedSession.id,
              user_id: params.user.id,
              assumption_text: entry.text,
              assumption_type: entry.type,
              value: entry.dependency_reference
                ? { dependency_reference: entry.dependency_reference }
                : null,
            }),
          ),
      ];
      const savedAssumptions = await manager.save(
        ZunoWhatIfAssumption,
        assumptionRows,
      );

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: params.user.id,
        userId: params.user.id,
        action: 'WHAT_IF_EXPLORED',
        entityType: 'ZunoWhatIfSession',
        entityId: savedSession.id,
        after: { hypothetical: true, current_plan_changed: false },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: ZunoAggregateType.CHALLENGE,
        aggregateId: projection.challenge.id,
        eventType: scenarioEvent(SCENARIO_EVENT_TYPES.WHAT_IF_EXPLORED),
        payload: {
          what_if_session_id: savedSession.id,
          challenge_id: projection.challenge.id,
          user_id: params.user.id,
          // Both stated explicitly so no consumer has to infer isolation from
          // the event name (Step 12 sections 39 and 102).
          hypothetical: true,
          current_plan_changed: false,
        },
      });

      return { session: savedSession, assumptions: savedAssumptions };
    });
  }

  /** Step 21 section 38: read one exploration back. */
  async findOwnedSession(
    user: ZunoUser,
    sessionId: string,
  ): Promise<{ session: ZunoWhatIfSession; assumptions: ZunoWhatIfAssumption[] }> {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    const owned = this.ownership.require(session, user.id, 'what-if session');

    // An expired exploration is reported as gone rather than served stale.
    // Step 20 section 29 gives it an expiry for a reason, and Step 21
    // section 109 prefers an honest state.
    if (owned.expires_at && owned.expires_at.getTime() < this.clock.now().getTime()) {
      throw ZunoException.notFound(`what-if session ${sessionId} has expired`);
    }

    const assumptions = await this.assumptions.find({
      where: { what_if_session_id: owned.id },
      order: { created_at: 'ASC' },
    });
    return { session: owned, assumptions };
  }

  /**
   * Step 21 section 38: DELETE discards an exploration.
   *
   * Soft delete plus an explicit DISCARDED status. Step 12 section 39 says a
   * What-If must not persist as reality; discarding is the user saying they are
   * finished with it, and the row is retained only long enough for retention
   * policy to remove it. Nothing about the challenge changes.
   */
  async discard(user: ZunoUser, sessionId: string): Promise<void> {
    const { session } = await this.findOwnedSession(user, sessionId);

    await this.dataSource.transaction(async (manager) => {
      session.status = WhatIfSessionStatus.DISCARDED;
      await manager.save(ZunoWhatIfSession, session);
      await manager.softDelete(ZunoWhatIfSession, { id: session.id });

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'WHAT_IF_DISCARDED',
        entityType: 'ZunoWhatIfSession',
        entityId: session.id,
        before: { status: WhatIfSessionStatus.ACTIVE },
        after: { status: WhatIfSessionStatus.DISCARDED },
      });
    });
  }

  private async recordBlocked(
    user: ZunoUser,
    challengeId: string,
    assessment: SafetyAssessment,
    source: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: user.id,
        challengeId,
        operation: 'WHAT_IF_EXPLORE',
        assessment,
      });
      await this.safety.recordIncident(manager, {
        userId: user.id,
        safetyDecisionId: decision.id,
        source,
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
          challenge_id: challengeId,
          user_id: user.id,
          risk_level: assessment.riskLevel,
        },
      });
    });
  }
}

function collectWhatIfText(payload: WhatIfResultPayload): string {
  return [
    ...payload.implications.map((entry) => entry.text),
    ...payload.controllable_actions,
    ...payload.existing_preparation_that_helps,
    ...payload.preparation.map((prep) => prep.action),
  ]
    .filter(Boolean)
    .join(' ');
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
