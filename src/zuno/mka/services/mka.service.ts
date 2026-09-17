import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';

import { ZunoMkaProgram } from '../entities/zuno-mka-program.entity';
import { ZunoMkaItem } from '../entities/zuno-mka-item.entity';
import { ZunoMkaCompletion } from '../entities/zuno-mka-completion.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../../challenges/entities/zuno-challenge-context.entity';
import { ZunoResponse } from '../../responses/entities/zuno-response.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { FocusPrioritiesPayload } from '../../responses/entities/response.types';

import {
  SafetyAssessment,
  SafetyService,
} from '../../safety/services/safety.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import {
  ChallengeStatus,
  EmotionalIntensity,
  MkaDimension,
  ResponseSectionType,
  RuleSafetyClass,
  ZunoDomain,
} from '../../common/enums';

import {
  ASTRO_DERIVED_SOURCE_TYPES,
  canTransitionMkaItem,
  canTransitionMkaProgram,
  MKA_DIMENSION_LIMITS,
  MKA_ENGINE_VERSION,
  MKA_MAX_ASTRO_REMEDIES,
  MKA_PERIOD_DAYS,
  MkaCompletionSource,
  MkaCompletionStatus,
  MkaFrequency,
  MkaItemStatus,
  MkaPeriodType,
  MkaPriority,
  MkaProgramStatus,
  MkaRemedyStatus,
  MkaReviewTrigger,
  MkaSourceType,
} from '../enums/mka.enum';
import {
  MkaPlanAggregateType,
  MkaPlanEventType,
} from '../enums/mka-plan-event.enum';
import { enqueueMkaPlanEvent } from '../enums/mka-plan-outbox';
import {
  FALLBACK_ACTION,
  MIND_PRACTICES,
  MkaPracticeTemplate,
  NEUTRAL_KARMA_PRACTICES,
} from './mka-practice-library';

export interface GenerateMkaParams {
  user: ZunoUser;
  challengeId: string;
  period?: MkaPeriodType;
  /** Forces a new version even if an equivalent programme is already active. */
  regenerate?: boolean;
  reason?: string;
}

export interface MkaProgramWithItems {
  program: ZunoMkaProgram;
  items: ZunoMkaItem[];
}

/** A practice that has passed selection but has not yet been persisted. */
interface MkaCandidate {
  dimension: MkaDimension;
  title: string;
  description: string;
  purpose: string | null;
  sourceType: MkaSourceType;
  sourceRuleKey: string | null;
  sourceRemedyKey: string | null;
  sourceRuleId: string | null;
  rulebookVersionId: string | null;
  frequency: MkaFrequency;
  durationMinutes: number | null;
  priority: MkaPriority;
  safetyClass: RuleSafetyClass;
  isDevotional: boolean;
  alternativeKeys: string[];
  karmaEligible: boolean;
  planEligible: boolean;
  scheduleData: Record<string, unknown>;
  validFrom: string | null;
  validTo: string | null;
  /** Semantic key used for deduplication (Step 15 sections 47-48). */
  dedupeKey: string;
}

/**
 * The Mind Karma Action engine.
 * Step 15 Mind Karma Action Specification, Step 20 Data Model sections 36-38.
 *
 * Converts a challenge and its composed understanding into a small, balanced
 * set of practices the user can actually do: one Mind practice, up to two Karma
 * practices, one to three Actions (Step 15 sections 26 and 28).
 *
 * THE ORDER OF OPERATIONS IS THE DESIGN.
 *
 *   1. ownership          nothing is read before it is proven to be the
 *                         caller's (Step 20 section 85)
 *   2. safety pre-check   nothing is generated before safety has spoken. This
 *                         mirrors `WhatNowService`/`ChallengeService`: Step 19
 *                         section 50 puts the pre-check ahead of orchestration
 *                         because it can change the whole execution path, and
 *                         Build Rule 163 makes it structural rather than a
 *                         late addition
 *   3. rulebook match     the ONLY source of astrological content
 *   4. candidate build    deterministic templates plus approved remedies
 *   5. deduplicate        sections 47-48
 *   6. load limits        sections 26-28
 *   7. safety post-check  section 101: block, log, do not display
 *   8. persist + events   one transaction
 *
 * WHAT THIS CLASS WILL NOT DO.
 * It contains no astrological rule, no planetary condition and no remedy text.
 * Step 15 Rule 1 requires every astrology-derived practice to trace to an
 * active, approved SME Rulebook rule, and Rule 2 allows the language to be
 * personalised but never the remedy to be originated. When the rulebook has
 * nothing to say - which is the current state of this deployment, since no
 * rulebook is loaded - the programme is still produced, marked
 * NO_APPROVED_RULE_AVAILABLE, and carries Mind, a neutral constructive Karma
 * practice and practical Action. Step 15 section 51 and Golden Test 103 make
 * that the required behaviour, not a degraded one.
 */
@Injectable()
export class MkaService {
  private readonly logger = new Logger(MkaService.name);

