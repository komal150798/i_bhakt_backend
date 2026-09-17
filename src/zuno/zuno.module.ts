import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Customer } from '../users/entities/customer.entity';
import { ZUNO_ENTITIES } from './zuno-entities';

// Services
import { ClockService } from './common/services/clock.service';
import {
  RequestContextService,
  RequestContextMiddleware,
} from './common/services/request-context.service';
import { OutboxService } from './common/services/outbox.service';
import { IdempotencyService } from './common/services/idempotency.service';
import { ZunoAuditService } from './common/services/zuno-audit.service';
import { ZunoOwnershipService } from './common/services/zuno-ownership.service';
import { ZunoResponseInterceptor } from './common/interceptors/zuno-response.interceptor';
import { ZunoExceptionFilter } from './common/filters/zuno-exception.filter';
import { ZunoUserGuard } from './common/guards/zuno-user.guard';

import { ZunoUserResolverService } from './identity/services/zuno-user-resolver.service';
import { ZunoProfileService } from './identity/services/zuno-profile.service';
import { SafetyService } from './safety/services/safety.service';
import { SafetySignalDetector } from './safety/services/safety-signal-detector';
import { ZunoAiGateway } from './ai/services/zuno-ai-gateway.service';
import { AiPricingService } from './ai/services/ai-pricing.service';
import { AiCostService } from './ai/services/ai-cost.service';

// Locations - the trusted-coordinate boundary (Step 21 section 22).
import { GeocoderProvider } from './locations/geocoder.provider';
import { TimezoneResolverService } from './locations/services/timezone-resolver.service';
import { BirthPlaceResolverService } from './locations/services/birth-place-resolver.service';
import { WhatNowService } from './whatnow/services/whatnow.service';
import { LlmWhatNowEngine } from './whatnow/engines/llm-whatnow.engine';
import { WHATNOW_ENGINE } from './whatnow/engines/whatnow.port';
import { ResponseComposerService } from './responses/services/response-composer.service';
import { ChallengeService } from './challenges/services/challenge.service';

// Rulebook - the SME-governed astrology knowledge layer
import { RulebookParserService } from './rulebook/parsing/rulebook-parser.service';
import { RulebookValidatorService } from './rulebook/validation/rulebook-validator.service';
import { RulebookCompilerService } from './rulebook/services/rulebook-compiler.service';
import { RulebookGovernanceService } from './rulebook/services/rulebook-governance.service';
import { RulebookRepositoryService } from './rulebook/services/rulebook-repository.service';
import { RulebookDashboardService } from './rulebook/services/rulebook-dashboard.service';
import { RulebookActorService } from './rulebook/services/rulebook-actor.service';
import { RulebookTemplateService } from './rulebook/templates/rulebook-template.service';
import { AdminUser } from '../users/entities/admin-user.entity';

// Reuse the existing provider-independent LLM abstraction rather than adding a
// second one (Build Rule 153: do not replace a working module by preference).
import { LLMService } from '../common/ai/services/llm.service';

/* ------------------------------------------------------------------ */
/* Phases 6-10, added 2026-09-17                                      */
/*                                                                    */
/* Each phase was built in isolation behind ports, so the modules do  */
/* not import one another. Where one phase needs another's behaviour  */
/* the dependency is a DI token with a null/no-op default, bound      */
/* below. That is why every cross-phase seam is visible here rather   */
/* than buried inside a service.                                      */
/* ------------------------------------------------------------------ */

// Phase 6 - Scenario & What-If
import { ScenarioContextService } from './scenario/services/scenario-context.service';
import { ScenarioService } from './scenario/services/scenario.service';
import { WhatIfService } from './scenario/services/what-if.service';
import { LlmScenarioEngine } from './scenario/engines/llm-scenario.engine';
import { LlmWhatIfEngine } from './scenario/engines/llm-what-if.engine';
import { SCENARIO_ENGINE } from './scenario/ports/scenario.port';
import { WHAT_IF_ENGINE } from './scenario/ports/what-if.port';

// Phase 7 - MKA + Plan
import { MkaService } from './mka/services/mka.service';
import { PlanService } from './plan/services/plan.service';

// Phase 8 - Karma Ledger
import { KarmaService } from './karma/services/karma.service';
import { DeterministicKarmaClassifier } from './karma/services/deterministic-karma-classifier';
import { KARMA_CLASSIFIER } from './karma/ports/karma-classifier.port';
import {
  KARMA_SOURCE_PORT,
  NullKarmaSourceAdapter,
} from './karma/ports/karma-source.port';

// Phase 9 - Life Signals + Realignment
import { LifeSignalService } from './signals/services/life-signal.service';
import { SignalClassifierService } from './signals/services/signal-classifier.service';
import { SignalTrendService } from './signals/services/signal-trend.service';
import { RealignmentService } from './realignment/services/realignment.service';
import { REALIGNMENT_TARGET } from './realignment/ports/realignment-target.port';
import { NoopRealignmentTarget } from './realignment/ports/noop-realignment-target';

