import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoScenarioSet } from '../entities/zuno-scenario-set.entity';
import { ZunoScenario } from '../entities/zuno-scenario.entity';
import { ZunoScenarioCondition } from '../entities/zuno-scenario-condition.entity';
import {
  ScenarioAstroContext,
  ScenarioPayload,
  ScenarioPreparation,
  ScenarioSetDiffEntry,
} from '../entities/scenario.types';
import {
  IScenarioEngine,
  ScenarioCandidate,
  SCENARIO_ENGINE,
} from '../ports/scenario.port';
import { ScenarioContextService } from './scenario-context.service';
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
  canTransitionScenario,
  DecisionReadiness,
  PreparationClass,
  SCENARIO_IMPACT_WEIGHT,
  SCENARIO_LOW_CONFIDENCE_THRESHOLD,
  SCENARIO_MAX_USER_FACING,
  SCENARIO_MIN_USER_FACING,
  SCENARIO_RELEVANCE_WEIGHT,
  SCENARIO_TYPE_CASE_CLASS,
  ScenarioConditionType,
  ScenarioEvidenceClass,
  ScenarioImpact,
  ScenarioRelevance,
  ScenarioSetStatus,
  ScenarioStatus,
  ScenarioType,
  UNSUPPORTED_EVIDENCE_CLASSES,
} from '../enums/scenario.enum';
import {
  findDeterministicClaims,
  isQualitativeProbabilityLabel,
} from '../schemas/deterministic-language.guard';

/**
 * Qualitative attention labels. Step 12 section 16: this vocabulary is what
 * replaces a percentage, and it is derived in code so no model ever chooses it.
 */
const RELEVANCE_PROBABILITY_LABEL: Readonly<Record<ScenarioRelevance, string>> = {
  [ScenarioRelevance.HIGH]: 'PRIMARY',
  [ScenarioRelevance.MEDIUM]: 'PLAUSIBLE',
  [ScenarioRelevance.LOW]: 'SECONDARY',
  [ScenarioRelevance.CONTINGENCY]: 'CONTINGENCY',
};

export interface GenerateScenariosParams {
  user: ZunoUser;
  challengeId: string;
  /** Step 12 section 86: why we are regenerating. */
  reason?: string;
}

export interface ScenarioSetResult {
  set: ZunoScenarioSet;
  scenarios: ZunoScenario[];
}

/**
 * Deterministic control layer over the Scenario intelligence engine.
 *
 * Step 12 section 56 draws the line this class implements. The LLM may assist
 * with candidate generation, semantic distinctness, summaries, implications and
 * preparation ideation. Everything else - scenario IDs, state, enums, maximum
 * counts, context sources, persistence, lifecycle, What-If isolation, impact and
 * relevance rules, downstream triggers, plan-mutation permission and safety
 * routing - is decided here, in code, from rules that can be read and tested.
 *
 * THE PIPELINE, in the order Step 12 section 55 specifies:
 *
 *   ownership          -> is this challenge even theirs
 *   SAFETY PRE-CHECK   -> BEFORE any model call
 *   context projection -> challenge context, dependencies, decisions
 *   rulebook           -> approved themes, or none, failing closed
 *   ENGINE             -> candidate scenarios
 *   remove unsupported -> section 14, no path resting only on inference
 *   deduplicate        -> section 52
 *   assess impact      -> section 30
 *   assess relevance   -> sections 15-17, 51
 *   select user-facing -> section 5, 2-4 scenarios
 *   shared preparation -> sections 24-25
 *   claim sweep        -> the possibility-language boundary, second layer
 *   SAFETY POST-CHECK  -> AFTER the model call, before anything is shown
 *   persist + diff     -> sections 65-66
 *
 * ON THE ORDER OF THE TWO SAFETY CALLS
 *
 * The pre-check runs before the engine and the post-check runs after it. That
 * is not a stylistic choice and it is not interchangeable:
 *
 *   The PRE-check can change the entire execution path (Step 19 section 50,
 *   Step 11 section 67). If someone's statement carries a critical signal, we
 *   must notice before their words reach a model provider - and before we pay
 *   for a call whose result we would have to discard anyway. A pre-check that
 *   ran after the model would be a log entry, not a gate.
 *
 *   The POST-check validates candidate output (Step 19 section 51, Step 21
 *   section 69). It cannot run earlier because the text does not exist yet.
 *
 * Step 12 section 71 closes the obvious loophole: scenario exploration cannot
 * bypass safety merely because it is hypothetical.
 *
 * WHAT THIS SERVICE DELIBERATELY CANNOT DO
 *
 * It holds no plan repository and no challenge-context write path. Step 12
 * section 57 and Rule 8 give the Plan Engine sole authority over whether, when
 * and how often preparation is executed; section 101 names automatic task
 * creation as the anti-pattern. This service proposes preparation and emits
 * events. It does not schedule anything.
 */
