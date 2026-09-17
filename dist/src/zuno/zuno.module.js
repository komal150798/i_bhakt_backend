"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZunoModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const customer_entity_1 = require("../users/entities/customer.entity");
const zuno_entities_1 = require("./zuno-entities");
const clock_service_1 = require("./common/services/clock.service");
const request_context_service_1 = require("./common/services/request-context.service");
const outbox_service_1 = require("./common/services/outbox.service");
const idempotency_service_1 = require("./common/services/idempotency.service");
const zuno_audit_service_1 = require("./common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("./common/services/zuno-ownership.service");
const zuno_response_interceptor_1 = require("./common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("./common/filters/zuno-exception.filter");
const zuno_user_guard_1 = require("./common/guards/zuno-user.guard");
const zuno_user_resolver_service_1 = require("./identity/services/zuno-user-resolver.service");
const zuno_profile_service_1 = require("./identity/services/zuno-profile.service");
const safety_service_1 = require("./safety/services/safety.service");
const safety_signal_detector_1 = require("./safety/services/safety-signal-detector");
const zuno_ai_gateway_service_1 = require("./ai/services/zuno-ai-gateway.service");
const ai_pricing_service_1 = require("./ai/services/ai-pricing.service");
const ai_cost_service_1 = require("./ai/services/ai-cost.service");
const geocoder_provider_1 = require("./locations/geocoder.provider");
const timezone_resolver_service_1 = require("./locations/services/timezone-resolver.service");
const birth_place_resolver_service_1 = require("./locations/services/birth-place-resolver.service");
const whatnow_service_1 = require("./whatnow/services/whatnow.service");
const llm_whatnow_engine_1 = require("./whatnow/engines/llm-whatnow.engine");
const whatnow_port_1 = require("./whatnow/engines/whatnow.port");
const response_composer_service_1 = require("./responses/services/response-composer.service");
const challenge_service_1 = require("./challenges/services/challenge.service");
const rulebook_parser_service_1 = require("./rulebook/parsing/rulebook-parser.service");
const rulebook_validator_service_1 = require("./rulebook/validation/rulebook-validator.service");
const rulebook_compiler_service_1 = require("./rulebook/services/rulebook-compiler.service");
const rulebook_governance_service_1 = require("./rulebook/services/rulebook-governance.service");
const rulebook_repository_service_1 = require("./rulebook/services/rulebook-repository.service");
const rulebook_dashboard_service_1 = require("./rulebook/services/rulebook-dashboard.service");
const rulebook_actor_service_1 = require("./rulebook/services/rulebook-actor.service");
const rulebook_template_service_1 = require("./rulebook/templates/rulebook-template.service");
const admin_user_entity_1 = require("../users/entities/admin-user.entity");
const llm_service_1 = require("../common/ai/services/llm.service");
const scenario_context_service_1 = require("./scenario/services/scenario-context.service");
const scenario_service_1 = require("./scenario/services/scenario.service");
const what_if_service_1 = require("./scenario/services/what-if.service");
const llm_scenario_engine_1 = require("./scenario/engines/llm-scenario.engine");
const llm_what_if_engine_1 = require("./scenario/engines/llm-what-if.engine");
const scenario_port_1 = require("./scenario/ports/scenario.port");
const what_if_port_1 = require("./scenario/ports/what-if.port");
const mka_service_1 = require("./mka/services/mka.service");
const plan_service_1 = require("./plan/services/plan.service");
const karma_service_1 = require("./karma/services/karma.service");
const deterministic_karma_classifier_1 = require("./karma/services/deterministic-karma-classifier");
const karma_classifier_port_1 = require("./karma/ports/karma-classifier.port");
const karma_source_port_1 = require("./karma/ports/karma-source.port");
const life_signal_service_1 = require("./signals/services/life-signal.service");
const signal_classifier_service_1 = require("./signals/services/signal-classifier.service");
const signal_trend_service_1 = require("./signals/services/signal-trend.service");
const realignment_service_1 = require("./realignment/services/realignment.service");
const realignment_target_port_1 = require("./realignment/ports/realignment-target.port");
const noop_realignment_target_1 = require("./realignment/ports/noop-realignment-target");
const memory_service_1 = require("./memory/services/memory.service");
const future_self_service_1 = require("./future-self/services/future-self.service");
const llm_future_self_engine_1 = require("./future-self/engines/llm-future-self.engine");
const future_self_port_1 = require("./future-self/engines/future-self.port");
const plan_progress_port_1 = require("./future-self/ports/plan-progress.port");
const scenario_controller_1 = require("./scenario/controllers/scenario.controller");
const mka_controller_1 = require("./mka/controllers/mka.controller");
const plan_controller_1 = require("./plan/controllers/plan.controller");
const karma_controller_1 = require("./karma/controllers/karma.controller");
const signals_controller_1 = require("./signals/controllers/signals.controller");
const realignment_controller_1 = require("./realignment/controllers/realignment.controller");
const memory_controller_1 = require("./memory/controllers/memory.controller");
const future_self_controller_1 = require("./future-self/controllers/future-self.controller");
const me_controller_1 = require("./identity/controllers/me.controller");
const challenges_controller_1 = require("./challenges/controllers/challenges.controller");
const admin_rulebook_controller_1 = require("./rulebook/controllers/admin-rulebook.controller");
const admin_ai_cost_controller_1 = require("./ai/controllers/admin-ai-cost.controller");
const locations_controller_1 = require("./locations/controllers/locations.controller");
let ZunoModule = class ZunoModule {
    configure(consumer) {
        consumer
            .apply(request_context_service_1.RequestContextMiddleware)
            .forRoutes({ path: 'me', method: common_1.RequestMethod.ALL }, { path: 'me/*', method: common_1.RequestMethod.ALL }, { path: 'challenges', method: common_1.RequestMethod.ALL }, { path: 'challenges/*', method: common_1.RequestMethod.ALL }, { path: 'locations', method: common_1.RequestMethod.ALL }, { path: 'locations/*', method: common_1.RequestMethod.ALL }, { path: 'scenarios', method: common_1.RequestMethod.ALL }, { path: 'scenarios/*', method: common_1.RequestMethod.ALL }, { path: 'mka', method: common_1.RequestMethod.ALL }, { path: 'mka/*', method: common_1.RequestMethod.ALL }, { path: 'plans', method: common_1.RequestMethod.ALL }, { path: 'plans/*', method: common_1.RequestMethod.ALL }, { path: 'plan-items', method: common_1.RequestMethod.ALL }, { path: 'plan-items/*', method: common_1.RequestMethod.ALL }, { path: 'karma', method: common_1.RequestMethod.ALL }, { path: 'karma/*', method: common_1.RequestMethod.ALL }, { path: 'signals', method: common_1.RequestMethod.ALL }, { path: 'signals/*', method: common_1.RequestMethod.ALL }, { path: 'realignment', method: common_1.RequestMethod.ALL }, { path: 'realignment/*', method: common_1.RequestMethod.ALL }, { path: 'memory', method: common_1.RequestMethod.ALL }, { path: 'memory/*', method: common_1.RequestMethod.ALL }, { path: 'future-self', method: common_1.RequestMethod.ALL }, { path: 'future-self/*', method: common_1.RequestMethod.ALL });
    }
};
exports.ZunoModule = ZunoModule;
exports.ZunoModule = ZunoModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([...zuno_entities_1.ZUNO_ENTITIES, customer_entity_1.Customer, admin_user_entity_1.AdminUser]),
            axios_1.HttpModule.register({ timeout: 60000, maxRedirects: 3 }),
        ],
        controllers: [
            me_controller_1.ZunoMeController,
            challenges_controller_1.ZunoChallengesController,
            locations_controller_1.ZunoLocationsController,
            admin_rulebook_controller_1.AdminRulebookController,
            admin_ai_cost_controller_1.AdminAiCostController,
            scenario_controller_1.ZunoScenarioController,
            mka_controller_1.ZunoMkaController,
            plan_controller_1.ZunoPlansController,
            plan_controller_1.ZunoPlanItemsController,
            karma_controller_1.ZunoKarmaController,
            signals_controller_1.ZunoSignalsController,
            realignment_controller_1.ZunoRealignmentController,
            memory_controller_1.ZunoMemoryController,
            future_self_controller_1.ZunoFutureSelfController,
            mka_controller_1.ZunoChallengeMkaController,
            plan_controller_1.ZunoChallengePlansController,
        ],
        providers: [
            clock_service_1.ClockService,
            request_context_service_1.RequestContextService,
            request_context_service_1.RequestContextMiddleware,
            outbox_service_1.OutboxService,
            idempotency_service_1.IdempotencyService,
            zuno_audit_service_1.ZunoAuditService,
            zuno_ownership_service_1.ZunoOwnershipService,
            zuno_response_interceptor_1.ZunoResponseInterceptor,
            zuno_exception_filter_1.ZunoExceptionFilter,
            zuno_user_guard_1.ZunoUserGuard,
            zuno_user_resolver_service_1.ZunoUserResolverService,
            zuno_profile_service_1.ZunoProfileService,
            safety_signal_detector_1.SafetySignalDetector,
            safety_service_1.SafetyService,
            llm_service_1.LLMService,
            ai_pricing_service_1.AiPricingService,
            zuno_ai_gateway_service_1.ZunoAiGateway,
            ai_cost_service_1.AiCostService,
            geocoder_provider_1.GeocoderProvider,
            timezone_resolver_service_1.TimezoneResolverService,
            birth_place_resolver_service_1.BirthPlaceResolverService,
            llm_whatnow_engine_1.LlmWhatNowEngine,
            { provide: whatnow_port_1.WHATNOW_ENGINE, useExisting: llm_whatnow_engine_1.LlmWhatNowEngine },
            whatnow_service_1.WhatNowService,
            response_composer_service_1.ResponseComposerService,
            challenge_service_1.ChallengeService,
            rulebook_parser_service_1.RulebookParserService,
            rulebook_validator_service_1.RulebookValidatorService,
            rulebook_compiler_service_1.RulebookCompilerService,
            rulebook_governance_service_1.RulebookGovernanceService,
            rulebook_repository_service_1.RulebookRepositoryService,
            rulebook_dashboard_service_1.RulebookDashboardService,
            rulebook_actor_service_1.RulebookActorService,
            rulebook_template_service_1.RulebookTemplateService,
            scenario_context_service_1.ScenarioContextService,
            llm_scenario_engine_1.LlmScenarioEngine,
            llm_what_if_engine_1.LlmWhatIfEngine,
            { provide: scenario_port_1.SCENARIO_ENGINE, useExisting: llm_scenario_engine_1.LlmScenarioEngine },
            { provide: what_if_port_1.WHAT_IF_ENGINE, useExisting: llm_what_if_engine_1.LlmWhatIfEngine },
            scenario_service_1.ScenarioService,
            what_if_service_1.WhatIfService,
            mka_service_1.MkaService,
            plan_service_1.PlanService,
            deterministic_karma_classifier_1.DeterministicKarmaClassifier,
            { provide: karma_classifier_port_1.KARMA_CLASSIFIER, useExisting: deterministic_karma_classifier_1.DeterministicKarmaClassifier },
            { provide: karma_source_port_1.KARMA_SOURCE_PORT, useClass: karma_source_port_1.NullKarmaSourceAdapter },
            karma_service_1.KarmaService,
            signal_classifier_service_1.SignalClassifierService,
            signal_trend_service_1.SignalTrendService,
            life_signal_service_1.LifeSignalService,
            noop_realignment_target_1.NoopRealignmentTarget,
            { provide: realignment_target_port_1.REALIGNMENT_TARGET, useExisting: noop_realignment_target_1.NoopRealignmentTarget },
            realignment_service_1.RealignmentService,
            memory_service_1.MemoryService,
            plan_progress_port_1.NullPlanProgressProvider,
            { provide: plan_progress_port_1.PLAN_PROGRESS_PROVIDER, useExisting: plan_progress_port_1.NullPlanProgressProvider },
            llm_future_self_engine_1.LlmFutureSelfEngine,
            { provide: future_self_port_1.FUTURE_SELF_ENGINE, useExisting: llm_future_self_engine_1.LlmFutureSelfEngine },
            future_self_service_1.FutureSelfService,
        ],
        exports: [
            zuno_user_resolver_service_1.ZunoUserResolverService,
            safety_service_1.SafetyService,
            zuno_ai_gateway_service_1.ZunoAiGateway,
            timezone_resolver_service_1.TimezoneResolverService,
            birth_place_resolver_service_1.BirthPlaceResolverService,
            rulebook_repository_service_1.RulebookRepositoryService,
        ],
    })
], ZunoModule);
//# sourceMappingURL=zuno.module.js.map