// Phase 10 - Memory + Future Self
import { MemoryService } from './memory/services/memory.service';
import { FutureSelfService } from './future-self/services/future-self.service';
import { LlmFutureSelfEngine } from './future-self/engines/llm-future-self.engine';
import { FUTURE_SELF_ENGINE } from './future-self/engines/future-self.port';
import {
  PLAN_PROGRESS_PROVIDER,
  NullPlanProgressProvider,
} from './future-self/ports/plan-progress.port';

// Phase 6-10 controllers
import { ZunoScenarioController } from './scenario/controllers/scenario.controller';
import {
  ZunoMkaController,
  ZunoChallengeMkaController,
} from './mka/controllers/mka.controller';
import {
  ZunoPlansController,
  ZunoPlanItemsController,
  ZunoChallengePlansController,
} from './plan/controllers/plan.controller';
import { ZunoKarmaController } from './karma/controllers/karma.controller';
import { ZunoSignalsController } from './signals/controllers/signals.controller';
import { ZunoRealignmentController } from './realignment/controllers/realignment.controller';
import { ZunoMemoryController } from './memory/controllers/memory.controller';
import { ZunoFutureSelfController } from './future-self/controllers/future-self.controller';

// Controllers
import { ZunoMeController } from './identity/controllers/me.controller';
import { ZunoChallengesController } from './challenges/controllers/challenges.controller';
import { AdminRulebookController } from './rulebook/controllers/admin-rulebook.controller';
import { AdminAiCostController } from './ai/controllers/admin-ai-cost.controller';
import { ZunoLocationsController } from './locations/controllers/locations.controller';