@Injectable()
export class ScenarioService {
  private readonly logger = new Logger(ScenarioService.name);

  constructor(
    @InjectRepository(ZunoScenarioSet)
    private readonly sets: Repository<ZunoScenarioSet>,
    @InjectRepository(ZunoScenario)
    private readonly scenarios: Repository<ZunoScenario>,
    @InjectRepository(ZunoScenarioCondition)
    private readonly conditions: Repository<ZunoScenarioCondition>,
    @Inject(SCENARIO_ENGINE) private readonly engine: IScenarioEngine,
    private readonly context: ScenarioContextService,
    private readonly safety: SafetyService,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generates a new versioned scenario set for a challenge.
   *
   * Appends rather than replaces. Step 12 section 65: "never silently overwrite
   * important history" - the previous set is marked SUPERSEDED and stays
   * readable, which is also what makes the section 66 diff possible.
   */
  async generate(params: GenerateScenariosParams): Promise<ScenarioSetResult> {
    const { user, challengeId } = params;

    // 1. Ownership. Masked as NOT_FOUND so the endpoint is not an
    //    id-enumeration oracle (Step 21 section 106).
    const projection = await this.context.project(user.id, challengeId);

    // 2. SAFETY PRE-CHECK - BEFORE ANY MODEL CALL.
    //
    //    Step 11 section 67 places the pre-check ahead of semantic work, and
    //    Step 19 section 50 explains why: it can alter the entire execution
    //    path. Running the engine first would send a self-harm statement to a
    //    model provider before ZUNO had noticed it. Step 12 section 71 confirms
    //    the rule holds here too - a scenario is still a high-stakes surface.
    const assessment = this.safety.preCheck({
      operation: 'SCENARIO_GENERATE',
      userId: user.id,
      challengeId: projection.challenge.id,
      text: projection.safetyText,
      domains: projection.domains,
    });

    if (assessment.blocked) {
      await this.recordBlocked(user, projection.challenge.id, assessment, 'SCENARIO_GENERATE_PRECHECK');
      throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
        message:
          assessment.boundaryMessage ??
          'I am not able to map out possibilities for this one, and I would rather say so plainly.',
        safety: {
          disposition: assessment.disposition,
          domain: assessment.domains[0],
        },
      });
    }

    // 3. Approved astrology, or none. Fail closed, gracefully - a missing
    //    Rulebook costs the set its themes, never its existence.
    const astro = await this.context.loadAstroContext(projection.domains);

    // 4. Paths the user has already ruled out, so section 69 is honoured
    //    across regenerations rather than only within one.
    const rejectedPaths = await this.rejectedPaths(projection.challenge.id);

    // 5. THE MODEL CALL.
    const result = await this.engine.generate({
      summary: projection.summary,
      facts: projection.facts,
      concerns: projection.concerns,
      dependencies: projection.dependencies,
      decisions: projection.decisions,
      controllable: projection.controllable,
      external: projection.external,
      temporal_anchors: projection.temporalAnchors,
      domains: projection.domains,
      mode: projection.challenge.mode,
      astro,
      rejected_paths: rejectedPaths,
      max_scenarios: SCENARIO_MAX_USER_FACING,
    });

    // 6. Deterministic shaping. Nothing below this line trusts the model.
    const shaped = this.shape(result.generation.scenarios, projection.concerns);

    if (shaped.length === 0) {
      // Build Rule 128 forbids a fabricated success. If nothing survived the
      // rules, say so rather than shipping whatever was left.
      throw new ZunoException(ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE, {
        internalDetail:
          'every candidate scenario was removed as unsupported, duplicate, or non-possibility language',
      });
    }

