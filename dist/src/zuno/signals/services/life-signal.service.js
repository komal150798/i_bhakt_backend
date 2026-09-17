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
var LifeSignalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifeSignalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_life_signal_entity_1 = require("../entities/zuno-life-signal.entity");
const zuno_life_signal_source_entity_1 = require("../entities/zuno-life-signal-source.entity");
const zuno_life_signal_confirmation_entity_1 = require("../entities/zuno-life-signal-confirmation.entity");
const zuno_life_signal_impact_entity_1 = require("../entities/zuno-life-signal-impact.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const safety_service_1 = require("../../safety/services/safety.service");
const rulebook_repository_service_1 = require("../../rulebook/services/rulebook-repository.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../enums");
const signal_classifier_service_1 = require("./signal-classifier.service");
let LifeSignalService = LifeSignalService_1 = class LifeSignalService {
    constructor(signals, challenges, classifier, safety, rulebook, outbox, audit, ownership, clock, dataSource) {
        this.signals = signals;
        this.challenges = challenges;
        this.classifier = classifier;
        this.safety = safety;
        this.rulebook = rulebook;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(LifeSignalService_1.name);
    }
    async record(params) {
        const statement = params.statement.trim();
        if (statement.length === 0) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'statement', code: 'REQUIRED' }]);
        }
        const source = params.source ?? enums_1.LifeSignalSource.USER_EXPLICIT;
        if (!enums_1.ACCEPTED_LIFE_SIGNAL_SOURCES.includes(source)) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'source', code: 'SOURCE_NOT_ENABLED' }], 'This kind of update is not connected yet.');
        }
        const challenge = params.challengeId
            ? await this.findOwnedChallenge(params.user.id, params.challengeId)
            : null;
        const assessment = this.safety.preCheck({
            operation: 'LIFE_SIGNAL_RECORD',
            userId: params.user.id,
            challengeId: challenge?.id ?? null,
            text: statement,
            domains: challenge?.primary_domain ? [challenge.primary_domain] : [],
        });
        if (assessment.blocked) {
            await this.dataSource.transaction(async (manager) => {
                const decision = await this.safety.recordDecision(manager, {
                    userId: params.user.id,
                    challengeId: challenge?.id ?? null,
                    operation: 'LIFE_SIGNAL_RECORD',
                    assessment,
                });
                await this.safety.recordIncident(manager, {
                    userId: params.user.id,
                    safetyDecisionId: decision.id,
                    source: 'LIFE_SIGNAL_PRECHECK',
                    domain: assessment.domains[0] ?? null,
                    severity: assessment.riskLevel,
                    violations: [],
                });
            });
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                message: assessment.boundaryMessage ??
                    'I would rather not carry on with this here, and I want to say so plainly.',
                safety: {
                    disposition: assessment.disposition,
                    domain: assessment.domains[0],
                },
            });
        }
        const now = this.clock.now();
        const classification = this.classifier.classify({
            statement,
            declaredType: params.signalType ?? null,
            source,
            origin: params.origin ?? enums_1.LifeSignalOrigin.USER_MESSAGE,
            domain: challenge?.primary_domain ?? null,
            challengeDomains: challenge?.primary_domain ? [challenge.primary_domain] : [],
            occurredAt: params.occurredAt ?? null,
            detectedAt: now,
        });
        if (!classification.isCandidateSignal) {
            return {
                signal: null,
                ignoredAsNoise: true,
                noiseReason: classification.noiseReason,
                deduplicated: false,
                realignmentRecommended: false,
                clarificationRequired: false,
                interpretationUnavailable: false,
            };
        }
        let rulebookVersionId = null;
        let interpretationUnavailable = false;
        if (classification.requiresRulebook) {
            const active = await this.rulebook.getActive();
            if (active) {
                rulebookVersionId = active.versionId;
            }
            else {
                interpretationUnavailable = true;
                this.logger.log('Astro timing signal stored without interpretation: no active Rulebook (fail-closed).');
            }
        }
        const existing = await this.signals.findOne({
            where: {
                user_id: params.user.id,
                challenge_id: challenge?.id ?? (0, typeorm_2.IsNull)(),
                fingerprint: classification.fingerprint,
                status: (0, typeorm_2.Not)((0, typeorm_2.In)([enums_1.LifeSignalStatus.ARCHIVED, enums_1.LifeSignalStatus.DISMISSED])),
            },
            order: { detected_at: 'DESC' },
        });
        if (existing) {
            const corroborated = await this.dataSource.transaction(async (manager) => this.appendSource(manager, existing, {
                statement,
                source,
                origin: params.origin ?? enums_1.LifeSignalOrigin.USER_MESSAGE,
                reliability: classification.reliability,
                sourceEventId: params.sourceEventId ?? null,
                observedAt: now,
            }));
            return {
                signal: corroborated,
                ignoredAsNoise: false,
                noiseReason: null,
                deduplicated: true,
                realignmentRecommended: corroborated.realignment_required,
                clarificationRequired: corroborated.clarification_required,
                interpretationUnavailable,
            };
        }
        const confirmationStatus = this.initialConfirmationStatus(source, classification);
        const saved = await this.dataSource.transaction(async (manager) => {
            const decision = await this.safety.recordDecision(manager, {
                userId: params.user.id,
                challengeId: challenge?.id ?? null,
                operation: 'LIFE_SIGNAL_RECORD',
                assessment,
            });
            const signal = manager.create(zuno_life_signal_entity_1.ZunoLifeSignal, {
                user_id: params.user.id,
                challenge_id: challenge?.id ?? null,
                signal_type: classification.signalType,
                source,
                nature: classification.nature,
                domain: challenge?.primary_domain ?? null,
                raw_value: { statement },
                normalized_value: {
                    normalized_event: classification.normalizedEvent,
                    detector_version: signal_classifier_service_1.SIGNAL_DETECTOR_VERSION,
                },
                confidence: classification.confidence.toFixed(3),
                reliability: classification.reliability,
                confirmation_status: confirmationStatus,
                materiality: classification.materiality,
                relevance: classification.relevance,
                urgency_change: classification.urgencyChange,
                status: enums_1.LifeSignalStatus.CANDIDATE,
                is_inference: classification.isInference,
                clarification_required: classification.clarificationRequired,
                realignment_required: false,
                reason_codes: classification.reasonCodes,
                fingerprint: classification.fingerprint,
                supersedes_signal_id: null,
                occurred_at: params.occurredAt ?? null,
                detected_at: now,
                processed_at: now,
                stale_after: classification.staleAfter,
                rulebook_version_id: rulebookVersionId,
                detector_version: signal_classifier_service_1.SIGNAL_DETECTOR_VERSION,
                safety_decision_id: decision.id,
            });
            const row = await manager.save(zuno_life_signal_entity_1.ZunoLifeSignal, signal);
            await this.appendSource(manager, row, {
                statement,
                source,
                origin: params.origin ?? enums_1.LifeSignalOrigin.USER_MESSAGE,
                reliability: classification.reliability,
                sourceEventId: params.sourceEventId ?? null,
                observedAt: now,
            });
            await manager.save(zuno_life_signal_confirmation_entity_1.ZunoLifeSignalConfirmation, manager.create(zuno_life_signal_confirmation_entity_1.ZunoLifeSignalConfirmation, {
                life_signal_id: row.id,
                user_id: params.user.id,
                from_status: enums_1.SignalConfirmationStatus.UNCONFIRMED,
                to_status: confirmationStatus,
                actor_type: source === enums_1.LifeSignalSource.USER_EXPLICIT
                    ? enums_1.SignalConfirmationActor.USER
                    : enums_1.SignalConfirmationActor.SYSTEM,
                actor_id: params.user.id,
                prompt_text: null,
                response_note: null,
                redacted_at: null,
            }));
            if ((0, enums_1.isConfirmedSignal)(confirmationStatus) &&
                source !== enums_1.LifeSignalSource.USER_EXPLICIT) {
                await this.activate(manager, row, params.user.id);
            }
            await this.audit.record(manager, {
                actorType: source === enums_1.LifeSignalSource.USER_EXPLICIT ? 'USER' : 'SYSTEM',
                actorId: params.user.id,
                userId: params.user.id,
                action: 'LIFE_SIGNAL_DETECTED',
                entityType: 'ZunoLifeSignal',
                entityId: row.id,
                after: {
                    status: row.status,
                    confirmation_status: row.confirmation_status,
                    materiality: row.materiality,
                },
            });
            await this.outbox.enqueue(manager, {
                aggregateType: (0, enums_1.asZunoAggregateType)(enums_1.LIFE_SIGNAL_AGGREGATE),
                aggregateId: row.id,
                eventType: (0, enums_1.asZunoEventType)(enums_1.SIGNAL_EVENT_TYPES.LIFE_SIGNAL_DETECTED),
                payload: {
                    life_signal_id: row.id,
                    user_id: params.user.id,
                    challenge_id: row.challenge_id,
                    signal_type: row.signal_type,
                    materiality: row.materiality,
                    confirmation_status: row.confirmation_status,
                    is_inference: row.is_inference,
                },
            });
            return row;
        });
        return {
            signal: saved,
            ignoredAsNoise: false,
            noiseReason: null,
            deduplicated: false,
            realignmentRecommended: saved.realignment_required,
            clarificationRequired: saved.clarification_required,
            interpretationUnavailable,
        };
    }
    async confirm(user, signalId, note) {
        const signal = await this.findOwned(user.id, signalId);
        if ((0, enums_1.isConfirmedSignal)(signal.confirmation_status))
            return signal;
        if (signal.confirmation_status === enums_1.SignalConfirmationStatus.REJECTED) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `signal ${signalId} was rejected and cannot be confirmed`,
            });
        }
        return this.dataSource.transaction(async (manager) => {
            const from = signal.confirmation_status;
            signal.confirmation_status = enums_1.SignalConfirmationStatus.CONFIRMED_USER_REPORTED;
            signal.reliability = enums_1.LifeSignalReliability.USER_CONFIRMED;
            signal.is_inference = false;
            signal.clarification_required = false;
            await this.activate(manager, signal, user.id);
            await manager.save(zuno_life_signal_confirmation_entity_1.ZunoLifeSignalConfirmation, manager.create(zuno_life_signal_confirmation_entity_1.ZunoLifeSignalConfirmation, {
                life_signal_id: signal.id,
                user_id: user.id,
                from_status: from,
                to_status: signal.confirmation_status,
                actor_type: enums_1.SignalConfirmationActor.USER,
                actor_id: user.id,
                prompt_text: null,
                response_note: note ?? null,
                redacted_at: null,
            }));
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: user.id,
                userId: user.id,
                action: 'LIFE_SIGNAL_CONFIRMED',
                entityType: 'ZunoLifeSignal',
                entityId: signal.id,
                before: { confirmation_status: from },
                after: { confirmation_status: signal.confirmation_status },
            });
            await this.outbox.enqueue(manager, {
                aggregateType: (0, enums_1.asZunoAggregateType)(enums_1.LIFE_SIGNAL_AGGREGATE),
                aggregateId: signal.id,
                eventType: (0, enums_1.asZunoEventType)(enums_1.SIGNAL_EVENT_TYPES.LIFE_SIGNAL_CONFIRMED),
                payload: {
                    life_signal_id: signal.id,
                    user_id: user.id,
                    challenge_id: signal.challenge_id,
                    materiality: signal.materiality,
                },
            });
            if (signal.realignment_required) {
                await this.outbox.enqueueMany(manager, [
                    {
                        aggregateType: (0, enums_1.asZunoAggregateType)(enums_1.LIFE_SIGNAL_AGGREGATE),
                        aggregateId: signal.id,
                        eventType: (0, enums_1.asZunoEventType)(enums_1.SIGNAL_EVENT_TYPES.LIFE_SIGNAL_MATERIAL),
                        payload: {
                            life_signal_id: signal.id,
                            user_id: user.id,
                            challenge_id: signal.challenge_id,
                            reason_codes: signal.reason_codes,
                        },
                    },
                    {
                        aggregateType: (0, enums_1.asZunoAggregateType)(enums_1.LIFE_SIGNAL_AGGREGATE),
                        aggregateId: signal.id,
                        eventType: (0, enums_1.asZunoEventType)(enums_1.SIGNAL_EVENT_TYPES.REALIGNMENT_REQUESTED),
                        payload: {
                            life_signal_id: signal.id,
                            user_id: user.id,
                            challenge_id: signal.challenge_id,
                        },
                    },
                ]);
            }
            return signal;
        });
    }
    async reject(user, signalId, note) {
        const signal = await this.findOwned(user.id, signalId);
        if (signal.confirmation_status === enums_1.SignalConfirmationStatus.REJECTED) {
            return signal;
        }
        return this.dataSource.transaction(async (manager) => {
            const fromStatus = signal.status;
            const fromConfirmation = signal.confirmation_status;
            signal.status = this.transition(fromStatus, enums_1.LifeSignalStatus.DISMISSED);
            signal.confirmation_status = enums_1.SignalConfirmationStatus.REJECTED;
            signal.realignment_required = false;
            signal.clarification_required = false;
            await manager.save(zuno_life_signal_entity_1.ZunoLifeSignal, signal);
            await manager.save(zuno_life_signal_confirmation_entity_1.ZunoLifeSignalConfirmation, manager.create(zuno_life_signal_confirmation_entity_1.ZunoLifeSignalConfirmation, {
                life_signal_id: signal.id,
                user_id: user.id,
                from_status: fromConfirmation,
                to_status: enums_1.SignalConfirmationStatus.REJECTED,
                actor_type: enums_1.SignalConfirmationActor.USER,
                actor_id: user.id,
                prompt_text: null,
                response_note: note ?? null,
                redacted_at: null,
            }));
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: user.id,
                userId: user.id,
                action: 'LIFE_SIGNAL_REJECTED',
                entityType: 'ZunoLifeSignal',
                entityId: signal.id,
                before: { status: fromStatus, confirmation_status: fromConfirmation },
                after: { status: signal.status, confirmation_status: signal.confirmation_status },
            });
            await this.outbox.enqueue(manager, {
                aggregateType: (0, enums_1.asZunoAggregateType)(enums_1.LIFE_SIGNAL_AGGREGATE),
                aggregateId: signal.id,
                eventType: (0, enums_1.asZunoEventType)(enums_1.SIGNAL_EVENT_TYPES.LIFE_SIGNAL_REJECTED),
                payload: {
                    life_signal_id: signal.id,
                    user_id: user.id,
                    challenge_id: signal.challenge_id,
                },
            });
            return signal;
        });
    }
    async findOwned(userId, signalId) {
        const signal = await this.signals.findOne({
            where: { id: signalId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(signal, userId, 'life signal');
    }
    async listSeparated(params) {
        const rows = await this.query(params);
        const now = this.clock.now();
        const live = params.status
            ? rows
            : rows.filter((row) => !this.isStale(row, now));
        return {
            confirmed: live.filter((row) => (0, enums_1.isConfirmedSignal)(row.confirmation_status)),
            unconfirmed: live.filter((row) => !(0, enums_1.isConfirmedSignal)(row.confirmation_status)),
        };
    }
    async actionableSignals(userId, challengeId) {
        const rows = await this.signals.find({
            where: {
                user_id: userId,
                challenge_id: challengeId,
                status: enums_1.LifeSignalStatus.ACTIVE,
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            order: { detected_at: 'DESC' },
            take: 200,
        });
        const now = this.clock.now();
        return rows.filter((row) => (0, enums_1.isConfirmedSignal)(row.confirmation_status) && !this.isStale(row, now));
    }
    isStale(signal, now) {
        if (signal.status === enums_1.LifeSignalStatus.STALE)
            return true;
        if (!signal.stale_after)
            return false;
        return signal.stale_after.getTime() <= now.getTime();
    }
    async sweepStale(userId, challengeId) {
        const now = this.clock.now();
        const due = await this.signals.find({
            where: {
                user_id: userId,
                ...(challengeId ? { challenge_id: challengeId } : {}),
                status: (0, typeorm_2.In)([enums_1.LifeSignalStatus.ACTIVE, enums_1.LifeSignalStatus.CANDIDATE]),
                stale_after: (0, typeorm_2.LessThan)(now),
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            take: 500,
        });
        if (due.length === 0)
            return 0;
        await this.dataSource.transaction(async (manager) => {
            for (const signal of due) {
                const from = signal.status;
                signal.status = this.transition(from, enums_1.LifeSignalStatus.STALE);
                signal.realignment_required = false;
                await manager.save(zuno_life_signal_entity_1.ZunoLifeSignal, signal);
                await this.outbox.enqueue(manager, {
                    aggregateType: (0, enums_1.asZunoAggregateType)(enums_1.LIFE_SIGNAL_AGGREGATE),
                    aggregateId: signal.id,
                    eventType: (0, enums_1.asZunoEventType)(enums_1.SIGNAL_EVENT_TYPES.LIFE_SIGNAL_STALE),
                    payload: {
                        life_signal_id: signal.id,
                        user_id: signal.user_id,
                        challenge_id: signal.challenge_id,
                    },
                });
            }
        });
        return due.length;
    }
    async query(params) {
        return this.signals.find({
            where: {
                user_id: params.userId,
                ...(params.challengeId ? { challenge_id: params.challengeId } : {}),
                ...(params.status ? { status: params.status } : {}),
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            order: { detected_at: 'DESC' },
            take: Math.min(params.limit, 100),
        });
    }
    async findOwnedChallenge(userId, challengeId) {
        const challenge = await this.challenges.findOne({
            where: { id: challengeId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(challenge, userId, 'challenge');
    }
    async activate(manager, signal, userId) {
        const now = this.clock.now();
        const candidates = await manager.find(zuno_life_signal_entity_1.ZunoLifeSignal, {
            where: {
                user_id: userId,
                challenge_id: signal.challenge_id ?? (0, typeorm_2.IsNull)(),
                status: enums_1.LifeSignalStatus.ACTIVE,
                id: (0, typeorm_2.Not)(signal.id),
                deleted_at: (0, typeorm_2.IsNull)(),
            },
        });
        const superseded = candidates.filter((previous) => this.replaces(signal, previous));
        for (const previous of superseded) {
            if (previous.fingerprint === signal.fingerprint)
                continue;
            previous.status = this.transition(previous.status, enums_1.LifeSignalStatus.SUPERSEDED);
            previous.realignment_required = false;
            await manager.save(zuno_life_signal_entity_1.ZunoLifeSignal, previous);
            await this.outbox.enqueue(manager, {
                aggregateType: (0, enums_1.asZunoAggregateType)(enums_1.LIFE_SIGNAL_AGGREGATE),
                aggregateId: previous.id,
                eventType: (0, enums_1.asZunoEventType)(enums_1.SIGNAL_EVENT_TYPES.LIFE_SIGNAL_SUPERSEDED),
                payload: {
                    life_signal_id: previous.id,
                    superseded_by: signal.id,
                    user_id: userId,
                    challenge_id: previous.challenge_id,
                },
            });
            signal.supersedes_signal_id = previous.id;
        }
        signal.status = this.transition(signal.status, enums_1.LifeSignalStatus.ACTIVE);
        signal.processed_at = now;
        signal.realignment_required = this.requiresRealignment(signal, now);
        if (signal.realignment_required &&
            !signal.reason_codes.includes(enums_1.RealignmentReasonCode.NEW_FACT) &&
            signal.reason_codes.length === 0) {
            signal.reason_codes = [enums_1.RealignmentReasonCode.NEW_FACT];
        }
        await manager.save(zuno_life_signal_entity_1.ZunoLifeSignal, signal);
        if (signal.challenge_id) {
            await manager.save(zuno_life_signal_impact_entity_1.ZunoLifeSignalImpact, manager.create(zuno_life_signal_impact_entity_1.ZunoLifeSignalImpact, {
                life_signal_id: signal.id,
                user_id: userId,
                entity_type: enums_1.SignalImpactEntityType.CHALLENGE,
                entity_id: signal.challenge_id,
                entity_key: null,
                impact_type: this.impactType(signal),
                impact_score: (enums_1.MATERIALITY_RANK[signal.materiality] / 3).toFixed(3),
                redacted_at: null,
            }));
        }
        await this.outbox.enqueue(manager, {
            aggregateType: (0, enums_1.asZunoAggregateType)(enums_1.LIFE_SIGNAL_AGGREGATE),
            aggregateId: signal.id,
            eventType: (0, enums_1.asZunoEventType)(enums_1.SIGNAL_EVENT_TYPES.LIFE_SIGNAL_VALIDATED),
            payload: {
                life_signal_id: signal.id,
                user_id: userId,
                challenge_id: signal.challenge_id,
                status: signal.status,
            },
        });
    }
    replaces(incoming, previous) {
        if (incoming.signal_type === previous.signal_type)
            return true;
        if (incoming.domain === null || incoming.domain !== previous.domain) {
            return false;
        }
        if (incoming.urgency_change === enums_1.UrgencyChange.NONE ||
            previous.urgency_change === enums_1.UrgencyChange.NONE) {
            return false;
        }
        return incoming.urgency_change !== previous.urgency_change;
    }
    requiresRealignment(signal, now) {
        if (!(0, enums_1.isConfirmedSignal)(signal.confirmation_status))
            return false;
        if (this.isStale(signal, now))
            return false;
        if (enums_1.MATERIALITY_RANK[signal.materiality] <
            enums_1.MATERIALITY_RANK[enums_1.LifeSignalMateriality.HIGH]) {
            return false;
        }
        return (signal.relevance === enums_1.LifeSignalRelevance.DIRECT ||
            signal.relevance === enums_1.LifeSignalRelevance.INDIRECT);
    }
    impactType(signal) {
        switch (signal.signal_type) {
            case enums_1.LifeSignalType.PLAN_BLOCKER:
                return enums_1.SignalImpactType.BLOCKS;
            case enums_1.LifeSignalType.PLAN_PROGRESS:
                return enums_1.SignalImpactType.PROGRESSES;
            case enums_1.LifeSignalType.OPPORTUNITY:
                return enums_1.SignalImpactType.INTRODUCES;
            case enums_1.LifeSignalType.STATUS_CHANGE:
            case enums_1.LifeSignalType.GOAL_CHANGE:
                return enums_1.SignalImpactType.INVALIDATES;
            default:
                return enums_1.SignalImpactType.SUPPORTS;
        }
    }
    initialConfirmationStatus(source, classification) {
        if (source === enums_1.LifeSignalSource.ADMIN) {
            return enums_1.SignalConfirmationStatus.CONFIRMED_ADMIN;
        }
        if (source !== enums_1.LifeSignalSource.USER_EXPLICIT) {
            return enums_1.SignalConfirmationStatus.CONFIRMED_SYSTEM_OBSERVED;
        }
        return classification.clarificationRequired
            ? enums_1.SignalConfirmationStatus.AWAITING_USER_CONFIRMATION
            : enums_1.SignalConfirmationStatus.UNCONFIRMED;
    }
    async appendSource(manager, signal, input) {
        await manager.save(zuno_life_signal_source_entity_1.ZunoLifeSignalSource, manager.create(zuno_life_signal_source_entity_1.ZunoLifeSignalSource, {
            life_signal_id: signal.id,
            user_id: signal.user_id,
            source: input.source,
            origin: input.origin,
            reliability: input.reliability,
            source_event_id: input.sourceEventId,
            source_ref: null,
            fingerprint: this.classifier.fingerprintFor(signal.signal_type, input.statement.slice(0, 120), input.observedAt),
            payload: { statement: input.statement },
            observed_at: input.observedAt,
            redacted_at: null,
        }));
        return signal;
    }
    transition(from, to) {
        if (from === to)
            return to;
        if (!(0, enums_1.canTransitionLifeSignal)(from, to)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `illegal life signal transition ${from} -> ${to}`,
            });
        }
        return to;
    }
};
exports.LifeSignalService = LifeSignalService;
exports.LifeSignalService = LifeSignalService = LifeSignalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_life_signal_entity_1.ZunoLifeSignal)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_challenge_entity_1.ZunoChallenge)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        signal_classifier_service_1.SignalClassifierService,
        safety_service_1.SafetyService,
        rulebook_repository_service_1.RulebookRepositoryService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], LifeSignalService);
//# sourceMappingURL=life-signal.service.js.map