/**
 * ZUNO application module.
 *
 * Covers Implementation Roadmap phases 1-3:
 *   Phase 1  platform foundation - identity bridge, ownership, error model,
 *            correlation, outbox, idempotency, audit, AI gateway
 *   Phase 2  user, profile and birth context
 *   Phase 3  the Challenge -> WhatNow -> adaptive response vertical slice
 *
 * Structured per Build Rule 18, which asks for modular domain boundaries
 * (auth, users, challenges, plans, mka, karma, memory, life-signals,
 * realignment, future-self, rulebook, ...). The directories for later phases
 * are not created speculatively; each arrives with its phase.
 *
 * Isolated from the existing iBhakt modules on purpose: it contributes its own
 * response envelope, exception filter and entity set, and shares only the
 * authentication strategy, the Customer record it bridges from, and the
 * LLMService.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([...ZUNO_ENTITIES, Customer, AdminUser]),
    // LLMService depends on HttpService.
    HttpModule.register({ timeout: 60000, maxRedirects: 3 }),
  ],
  controllers: [
    ZunoMeController,
    ZunoChallengesController,
    ZunoLocationsController,
    AdminRulebookController,
    AdminAiCostController,

    // Phases 6-10
    ZunoScenarioController,
    ZunoMkaController,
    ZunoPlansController,
    ZunoPlanItemsController,
    ZunoKarmaController,
    ZunoSignalsController,
    ZunoRealignmentController,
    ZunoMemoryController,
    ZunoFutureSelfController,

    // Step 21 sections 47/50 nest four endpoints under /challenges. These
    // cannot shadow ZunoChallengesController: its dynamic route is the single
    // segment ':challengeId', while these are ':challengeId/mka' and
    // ':challengeId/plans'.
    ZunoChallengeMkaController,
    ZunoChallengePlansController,
  ],
  providers: [
    // Platform
    ClockService,
    RequestContextService,
    RequestContextMiddleware,
    OutboxService,
    IdempotencyService,
    ZunoAuditService,
    ZunoOwnershipService,
    ZunoResponseInterceptor,
    ZunoExceptionFilter,
    ZunoUserGuard,

    // Identity
    ZunoUserResolverService,
    ZunoProfileService,

    // Safety - registered before the engines that depend on it, so the
    // dependency direction stays obvious: nothing generates before safety.
    SafetySignalDetector,
    SafetyService,

    // AI. Pricing is registered before the gateway that depends on it, so the
    // dependency direction stays readable: nothing is billed before it is priced.
    LLMService,
    AiPricingService,
    ZunoAiGateway,
    AiCostService,

    // Locations. The geocoder is bound through its port token so a provider can
    // be swapped, or removed entirely, without any consumer changing - and so
    // that the fail-closed null implementation is the default.
    GeocoderProvider,
    TimezoneResolverService,
    BirthPlaceResolverService,

    // WhatNow. The engine is bound through its port token so the Node/LLM
    // implementation can be swapped for an HTTP adapter to the Python
    // intelligence service (Step 21 section 27) without touching any consumer.
    LlmWhatNowEngine,
    { provide: WHATNOW_ENGINE, useExisting: LlmWhatNowEngine },
    WhatNowService,

    // Response and orchestration
    ResponseComposerService,
    ChallengeService,

    // Rulebook. The repository is the ONLY runtime path to astrology
    // knowledge, and it fails closed when no version is active
    // (Step 20 section 125).
    RulebookParserService,
    RulebookValidatorService,
    RulebookCompilerService,
    RulebookGovernanceService,
    RulebookRepositoryService,
    RulebookDashboardService,
    RulebookActorService,
    RulebookTemplateService,
    /* ---------------------------------------------------------------- */
    /* Phase 6 - Scenario & What-If                                     */
    /* ---------------------------------------------------------------- */
    ScenarioContextService,
    LlmScenarioEngine,
    LlmWhatIfEngine,
    { provide: SCENARIO_ENGINE, useExisting: LlmScenarioEngine },
    { provide: WHAT_IF_ENGINE, useExisting: LlmWhatIfEngine },
    ScenarioService,
    WhatIfService,

    /* ---------------------------------------------------------------- */
    /* Phase 7 - MKA + Plan                                             */
    /* ---------------------------------------------------------------- */
    MkaService,
    PlanService,

    /* ---------------------------------------------------------------- */
    /* Phase 8 - Karma Ledger                                           */
    /*                                                                  */
    /* The classifier returns labels only and structurally cannot       */
    /* return points (Step 17 section 21).                              */
    /* ---------------------------------------------------------------- */
    DeterministicKarmaClassifier,
    { provide: KARMA_CLASSIFIER, useExisting: DeterministicKarmaClassifier },
    // Null by default: the ledger then falls back to the event's own
    // assertions and records only what the event explicitly marked eligible.
    // It never fabricates an action. Bind a real adapter once Plan/MKA
    // expose one.
    { provide: KARMA_SOURCE_PORT, useClass: NullKarmaSourceAdapter },
    KarmaService,

    /* ---------------------------------------------------------------- */
    /* Phase 9 - Life Signals + Realignment                             */
    /* ---------------------------------------------------------------- */
    SignalClassifierService,
    SignalTrendService,
    LifeSignalService,
    // No-op by default. It reports `applied: false` rather than a fabricated
    // success, so an unwired realignment is visibly inert instead of silently
    // claiming to have changed a plan. The Plan/MKA implementation that
    // replaces it MUST write through the transaction's EntityManager, or
    // atomicity is lost.
    NoopRealignmentTarget,
    { provide: REALIGNMENT_TARGET, useExisting: NoopRealignmentTarget },
    RealignmentService,

    /* ---------------------------------------------------------------- */
    /* Phase 10 - Memory + Future Self                                  */
    /* ---------------------------------------------------------------- */
    MemoryService,
    NullPlanProgressProvider,
    { provide: PLAN_PROGRESS_PROVIDER, useExisting: NullPlanProgressProvider },
    LlmFutureSelfEngine,
    { provide: FUTURE_SELF_ENGINE, useExisting: LlmFutureSelfEngine },
    FutureSelfService,
  ],
  exports: [
    ZunoUserResolverService,
    SafetyService,
    ZunoAiGateway,
    // Exported for the astrology layer, which needs a resolved birth moment
    // before it can compute anything.
    TimezoneResolverService,
    BirthPlaceResolverService,
    // Exported so later phases (astrology, MKA, plan) resolve rules through
    // the governed repository rather than reading the tables directly.
    RulebookRepositoryService,
  ],
})
export class ZunoModule implements NestModule {
  /**
   * Correlation context is established for ZUNO routes only.
   *
   * Applying it globally would change request handling for every existing
   * iBhakt endpoint, which Build Rule 152 ("refactoring must preserve approved
   * behaviour") says not to do as a side effect of adding a feature.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes(
        { path: 'me', method: RequestMethod.ALL },
        { path: 'me/*', method: RequestMethod.ALL },
        { path: 'challenges', method: RequestMethod.ALL },
        { path: 'challenges/*', method: RequestMethod.ALL },
        { path: 'locations', method: RequestMethod.ALL },
        { path: 'locations/*', method: RequestMethod.ALL },
        // Phases 6-10. Every root here must also appear in ZUNO_ROUTE_ROOTS,
        // or the legacy interceptor double-wraps the response envelope.
        { path: 'scenarios', method: RequestMethod.ALL },
        { path: 'scenarios/*', method: RequestMethod.ALL },
        { path: 'mka', method: RequestMethod.ALL },
        { path: 'mka/*', method: RequestMethod.ALL },
        { path: 'plans', method: RequestMethod.ALL },
        { path: 'plans/*', method: RequestMethod.ALL },
        { path: 'plan-items', method: RequestMethod.ALL },
        { path: 'plan-items/*', method: RequestMethod.ALL },
        { path: 'karma', method: RequestMethod.ALL },
        { path: 'karma/*', method: RequestMethod.ALL },
        { path: 'signals', method: RequestMethod.ALL },
        { path: 'signals/*', method: RequestMethod.ALL },
        { path: 'realignment', method: RequestMethod.ALL },
        { path: 'realignment/*', method: RequestMethod.ALL },
        { path: 'memory', method: RequestMethod.ALL },
        { path: 'memory/*', method: RequestMethod.ALL },
        { path: 'future-self', method: RequestMethod.ALL },
        { path: 'future-self/*', method: RequestMethod.ALL },
      );
  }
}