    const sharedPreparation = this.deriveSharedPreparation(
      result.generation.shared_preparation,
      shaped,
    );

    // 7. SAFETY POST-CHECK - AFTER the model call, before anything is stored
    //    or shown. Step 19 section 51, Step 21 section 69.
    const postCheck = this.safety.postCheck({
      userId: user.id,
      challengeId: projection.challenge.id,
      candidateText: collectScenarioText(shaped, sharedPreparation, result.generation.watch_signals),
      assessment,
    });

    const previous = await this.currentSet(projection.challenge.id);

    return this.dataSource.transaction(async (manager) => {
      const decision = await this.safety.recordDecision(manager, {
        userId: user.id,
        challengeId: projection.challenge.id,
        operation: 'SCENARIO_GENERATE',
        assessment,
      });

      if (!postCheck.allowed) {
        await this.safety.recordIncident(manager, {
          userId: user.id,
          safetyDecisionId: decision.id,
          source: 'SCENARIO_POST_CHECK',
          domain: projection.domains[0] ?? null,
          severity: assessment.riskLevel,
          violations: postCheck.violations,
        });
        this.logger.warn(
          `Post-check blocked a scenario set for challenge ${projection.challenge.id}: ${postCheck.violations.join(',')}`,
        );
        throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
          message:
            'I could not put these possibilities in a way I was comfortable sending. Let us approach it differently.',
          safety: { disposition: assessment.disposition },
        });
      }

      // Step 12 section 65: supersede, never overwrite.
      if (previous) {
        previous.status = ScenarioSetStatus.SUPERSEDED;
        await manager.save(ZunoScenarioSet, previous);
      }

      const previousScenarios = previous
        ? await manager.find(ZunoScenario, {
            where: { scenario_set_id: previous.id },
          })
        : [];

      const versionNumber = (previous?.version_number ?? 0) + 1;
      const userFacing = shaped.filter((entry) => entry.userFacing);

      const set = manager.create(ZunoScenarioSet, {
        challenge_id: projection.challenge.id,
        user_id: user.id,
        version_number: versionNumber,
        status: ScenarioSetStatus.CURRENT,
        generated_reason:
          params.reason ?? (previous ? 'REGENERATION' : 'INITIAL_ANALYSIS'),
        shared_preparation: sharedPreparation,
        watch_signals: unique(result.generation.watch_signals),
        seeds: result.generation.seeds,
        comparison: result.generation.comparison,
        diff: this.buildDiff(previousScenarios, shaped),
        decision_readiness:
          projection.decisions.length > 0
            ? result.generation.decision_readiness
            : (null as DecisionReadiness | null),
        provenance: {
          challenge_context_version: projection.context?.version_number ?? 0,
          rulebook_version_id: astro?.rulebook_version_id ?? null,
          scenario_engine_version: result.engineVersion,
          prompt_version: result.promptVersion,
          astro_available: astro !== null,
        },
        user_facing_count: userFacing.length,
        safety_decision_id: decision.id,
        ai_generation_run_id: result.aiGenerationRunId,
      });
      const savedSet = await manager.save(ZunoScenarioSet, set);

      const savedScenarios: ZunoScenario[] = [];
      for (let index = 0; index < shaped.length; index++) {
        const entry = shaped[index];
        const row = manager.create(ZunoScenario, {
          scenario_set_id: savedSet.id,
          challenge_id: projection.challenge.id,
          user_id: user.id,
          name: entry.candidate.title,
          description: entry.candidate.summary,
          scenario_type: entry.candidate.scenario_type,
          case_class: SCENARIO_TYPE_CASE_CLASS[entry.candidate.scenario_type],
          status: ScenarioStatus.ACTIVE_CANDIDATE,
          relevance: entry.relevance,
          impact: entry.impact,
          horizon: entry.candidate.horizon,
          probability_label: this.probabilityLabel(entry.relevance),
          confidence: entry.candidate.confidence.toFixed(3),
          // Scenarios in a generated set describe the factual branch space.
          // A hypothetical lives in the what-if tables (Step 20 Rule 4).
          hypothetical: false,
          user_facing: entry.userFacing,
          display_order: index,
          option_ref: entry.candidate.option_ref,
          payload: this.buildPayload(entry.candidate, astro),
          user_decision_note: null,
          triggered_at: null,
        });
        const savedScenario = await manager.save(ZunoScenario, row);
        savedScenarios.push(savedScenario);

        // Step 12 section 58: conditions become Life Signal watch classes, so
        // they are rows the signal engine can query, not buried JSON.
        const conditionRows = [
          ...entry.candidate.signals_for.map((description) => ({
            type: ScenarioConditionType.SIGNAL_FOR,
            description,
          })),
          ...entry.candidate.signals_against.map((description) => ({
            type: ScenarioConditionType.SIGNAL_AGAINST,
            description,
          })),
          ...entry.candidate.dependencies.map((edge) => ({
            type: ScenarioConditionType.DEPENDENCY,
            description: `${edge.from} -> ${edge.to}`,
          })),
        ].map((condition) =>
          manager.create(ZunoScenarioCondition, {
            scenario_id: savedScenario.id,
            user_id: user.id,
            condition_type: condition.type,
            description: condition.description,
            signal_definition: {},
          }),
        );
        if (conditionRows.length > 0) {
          await manager.save(ZunoScenarioCondition, conditionRows);
        }
      }

