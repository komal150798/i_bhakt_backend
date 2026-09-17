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
var FutureSelfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FUTURE_SELF_DEFAULT_MEMORY_TYPES = exports.FutureSelfService = exports.FUTURE_SELF_BOUNDARY_VERSION = void 0;
exports.requestContextForMode = requestContextForMode;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const future_self_port_1 = require("../engines/future-self.port");
const plan_progress_port_1 = require("../ports/plan-progress.port");
const zuno_future_self_narrative_entity_1 = require("../entities/zuno-future-self-narrative.entity");
const zuno_future_self_source_entity_1 = require("../entities/zuno-future-self-source.entity");
const future_self_enum_1 = require("../enums/future-self.enum");
const future_self_boundary_1 = require("../grounding/future-self-boundary");
const memory_service_1 = require("../../memory/services/memory.service");
const memory_enum_1 = require("../../memory/enums/memory.enum");
const memory_events_1 = require("../../memory/events/memory-events");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_challenge_context_entity_1 = require("../../challenges/entities/zuno-challenge-context.entity");
const safety_service_1 = require("../../safety/services/safety.service");
const rulebook_repository_service_1 = require("../../rulebook/services/rulebook-repository.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
exports.FUTURE_SELF_BOUNDARY_VERSION = 'fs-boundary-1.0.0';
const FUTURE_SELF_MEMORY_MAX_ITEMS = 10;
let FutureSelfService = FutureSelfService_1 = class FutureSelfService {
    constructor(engine, planProgress, narratives, challenges, contexts, memory, safety, outbox, audit, ownership, clock, dataSource, rulebook) {
        this.engine = engine;
        this.planProgress = planProgress;
        this.narratives = narratives;
        this.challenges = challenges;
        this.contexts = contexts;
        this.memory = memory;
        this.safety = safety;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.clock = clock;
        this.dataSource = dataSource;
        this.rulebook = rulebook;
        this.logger = new common_1.Logger(FutureSelfService_1.name);
    }
    async generate(params) {
        const now = this.clock.now();
        const challenge = params.challengeId
            ? await this.findOwnedChallenge(params.userId, params.challengeId)
            : null;
        if (challenge && challenge.status === enums_1.ChallengeStatus.ARCHIVED) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: 'cannot generate Future Self for an archived challenge',
            });
        }
        const context = challenge ? await this.latestContext(challenge.id) : null;
        const preCheckText = [
            challenge?.raw_user_statement ?? '',
            context?.summary ?? '',
        ]
            .filter(Boolean)
            .join(' ');
        const domains = challenge?.primary_domain
            ? [challenge.primary_domain]
            : [];
        const assessment = this.safety.preCheck({
            operation: 'FUTURE_SELF_GENERATE',
            userId: params.userId,
            challengeId: challenge?.id ?? null,
            text: preCheckText,
            domains,
        });
        if (assessment.blocked) {
            await this.recordBlocked(params.userId, challenge?.id ?? null, assessment);
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                message: assessment.boundaryMessage ??
                    'I am not able to reflect on this one here, and I would rather say so plainly.',
                safety: {
                    disposition: assessment.disposition,
                    domain: assessment.domains[0],
                },
            });
        }
        const since = new Date(now.getTime() - (future_self_enum_1.MODE_LOOKBACK_DAYS[params.mode] ?? 7) * 86_400_000);
        const closedChallengeIds = await this.closedChallengeIds(params.userId);
        const retrieval = await this.memory.retrieve({
            userId: params.userId,
            requestContext: requestContextForMode(params.mode),
            challengeId: challenge?.id ?? null,
            closedChallengeIds,
            maxItems: FUTURE_SELF_MEMORY_MAX_ITEMS,
            queryTerms: deriveQueryTerms(challenge, context),
            now,
        });
        const plan = await this.safelyGetPlan(params.userId, challenge?.id ?? null);
        const progress = await this.safelyGetProgress(params.userId, challenge?.id ?? null, since);
        const timingContext = await this.timingContext(challenge);
        const groundingSources = this.groundingSources(challenge, context, retrieval.items, plan, progress);
        const grounding = (0, future_self_boundary_1.buildGroundingSet)(groundingSources);
        const request = {
            mode: params.mode,
            context: {
                challengeTitle: challenge?.title ?? null,
                challengeSummary: context?.summary ?? null,
                relevantMemory: retrieval.items.map((entry) => entry.memory.memory_value?.statement ?? ''),
                planTitle: plan?.title ?? null,
                openPlanItems: (plan?.activeItems ?? []).map((item) => item.title),
                completedActions: progress.completedActions.map((a) => a.title),
                openLoops: progress.openLoops,
                observedPatterns: progress.observedPatterns,
                timingContext,
                periodStart: toDateOnly(since),
                periodEnd: toDateOnly(now),
            },
        };
        const generated = await this.engine.generate(request);
        const narrative = generated.narrative;
        const candidateText = [
            narrative.summary,
            ...narrative.progress_themes,
            ...narrative.open_loops,
            ...narrative.strengths_observed,
            ...narrative.next_focus,
        ].join('\n');
        const boundary = (0, future_self_boundary_1.checkFutureSelfBoundary)({
            mode: params.mode,
            candidateText,
            summary: narrative.summary,
            grounding,
            claimedSourceRefs: narrative.source_refs,
        });
        if (!boundary.allowed) {
            this.logger.warn(`Future Self generation refused by the grounding boundary: ${boundary.violations.join(',')}`);
            await this.recordBoundaryRefusal(params.userId, challenge?.id ?? null, boundary.violations);
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE, {
                message: 'I could not put this together in a way I was confident was true. Nothing has been lost - let us try again shortly.',
                internalDetail: `future self boundary violations: ${boundary.violations.join(',')}`,
            });
        }
        const postCheck = this.safety.postCheck({
            userId: params.userId,
            challengeId: challenge?.id ?? null,
            candidateText,
            assessment,
        });
        return this.dataSource.transaction(async (manager) => {
            const decision = await this.safety.recordDecision(manager, {
                userId: params.userId,
                challengeId: challenge?.id ?? null,
                operation: 'FUTURE_SELF_GENERATE',
                assessment,
            });
            if (!postCheck.allowed) {
                await this.safety.recordIncident(manager, {
                    userId: params.userId,
                    safetyDecisionId: decision.id,
                    source: 'FUTURE_SELF_POST_CHECK',
                    domain: challenge?.primary_domain ?? null,
                    severity: assessment.riskLevel,
                    violations: postCheck.violations,
                });
                this.logger.warn(`Future Self post-check blocked a narrative: ${postCheck.violations.join(',')}`);
                throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                    message: 'I could not put this in a way I was comfortable sending. Let us try approaching it differently.',
                    safety: { disposition: assessment.disposition },
                });
            }
            const row = manager.create(zuno_future_self_narrative_entity_1.ZunoFutureSelfNarrative, {
                user_id: params.userId,
                challenge_id: challenge?.id ?? null,
                mode: params.mode,
                period_start: toDateOnly(since),
                period_end: toDateOnly(now),
                summary: narrative.summary,
                progress_themes: narrative.progress_themes,
                open_loops: narrative.open_loops,
                strengths_observed: narrative.strengths_observed,
                next_focus: narrative.next_focus,
                generation_model_version: generated.modelVersion,
                engine_version: generated.engineVersion,
                prompt_template_version: null,
                ai_generation_run_id: generated.aiGenerationRunId,
                safety_decision_id: decision.id,
                boundary_version: exports.FUTURE_SELF_BOUNDARY_VERSION,
                version: 1,
                redacted_at: null,
            });
            const savedNarrative = await manager.save(zuno_future_self_narrative_entity_1.ZunoFutureSelfNarrative, row);
            const sourceRows = [];
            for (const ref of unique(narrative.source_refs)) {
                if (!grounding.sourceRefs.has(ref))
                    continue;
                const [entityType, entityId] = splitRef(ref);
                if (!entityType || !entityId)
                    continue;
                sourceRows.push(manager.create(zuno_future_self_source_entity_1.ZunoFutureSelfSource, {
                    future_self_narrative_id: savedNarrative.id,
                    source_entity_type: entityType,
                    source_entity_id: entityId,
                    redacted_at: null,
                }));
            }
            const savedSources = sourceRows.length > 0
                ? await manager.save(zuno_future_self_source_entity_1.ZunoFutureSelfSource, sourceRows)
                : [];
            await this.audit.record(manager, {
                actorType: 'SYSTEM',
                userId: params.userId,
                action: 'FUTURE_SELF_GENERATED',
                entityType: 'ZunoFutureSelfNarrative',
                entityId: savedNarrative.id,
                after: { mode: params.mode, source_count: savedSources.length },
                metadata: {
                    boundary_version: exports.FUTURE_SELF_BOUNDARY_VERSION,
                    memory_items_used: retrieval.items.length,
                    memory_items_considered: retrieval.consideredCount,
                },
            });
            await this.outbox.enqueue(manager, {
                aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.FUTURE_SELF),
                aggregateId: savedNarrative.id,
                eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.FUTURE_SELF_GENERATED),
                payload: {
                    future_self_id: savedNarrative.id,
                    user_id: params.userId,
                    challenge_id: challenge?.id ?? null,
                    mode: params.mode,
                    source_count: savedSources.length,
                },
            });
            return { narrative: savedNarrative, sources: savedSources };
        });
    }
    async findOwned(userId, narrativeId) {
        const row = await this.narratives.findOne({
            where: { id: narrativeId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(row, userId, 'future self narrative');
    }
    async listForUser(userId, filters = {}) {
        return this.narratives.find({
            where: {
                user_id: userId,
                deleted_at: (0, typeorm_2.IsNull)(),
                redacted_at: (0, typeorm_2.IsNull)(),
                ...(filters.challengeId ? { challenge_id: filters.challengeId } : {}),
                ...(filters.mode ? { mode: filters.mode } : {}),
            },
            order: { created_at: 'DESC' },
            take: Math.min(filters.limit ?? 20, 50),
        });
    }
    async markViewed(userId, narrativeId) {
        const row = await this.findOwned(userId, narrativeId);
        await this.dataSource.transaction(async (manager) => {
            await this.outbox.enqueue(manager, {
                aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.FUTURE_SELF),
                aggregateId: row.id,
                eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.FUTURE_SELF_VIEWED),
                payload: { future_self_id: row.id, user_id: userId },
            });
        });
    }
    groundingSources(challenge, context, memories, plan, progress) {
        const sources = [];
        if (challenge) {
            sources.push({
                entityType: 'ZunoChallenge',
                entityId: challenge.id,
                text: [challenge.title ?? '', context?.summary ?? ''].join(' '),
            });
        }
        for (const entry of memories) {
            sources.push({
                entityType: 'ZunoMemory',
                entityId: entry.memory.id,
                text: [
                    entry.memory.memory_value?.statement ?? '',
                    entry.memory.memory_value?.label ?? '',
                ].join(' '),
            });
        }
        if (plan) {
            sources.push({
                entityType: 'ZunoPlan',
                entityId: plan.planId,
                text: [plan.title, ...plan.activeItems.map((i) => i.title)].join(' '),
            });
        }
        for (const action of progress.completedActions) {
            sources.push({
                entityType: action.sourceEntityType,
                entityId: action.sourceEntityId,
                text: action.title,
            });
        }
        if (challenge && (progress.openLoops.length || progress.observedPatterns.length)) {
            sources.push({
                entityType: 'ZunoChallenge',
                entityId: challenge.id,
                text: [...progress.openLoops, ...progress.observedPatterns].join(' '),
            });
        }
        return sources;
    }
    async timingContext(challenge) {
        if (!this.rulebook || !challenge?.primary_domain)
            return null;
        try {
            if (!(await this.rulebook.isAstrologyAvailable())) {
                this.logger.debug('No active Rulebook; Future Self proceeds without timing context (fail closed).');
                return null;
            }
            const rules = await this.rulebook.findRules({
                domains: [challenge.primary_domain],
            });
            const keys = rules
                .map((rule) => rule.interpretation_key)
                .filter((key) => Boolean(key));
            if (keys.length === 0)
                return null;
            const interpretations = await this.rulebook.findInterpretations(keys);
            const safe = Array.from(interpretations.values())
                .map((row) => row.user_safe_summary)
                .filter((text) => Boolean(text))
                .slice(0, 2);
            return safe.length > 0 ? safe.join(' ') : null;
        }
        catch (error) {
            this.logger.debug(`Rulebook unavailable for timing context; continuing without it: ${error instanceof Error ? error.name : 'unknown'}`);
            return null;
        }
    }
    async safelyGetPlan(userId, challengeId) {
        try {
            return await this.planProgress.getCurrentPlan(userId, challengeId);
        }
        catch (error) {
            this.logger.warn('Plan provider failed; Future Self continues without plan context.');
            return null;
        }
    }
    async safelyGetProgress(userId, challengeId, since) {
        try {
            return await this.planProgress.getProgress(userId, challengeId, since);
        }
        catch {
            this.logger.warn('Progress provider failed; Future Self continues without progress context.');
            return { completedActions: [], openLoops: [], observedPatterns: [] };
        }
    }
    async findOwnedChallenge(userId, challengeId) {
        const challenge = await this.challenges.findOne({
            where: { id: challengeId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(challenge, userId, 'challenge');
    }
    async latestContext(challengeId) {
        return this.contexts.findOne({
            where: { challenge_id: challengeId },
            order: { version_number: 'DESC' },
        });
    }
    async closedChallengeIds(userId) {
        const rows = await this.challenges.find({
            where: [
                { user_id: userId, status: enums_1.ChallengeStatus.RESOLVED },
                { user_id: userId, status: enums_1.ChallengeStatus.ARCHIVED },
            ],
            select: ['id'],
            take: 200,
        });
        return rows.map((row) => row.id);
    }
    async recordBlocked(userId, challengeId, assessment) {
        await this.dataSource.transaction(async (manager) => {
            const decision = await this.safety.recordDecision(manager, {
                userId,
                challengeId,
                operation: 'FUTURE_SELF_GENERATE',
                assessment,
            });
            await this.safety.recordIncident(manager, {
                userId,
                safetyDecisionId: decision.id,
                source: 'FUTURE_SELF_PRECHECK',
                domain: assessment.domains[0] ?? null,
                severity: assessment.riskLevel,
                violations: [],
            });
        });
    }
    async recordBoundaryRefusal(userId, challengeId, violations) {
        try {
            await this.dataSource.transaction(async (manager) => {
                await this.audit.record(manager, {
                    actorType: 'SYSTEM',
                    userId,
                    action: 'FUTURE_SELF_BOUNDARY_REFUSAL',
                    entityType: 'ZunoFutureSelfNarrative',
                    entityId: null,
                    metadata: {
                        challenge_id: challengeId,
                        violations,
                        boundary_version: exports.FUTURE_SELF_BOUNDARY_VERSION,
                    },
                });
            });
        }
        catch {
            this.logger.warn('Could not record a Future Self boundary refusal.');
        }
    }
};
exports.FutureSelfService = FutureSelfService;
exports.FutureSelfService = FutureSelfService = FutureSelfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(future_self_port_1.FUTURE_SELF_ENGINE)),
    __param(1, (0, common_1.Inject)(plan_progress_port_1.PLAN_PROGRESS_PROVIDER)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_future_self_narrative_entity_1.ZunoFutureSelfNarrative)),
    __param(3, (0, typeorm_1.InjectRepository)(zuno_challenge_entity_1.ZunoChallenge)),
    __param(4, (0, typeorm_1.InjectRepository)(zuno_challenge_context_entity_1.ZunoChallengeContext)),
    __param(12, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, Object, typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        memory_service_1.MemoryService,
        safety_service_1.SafetyService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        clock_service_1.ClockService,
        typeorm_2.DataSource,
        rulebook_repository_service_1.RulebookRepositoryService])
], FutureSelfService);
function requestContextForMode(mode) {
    switch (mode) {
        case future_self_enum_1.FutureSelfMode.DAILY:
            return memory_enum_1.MemoryRequestContext.FUTURE_SELF_DAILY;
        case future_self_enum_1.FutureSelfMode.WEEKLY:
            return memory_enum_1.MemoryRequestContext.FUTURE_SELF_WEEKLY;
        case future_self_enum_1.FutureSelfMode.MILESTONE:
            return memory_enum_1.MemoryRequestContext.FUTURE_SELF_MILESTONE;
        case future_self_enum_1.FutureSelfMode.REALIGNMENT:
            return memory_enum_1.MemoryRequestContext.FUTURE_SELF_REALIGNMENT;
        case future_self_enum_1.FutureSelfMode.REFLECTION:
            return memory_enum_1.MemoryRequestContext.FUTURE_SELF_REFLECTION;
        default:
            return memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE;
    }
}
function deriveQueryTerms(challenge, context) {
    const text = [challenge?.title ?? '', context?.summary ?? ''].join(' ');
    return Array.from(new Set(text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 5 && !QUERY_STOPWORDS.has(token)))).slice(0, 12);
}
const QUERY_STOPWORDS = new Set([
    'about', 'after', 'again', 'because', 'before', 'being', 'between', 'could',
    'every', 'might', 'other', 'should', 'their', 'there', 'these', 'thing',
    'things', 'those', 'through', 'where', 'which', 'while', 'would', 'still',
    'something', 'someone', 'really', 'maybe',
]);
function toDateOnly(date) {
    return date.toISOString().slice(0, 10);
}
function splitRef(ref) {
    const index = ref.indexOf(':');
    if (index <= 0)
        return [null, null];
    return [ref.slice(0, index), ref.slice(index + 1)];
}
function unique(values) {
    return Array.from(new Set(values));
}
exports.FUTURE_SELF_DEFAULT_MEMORY_TYPES = [
    memory_enum_1.MemoryType.DECISION,
    memory_enum_1.MemoryType.PROGRESS,
    memory_enum_1.MemoryType.COMMITMENT,
    memory_enum_1.MemoryType.GOAL,
    memory_enum_1.MemoryType.CONSTRAINT,
    memory_enum_1.MemoryType.PREFERENCE,
    memory_enum_1.MemoryType.PATTERN,
    memory_enum_1.MemoryType.CHALLENGE,
    memory_enum_1.MemoryType.LIFE_EVENT,
];
//# sourceMappingURL=future-self.service.js.map