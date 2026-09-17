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
var MemoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
exports.whyItMatters = whyItMatters;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_memory_entity_1 = require("../entities/zuno-memory.entity");
const zuno_memory_candidate_entity_1 = require("../entities/zuno-memory-candidate.entity");
const zuno_memory_evidence_entity_1 = require("../entities/zuno-memory-evidence.entity");
const zuno_memory_conflict_entity_1 = require("../entities/zuno-memory-conflict.entity");
const memory_enum_1 = require("../enums/memory.enum");
const memory_relevance_1 = require("../retrieval/memory-relevance");
const memory_policy_1 = require("./memory-policy");
const memory_events_1 = require("../events/memory-events");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const safety_service_1 = require("../../safety/services/safety.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const RETRIEVAL_FETCH_CAP = 400;
let MemoryService = MemoryService_1 = class MemoryService {
    constructor(memories, candidates, evidence, conflicts, safety, outbox, audit, ownership, clock, dataSource) {
        this.memories = memories;
        this.candidates = candidates;
        this.evidence = evidence;
        this.conflicts = conflicts;
        this.safety = safety;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(MemoryService_1.name);
    }
    async proposeCandidate(params) {
        const statement = (params.value?.statement ?? '').trim();
        const factuality = params.factuality ?? memory_enum_1.MemoryFactuality.FACT;
        const scope = params.challengeId != null ? memory_enum_1.MemoryScope.CHALLENGE : memory_enum_1.MemoryScope.GLOBAL;
        const assessment = this.safety.preCheck({
            operation: 'MEMORY_CANDIDATE',
            userId: params.userId,
            challengeId: params.challengeId ?? null,
            text: statement,
            domains: [],
        });
        if (assessment.blocked) {
            this.logger.warn(`Memory candidate refused by safety pre-check (risk=${assessment.riskLevel})`);
            return refusal(memory_enum_1.MemoryRejectionReason.SAFETY_BLOCKED);
        }
        const verdict = (0, memory_policy_1.assessWorthiness)({
            type: params.type,
            statement,
            evidenceType: params.evidenceType,
            confidence: params.confidence,
            factuality,
            evidenceCount: params.evidenceCount ?? params.evidence?.length ?? 0,
        });
        if ((0, memory_policy_1.isUnworthy)(verdict)) {
            this.logger.debug(`Memory candidate refused: ${verdict.reason}`);
            return refusal(verdict.reason);
        }
        if (params.sourceEventId) {
            const existing = await this.memories.findOne({
                where: {
                    user_id: params.userId,
                    memory_key: params.key,
                    source_event_id: params.sourceEventId,
                    status: memory_enum_1.MemoryStatus.ACTIVE,
                },
            });
            if (existing) {
                return {
                    candidate: null,
                    memory: existing,
                    rejectedReason: null,
                    confirmationReason: null,
                    merged: true,
                };
            }
        }
        const sensitivity = (0, memory_policy_1.classifySensitivity)(params.type, statement);
        const retention = params.retentionClass ?? (0, memory_policy_1.defaultRetention)(params.type, factuality);
        const incumbent = await this.findActiveByKey(params.userId, params.key, params.challengeId ?? null);
        if (incumbent &&
            incumbent.memory_value?.statement?.trim().toLowerCase() ===
                statement.toLowerCase()) {
            const merged = await this.recordConfirmation(incumbent, params.confidence, params.evidence);
            return {
                candidate: null,
                memory: merged,
                rejectedReason: null,
                confirmationReason: null,
                merged: true,
            };
        }
        const conflictsWithActive = incumbent != null &&
            (0, memory_policy_1.contradicts)({ memory_key: incumbent.memory_key, factuality: incumbent.factuality }, { memory_key: params.key, factuality });
        const confirmation = (0, memory_policy_1.confirmationRequirement)({
            evidenceType: params.evidenceType,
            confidence: params.confidence,
            sensitivity,
            type: params.type,
            conflictsWithActive,
            source: params.source,
        });
        return this.dataSource.transaction(async (manager) => {
            const now = this.clock.now();
            const candidate = manager.create(zuno_memory_candidate_entity_1.ZunoMemoryCandidate, {
                user_id: params.userId,
                challenge_id: params.challengeId ?? null,
                scope,
                memory_type: params.type,
                memory_key: params.key,
                proposed_value: { ...params.value, statement },
                factuality,
                source: params.source,
                source_event_id: params.sourceEventId ?? null,
                evidence_type: params.evidenceType,
                confidence: clampConfidence(params.confidence),
                suggested_retention: retention,
                sensitivity_class: sensitivity,
                status: confirmation
                    ? memory_enum_1.MemoryCandidateStatus.AWAITING_CONFIRMATION
                    : memory_enum_1.MemoryCandidateStatus.ACCEPTED,
                confirmation_required: confirmation !== null,
                confirmation_reason: confirmation,
                rejection_reason: null,
                resulting_memory_id: null,
                decided_at: confirmation ? null : now,
            });
            const savedCandidate = await manager.save(zuno_memory_candidate_entity_1.ZunoMemoryCandidate, candidate);
            await this.outbox.enqueue(manager, {
                aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY_CANDIDATE),
                aggregateId: savedCandidate.id,
                eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.CANDIDATE_CREATED),
                payload: {
                    candidate_id: savedCandidate.id,
                    user_id: params.userId,
                    memory_type: params.type,
                    confirmation_required: confirmation !== null,
                },
            });
            if (conflictsWithActive && incumbent) {
                await this.recordConflict(manager, {
                    userId: params.userId,
                    incumbent,
                    incomingSource: params.source,
                });
            }
            if (confirmation) {
                this.logger.debug(`Memory candidate ${savedCandidate.id} awaiting confirmation: ${confirmation}`);
                return {
                    candidate: savedCandidate,
                    memory: null,
                    rejectedReason: null,
                    confirmationReason: confirmation,
                    merged: false,
                };
            }
            const memory = await this.writeMemory(manager, {
                candidate: savedCandidate,
                retention,
                incumbent,
                now,
            });
            savedCandidate.resulting_memory_id = memory.id;
            savedCandidate.proposed_value = null;
            await manager.save(zuno_memory_candidate_entity_1.ZunoMemoryCandidate, savedCandidate);
            return {
                candidate: savedCandidate,
                memory,
                rejectedReason: null,
                confirmationReason: null,
                merged: false,
            };
        });
    }
    async confirmCandidate(userId, candidateId) {
        const candidate = await this.candidates.findOne({
            where: { id: candidateId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        const owned = this.ownership.require(candidate, userId, 'memory candidate');
        if (owned.status !== memory_enum_1.MemoryCandidateStatus.AWAITING_CONFIRMATION) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `candidate ${candidateId} is ${owned.status}, not awaiting confirmation`,
            });
        }
        if (!owned.proposed_value) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `candidate ${candidateId} has no proposed value to confirm`,
            });
        }
        const incumbent = await this.findActiveByKey(userId, owned.memory_key, owned.challenge_id);
        return this.dataSource.transaction(async (manager) => {
            const now = this.clock.now();
            owned.evidence_type = memory_enum_1.MemoryEvidenceType.EXPLICIT;
            owned.source = memory_enum_1.MemorySource.USER_EXPLICIT;
            owned.status = memory_enum_1.MemoryCandidateStatus.ACCEPTED;
            owned.decided_at = now;
            const memory = await this.writeMemory(manager, {
                candidate: owned,
                retention: owned.suggested_retention,
                incumbent,
                now,
            });
            owned.resulting_memory_id = memory.id;
            owned.proposed_value = null;
            await manager.save(zuno_memory_candidate_entity_1.ZunoMemoryCandidate, owned);
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: userId,
                userId,
                action: 'MEMORY_CANDIDATE_CONFIRMED',
                entityType: 'ZunoMemoryCandidate',
                entityId: owned.id,
                after: { memory_id: memory.id },
            });
            return memory;
        });
    }
    async rejectCandidate(userId, candidateId, reason = memory_enum_1.MemoryRejectionReason.USER_REJECTED) {
        const candidate = await this.candidates.findOne({
            where: { id: candidateId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        const owned = this.ownership.require(candidate, userId, 'memory candidate');
        return this.dataSource.transaction(async (manager) => {
            owned.status = memory_enum_1.MemoryCandidateStatus.REJECTED;
            owned.rejection_reason = reason;
            owned.decided_at = this.clock.now();
            owned.proposed_value = null;
            const saved = await manager.save(zuno_memory_candidate_entity_1.ZunoMemoryCandidate, owned);
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: userId,
                userId,
                action: 'MEMORY_CANDIDATE_REJECTED',
                entityType: 'ZunoMemoryCandidate',
                entityId: owned.id,
                metadata: { reason },
            });
            return saved;
        });
    }
    async retrieve(params) {
        const rows = await this.memories.find({
            where: {
                user_id: params.userId,
                status: memory_enum_1.MemoryStatus.ACTIVE,
                deleted_at: (0, typeorm_2.IsNull)(),
                redacted_at: (0, typeorm_2.IsNull)(),
            },
            order: { last_confirmed_at: 'DESC' },
            take: RETRIEVAL_FETCH_CAP,
        });
        return (0, memory_relevance_1.selectRelevantMemories)(rows, {
            ...params,
            now: params.now ?? this.clock.now(),
        });
    }
    async summaryForUser(userId) {
        const rows = await this.memories.find({
            where: {
                user_id: userId,
                status: memory_enum_1.MemoryStatus.ACTIVE,
                deleted_at: (0, typeorm_2.IsNull)(),
                redacted_at: (0, typeorm_2.IsNull)(),
            },
            order: { memory_type: 'ASC', last_confirmed_at: 'DESC' },
        });
        const groups = new Map();
        for (const row of rows) {
            if (!groups.has(row.memory_type)) {
                groups.set(row.memory_type, {
                    type: row.memory_type,
                    label: humanTypeLabel(row.memory_type),
                    items: [],
                });
            }
            groups.get(row.memory_type).items.push({
                id: row.id,
                statement: row.memory_value?.statement ?? '',
                scope: row.scope,
                challengeId: row.challenge_id,
                why: whyItMatters(row),
                lastConfirmedAt: row.last_confirmed_at
                    ? row.last_confirmed_at.toISOString()
                    : null,
                expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
            });
        }
        return Array.from(groups.values());
    }
    async listForUser(userId, filters = {}) {
        return this.memories.find({
            where: {
                user_id: userId,
                status: memory_enum_1.MemoryStatus.ACTIVE,
                deleted_at: (0, typeorm_2.IsNull)(),
                redacted_at: (0, typeorm_2.IsNull)(),
                ...(filters.type ? { memory_type: filters.type } : {}),
                ...(filters.challengeId ? { challenge_id: filters.challengeId } : {}),
                ...(filters.scope ? { scope: filters.scope } : {}),
            },
            order: { last_confirmed_at: 'DESC' },
        });
    }
    async pendingCandidates(userId) {
        return this.candidates.find({
            where: {
                user_id: userId,
                status: memory_enum_1.MemoryCandidateStatus.AWAITING_CONFIRMATION,
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }
    async findOwned(userId, memoryId) {
        const memory = await this.memories.findOne({
            where: { id: memoryId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(memory, userId, 'memory');
    }
    async correct(params) {
        const existing = await this.findOwned(params.userId, params.memoryId);
        this.ownership.assertVersion(existing, params.expectedVersion);
        if (existing.status !== memory_enum_1.MemoryStatus.ACTIVE) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `cannot correct a ${existing.status} memory`,
            });
        }
        const statement = (params.statement ?? '').trim();
        if (statement.length === 0) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'statement', code: 'REQUIRED' }]);
        }
        const assessment = this.safety.preCheck({
            operation: 'MEMORY_CORRECT',
            userId: params.userId,
            challengeId: existing.challenge_id,
            text: statement,
            domains: [],
        });
        if (assessment.blocked) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                message: assessment.boundaryMessage ??
                    'I am not able to store that here, and I would rather say so plainly.',
                safety: { disposition: assessment.disposition },
            });
        }
        return this.dataSource.transaction(async (manager) => {
            const now = this.clock.now();
            const value = {
                ...existing.memory_value,
                statement,
                label: params.label ?? existing.memory_value?.label,
            };
            const corrected = manager.create(zuno_memory_entity_1.ZunoMemory, {
                user_id: existing.user_id,
                challenge_id: existing.challenge_id,
                scope: existing.scope,
                memory_type: existing.memory_type,
                memory_key: existing.memory_key,
                memory_value: value,
                factuality: existing.factuality,
                source: memory_enum_1.MemorySource.USER_CORRECTION,
                source_event_id: null,
                evidence_type: memory_enum_1.MemoryEvidenceType.EXPLICIT,
                confidence: '1.000',
                retention_class: existing.retention_class,
                sensitivity_class: (0, memory_policy_1.classifySensitivity)(existing.memory_type, statement),
                status: memory_enum_1.MemoryStatus.ACTIVE,
                last_confirmed_at: now,
                confirmation_count: 1,
                expires_at: null,
                supersedes_memory_id: existing.id,
                superseded_by_memory_id: null,
                superseded_at: null,
                redacted_at: null,
                deletion_reason: null,
            });
            const saved = await manager.save(zuno_memory_entity_1.ZunoMemory, corrected);
            await this.markSuperseded(manager, existing, saved, now);
            await this.evidenceRow(manager, {
                memoryId: saved.id,
                sourceEntityType: 'ZunoMemory',
                sourceEntityId: existing.id,
                role: memory_enum_1.MemoryEvidenceRole.ORIGIN,
                observedAt: now,
            });
            const conflict = manager.create(zuno_memory_conflict_entity_1.ZunoMemoryConflict, {
                user_id: existing.user_id,
                memory_a_id: existing.id,
                memory_b_id: saved.id,
                resolution_status: memory_enum_1.MemoryConflictResolution.RESOLVED_BY_USER,
                resolved_memory_id: saved.id,
                authority_a: memory_enum_1.MEMORY_SOURCE_AUTHORITY[existing.source] ?? 40,
                authority_b: memory_enum_1.MEMORY_SOURCE_AUTHORITY[memory_enum_1.MemorySource.USER_CORRECTION],
                resolved_at: now,
            });
            await manager.save(zuno_memory_conflict_entity_1.ZunoMemoryConflict, conflict);
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: params.userId,
                userId: params.userId,
                action: 'MEMORY_CORRECTED',
                entityType: 'ZunoMemory',
                entityId: saved.id,
                before: { memory_id: existing.id, status: memory_enum_1.MemoryStatus.ACTIVE },
                after: { memory_id: saved.id, supersedes: existing.id },
            });
            await this.outbox.enqueueMany(manager, [
                {
                    aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY),
                    aggregateId: saved.id,
                    eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.CORRECTED),
                    payload: {
                        memory_id: saved.id,
                        superseded_memory_id: existing.id,
                        user_id: params.userId,
                        memory_type: saved.memory_type,
                    },
                },
                {
                    aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY),
                    aggregateId: existing.id,
                    eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.SUPERSEDED),
                    payload: {
                        memory_id: existing.id,
                        superseded_by_memory_id: saved.id,
                        user_id: params.userId,
                    },
                },
            ]);
            return saved;
        });
    }
    async supersede(manager, incumbent, replacement, now) {
        const incumbentAuthority = memory_enum_1.MEMORY_SOURCE_AUTHORITY[incumbent.source] ?? 40;
        const incomingAuthority = memory_enum_1.MEMORY_SOURCE_AUTHORITY[replacement.source] ?? 40;
        if (incomingAuthority < incumbentAuthority) {
            await this.recordConflict(manager, {
                userId: incumbent.user_id,
                incumbent,
                incomingSource: replacement.source,
                challengerId: replacement.id,
            });
            return { superseded: false };
        }
        await this.markSuperseded(manager, incumbent, replacement, now);
        await this.outbox.enqueue(manager, {
            aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY),
            aggregateId: incumbent.id,
            eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.SUPERSEDED),
            payload: {
                memory_id: incumbent.id,
                superseded_by_memory_id: replacement.id,
                user_id: incumbent.user_id,
            },
        });
        return { superseded: true };
    }
    async supersessionChain(userId, memoryId) {
        const chain = [];
        let current = await this.findOwned(userId, memoryId);
        const seen = new Set();
        while (current) {
            if (seen.has(current.id))
                break;
            seen.add(current.id);
            chain.push(current);
            if (!current.supersedes_memory_id)
                break;
            current = await this.memories.findOne({
                where: { id: current.supersedes_memory_id, user_id: userId },
            });
        }
        return chain;
    }
    async expireDue(options = {}) {
        const now = options.now ?? this.clock.now();
        const due = await this.memories.find({
            where: {
                ...(options.userId ? { user_id: options.userId } : {}),
                status: memory_enum_1.MemoryStatus.ACTIVE,
                expires_at: (0, typeorm_2.LessThanOrEqual)(now),
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            take: 500,
        });
        if (due.length === 0)
            return 0;
        return this.dataSource.transaction(async (manager) => {
            for (const memory of due) {
                memory.status = memory_enum_1.MemoryStatus.EXPIRED;
                await manager.save(zuno_memory_entity_1.ZunoMemory, memory);
                await this.outbox.enqueue(manager, {
                    aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY),
                    aggregateId: memory.id,
                    eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.EXPIRED),
                    payload: {
                        memory_id: memory.id,
                        user_id: memory.user_id,
                        memory_type: memory.memory_type,
                    },
                });
            }
            return due.length;
        });
    }
    async closeChallengeMemory(userId, challengeId) {
        const rows = await this.memories.find({
            where: {
                user_id: userId,
                challenge_id: challengeId,
                status: memory_enum_1.MemoryStatus.ACTIVE,
                retention_class: memory_enum_1.MemoryRetentionClass.CHALLENGE_LIFETIME,
                deleted_at: (0, typeorm_2.IsNull)(),
            },
        });
        if (rows.length === 0)
            return 0;
        return this.dataSource.transaction(async (manager) => {
            const now = this.clock.now();
            for (const memory of rows) {
                memory.status = memory_enum_1.MemoryStatus.EXPIRED;
                memory.expires_at = now;
                await manager.save(zuno_memory_entity_1.ZunoMemory, memory);
                await this.outbox.enqueue(manager, {
                    aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY),
                    aggregateId: memory.id,
                    eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.EXPIRED),
                    payload: {
                        memory_id: memory.id,
                        user_id: userId,
                        challenge_id: challengeId,
                        reason: 'CHALLENGE_CLOSED',
                    },
                });
            }
            return rows.length;
        });
    }
    async deleteMemory(userId, memoryId, reason = 'USER_REQUESTED') {
        const memory = await this.findOwned(userId, memoryId);
        await this.dataSource.transaction(async (manager) => {
            const now = this.clock.now();
            const beforeStatus = memory.status;
            memory.status = memory_enum_1.MemoryStatus.DELETED;
            memory.redacted_at = now;
            memory.deleted_at = now;
            memory.deletion_reason = reason;
            memory.memory_value = { statement: '', label: memory.memory_value?.label };
            memory.expires_at = now;
            await manager.save(zuno_memory_entity_1.ZunoMemory, memory);
            const relatedCandidates = await manager.find(zuno_memory_candidate_entity_1.ZunoMemoryCandidate, {
                where: [
                    { resulting_memory_id: memory.id },
                    {
                        user_id: userId,
                        memory_key: memory.memory_key,
                        status: memory_enum_1.MemoryCandidateStatus.AWAITING_CONFIRMATION,
                    },
                ],
            });
            for (const candidate of relatedCandidates) {
                candidate.proposed_value = null;
                if (candidate.status === memory_enum_1.MemoryCandidateStatus.AWAITING_CONFIRMATION) {
                    candidate.status = memory_enum_1.MemoryCandidateStatus.REJECTED;
                    candidate.rejection_reason = memory_enum_1.MemoryRejectionReason.USER_REJECTED;
                    candidate.decided_at = now;
                }
                await manager.save(zuno_memory_candidate_entity_1.ZunoMemoryCandidate, candidate);
            }
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: userId,
                userId,
                action: 'MEMORY_DELETED',
                entityType: 'ZunoMemory',
                entityId: memory.id,
                before: { status: beforeStatus },
                after: { status: memory_enum_1.MemoryStatus.DELETED },
                metadata: { reason, memory_type: memory.memory_type },
            });
            await this.outbox.enqueue(manager, {
                aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY),
                aggregateId: memory.id,
                eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.DELETED),
                payload: {
                    memory_id: memory.id,
                    user_id: userId,
                    memory_type: memory.memory_type,
                    reason,
                    invalidate_downstream: true,
                },
            });
        });
    }
    async deleteChallengeMemory(userId, challengeId) {
        const rows = await this.memories.find({
            where: {
                user_id: userId,
                challenge_id: challengeId,
                status: memory_enum_1.MemoryStatus.ACTIVE,
                deleted_at: (0, typeorm_2.IsNull)(),
            },
        });
        for (const row of rows) {
            await this.deleteMemory(userId, row.id, 'USER_CLEARED_CHALLENGE');
        }
        return rows.length;
    }
    async writeMemory(manager, params) {
        const { candidate, retention, incumbent, now } = params;
        const expiryDays = (0, memory_policy_1.defaultExpiryDays)(retention);
        const memory = manager.create(zuno_memory_entity_1.ZunoMemory, {
            user_id: candidate.user_id,
            challenge_id: candidate.challenge_id,
            scope: candidate.scope,
            memory_type: candidate.memory_type,
            memory_key: candidate.memory_key,
            memory_value: candidate.proposed_value,
            factuality: candidate.factuality,
            source: candidate.source,
            source_event_id: candidate.source_event_id,
            evidence_type: candidate.evidence_type,
            confidence: candidate.confidence,
            retention_class: retention,
            sensitivity_class: candidate.sensitivity_class,
            status: memory_enum_1.MemoryStatus.ACTIVE,
            last_confirmed_at: now,
            confirmation_count: 1,
            expires_at: expiryDays === null
                ? null
                : new Date(now.getTime() + expiryDays * 86_400_000),
            supersedes_memory_id: incumbent ? incumbent.id : null,
            superseded_by_memory_id: null,
            superseded_at: null,
            redacted_at: null,
            deletion_reason: null,
        });
        const saved = await manager.save(zuno_memory_entity_1.ZunoMemory, memory);
        if (incumbent) {
            await this.supersede(manager, incumbent, saved, now);
        }
        await this.evidenceRow(manager, {
            memoryId: saved.id,
            sourceEntityType: 'ZunoMemoryCandidate',
            sourceEntityId: candidate.id,
            role: memory_enum_1.MemoryEvidenceRole.ORIGIN,
            observedAt: now,
        });
        await this.audit.record(manager, {
            actorType: candidate.source === memory_enum_1.MemorySource.USER_EXPLICIT ? 'USER' : 'SYSTEM',
            actorId: candidate.user_id,
            userId: candidate.user_id,
            action: 'MEMORY_CREATED',
            entityType: 'ZunoMemory',
            entityId: saved.id,
            after: { memory_type: saved.memory_type, status: saved.status },
        });
        await this.outbox.enqueue(manager, {
            aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY),
            aggregateId: saved.id,
            eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.CREATED),
            payload: {
                memory_id: saved.id,
                user_id: saved.user_id,
                memory_type: saved.memory_type,
                challenge_id: saved.challenge_id,
                retention_class: saved.retention_class,
            },
        });
        return saved;
    }
    async markSuperseded(manager, incumbent, replacement, now) {
        incumbent.status = memory_enum_1.MemoryStatus.SUPERSEDED;
        incumbent.superseded_by_memory_id = replacement.id;
        incumbent.superseded_at = now;
        await manager.save(zuno_memory_entity_1.ZunoMemory, incumbent);
    }
    async recordConfirmation(memory, observedConfidence, evidence) {
        return this.dataSource.transaction(async (manager) => {
            const now = this.clock.now();
            const current = Number.parseFloat(memory.confidence) || 0;
            const blended = Math.min(1, Math.max(current, clampNumber(observedConfidence)) + 0.02);
            memory.confidence = blended.toFixed(3);
            memory.last_confirmed_at = now;
            memory.confirmation_count = (memory.confirmation_count ?? 1) + 1;
            const saved = await manager.save(zuno_memory_entity_1.ZunoMemory, memory);
            for (const entry of evidence ?? []) {
                await this.evidenceRow(manager, {
                    memoryId: saved.id,
                    sourceEntityType: entry.sourceEntityType,
                    sourceEntityId: entry.sourceEntityId,
                    role: entry.role ?? memory_enum_1.MemoryEvidenceRole.CONFIRMATION,
                    observedAt: entry.observedAt ?? now,
                });
            }
            await this.outbox.enqueue(manager, {
                aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY),
                aggregateId: saved.id,
                eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.UPDATED),
                payload: {
                    memory_id: saved.id,
                    user_id: saved.user_id,
                    confirmation_count: saved.confirmation_count,
                },
            });
            return saved;
        });
    }
    async evidenceRow(manager, params) {
        const row = manager.create(zuno_memory_evidence_entity_1.ZunoMemoryEvidence, {
            memory_id: params.memoryId,
            source_entity_type: params.sourceEntityType,
            source_entity_id: params.sourceEntityId,
            evidence_role: params.role,
            observed_at: params.observedAt,
            redacted_at: null,
        });
        await manager.save(zuno_memory_evidence_entity_1.ZunoMemoryEvidence, row);
    }
    async recordConflict(manager, params) {
        const row = manager.create(zuno_memory_conflict_entity_1.ZunoMemoryConflict, {
            user_id: params.userId,
            memory_a_id: params.incumbent.id,
            memory_b_id: params.challengerId ?? params.incumbent.id,
            resolution_status: memory_enum_1.MemoryConflictResolution.UNRESOLVED,
            resolved_memory_id: null,
            authority_a: memory_enum_1.MEMORY_SOURCE_AUTHORITY[params.incumbent.source] ?? 40,
            authority_b: memory_enum_1.MEMORY_SOURCE_AUTHORITY[params.incomingSource] ?? 40,
            resolved_at: null,
        });
        await manager.save(zuno_memory_conflict_entity_1.ZunoMemoryConflict, row);
        await this.outbox.enqueue(manager, {
            aggregateType: (0, memory_events_1.asAggregateType)(memory_events_1.MemoryAggregateType.MEMORY),
            aggregateId: params.incumbent.id,
            eventType: (0, memory_events_1.asEventType)(memory_events_1.MemoryEventType.CONFLICT_DETECTED),
            payload: {
                user_id: params.userId,
                incumbent_memory_id: params.incumbent.id,
                incoming_source: params.incomingSource,
            },
        });
    }
    async findActiveByKey(userId, key, challengeId) {
        return this.memories.findOne({
            where: {
                user_id: userId,
                memory_key: key,
                challenge_id: challengeId === null ? (0, typeorm_2.IsNull)() : challengeId,
                status: memory_enum_1.MemoryStatus.ACTIVE,
                deleted_at: (0, typeorm_2.IsNull)(),
            },
        });
    }
    async countByStatus(userId, statuses) {
        return this.memories.count({
            where: { user_id: userId, status: (0, typeorm_2.In)(statuses) },
        });
    }
};
exports.MemoryService = MemoryService;
exports.MemoryService = MemoryService = MemoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_memory_entity_1.ZunoMemory)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_memory_candidate_entity_1.ZunoMemoryCandidate)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_memory_evidence_entity_1.ZunoMemoryEvidence)),
    __param(3, (0, typeorm_1.InjectRepository)(zuno_memory_conflict_entity_1.ZunoMemoryConflict)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        safety_service_1.SafetyService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], MemoryService);
