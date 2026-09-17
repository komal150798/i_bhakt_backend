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
const me_controller_1 = require("./identity/controllers/me.controller");
const challenges_controller_1 = require("./challenges/controllers/challenges.controller");
const admin_rulebook_controller_1 = require("./rulebook/controllers/admin-rulebook.controller");
let ZunoModule = class ZunoModule {
    configure(consumer) {
        consumer
            .apply(request_context_service_1.RequestContextMiddleware)
            .forRoutes({ path: 'me', method: common_1.RequestMethod.ALL }, { path: 'me/*', method: common_1.RequestMethod.ALL }, { path: 'challenges', method: common_1.RequestMethod.ALL }, { path: 'challenges/*', method: common_1.RequestMethod.ALL });
    }
};
exports.ZunoModule = ZunoModule;
exports.ZunoModule = ZunoModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([...zuno_entities_1.ZUNO_ENTITIES, customer_entity_1.Customer, admin_user_entity_1.AdminUser]),
            axios_1.HttpModule.register({ timeout: 60000, maxRedirects: 3 }),
        ],
        controllers: [me_controller_1.ZunoMeController, challenges_controller_1.ZunoChallengesController, admin_rulebook_controller_1.AdminRulebookController],
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
            zuno_ai_gateway_service_1.ZunoAiGateway,
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
        ],
        exports: [
            zuno_user_resolver_service_1.ZunoUserResolverService,
            safety_service_1.SafetyService,
            zuno_ai_gateway_service_1.ZunoAiGateway,
            rulebook_repository_service_1.RulebookRepositoryService,
        ],
    })
], ZunoModule);
//# sourceMappingURL=zuno.module.js.map