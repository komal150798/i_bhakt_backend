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
var ChallengeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_challenge_entity_1 = require("../entities/zuno-challenge.entity");
const zuno_challenge_context_entity_1 = require("../entities/zuno-challenge-context.entity");
const zuno_challenge_domain_entity_1 = require("../entities/zuno-challenge-domain.entity");
const zuno_response_entity_1 = require("../../responses/entities/zuno-response.entity");
const zuno_user_profile_entity_1 = require("../../identity/entities/zuno-user-profile.entity");
const whatnow_service_1 = require("../../whatnow/services/whatnow.service");
const response_composer_service_1 = require("../../responses/services/response-composer.service");
const safety_service_1 = require("../../safety/services/safety.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
let ChallengeService = ChallengeService_1 = class ChallengeService {
    constructor(challenges, contexts, responses, profiles, whatNow, composer, safety, outbox, audit, ownership, clock, dataSource) {
        this.challenges = challenges;
        this.contexts = contexts;
        this.responses = responses;
        this.profiles = profiles;
        this.whatNow = whatNow;
        this.composer = composer;
        this.safety = safety;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(ChallengeService_1.name);
    }
    async create(params) {
        const statement = params.statement.trim();
        if (statement.length === 0) {
            throw zuno_exception_1.ZunoException.validation([
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
                    aggregateType: enums_1.ZunoAggregateType.SAFETY_DECISION,
                    aggregateId: decision.id,
                    eventType: enums_1.ZunoEventType.SAFETY_CRITICAL_ESCALATION,
                    payload: {
                        safety_decision_id: decision.id,
                        user_id: params.user.id,
                        risk_level: assessment.riskLevel,
                    },
                });
                throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                    message: assessment.boundaryMessage ??
                        'I am not able to help with this here, and I would rather say so plainly.',
                    safety: {
                        disposition: assessment.disposition,
                        domain: assessment.domains[0],
                    },
                });
            }
            const now = this.clock.now();
            const challenge = manager.create(zuno_challenge_entity_1.ZunoChallenge, {
                user_id: params.user.id,
                title: null,
                raw_user_statement: statement,
                primary_domain: null,
                theme: null,
                status: enums_1.ChallengeStatus.NEW,
                mode: null,
                urgency: null,
                emotional_intensity: null,
                priority: null,
                context_version: 0,
                opened_at: now,
                resolved_at: null,
                resolution_note: null,
            });
            const saved = await manager.save(zuno_challenge_entity_1.ZunoChallenge, challenge);
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
                aggregateType: enums_1.ZunoAggregateType.CHALLENGE,
                aggregateId: saved.id,
                eventType: enums_1.ZunoEventType.CHALLENGE_CREATED,
                payload: { challenge_id: saved.id, user_id: params.user.id },
            });
            return saved;
        });
    }
    async analyze(user, challengeId) {
        const challenge = await this.findOwned(user.id, challengeId);
        if (challenge.status === enums_1.ChallengeStatus.ARCHIVED ||
            challenge.status === enums_1.ChallengeStatus.RESOLVED) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `cannot analyze a ${challenge.status} challenge`,
            });
        }
        const profile = await this.profiles.findOne({ where: { user_id: user.id } });
        const previous = await this.latestContext(challenge.id);
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
        const domains = [
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
                await this.safety.recordIncident(manager, {
                    userId: user.id,
                    safetyDecisionId: decision.id,
                    source: 'RESPONSE_POST_CHECK',
                    domain: analysis.primaryDomain,
                    severity: assessment.riskLevel,
                    violations: postCheck.violations,
                });
                this.logger.warn(`Post-check blocked a response for challenge ${challenge.id}: ${postCheck.violations.join(',')}`);
                throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                    message: 'I could not put this in a way I was comfortable sending. Let us try approaching it differently.',
                    safety: { disposition: assessment.disposition },
                });
            }
            const nextVersion = challenge.context_version + 1;
            const context = manager.create(zuno_challenge_context_entity_1.ZunoChallengeContext, {
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
            const savedContext = await manager.save(zuno_challenge_context_entity_1.ZunoChallengeContext, context);
            await manager.delete(zuno_challenge_domain_entity_1.ZunoChallengeDomain, { challenge_id: challenge.id });
            const domainRows = domains.map((domain) => manager.create(zuno_challenge_domain_entity_1.ZunoChallengeDomain, {
                challenge_id: challenge.id,
                user_id: user.id,
                domain,
                risk_class: analysis.domainRisk.get(domain) ??
                    assessment.riskLevel,
                is_primary: domain === analysis.primaryDomain,
                confidence: analysis.secondaryDomains
                    .find((entry) => entry.domain === domain)
                    ?.confidence?.toFixed(3) ??
                    (domain === analysis.primaryDomain
                        ? analysis.confidence.toFixed(3)
                        : null),
            }));
            await manager.save(zuno_challenge_domain_entity_1.ZunoChallengeDomain, domainRows);
            const previousStatus = challenge.status;
            const nextStatus = analysis.clarificationRequired
                ? enums_1.ChallengeStatus.UNDERSTANDING
                : enums_1.ChallengeStatus.ACTIVE;
            challenge.primary_domain = analysis.primaryDomain;
            challenge.theme = analysis.theme;
            challenge.title = analysis.title;
            challenge.urgency = analysis.urgency;
            challenge.emotional_intensity = analysis.emotionalIntensity;
            challenge.mode = analysis.mode;
            challenge.context_version = nextVersion;
            challenge.status = this.transition(challenge.status, nextStatus);
            const savedChallenge = await manager.save(zuno_challenge_entity_1.ZunoChallenge, challenge);
            const response = manager.create(zuno_response_entity_1.ZunoResponse, {
                user_id: user.id,
                challenge_id: challenge.id,
                conversation_id: null,
                response_type: analysis.clarificationRequired
                    ? enums_1.ResponseType.CONTEXT_VALIDATION
                    : enums_1.ResponseType.CONTEXT_VALIDATION,
                structured_payload: payload,
                rendered_text: null,
                context_version: nextVersion,
                model_version: null,
                prompt_version: analysis.extractorVersion,
                engine_version: response_composer_service_1.RESPONSE_COMPOSER_VERSION,
                rulebook_version_id: null,
                safety_decision_id: decision.id,
                redacted_at: null,
            });
            const savedResponse = await manager.save(zuno_response_entity_1.ZunoResponse, response);
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
                    aggregateType: enums_1.ZunoAggregateType.CHALLENGE,
                    aggregateId: challenge.id,
                    eventType: enums_1.ZunoEventType.CHALLENGE_ANALYZED,
                    payload: {
                        challenge_id: challenge.id,
                        user_id: user.id,
                        primary_domain: analysis.primaryDomain,
                        context_version: nextVersion,
                        clarification_required: analysis.clarificationRequired,
                    },
                },
                {
                    aggregateType: enums_1.ZunoAggregateType.RESPONSE,
                    aggregateId: savedResponse.id,
                    eventType: enums_1.ZunoEventType.RESPONSE_GENERATED,
                    payload: {
                        response_id: savedResponse.id,
                        challenge_id: challenge.id,
                        user_id: user.id,
                    },
                },
            ]);
            if (analysis.clarificationRequired) {
                await this.outbox.enqueue(manager, {
                    aggregateType: enums_1.ZunoAggregateType.CHALLENGE,
                    aggregateId: challenge.id,
                    eventType: enums_1.ZunoEventType.CLARIFICATION_REQUESTED,
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
    async handleBlockedAnalysis(user, challenge, assessment) {
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
                aggregateType: enums_1.ZunoAggregateType.SAFETY_DECISION,
                aggregateId: decision.id,
                eventType: enums_1.ZunoEventType.SAFETY_CRITICAL_ESCALATION,
                payload: {
                    safety_decision_id: decision.id,
                    challenge_id: challenge.id,
                    user_id: user.id,
                    risk_level: assessment.riskLevel,
                },
            });
        });
        throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
            message: assessment.boundaryMessage ??
                'I am not able to work through this one here, and I would rather say so plainly.',
            safety: {
                disposition: assessment.disposition,
                domain: assessment.domains[0],
            },
        });
    }
    async latestResponse(user, challengeId) {
        await this.findOwned(user.id, challengeId);
        const response = await this.responses.findOne({
            where: { challenge_id: challengeId, user_id: user.id },
            order: { created_at: 'DESC' },
        });
        if (!response) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.PROCESSING, {
                message: 'We have not worked through this one yet.',
                internalDetail: `no response for challenge ${challengeId}`,
            });
        }
        return response;
    }
    async list(params) {
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
    async findOwned(userId, challengeId) {
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
    async resolve(user, challengeId, note, expectedVersion) {
        const challenge = await this.findOwned(user.id, challengeId);
        this.ownership.assertVersion(challenge, expectedVersion);
        return this.dataSource.transaction(async (manager) => {
            const before = challenge.status;
            challenge.status = this.transition(before, enums_1.ChallengeStatus.RESOLVED);
            challenge.resolved_at = this.clock.now();
            challenge.resolution_note = note ?? null;
            const saved = await manager.save(zuno_challenge_entity_1.ZunoChallenge, challenge);
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
                aggregateType: enums_1.ZunoAggregateType.CHALLENGE,
                aggregateId: challenge.id,
                eventType: enums_1.ZunoEventType.CHALLENGE_RESOLVED,
                payload: { challenge_id: challenge.id, user_id: user.id },
            });
            return saved;
        });
    }
    async reopen(user, challengeId, expectedVersion) {
        const challenge = await this.findOwned(user.id, challengeId);
        this.ownership.assertVersion(challenge, expectedVersion);
        return this.dataSource.transaction(async (manager) => {
            const before = challenge.status;
            challenge.status = this.transition(before, enums_1.ChallengeStatus.ACTIVE);
            challenge.resolved_at = null;
            const saved = await manager.save(zuno_challenge_entity_1.ZunoChallenge, challenge);
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
                aggregateType: enums_1.ZunoAggregateType.CHALLENGE,
                aggregateId: challenge.id,
                eventType: enums_1.ZunoEventType.CHALLENGE_REOPENED,
                payload: { challenge_id: challenge.id, user_id: user.id },
            });
            return saved;
        });
    }
    transition(from, to) {
        if (from === to)
            return to;
        if (!(0, enums_1.canTransitionChallenge)(from, to)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `illegal challenge transition ${from} -> ${to}`,
            });
        }
        return to;
    }
};
exports.ChallengeService = ChallengeService;
exports.ChallengeService = ChallengeService = ChallengeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_challenge_entity_1.ZunoChallenge)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_challenge_context_entity_1.ZunoChallengeContext)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_response_entity_1.ZunoResponse)),
    __param(3, (0, typeorm_1.InjectRepository)(zuno_user_profile_entity_1.ZunoUserProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        whatnow_service_1.WhatNowService,
        response_composer_service_1.ResponseComposerService,
        safety_service_1.SafetyService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], ChallengeService);
function collectText(payload) {
    const parts = [payload.title];
    const walk = (value) => {
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
function encodeCursor(date) {
    return Buffer.from(date.toISOString()).toString('base64url');
}
function decodeCursor(cursor) {
    try {
        const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
        const date = new Date(decoded);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=challenge.service.js.map