      await this.audit.record(manager, {
        actorType: 'SYSTEM',
        userId: user.id,
        action: 'SCENARIO_SET_GENERATED',
        entityType: 'ZunoScenarioSet',
        entityId: savedSet.id,
        before: previous ? { version: previous.version_number } : undefined,
        after: { version: versionNumber, scenarios: savedScenarios.length },
        metadata: { astro_available: astro !== null },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: ZunoAggregateType.CHALLENGE,
        aggregateId: projection.challenge.id,
        eventType: scenarioEvent(SCENARIO_EVENT_TYPES.SCENARIO_SET_GENERATED),
        payload: {
          scenario_set_id: savedSet.id,
          challenge_id: projection.challenge.id,
          user_id: user.id,
          version: versionNumber,
          scenario_count: savedScenarios.length,
          // Step 12 section 66: Realignment needs the change, not the content.
          changes: savedSet.diff.length,
        },
      });

      return { set: savedSet, scenarios: savedScenarios };
    });
  }

  /** The current set for a challenge, or null. Step 12 section 85. */
  async currentSet(challengeId: string): Promise<ZunoScenarioSet | null> {
    return this.sets.findOne({
      where: { challenge_id: challengeId, status: ScenarioSetStatus.CURRENT },
      order: { version_number: 'DESC' },
    });
  }

  /**
   * Reads the current set. Step 21 section 36 (`GET .../scenarios`).
   *
   * Step 12 section 85 is explicit that opening a screen must not regenerate,
   * so this is a pure read. Returning nothing is a legitimate answer - it means
   * the scenarios have not been generated yet, and Step 21 section 109 prefers
   * an honest state to a fabricated one.
   */
  async listCurrent(
    user: ZunoUser,
    challengeId: string,
    options: { includeAll?: boolean } = {},
  ): Promise<ScenarioSetResult | null> {
    await this.context.requireOwnedChallenge(user.id, challengeId);
    const set = await this.currentSet(challengeId);
    if (!set) return null;

    const rows = await this.scenarios.find({
      where: { scenario_set_id: set.id },
      order: { display_order: 'ASC' },
    });

    // Step 12 section 54: "do not show all by default". The extra ones are
    // available on request rather than hidden forever.
    const scenarios = options.includeAll
      ? rows
      : rows.filter((row) => row.user_facing);

    return { set, scenarios };
  }

  async findOwnedScenario(userId: string, scenarioId: string): Promise<ZunoScenario> {
    const scenario = await this.scenarios.findOne({ where: { id: scenarioId } });
    return this.ownership.require(scenario, userId, 'scenario');
  }

  /**
   * Records the user's own decision about a path.
   * Step 12 sections 68-70: adoption and rejection are user decisions, and
   * Rule 9 requires stated boundaries to be respected afterwards.
   *
   * Note what this does NOT do: adopting a contingency does not add anything to
   * a plan. Step 12 section 68 says the Plan Engine "may then incorporate
   * related preparation after confirmation", which is the Plan Engine's call.
   * This records the decision and emits the change.
   */
  async decide(
    user: ZunoUser,
    scenarioId: string,
    status: ScenarioStatus.USER_ADOPTED | ScenarioStatus.USER_REJECTED | ScenarioStatus.DISMISSED,
    note: string | undefined,
    expectedVersion: number | undefined,
  ): Promise<ZunoScenario> {
    const scenario = await this.findOwnedScenario(user.id, scenarioId);
    this.ownership.assertVersion(scenario, expectedVersion);

    if (!canTransitionScenario(scenario.status, status)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `illegal scenario transition ${scenario.status} -> ${status}`,
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const before = scenario.status;
      scenario.status = status;
      scenario.user_decision_note = note ?? null;
      // A rejected path stops occupying a card. Step 12 section 105: do not
      // keep surfacing it without new evidence.
      if (status === ScenarioStatus.USER_REJECTED || status === ScenarioStatus.DISMISSED) {
        scenario.user_facing = false;
      }
      const saved = await manager.save(ZunoScenario, scenario);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'SCENARIO_DECISION_RECORDED',
        entityType: 'ZunoScenario',
        entityId: saved.id,
        before: { status: before },
        after: { status: saved.status },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: ZunoAggregateType.CHALLENGE,
        aggregateId: saved.challenge_id,
        eventType: scenarioEvent(SCENARIO_EVENT_TYPES.SCENARIO_CHANGED),
        payload: {
          scenario_id: saved.id,
          challenge_id: saved.challenge_id,
          user_id: user.id,
          before: before,
          after: saved.status,
        },
      });

      return saved;
    });
  }

  /**
   * Promotes a scenario into current reality.
   * Step 12 sections 22-23 and Rule 7: once an event is confirmed it stops
   * being a scenario. Section 49: reality overrides everything the set said.
   *
   * The engine notifies the Life Signal / Realignment flow (section 23) by
   * emitting an event. It does not reach into the challenge or the plan itself.
   */
  async markTriggered(
    user: ZunoUser,
    scenarioId: string,
    note: string | undefined,
    expectedVersion: number | undefined,
  ): Promise<ZunoScenario> {
    const scenario = await this.findOwnedScenario(user.id, scenarioId);
    this.ownership.assertVersion(scenario, expectedVersion);

    if (!canTransitionScenario(scenario.status, ScenarioStatus.TRIGGERED)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `illegal scenario transition ${scenario.status} -> TRIGGERED`,
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const before = scenario.status;
      scenario.status = ScenarioStatus.TRIGGERED;
      scenario.triggered_at = this.clock.now();
      scenario.user_decision_note = note ?? scenario.user_decision_note;
      const saved = await manager.save(ZunoScenario, scenario);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'SCENARIO_TRIGGERED',
        entityType: 'ZunoScenario',
        entityId: saved.id,
        before: { status: before },
        after: { status: saved.status },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: ZunoAggregateType.CHALLENGE,
        aggregateId: saved.challenge_id,
        eventType: scenarioEvent(SCENARIO_EVENT_TYPES.SCENARIO_TRIGGERED),
        payload: {
          scenario_id: saved.id,
          challenge_id: saved.challenge_id,
          user_id: user.id,
          // Step 12 section 23: this is now a fact, and downstream must treat
          // it as one rather than continuing to present it as a possibility.
          became_reality: true,
        },
      });

      return saved;
    });
  }

  // -----------------------------------------------------------------
  // Deterministic shaping. Step 12 sections 10-17, 30-31, 51-53, 55.
  // -----------------------------------------------------------------

  private shape(
    candidates: ScenarioCandidate[],
    concerns: string[],
  ): ShapedScenario[] {
    const supported = candidates.filter((candidate) =>
      this.isSupported(candidate),
    );

    const distinct = this.deduplicate(supported);

    const assessed = distinct
      .map((candidate) => this.assess(candidate, concerns))
      .filter((entry): entry is ShapedScenario => entry !== null);

    // The possibility-language boundary, second layer. The validator already
    // rejected the response if any candidate asserted an outcome; this catches
    // anything that survived a partial parse, and protects against a future
    // engine implementation whose validator is less thorough. A scenario that
    // trips it is dropped rather than rewritten - rewriting someone's claim
    // into a hedge would hide the failure instead of surfacing it.
    const clean = assessed.filter((entry) => {
      const claims = [
        ...findDeterministicClaims(entry.candidate.title, 'title'),
        ...findDeterministicClaims(entry.candidate.summary, 'summary'),
      ];
      if (claims.length > 0) {
        this.logger.warn(
          `Dropped a scenario asserting a determined outcome: ${claims
            .map((claim) => claim.kind)
            .join(',')}`,
        );
        return false;
      }
      return true;
    });

    // Step 12 sections 31 and 5: prioritise, then cap. Sorted by relevance,
    // then by impact, so a low-relevance critical-impact path still makes the
    // cut ahead of a low-relevance moderate one.
    const ordered = [...clean].sort((a, b) => {
      const byRelevance =
        SCENARIO_RELEVANCE_WEIGHT[b.relevance] - SCENARIO_RELEVANCE_WEIGHT[a.relevance];
      if (byRelevance !== 0) return byRelevance;
      const byImpact = SCENARIO_IMPACT_WEIGHT[b.impact] - SCENARIO_IMPACT_WEIGHT[a.impact];
      if (byImpact !== 0) return byImpact;
      return b.candidate.confidence - a.candidate.confidence;
    });

    // Step 12 section 5: at most four in the primary journey; section 54 keeps
    // the rest available rather than discarding them.
    return ordered.map((entry, index) => ({
      ...entry,
      userFacing: index < SCENARIO_MAX_USER_FACING,
    }));
  }

  /**
   * Step 12 section 14 and Rule 3.
   *
   * "No scenario should depend entirely on unsupported system inference."
   * A candidate with no basis at all, or whose only basis is SYSTEM_INFERENCE,
   * is not traceable to anything and is removed - this is the section 55 step
   * "remove unsupported scenarios".
   */
  private isSupported(candidate: ScenarioCandidate): boolean {
    if (candidate.basis.length === 0) return false;
    return candidate.basis.some(
      (entry) => !UNSUPPORTED_EVIDENCE_CLASSES.includes(entry.type),
    );
  }

  /**
   * Step 12 sections 52 and 104.
   *
   * "Stay employed", "Remain in current job" and "Continue working" are one
   * scenario. Compared on normalised title and summary tokens plus the scenario
   * type, because section 52 asks to compare outcome state and causal path -
   * two candidates of the same type describing the same outcome in different
   * words are duplicates however differently they are phrased.
   *
   * The first occurrence wins, since the engine emits its strongest candidate
   * first often enough that the alternative (keeping the last) would lose
   * detail for no gain.
   */
  private deduplicate(candidates: ScenarioCandidate[]): ScenarioCandidate[] {
    const kept: ScenarioCandidate[] = [];
    for (const candidate of candidates) {
      const isDuplicate = kept.some((existing) =>
        this.isSemanticDuplicate(existing, candidate),
      );
      if (isDuplicate) {
        this.logger.debug(
          `Merged a duplicate scenario: "${candidate.title}" (Step 12 s.52)`,
        );
        continue;
      }
      kept.push(candidate);
    }
    return kept;
  }

  private isSemanticDuplicate(a: ScenarioCandidate, b: ScenarioCandidate): boolean {
    if (a.scenario_type !== b.scenario_type) {
      // A different path shape is a different path, even with similar wording.
      return false;
    }
    const titleOverlap = tokenOverlap(a.title, b.title);
    const summaryOverlap = tokenOverlap(a.summary, b.summary);
    // Two thirds of the meaningful words in common, on either the title or the
    // summary, with the same scenario type. Tuned to catch rewording without
    // collapsing "Role continues" into "Role changes internally", which share
    // "role" and little else.
    return titleOverlap >= 0.67 || summaryOverlap >= 0.67;
  }

  /**
   * Step 12 sections 15-17, 30-31 and 51.
   *
   * Two independent dimensions, and the rule that connects them:
   *   low confidence + low impact                -> DROP
   *   low confidence + high or critical impact   -> CONTINGENCY
   *
   * The second half is the one that matters. It is what lets ZUNO prepare
   * someone for a job loss without telling them it is coming (section 32), and
   * Step 19 section 43 requires exactly this separation so that a frightening
   * low-confidence possibility is not promoted into a prominent prediction.
   */
  private assess(
    candidate: ScenarioCandidate,
    concerns: string[],
  ): ShapedScenario | null {
    const impact = candidate.impact;
    let relevance = candidate.relevance;

    const lowConfidence =
      candidate.confidence < SCENARIO_LOW_CONFIDENCE_THRESHOLD;
    const highImpact =
      impact === ScenarioImpact.HIGH || impact === ScenarioImpact.CRITICAL;

    if (lowConfidence && !highImpact) {
      this.logger.debug(
        `Dropped a low-confidence, low-impact scenario: "${candidate.title}" (Step 12 s.51)`,
      );
      return null;
    }
    if (lowConfidence && highImpact) {
      relevance = ScenarioRelevance.CONTINGENCY;
    }

    // Step 12 sections 8 and 15: the user's own concern raises how much
    // attention a path deserves. This is attention, not likelihood - naming a
    // fear does not make it more probable, but it does make the path worth
    // preparing for, and section 96 wants the user to end up feeling they have
    // options rather than that they were ignored.
    if (
      relevance === ScenarioRelevance.LOW &&
      concerns.some((concern) => tokenOverlap(concern, candidate.summary) >= 0.4)
    ) {
      relevance = ScenarioRelevance.MEDIUM;
    }

    // Step 12 section 32: a contingency is not the likely path but is too
    // important to ignore, and a CONTINGENCY-typed scenario says so by name.
    if (
      candidate.scenario_type === ScenarioType.CONTINGENCY &&
      relevance === ScenarioRelevance.HIGH
    ) {
      // A contingency presented as the headline path is section 98's
      // worst-case bias wearing a different label.
      relevance = ScenarioRelevance.CONTINGENCY;
    }

    return { candidate, relevance, impact, userFacing: true };
  }

  /**
   * Step 12 sections 24-25 and 95.
   *
   * The engine proposes shared preparation; this adds anything that actually
   * appears in two or more scenarios, because an action that helps in several
   * futures IS shared preparation whether or not the model labelled it that
   * way. Section 25 calls this ZUNO's core differentiator - "we do not need to
   * know exactly which path happens to make useful moves now" - so it is
   * computed rather than accepted on trust.
   */
  private deriveSharedPreparation(
    proposed: { action: string; classification: PreparationClass }[],
    shaped: ShapedScenario[],
  ): ScenarioPreparation[] {
    const counts = new Map<string, { action: string; count: number }>();
    for (const entry of shaped) {
      const seen = new Set<string>();
      for (const prep of entry.candidate.scenario_specific_preparation) {
        const key = normalise(prep.action);
        if (key.length === 0 || seen.has(key)) continue;
        seen.add(key);
        const existing = counts.get(key);
        counts.set(key, {
          action: existing?.action ?? prep.action,
          count: (existing?.count ?? 0) + 1,
        });
      }
    }

    const derived: ScenarioPreparation[] = Array.from(counts.values())
      .filter((entry) => entry.count >= 2)
      .map((entry) => ({
        action: entry.action,
        classification: PreparationClass.COMMON,
      }));

    const combined = [
      ...proposed.map((entry) => ({
        action: entry.action,
        classification: PreparationClass.COMMON,
      })),
      ...derived,
    ];

    const seen = new Set<string>();
    return combined.filter((entry) => {
      const key = normalise(entry.action);
      if (key.length === 0 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Step 12 section 66: what Realignment needs to know changed.
   * Matched on normalised title, which is the only stable identifier across
   * two independently generated sets.
   */
  private buildDiff(
    previous: ZunoScenario[],
    current: ShapedScenario[],
  ): ScenarioSetDiffEntry[] {
    const diff: ScenarioSetDiffEntry[] = [];
    const previousByKey = new Map(
      previous.map((row) => [normalise(row.name), row]),
    );
    const currentKeys = new Set(
      current.map((entry) => normalise(entry.candidate.title)),
    );

    for (const entry of current) {
      const key = normalise(entry.candidate.title);
      const before = previousByKey.get(key);
      if (!before) {
        diff.push({ scenario_title: entry.candidate.title, change: 'ADDED' });
        continue;
      }
      if (before.relevance !== entry.relevance) {
        const increased =
          SCENARIO_RELEVANCE_WEIGHT[entry.relevance] >
          SCENARIO_RELEVANCE_WEIGHT[before.relevance];
        diff.push({
          scenario_title: entry.candidate.title,
          change: increased ? 'RELEVANCE_INCREASED' : 'RELEVANCE_DECREASED',
          before: before.relevance,
          after: entry.relevance,
        });
      }
      if (before.impact !== entry.impact) {
        diff.push({
          scenario_title: entry.candidate.title,
          change: 'IMPACT_CHANGED',
          before: before.impact,
          after: entry.impact,
        });
      }
    }

    for (const row of previous) {
      if (!currentKeys.has(normalise(row.name))) {
        diff.push({ scenario_title: row.name, change: 'REMOVED' });
      }
    }

    return diff;
  }

  private buildPayload(
    candidate: ScenarioCandidate,
    astro: ScenarioAstroContext | null,
  ): ScenarioPayload {
    return {
      basis: candidate.basis.map((entry) => ({
        type: entry.type as ScenarioEvidenceClass,
        reference: entry.reference,
      })),
      signals_for: candidate.signals_for,
      signals_against: candidate.signals_against,
      dependencies: candidate.dependencies,
      risks: candidate.risks,
      opportunities: candidate.opportunities,
      controllable_factors: candidate.controllable_factors,
      impact_areas: candidate.impact_areas,
      scenario_specific_preparation: candidate.scenario_specific_preparation,
      benefits: candidate.benefits,
      constraints: candidate.constraints,
      // Step 12 section 36: only a DECISION carries reversibility. Recording it
      // on an external event would imply the user chose it.
      reversibility:
        candidate.scenario_type === ScenarioType.DECISION
          ? candidate.reversibility
          : null,
      astro_context: astro,
    };
  }

  /**
   * Step 12 section 16. Derived in code from the relevance enum, never taken
   * from the model, and asserted to contain no digits before it is returned.
   */
  private probabilityLabel(relevance: ScenarioRelevance): string {
    const label = RELEVANCE_PROBABILITY_LABEL[relevance];
    if (!isQualitativeProbabilityLabel(label)) {
      // Unreachable from the table above. Present because a future edit to the
      // table is exactly the kind of change that would slip a number in, and
      // failing here is better than persisting "72%".
      throw ZunoException.internal(
        `probability label "${label}" is not qualitative (Step 12 s.16)`,
      );
    }
    return label;
  }

  /** Step 12 sections 69-70: paths the user has ruled out, for the prompt. */
  private async rejectedPaths(challengeId: string): Promise<string[]> {
    const rows = await this.scenarios.find({
      where: { challenge_id: challengeId, status: ScenarioStatus.USER_REJECTED },
    });
    return rows.map((row) => row.name);
  }

  /** Shared with the blocked-analysis path in ChallengeService, same shape. */
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
        operation: 'SCENARIO_GENERATE',
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

interface ShapedScenario {
  candidate: ScenarioCandidate;
  relevance: ScenarioRelevance;
  impact: ScenarioImpact;
  userFacing: boolean;
}

/** Every user-facing string in the set, so the post-check can scan it. */
function collectScenarioText(
  shaped: ShapedScenario[],
  sharedPreparation: ScenarioPreparation[],
  watchSignals: string[],
): string {
  const parts: string[] = [];
  for (const entry of shaped) {
    parts.push(entry.candidate.title, entry.candidate.summary);
    parts.push(...entry.candidate.risks);
    parts.push(...entry.candidate.opportunities);
    parts.push(...entry.candidate.signals_for);
    parts.push(...entry.candidate.signals_against);
    parts.push(...entry.candidate.benefits);
    parts.push(...entry.candidate.constraints);
    parts.push(
      ...entry.candidate.scenario_specific_preparation.map((prep) => prep.action),
    );
  }
  parts.push(...sharedPreparation.map((prep) => prep.action));
  parts.push(...watchSignals);
  return parts.filter(Boolean).join(' ');
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'to', 'of', 'in', 'on',
  'at', 'for', 'and', 'or', 'with', 'your', 'you', 'their', 'they', 'it',
  'this', 'that', 'while', 'as', 'by', 'from', 'my', 'i', 'we',
]);

function meaningfulTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

/** Jaccard-style overlap over meaningful tokens. 0 when either side is empty. */
function tokenOverlap(a: string, b: string): number {
  const left = meaningfulTokens(a);
  const right = meaningfulTokens(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) {
    if (right.has(token)) shared++;
  }
  return shared / Math.min(left.size, right.size);
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}
