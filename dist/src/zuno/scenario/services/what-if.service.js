"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WhatIfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatIfService = exports.WHAT_IF_HYPOTHETICAL_NOTICE = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_what_if_session_entity_1 = require("../entities/zuno-what-if-session.entity");
const zuno_what_if_assumption_entity_1 = require("../entities/zuno-what-if-assumption.entity");
const what_if_port_1 = require("../ports/what-if.port");
const scenario_context_service_1 = require("./scenario-context.service");
const scenario_service_1 = require("./scenario.service");
const safety_service_1 = require("../../safety/services/safety.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const scenario_events_1 = require("../scenario.events");
const enums_1 = require("../../common/enums");
const scenario_enum_1 = require("../enums/scenario.enum");
const deterministic_language_guard_1 = require("../schemas/deterministic-language.guard");
exports.WHAT_IF_HYPOTHETICAL_NOTICE = 'This is a hypothetical. Your current plan is unchanged.';
const WHAT_IF_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let WhatIfService = WhatIfService_1 = class WhatIfService {
    constructor(sessions, assumptions, engine, context, scenarios, safety, outbox, audit, ownership, clock, dataSource) {
        this.sessions = sessions;
        this.assumptions = assumptions;
        this.engine = engine;
        this.context = context;
        this.scenarios = scenarios;
        this.safety = safety;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(WhatIfService_1.name);
    }
    async explore(params) {
        const question = params.question.trim();
        if (question.length === 0) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'question', code: 'REQUIRED' }]);
        }
        const projection = await this.context.project(params.user.id, params.challengeId);
        const assessment = this.safety.preCheck({
            operation: 'WHAT_IF_EXPLORE',
            userId: params.user.id,
            challengeId: projection.challenge.id,
            text: `${question}\n${projection.safetyText}`,
            domains: projection.domains,
        });
        if (assessment.blocked) {
            await this.recordBlocked(params.user, projection.challenge.id, assessment, 'WHAT_IF_PRECHECK');
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                message: assessment.boundaryMessage ??
                    'I am not able to explore this one, even hypothetically, and I would rather say so plainly.',
                safety: {
                    disposition: assessment.disposition,
                    domain: assessment.domains[0],
                },
            });
        }
        const astro = await this.context.loadAstroContext(projection.domains);
        const currentSet = await this.scenarios.currentSet(projection.challenge.id);
        const existingPreparation = (currentSet?.shared_preparation ?? []).map((prep) => prep.action);
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
            max_cascade_depth: scenario_enum_1.WHAT_IF_MAX_CASCADE_DEPTH,
        });
        const exploration = result.exploration;
        const implications = exploration.implications
            .filter((entry) => entry.layer <= scenario_enum_1.WHAT_IF_MAX_CASCADE_DEPTH)
            .filter((entry) => {
            const claims = (0, deterministic_language_guard_1.findDeterministicClaims)(entry.text, 'implication');
            if (claims.length > 0) {
                this.logger.warn(`Dropped a what-if implication asserting a determined outcome: ${claims
                    .map((claim) => claim.kind)
                    .join(',')}`);
                return false;
            }
            return true;
        });
        if (implications.length === 0) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE, {
                internalDetail: 'what-if produced no implication within the permitted cascade depth and possibility-language bounds',
            });
        }
        const payload = {
            implications,
            controllable_actions: exploration.controllable_actions,
            existing_preparation_that_helps: exploration.existing_preparation_that_helps.filter((entry) => existingPreparation.some((actual) => normalise(actual) === normalise(entry))),
            preparation: exploration.preparation,
            impact_areas: exploration.impact_areas,
            impact: exploration.impact,
            reversibility: exploration.reversibility,
            hypothetical_notice: exports.WHAT_IF_HYPOTHETICAL_NOTICE,
        };
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
                throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                    message: 'I could not think this one through in a way I was comfortable sending. Let us approach it differently.',
                    safety: { disposition: assessment.disposition },
                });
            }
            const now = this.clock.now();
            const session = manager.create(zuno_what_if_session_entity_1.ZunoWhatIfSession, {
                user_id: params.user.id,
                challenge_id: projection.challenge.id,
                prompt: question,
                status: scenario_enum_1.WhatIfSessionStatus.ACTIVE,
                is_hypothetical: true,
                result: payload,
                current_plan_changed: false,
                challenge_context_version: projection.context?.version_number ?? null,
                engine_version: result.engineVersion,
                safety_decision_id: decision.id,
                ai_generation_run_id: result.aiGenerationRunId,
                expires_at: new Date(now.getTime() + WHAT_IF_TTL_MS),
            });
            const savedSession = await manager.save(zuno_what_if_session_entity_1.ZunoWhatIfSession, session);
            const assumptionRows = [
                manager.create(zuno_what_if_assumption_entity_1.ZunoWhatIfAssumption, {
                    what_if_session_id: savedSession.id,
                    user_id: params.user.id,
                    assumption_text: exploration.assumption,
                    assumption_type: scenario_enum_1.WhatIfAssumptionType.USER_STATED,
                    value: null,
                }),
                ...exploration.assumptions
                    .filter((entry) => entry.type !== scenario_enum_1.WhatIfAssumptionType.USER_STATED)
                    .map((entry) => manager.create(zuno_what_if_assumption_entity_1.ZunoWhatIfAssumption, {
                    what_if_session_id: savedSession.id,
                    user_id: params.user.id,
                    assumption_text: entry.text,
                    assumption_type: entry.type,
                    value: entry.dependency_reference
                        ? { dependency_reference: entry.dependency_reference }
                        : null,
                })),
            ];
            const savedAssumptions = await manager.save(zuno_what_if_assumption_entity_1.ZunoWhatIfAssumption, assumptionRows);
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
                aggregateType: enums_1.ZunoAggregateType.CHALLENGE,
                aggregateId: projection.challenge.id,
                eventType: (0, scenario_events_1.scenarioEvent)(scenario_events_1.SCENARIO_EVENT_TYPES.WHAT_IF_EXPLORED),
                payload: {
                    what_if_session_id: savedSession.id,
                    challenge_id: projection.challenge.id,
                    user_id: params.user.id,
                    hypothetical: true,
                    current_plan_changed: false,
                },
            });
            return { session: savedSession, assumptions: savedAssumptions };
        });
    }
    async findOwnedSession(user, sessionId) {
        const session = await this.sessions.findOne({ where: { id: sessionId } });
        const owned = this.ownership.require(session, user.id, 'what-if session');
        if (owned.expires_at && owned.expires_at.getTime() < this.clock.now().getTime()) {
            throw zuno_exception_1.ZunoException.notFound(`what-if session ${sessionId} has expired`);
        }
        const assumptions = await this.assumptions.find({
            where: { what_if_session_id: owned.id },
            order: { created_at: 'ASC' },
        });
        return { session: owned, assumptions };
    }
    async discard(user, sessionId) {
        const { session } = await this.findOwnedSession(user, sessionId);
        await this.dataSource.transaction(async (manager) => {
            session.status = scenario_enum_1.WhatIfSessionStatus.DISCARDED;
            await manager.save(zuno_what_if_session_entity_1.ZunoWhatIfSession, session);
            await manager.softDelete(zuno_what_if_session_entity_1.ZunoWhatIfSession, { id: session.id });
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: user.id,
                userId: user.id,
                action: 'WHAT_IF_DISCARDED',
                entityType: 'ZunoWhatIfSession',
                entityId: session.id,
                before: { status: scenario_enum_1.WhatIfSessionStatus.ACTIVE },
                after: { status: scenario_enum_1.WhatIfSessionStatus.DISCARDED },
            });
        });
    }
    async recordBlocked(user, challengeId, assessment, source) {
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
                aggregateType: enums_1.ZunoAggregateType.SAFETY_DECISION,
                aggregateId: decision.id,
                eventType: enums_1.ZunoEventType.SAFETY_CRITICAL_ESCALATION,
                payload: {
                    safety_decision_id: decision.id,
                    challenge_id: challengeId,
                    user_id: user.id,
                    risk_level: assessment.riskLevel,
                },
            });
        });
    }
};
exports.WhatIfService = WhatIfService;
exports.WhatIfService = WhatIfService = WhatIfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_what_if_session_entity_1.ZunoWhatIfSession)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_what_if_assumption_entity_1.ZunoWhatIfAssumption)),
    __param(2, (0, common_1.Inject)(what_if_port_1.WHAT_IF_ENGINE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, Object, scenario_context_service_1.ScenarioContextService,
        scenario_service_1.ScenarioService,
        safety_service_1.SafetyService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], WhatIfService);
function collectWhatIfText(payload) {
    return [
        ...payload.implications.map((entry) => entry.text),
        ...payload.controllable_actions,
        ...payload.existing_preparation_that_helps,
        ...payload.preparation.map((prep) => prep.action),
    ]
        .filter(Boolean)
        .join(' ');
}
function normalise(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=what-if.service.js.map