  constructor(
    @InjectRepository(ZunoMkaProgram)
    private readonly programs: Repository<ZunoMkaProgram>,
    @InjectRepository(ZunoMkaItem)
    private readonly items: Repository<ZunoMkaItem>,
    @InjectRepository(ZunoMkaCompletion)
    private readonly completions: Repository<ZunoMkaCompletion>,
    @InjectRepository(ZunoChallenge)
    private readonly challenges: Repository<ZunoChallenge>,
    @InjectRepository(ZunoChallengeContext)
    private readonly contexts: Repository<ZunoChallengeContext>,
    @InjectRepository(ZunoResponse)
    private readonly responses: Repository<ZunoResponse>,
    private readonly rulebook: RulebookRepositoryService,
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
   * Generates an MKA programme for a challenge.
   *
   * Idempotent by default (Step 15 section 92): if an ACTIVE programme already
   * covers this period at the same challenge context version and the same
   * rulebook version, it is returned unchanged rather than duplicated.
   * Step 15 sections 93-95 are explicit that re-opening a screen is not a
   * reason to regenerate.
   */
  async generate(params: GenerateMkaParams): Promise<MkaProgramWithItems> {
    const challenge = await this.findOwnedChallenge(
      params.user.id,
      params.challengeId,
    );

    if (
      challenge.status === ChallengeStatus.ARCHIVED ||
      challenge.status === ChallengeStatus.RESOLVED
    ) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `cannot generate MKA for a ${challenge.status} challenge`,
      });
    }

    const period = params.period ?? MkaPeriodType.WEEK;

    // --- 2. SAFETY BEFORE ANYTHING IS GENERATED --------------------------
    // Ordering copied deliberately from ChallengeService.analyze: the
    // deterministic pre-check runs on the user's own words before any content
    // is assembled, then is refined once the domains are known.
    const initial = this.safety.preCheck({
      operation: 'MKA_GENERATE',
      userId: params.user.id,
      challengeId: challenge.id,
      text: challenge.raw_user_statement,
      domains: [],
    });

    const domains = this.domainsFor(challenge);
    const assessment = this.safety.refineWithDomains(initial, {
      operation: 'MKA_GENERATE',
      userId: params.user.id,
      challengeId: challenge.id,
      text: challenge.raw_user_statement,
      domains,
    });

    if (assessment.blocked) {
      await this.recordBlocked(params.user.id, challenge.id, assessment);
      throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
        message:
          assessment.boundaryMessage ??
          'I am not able to build a practice plan around this one, and I would rather say so plainly.',
        safety: {
          disposition: assessment.disposition,
          domain: assessment.domains[0],
        },
      });
    }

    const context = await this.contexts.findOne({
      where: { challenge_id: challenge.id },
      order: { version_number: 'DESC' },
    });
    const response = await this.responses.findOne({
      where: { challenge_id: challenge.id, user_id: params.user.id },
      order: { created_at: 'DESC' },
    });

    // --- 3. RULEBOOK ------------------------------------------------------
    const remedyOutcome = await this.selectApprovedRemedies(domains, assessment);

    const existing = await this.findActiveProgram(params.user.id, challenge.id);
    if (
      existing &&
      !params.regenerate &&
      existing.period_type === period &&
      existing.context_version === challenge.context_version &&
      existing.rulebook_version_id === remedyOutcome.rulebookVersionId
    ) {
      // Step 15 section 92: identical inputs must not create duplicates.
      const currentItems = await this.itemsFor(existing.id);
      return { program: existing, items: currentItems };
    }

    // --- 4/5/6. CANDIDATES, DEDUPLICATION, LOAD LIMITS -------------------
    const candidates = this.applyLoadLimits(
      this.deduplicate([
        this.mindCandidate(challenge),
        ...remedyOutcome.candidates,
        ...this.karmaFallbackCandidates(remedyOutcome.candidates),
        ...this.actionCandidates(challenge, context, response),
      ]),
    );

    // --- 7. SAFETY POST-CHECK, PER ITEM ----------------------------------
    // Step 15 section 101: block, log, do not display. Checking each item
    // separately rather than the concatenation means one unusable practice
    // does not take a valid programme down with it.
    const { kept, rejected } = this.postCheckCandidates(
      params.user.id,
      challenge.id,
      candidates,
      assessment,
    );

    const finalCandidates = this.ensurePracticalAction(kept);
    if (finalCandidates.length === 0) {
      throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
        message:
          'I could not put together a set of practices I was comfortable suggesting here.',
        safety: { disposition: assessment.disposition },
        internalDetail: 'every MKA candidate failed the safety post-check',
      });
    }

    const { startDate, endDate } = this.periodWindow(period);

    // --- 8. PERSIST -------------------------------------------------------
    return this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: params.user.id,
        challengeId: challenge.id,
        operation: 'MKA_GENERATE',
        assessment,
      });

      for (const violation of rejected) {
        await this.safety.recordIncident(manager, {
          userId: params.user.id,
          safetyDecisionId: decision.id,
          source: 'MKA_CANDIDATE_POST_CHECK',
          domain: domains[0] ?? null,
          severity: assessment.riskLevel,
          violations: violation,
        });
      }

      // Step 15 section 76: the previous programme becomes SUPERSEDED rather
      // than being edited, so the historical version stays readable.
      const previous = existing
        ? await this.supersede(manager, existing, params.user.id)
        : null;

      const program = manager.create(ZunoMkaProgram, {
        user_id: params.user.id,
        challenge_id: challenge.id,
        plan_id: null,
        period_type: period,
        start_date: startDate,
        end_date: endDate,
        status: MkaProgramStatus.ACTIVE,
        rulebook_version_id: remedyOutcome.rulebookVersionId,
        remedy_status: remedyOutcome.remedyStatus,
        review_trigger: MkaReviewTrigger.END_OF_PERIOD,
        review_at: endDate,
        context_version: challenge.context_version,
        source_response_id: response?.id ?? null,
        safety_decision_id: decision.id,
        engine_version: MKA_ENGINE_VERSION,
        generated_reason:
          params.reason ?? (previous ? 'REGENERATED' : 'INITIAL_GENERATION'),
        superseded_by_id: null,
        activated_at: this.clock.now(),
        completed_at: null,
      });
      const savedProgram = await manager.save(ZunoMkaProgram, program);

      if (previous) {
        previous.superseded_by_id = savedProgram.id;
        await manager.save(ZunoMkaProgram, previous);
      }

      const rows = finalCandidates.map((candidate, index) =>
        manager.create(ZunoMkaItem, {
          mka_program_id: savedProgram.id,
          user_id: params.user.id,
          dimension: candidate.dimension,
          title: candidate.title,
          description: candidate.description,
          purpose: candidate.purpose,
          source_type: candidate.sourceType,
          source_rule_key: candidate.sourceRuleKey,
          source_remedy_key: candidate.sourceRemedyKey,
          source_rule_id: candidate.sourceRuleId,
          rulebook_version_id: candidate.rulebookVersionId,
          frequency: candidate.frequency,
          schedule_data: candidate.scheduleData,
          duration_minutes: candidate.durationMinutes,
          priority: candidate.priority,
          valid_from: candidate.validFrom,
          valid_to: candidate.validTo,
          plan_eligible: candidate.planEligible,
          karma_eligible: candidate.karmaEligible,
          safety_class: candidate.safetyClass,
          is_devotional: candidate.isDevotional,
          alternative_keys: candidate.alternativeKeys,
          display_order: index,
          status: MkaItemStatus.ACTIVE,
        }),
      );
      const savedItems = await manager.save(ZunoMkaItem, rows);

      await this.audit.record(manager, {
        actorType: 'SYSTEM',
        userId: params.user.id,
        action: 'MKA_GENERATED',
        entityType: 'ZunoMkaProgram',
        entityId: savedProgram.id,
        after: {
          status: savedProgram.status,
          remedy_status: savedProgram.remedy_status,
          item_count: savedItems.length,
        },
        metadata: {
          challengeId: challenge.id,
          rulebookVersionId: remedyOutcome.rulebookVersionId,
          supersededProgramId: previous?.id ?? null,
        },
      });

      await enqueueMkaPlanEvent(this.outbox, manager, {
        aggregateType: MkaPlanAggregateType.MKA_PROGRAM,
        aggregateId: savedProgram.id,
        eventType: MkaPlanEventType.MKA_GENERATED,
        payload: {
          mka_program_id: savedProgram.id,
          challenge_id: challenge.id,
          user_id: params.user.id,
          period_type: period,
          item_count: savedItems.length,
          remedy_status: savedProgram.remedy_status,
        },
      });
      await enqueueMkaPlanEvent(this.outbox, manager, {
        aggregateType: MkaPlanAggregateType.MKA_PROGRAM,
        aggregateId: savedProgram.id,
        eventType: MkaPlanEventType.MKA_ACTIVATED,
        payload: {
          mka_program_id: savedProgram.id,
          challenge_id: challenge.id,
          user_id: params.user.id,
        },
      });

      // Step 15 section 52: a gap in rule coverage becomes an SME review
      // candidate. It must never become an invented remedy, and the user's
      // response must not wait for the SME either.
      if (remedyOutcome.remedyStatus === MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE) {
        await enqueueMkaPlanEvent(this.outbox, manager, {
          aggregateType: MkaPlanAggregateType.MKA_PROGRAM,
          aggregateId: savedProgram.id,
          eventType: MkaPlanEventType.MKA_SME_REVIEW_CANDIDATE,
          payload: {
            mka_program_id: savedProgram.id,
            user_id: params.user.id,
            domains,
            reason: 'NO_APPROVED_RULE_AVAILABLE',
          },
        });
      }

      return { program: savedProgram, items: savedItems };
    });
  }

  // -------------------------------------------------------------------------
  // Rulebook access - the only astrological path in this module
  // -------------------------------------------------------------------------

  /**
   * Resolves approved remedies into Karma/Mind candidates.
   *
   * FAIL CLOSED, BUT DO NOT FAIL THE REQUEST.
   * `RulebookRepositoryService.findRules` throws RULEBOOK_UNAVAILABLE when no
   * version is in production - correct for an astrology endpoint, wrong here.
   * Step 15 section 51 says ZUNO can still provide safe Mind and Action
   * guidance when no approved rule exists, and section 50 ranks omission above
   * fabrication. So the refusal is caught, recorded as
   * NO_APPROVED_RULE_AVAILABLE, and the programme continues without astrology.
   *
   * The distinction that matters: astrology is *absent and labelled absent*,
   * never *silently substituted*.
   */
  private async selectApprovedRemedies(
    domains: ZunoDomain[],
    assessment: SafetyAssessment,
  ): Promise<{
    candidates: MkaCandidate[];
    rulebookVersionId: string | null;
    remedyStatus: MkaRemedyStatus;
  }> {
    // Step 19: a safety assessment that suppresses astrology outranks the
    // rulebook entirely. Step 15 Rule 7: safety overrides the SME Rulebook.
    if (assessment.astrologySuppressed) {
      return {
        candidates: [],
        rulebookVersionId: null,
        remedyStatus: MkaRemedyStatus.SUPPRESSED_BY_SAFETY,
      };
    }

    const active = await this.rulebook.getActive();
    if (!active) {
      this.logger.log(
        'No active Rulebook; MKA continues with Mind and Action guidance only.',
      );
      return {
        candidates: [],
        rulebookVersionId: null,
        remedyStatus: MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
      };
    }

    try {
      const rules = await this.rulebook.findRules({ domains });
      const remedyKeys = Array.from(
        new Set(rules.flatMap((rule) => rule.remedy_keys ?? [])),
      );
      if (remedyKeys.length === 0) {
        return {
          candidates: [],
          rulebookVersionId: active.versionId,
          remedyStatus: MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
        };
      }

      const remedies = await this.rulebook.findRemedies(remedyKeys);
      const ruleByRemedyKey = new Map<string, (typeof rules)[number]>();
      for (const rule of rules) {
        for (const key of rule.remedy_keys ?? []) {
          if (!ruleByRemedyKey.has(key)) ruleByRemedyKey.set(key, rule);
        }
      }

      const candidates = remedies
        // Step 15 sections 19-20 and Build Rule 63: cost and caution filters
        // sit above SME approval. A remedy that costs money is never
        // *prescribed*; the user may choose it, but ZUNO will not schedule it.
        .filter((remedy) => !remedy.has_financial_cost)
        .filter((remedy) => remedy.safety_class !== RuleSafetyClass.REQUIRES_CAUTION)
        .map<MkaCandidate>((remedy) => {
          const rule = ruleByRemedyKey.get(remedy.external_remedy_key) ?? null;
          return {
            dimension: remedy.mka_dimension,
            title: remedy.name,
            // Step 08 section 48 / Step 15 section 72: exact wording is
            // preserved character for character. Nothing here rewrites it.
            description: remedy.instructions,
            purpose: remedy.user_explanation ?? remedy.purpose,
            sourceType: MkaSourceType.APPROVED_ASTRO_REMEDY,
            sourceRuleKey: rule?.external_rule_key ?? null,
            sourceRemedyKey: remedy.external_remedy_key,
            sourceRuleId: rule?.id ?? null,
            rulebookVersionId: active.versionId,
            frequency: this.mapRemedyFrequency(remedy.frequency),
            durationMinutes: null,
            priority: MkaPriority.IMPORTANT,
            safetyClass: remedy.safety_class,
            isDevotional: remedy.is_devotional,
            alternativeKeys: remedy.alternative_keys ?? [],
            karmaEligible: true,
            planEligible: true,
            scheduleData: {
              preferred_time: remedy.preferred_time ?? null,
              duration_text: remedy.duration ?? null,
            },
            validFrom: null,
            validTo: null,
            dedupeKey: `REMEDY:${remedy.external_remedy_key}`,
          };
        })
        // Step 15 section 27 and 112: never more than the remedy ceiling.
        .slice(0, MKA_MAX_ASTRO_REMEDIES);

      return {
        candidates,
        rulebookVersionId: active.versionId,
        remedyStatus:
          candidates.length > 0
            ? MkaRemedyStatus.APPROVED_RULE_APPLIED
            : MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
      };
    } catch (error) {
      if (
        error instanceof ZunoException &&
        error.code === ZunoErrorCode.RULEBOOK_UNAVAILABLE
      ) {
        this.logger.warn(
          'Rulebook became unavailable mid-generation; continuing without astrology.',
        );
        return {
          candidates: [],
          rulebookVersionId: null,
          remedyStatus: MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
        };
      }
      throw error;
    }
  }

  /** SME frequency vocabulary -> MKA frequency. Never widened, only mapped. */
  private mapRemedyFrequency(frequency: string): MkaFrequency {
    switch (frequency) {
      case 'DAILY':
        return MkaFrequency.DAILY;
      case 'WEEKLY':
        return MkaFrequency.WEEKLY;
      case 'ONE_TIME':
        return MkaFrequency.ONCE;
      case 'MONTHLY':
      case 'OCCASIONAL':
        return MkaFrequency.CUSTOM;
      default:
        // An unrecognised SME value must not silently become DAILY - that
        // would invent a schedule the SME never approved (Golden Test 99).
        return MkaFrequency.CUSTOM;
    }
  }

  // -------------------------------------------------------------------------
  // Candidate construction
  // -------------------------------------------------------------------------

  private mindCandidate(challenge: ZunoChallenge): MkaCandidate {
    const intensity = challenge.emotional_intensity ?? EmotionalIntensity.MODERATE;
    const template = MIND_PRACTICES[intensity] ?? MIND_PRACTICES.MODERATE;
    return this.fromTemplate(template);
  }

  /**
   * Fills the Karma slot when astrology produced nothing.
   *
   * Step 15 section 100: never invent an astrological practice to fill the
   * slot. A neutral constructive practice is not an invented remedy - it makes
   * no astrological claim at all, which is exactly what Golden Test 103
   * expects ("Karma = safe non-astrology constructive practice if permitted").
   */
  private karmaFallbackCandidates(astro: MkaCandidate[]): MkaCandidate[] {
    const hasKarma = astro.some((c) => c.dimension === MkaDimension.KARMA);
    if (hasKarma) return [];
    return [this.fromTemplate(NEUTRAL_KARMA_PRACTICES[0])];
  }

  /**
   * Practical Actions, drawn from the user's own understanding.
   *
   * Preference order, and the reason for it:
   *   1. the composed response's FOCUS_PRIORITIES section - already safety
   *      post-checked and already shown to the user, so the plan matches what
   *      they were told matters (Step 02 section 18 caps it at 3-4);
   *   2. `factors.controllable` from the challenge context - Step 11
   *      section 23 is literally "what the user can and cannot influence", so
   *      the controllable side is the honest source of practical action;
   *   3. `desired_outcomes` - a stated goal turned into a first step;
   *   4. the fixed fallback, so the ACTION pillar is never empty (Rule 3).
   *
   * Nothing here invents a fact about the user's situation. Every string is
   * either ZUNO's own reviewed wording or text the user's own understanding
   * already contains.
   */
  private actionCandidates(
    challenge: ZunoChallenge,
    context: ZunoChallengeContext | null,
    response: ZunoResponse | null,
  ): MkaCandidate[] {
    const fromResponse = this.prioritiesFromResponse(response);
    if (fromResponse.length > 0) return fromResponse;

    const controllable = context?.payload?.factors?.controllable ?? [];
    if (controllable.length > 0) {
      return controllable
        .slice(0, MKA_DIMENSION_LIMITS[MkaDimension.ACTION])
        .map((factor, index) => ({
          ...this.fromTemplate(FALLBACK_ACTION),
          title: this.trim(factor, 300),
          description: this.trim(factor, 2000),
          purpose:
            'This is one of the parts of the situation that is actually within your control.',
          sourceType: MkaSourceType.WHATNOW,
          priority: index === 0 ? MkaPriority.ESSENTIAL : MkaPriority.IMPORTANT,
          dedupeKey: `ACTION:${normaliseKey(factor)}`,
        }));
    }

    const outcomes = context?.payload?.desired_outcomes ?? [];
    if (outcomes.length > 0) {
      return outcomes
        .slice(0, MKA_DIMENSION_LIMITS[MkaDimension.ACTION])
        .map((outcome, index) => ({
          ...this.fromTemplate(FALLBACK_ACTION),
          title: this.trim(`Take one step towards: ${outcome.goal}`, 300),
          description: this.trim(
            `Choose the smallest concrete step that moves this forward: ${outcome.goal}`,
            2000,
          ),
          purpose: 'Keep the goal moving rather than waiting for certainty.',
          sourceType: MkaSourceType.USER_GOAL,
          priority: index === 0 ? MkaPriority.ESSENTIAL : MkaPriority.IMPORTANT,
          dedupeKey: `ACTION:${normaliseKey(outcome.goal)}`,
        }));
    }

    this.logger.debug(
      `Challenge ${challenge.id} had no actionable context; using the fallback preparation action.`,
    );
    return [this.fromTemplate(FALLBACK_ACTION)];
  }

  private prioritiesFromResponse(response: ZunoResponse | null): MkaCandidate[] {
    const section = response?.structured_payload?.sections?.find(
      (s) => s.type === ResponseSectionType.FOCUS_PRIORITIES,
    );
    if (!section) return [];
    const payload = section.payload as FocusPrioritiesPayload | undefined;
    const priorities = payload?.priorities ?? [];
    return priorities
      .slice(0, MKA_DIMENSION_LIMITS[MkaDimension.ACTION])
      .map((priority, index) => ({
        ...this.fromTemplate(FALLBACK_ACTION),
        title: this.trim(priority.title, 300),
        description: this.trim(priority.why || priority.title, 2000),
        purpose: this.trim(priority.why, 2000),
        sourceType: MkaSourceType.WHATNOW,
        priority: index === 0 ? MkaPriority.ESSENTIAL : MkaPriority.IMPORTANT,
        dedupeKey: `ACTION:${normaliseKey(priority.title)}`,
      }));
  }

  private fromTemplate(template: MkaPracticeTemplate): MkaCandidate {
    return {
      dimension: template.dimension,
      title: template.title,
      description: template.description,
      purpose: template.purpose,
      sourceType: template.sourceType,
      sourceRuleKey: null,
      sourceRemedyKey: null,
      sourceRuleId: null,
      rulebookVersionId: null,
      frequency: template.frequency,
      durationMinutes: template.durationMinutes,
      priority: template.priority,
      safetyClass: RuleSafetyClass.LOW_RISK,
      isDevotional: false,
      alternativeKeys: [],
      karmaEligible: template.karmaEligible,
      planEligible: true,
      scheduleData: {},
      validFrom: null,
      validTo: null,
      dedupeKey: `TEMPLATE:${template.key}`,
    };
  }

  // -------------------------------------------------------------------------
  // Deduplication, load limits, balance
  // -------------------------------------------------------------------------

  /** Step 15 sections 47-48: merge duplicates, prefer the smallest sufficient set. */
  private deduplicate(candidates: MkaCandidate[]): MkaCandidate[] {
    const seen = new Set<string>();
    const result: MkaCandidate[] = [];
    for (const candidate of candidates) {
      if (seen.has(candidate.dedupeKey)) continue;
      seen.add(candidate.dedupeKey);
      result.push(candidate);
    }
    return result;
  }

  /**
   * Step 15 sections 26-28 and Anti-Pattern 112: cognitive load is capped per
   * dimension, and the astrology-derived count is capped separately so a
   * rulebook rich in remedies cannot crowd out practical action.
   */
  private applyLoadLimits(candidates: MkaCandidate[]): MkaCandidate[] {
    const perDimension = new Map<MkaDimension, number>();
    let astroCount = 0;
    const kept: MkaCandidate[] = [];

    for (const candidate of candidates) {
      const used = perDimension.get(candidate.dimension) ?? 0;
      if (used >= MKA_DIMENSION_LIMITS[candidate.dimension]) continue;

      const isAstro = ASTRO_DERIVED_SOURCE_TYPES.includes(candidate.sourceType);
      if (isAstro && astroCount >= MKA_MAX_ASTRO_REMEDIES) continue;

      perDimension.set(candidate.dimension, used + 1);
      if (isAstro) astroCount += 1;
      kept.push(candidate);
    }
    return kept;
  }

  /**
   * Step 15 section 26 and Rule 3: an MKA set with remedies and no practical
   * action is invalid for a real-world challenge.
   */
  private ensurePracticalAction(candidates: MkaCandidate[]): MkaCandidate[] {
    if (candidates.length === 0) return candidates;
    if (candidates.some((c) => c.dimension === MkaDimension.ACTION)) {
      return candidates;
    }
    return [...candidates, this.fromTemplate(FALLBACK_ACTION)];
  }

  private postCheckCandidates(
    userId: string,
    challengeId: string,
    candidates: MkaCandidate[],
    assessment: SafetyAssessment,
  ): { kept: MkaCandidate[]; rejected: ReturnType<SafetyService['postCheck']>['violations'][] } {
    const kept: MkaCandidate[] = [];
    const rejected: ReturnType<SafetyService['postCheck']>['violations'][] = [];

    for (const candidate of candidates) {
      const result = this.safety.postCheck({
        userId,
        challengeId,
        candidateText: [candidate.title, candidate.description, candidate.purpose]
          .filter(Boolean)
          .join(' '),
        assessment,
      });
      if (result.allowed) {
        kept.push(candidate);
      } else {
        this.logger.warn(
          `MKA candidate ${candidate.dedupeKey} blocked by the post-check: ${result.violations.join(',')}`,
        );
        rejected.push(result.violations);
      }
    }
    return { kept, rejected };
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

  async findOwnedProgram(
    userId: string,
    programId: string,
  ): Promise<ZunoMkaProgram> {
    const program = await this.programs.findOne({
      where: { id: programId, deleted_at: IsNull() },
    });
    return this.ownership.require(program, userId, 'mka programme');
  }

  async findOwnedItem(userId: string, itemId: string): Promise<ZunoMkaItem> {
    const item = await this.items.findOne({
      where: { id: itemId, deleted_at: IsNull() },
    });
    return this.ownership.require(item, userId, 'mka item');
  }

  /** The programme currently in force for a challenge, if any. */
  async findActiveProgram(
    userId: string,
    challengeId: string,
  ): Promise<ZunoMkaProgram | null> {
    return this.programs.findOne({
      where: {
        user_id: userId,
        challenge_id: challengeId,
        status: MkaProgramStatus.ACTIVE,
        deleted_at: IsNull(),
      },
      order: { created_at: 'DESC' },
    });
  }

  async itemsFor(programId: string): Promise<ZunoMkaItem[]> {
    return this.items.find({
      where: { mka_program_id: programId, deleted_at: IsNull() },
      order: { display_order: 'ASC' },
    });
  }

  /** Plan-eligible, still-active items. Used by the Plan Engine (section 40). */
  async planEligibleItems(programId: string): Promise<ZunoMkaItem[]> {
    return this.items.find({
      where: {
        mka_program_id: programId,
        plan_eligible: true,
        status: MkaItemStatus.ACTIVE,
        deleted_at: IsNull(),
      },
      order: { display_order: 'ASC' },
    });
  }

  async currentForChallenge(
    user: ZunoUser,
    challengeId: string,
  ): Promise<MkaProgramWithItems> {
    await this.findOwnedChallenge(user.id, challengeId);
    const program = await this.findActiveProgram(user.id, challengeId);
    if (!program) {
      throw new ZunoException(ZunoErrorCode.PROCESSING, {
        message: 'We have not built your practice plan for this yet.',
        internalDetail: `no active MKA programme for challenge ${challengeId}`,
      });
    }
    return { program, items: await this.itemsFor(program.id) };
  }

  async listPrograms(userId: string, challengeId?: string): Promise<ZunoMkaProgram[]> {
    return this.programs.find({
      where: {
        user_id: userId,
        deleted_at: IsNull(),
        ...(challengeId ? { challenge_id: challengeId } : {}),
      },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  // -------------------------------------------------------------------------
  // Completion
  // -------------------------------------------------------------------------

  /**
   * Records a completion. Step 21 section 47, Step 15 section 90.
   *
   * Self-report is sufficient - Step 15 section 70 forbids demanding proof of
   * prayer, donation or ritual.
   *
   * Emits `zuno.mka.item_completed`, which the Karma Ledger (Step 17) consumes.
   * The event carries the eligibility flag but no score: Step 15 section 65 and
   * Step 17 keep scoring entirely on the ledger's side of the boundary.
   */
  async completeItem(
    user: ZunoUser,
    itemId: string,
    options: { date?: string; note?: string } = {},
  ): Promise<ZunoMkaCompletion> {
    return this.recordCompletion(user, itemId, MkaCompletionStatus.DONE, options);
  }

  /**
   * Records a skip.
   *
   * Step 15 sections 66-68 and Build Rule 64: a skipped practice produces no
   * penalty, no negative Karma and no catch-up schedule. The row exists so the
   * Plan Engine can notice overload and offer to simplify - nothing else reads
   * it.
   */
  async skipItem(
    user: ZunoUser,
    itemId: string,
    options: { date?: string; note?: string } = {},
  ): Promise<ZunoMkaCompletion> {
    return this.recordCompletion(user, itemId, MkaCompletionStatus.SKIPPED, options);
  }

  private async recordCompletion(
    user: ZunoUser,
    itemId: string,
    status: MkaCompletionStatus,
    options: { date?: string; note?: string },
  ): Promise<ZunoMkaCompletion> {
    const item = await this.findOwnedItem(user.id, itemId);
    const program = await this.findOwnedProgram(user.id, item.mka_program_id);

    if (
      program.status !== MkaProgramStatus.ACTIVE &&
      program.status !== MkaProgramStatus.EXPIRED
    ) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `cannot record against a ${program.status} MKA programme`,
      });
    }
    if (item.status !== MkaItemStatus.ACTIVE) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `cannot record against a ${item.status} MKA item`,
      });
    }

    const date = options.date ?? this.clock.today();

    // Step 15 section 92 in miniature: a double tap on "Mark Done" must not
    // produce two ledger-eligible events.
    const existing = await this.completions.findOne({
      where: { mka_item_id: item.id, completion_date: date },
    });
    if (existing) return existing;

    return this.dataSource.transaction(async (manager) => {
      const completion = manager.create(ZunoMkaCompletion, {
        mka_item_id: item.id,
        mka_program_id: program.id,
        user_id: user.id,
        completion_date: date,
        status,
        user_note: options.note ?? null,
        source: MkaCompletionSource.USER,
        karma_eligible: item.karma_eligible,
        redacted_at: null,
      });
      const saved = await manager.save(ZunoMkaCompletion, completion);

      // A ONCE practice is finished by its single completion; a recurring one
      // stays ACTIVE until the period ends (Step 15 section 30).
      if (
        status === MkaCompletionStatus.DONE &&
        item.frequency === MkaFrequency.ONCE
      ) {
        item.status = this.transitionItem(item.status, MkaItemStatus.COMPLETED);
        await manager.save(ZunoMkaItem, item);
      }

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: `MKA_ITEM_${status}`,
        entityType: 'ZunoMkaItem',
        entityId: item.id,
        after: { status, completion_date: date },
      });

      await enqueueMkaPlanEvent(this.outbox, manager, {
        aggregateType: MkaPlanAggregateType.MKA_ITEM,
        aggregateId: item.id,
        eventType:
          status === MkaCompletionStatus.DONE
            ? MkaPlanEventType.MKA_ITEM_COMPLETED
            : MkaPlanEventType.MKA_ITEM_SKIPPED,
        payload: {
          mka_item_id: item.id,
          mka_program_id: program.id,
          mka_completion_id: saved.id,
          challenge_id: program.challenge_id,
          user_id: user.id,
          dimension: item.dimension,
          // The Karma Ledger decides the score; this only states eligibility.
          karma_eligible: item.karma_eligible,
          completion_date: date,
          status,
        },
      });

      return saved;
    });
  }

  async completionsFor(
    userId: string,
    programId: string,
  ): Promise<ZunoMkaCompletion[]> {
    return this.completions.find({
      where: { user_id: userId, mka_program_id: programId },
      order: { completion_date: 'DESC' },
      take: 200,
    });
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** Marks a programme complete. Step 15 section 118. */
  async completeProgram(
    user: ZunoUser,
    programId: string,
    expectedVersion?: number,
  ): Promise<ZunoMkaProgram> {
    const program = await this.findOwnedProgram(user.id, programId);
    this.ownership.assertVersion(program, expectedVersion);

    return this.dataSource.transaction(async (manager) => {
      const before = program.status;
      program.status = this.transitionProgram(before, MkaProgramStatus.COMPLETED);
      program.completed_at = this.clock.now();
      const saved = await manager.save(ZunoMkaProgram, program);

      await manager.update(
        ZunoMkaItem,
        { mka_program_id: program.id, status: MkaItemStatus.ACTIVE },
        { status: MkaItemStatus.COMPLETED },
      );

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'MKA_COMPLETED',
        entityType: 'ZunoMkaProgram',
        entityId: program.id,
        before: { status: before },
        after: { status: saved.status },
      });
      await enqueueMkaPlanEvent(this.outbox, manager, {
        aggregateType: MkaPlanAggregateType.MKA_PROGRAM,
        aggregateId: program.id,
        eventType: MkaPlanEventType.MKA_COMPLETED,
        payload: {
          mka_program_id: program.id,
          user_id: user.id,
          challenge_id: program.challenge_id,
        },
      });
      return saved;
    });
  }

  /**
   * Retires the previous programme when a newer one takes over.
   *
   * Items are marked CANCELLED_BY_REALIGNMENT rather than MISSED - Step 15
   * section 67 and Step 16 section 47 both insist a practice withdrawn by the
   * system is not a user failure. COMPLETED items are left alone, because
   * Step 16 section 109 forbids a realignment erasing completed work.
   */
  private async supersede(
    manager: EntityManager,
    program: ZunoMkaProgram,
    userId: string,
  ): Promise<ZunoMkaProgram> {
    const before = program.status;
    program.status = this.transitionProgram(before, MkaProgramStatus.SUPERSEDED);
    const saved = await manager.save(ZunoMkaProgram, program);

    await manager.update(
      ZunoMkaItem,
      {
        mka_program_id: program.id,
        status: In([MkaItemStatus.ACTIVE, MkaItemStatus.EXPIRED]),
      },
      { status: MkaItemStatus.CANCELLED_BY_REALIGNMENT },
    );

    await this.audit.record(manager, {
      actorType: 'SYSTEM',
      userId,
      action: 'MKA_SUPERSEDED',
      entityType: 'ZunoMkaProgram',
      entityId: program.id,
      before: { status: before },
      after: { status: saved.status },
    });
    await enqueueMkaPlanEvent(this.outbox, manager, {
      aggregateType: MkaPlanAggregateType.MKA_PROGRAM,
      aggregateId: program.id,
      eventType: MkaPlanEventType.MKA_SUPERSEDED,
      payload: {
        mka_program_id: program.id,
        user_id: userId,
        challenge_id: program.challenge_id,
      },
    });
    return saved;
  }

  /** Build Rule 179: illegal programme moves fail loudly. */
  transitionProgram(
    from: MkaProgramStatus,
    to: MkaProgramStatus,
  ): MkaProgramStatus {
    if (from === to) return to;
    if (!canTransitionMkaProgram(from, to)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `illegal MKA programme transition ${from} -> ${to}`,
      });
    }
    return to;
  }

  /** Build Rule 179: illegal item moves fail loudly. */
  transitionItem(from: MkaItemStatus, to: MkaItemStatus): MkaItemStatus {
    if (from === to) return to;
    if (!canTransitionMkaItem(from, to)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `illegal MKA item transition ${from} -> ${to}`,
      });
    }
    return to;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private domainsFor(challenge: ZunoChallenge): ZunoDomain[] {
    return challenge.primary_domain ? [challenge.primary_domain] : [];
  }

  private periodWindow(period: MkaPeriodType): {
    startDate: string;
    endDate: string;
  } {
    const start = this.clock.now();
    const days = MKA_PERIOD_DAYS[period] ?? MKA_PERIOD_DAYS[MkaPeriodType.WEEK];
    const end = new Date(start.getTime());
    // Inclusive window: a 7-day week runs day 0 to day 6.
    end.setUTCDate(end.getUTCDate() + days - 1);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  private async recordBlocked(
    userId: string,
    challengeId: string,
    assessment: SafetyAssessment,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId,
        challengeId,
        operation: 'MKA_GENERATE',
        assessment,
      });
      await this.safety.recordIncident(manager, {
        userId,
        safetyDecisionId: decision.id,
        source: 'MKA_GENERATE_PRECHECK',
        domain: assessment.domains[0] ?? null,
        severity: assessment.riskLevel,
        violations: [],
      });
    });
  }

  private trim(value: string, max: number): string {
    const clean = (value ?? '').trim();
    return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
  }
}

/** Stable key for semantic deduplication. Case and spacing are not meaning. */
function normaliseKey(value: string): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