function refusal(reason) {
    return {
        candidate: null,
        memory: null,
        rejectedReason: reason,
        confirmationReason: null,
        merged: false,
    };
}
function clampConfidence(value) {
    return clampNumber(value).toFixed(3);
}
function clampNumber(value) {
    if (!Number.isFinite(value))
        return 0.5;
    if (value < 0)
        return 0;
    if (value > 1)
        return 1;
    return value;
}
function humanTypeLabel(type) {
    const labels = {
        [memory_enum_1.MemoryType.PROFILE]: 'About you',
        [memory_enum_1.MemoryType.PREFERENCE]: 'How you like to be helped',
        [memory_enum_1.MemoryType.GOAL]: 'What you are working towards',
        [memory_enum_1.MemoryType.CHALLENGE]: 'What you are facing',
        [memory_enum_1.MemoryType.CONSTRAINT]: 'What limits your options',
        [memory_enum_1.MemoryType.DECISION]: 'Decisions you have made',
        [memory_enum_1.MemoryType.COMMITMENT]: 'What you said you would do',
        [memory_enum_1.MemoryType.PLAN_CONTEXT]: 'Your plan',
        [memory_enum_1.MemoryType.PROGRESS]: 'What you have done',
        [memory_enum_1.MemoryType.LIFE_EVENT]: 'Things that changed',
        [memory_enum_1.MemoryType.PATTERN]: 'What tends to work for you',
        [memory_enum_1.MemoryType.USER_CORRECTION]: 'Corrections you made',
        [memory_enum_1.MemoryType.ASTRO_CONTEXT_REFERENCE]: 'Timing context',
        [memory_enum_1.MemoryType.FUTURE_SELF_NARRATIVE]: 'Your story so far',
        [memory_enum_1.MemoryType.TEMPORARY_CONTEXT]: 'Right now',
    };
    return labels[type] ?? 'Other';
}
function whyItMatters(memory) {
    switch (memory.retention_class) {
        case memory_enum_1.MemoryRetentionClass.USER_PINNED:
            return 'You asked ZUNO to keep this.';
        case memory_enum_1.MemoryRetentionClass.UNTIL_SUPERSEDED:
            return 'Kept until you tell ZUNO it has changed.';
        case memory_enum_1.MemoryRetentionClass.CHALLENGE_LIFETIME:
            return 'Kept while you are working through this situation.';
        case memory_enum_1.MemoryRetentionClass.LONG_TERM:
            return 'Kept because it shapes guidance over time.';
        case memory_enum_1.MemoryRetentionClass.SHORT_TERM:
            return 'Kept briefly, then forgotten automatically.';
        case memory_enum_1.MemoryRetentionClass.SESSION:
            return 'Kept only for this conversation.';
        default:
            return 'Used to keep ZUNO consistent with what you have said.';
    }
}
//# sourceMappingURL=memory.service.js.map