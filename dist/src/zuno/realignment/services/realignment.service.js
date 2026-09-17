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
var RealignmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealignmentService = exports.REALIGNMENT_ENGINE_VERSION = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const zuno_realignment_entity_1 = require("../entities/zuno-realignment.entity");
const zuno_realignment_change_entity_1 = require("../entities/zuno-realignment-change.entity");
const zuno_realignment_assumption_entity_1 = require("../entities/zuno-realignment-assumption.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_life_signal_entity_1 = require("../../signals/entities/zuno-life-signal.entity");
const life_signal_service_1 = require("../../signals/services/life-signal.service");
const safety_service_1 = require("../../safety/services/safety.service");
const rulebook_repository_service_1 = require("../../rulebook/services/rulebook-repository.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
const enums_2 = require("../../signals/enums");
const enums_3 = require("../enums");
const realignment_target_port_1 = require("../ports/realignment-target.port");
exports.REALIGNMENT_ENGINE_VERSION = 'realignment-engine@1.0.0';
let RealignmentService = RealignmentService_1 = class RealignmentService {
    constructor(realignments, challenges, signals, target, lifeSignals, safety, rulebook, outbox, audit, ownership, clock, dataSource) {
        this.realignments = realignments;
        this.challenges = challenges;
        this.signals = signals;
        this.target = target;
        this.lifeSignals = lifeSignals;
        this.safety = safety;
        this.rulebook = rulebook;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(RealignmentService_1.name);
    }
    async evaluate(params) {
        const challenge = await this.findOwnedChallenge(params.user.id, params.challengeId);
        const trigger = params.triggerSignalId
            ? await this.loadTriggerSignal(params.user.id, params.triggerSignalId)
            : null;
        const assessment = this.safety.preCheck({
            operation: 'REALIGNMENT_EVALUATE',
            userId: params.user.id,
            challengeId: challenge.id,
            text: challenge.raw_user_statement,
            domains: challenge.primary_domain ? [challenge.primary_domain] : [],
        });
        if (assessment.blocked) {
            await this.dataSource.transaction(async (manager) => {
                const decision = await this.safety.recordDecision(manager, {
                    userId: params.user.id,
                    challengeId: challenge.id,
                    operation: 'REALIGNMENT_EVALUATE',
                    assessment,
                });
                await this.safety.recordIncident(manager, {
                    userId: params.user.id,
                    safetyDecisionId: decision.id,
                    source: 'REALIGNMENT_EVALUATE_PRECHECK',
                    domain: assessment.domains[0] ?? null,
                    severity: assessment.riskLevel,
                    violations: [],
                });
            });
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                message: assessment.boundaryMessage ??
                    'Before we change anything, there is something here I would rather not work around.',
                safety: { disposition: assessment.disposition },
            });
        }
        const actionable = await this.lifeSignals.actionableSignals(params.user.id, challenge.id);
        const driving = trigger && actionable.some((row) => row.id === trigger.id)
            ? actionable
            : trigger
                ? []
                : actionable;
        const fingerprint = this.triggerFingerprint(challenge.id, trigger?.id ?? null, challenge.context_version);
        const existing = await this.realignments.findOne({
            where: {
                user_id: params.user.id,
                challenge_id: challenge.id,
                trigger_fingerprint: fingerprint,
                status: (0, typeorm_2.In)([
                    enums_3.RealignmentStatus.EVALUATED,
                    enums_3.RealignmentStatus.AWAITING_USER_CONFIRMATION,
                    enums_3.RealignmentStatus.APPLIED,
                ]),
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            order: { created_at: 'DESC' },
        });
        if (existing) {
            const changes = await this.dataSource
                .getRepository(zuno_realignment_change_entity_1.ZunoRealignmentChange)
                .find({ where: { realignment_id: existing.id } });
            return { realignment: existing, changes, idempotentReplay: true };
        }
        const level = this.level(driving);
        const reasonCodes = this.reasonCodes(driving);
        const scope = this.scope(level, driving);
        const planMode = this.planChangeMode(level, driving);
        const now = this.clock.now();
        const activeRulebook = await this.rulebook.getActive();
        const saved = await this.dataSource.transaction(async (manager) => {
            const inFlight = await manager.find(zuno_realignment_entity_1.ZunoRealignment, {
                where: {
                    user_id: params.user.id,
                    challenge_id: challenge.id,
                    status: (0, typeorm_2.In)([
                        enums_3.RealignmentStatus.PENDING,
                        enums_3.RealignmentStatus.EVALUATED,
                        enums_3.RealignmentStatus.AWAITING_USER_CONFIRMATION,
                    ]),
                    deleted_at: (0, typeorm_2.IsNull)(),
                },
            });
            for (const prior of inFlight) {
                prior.status = this.transition(prior.status, enums_3.RealignmentStatus.SUPERSEDED);
                await manager.save(zuno_realignment_entity_1.ZunoRealignment, prior);
            }
            const realignment = manager.create(zuno_realignment_entity_1.ZunoRealignment, {
                user_id: params.user.id,
                challenge_id: challenge.id,
                trigger_type: params.trigger ??
                    (trigger ? enums_3.RealignmentTrigger.LIFE_SIGNAL : enums_3.RealignmentTrigger.USER_REQUEST),
                trigger_signal_id: trigger?.id ?? null,
                level,
                scope,
                status: enums_3.RealignmentStatus.EVALUATED,
                reason: this.explain(level, driving),
                reason_codes: reasonCodes,
                previous_state_ref: {
                    challenge_id: challenge.id,
                    context_version: challenge.context_version,
                    challenge_status: challenge.status,
                },
                new_state_ref: {},
                previous_context_version: challenge.context_version,
                current_context_version: challenge.context_version,
                plan_change_mode: planMode,
                scenario_reassessment_required: enums_3.REALIGNMENT_LEVEL_RANK[level] >=
                    enums_3.REALIGNMENT_LEVEL_RANK[enums_3.RealignmentLevel.PARTIAL],
                mka_refresh_required: this.mkaRefreshRequired(level, reasonCodes),
                user_confirmation_required: this.confirmationRequired(level, reasonCodes),
                safety_review_required: false,
                trigger_fingerprint: fingerprint,
                superseded_by_id: null,
                rulebook_version_id: activeRulebook?.versionId ?? null,
                engine_version: exports.REALIGNMENT_ENGINE_VERSION,
                applied_at: null,
                completed_at: null,
            });
            const row = await manager.save(zuno_realignment_entity_1.ZunoRealignment, realignment);
            for (const prior of inFlight) {
                prior.superseded_by_id = row.id;
                await manager.save(zuno_realignment_entity_1.ZunoRealignment, prior);
            }
            if (row.user_confirmation_required) {
                row.status = this.transition(row.status, enums_3.RealignmentStatus.AWAITING_USER_CONFIRMATION);
                await manager.save(zuno_realignment_entity_1.ZunoRealignment, row);
            }
            const changeRows = await this.writeDiff(manager, row, driving);
            await this.writeAssumptions(manager, row, driving);
            await this.audit.record(manager, {
                actorType: 'SYSTEM',
                userId: params.user.id,
                action: 'REALIGNMENT_EVALUATED',
                entityType: 'ZunoRealignment',
                entityId: row.id,
                after: { level: row.level, status: row.status, scope: row.scope },
                metadata: { reason_codes: row.reason_codes },
            });
            await this.outbox.enqueue(manager, {
                aggregateType: (0, enums_2.asZunoAggregateType)(enums_3.REALIGNMENT_AGGREGATE),
                aggregateId: row.id,
                eventType: (0, enums_2.asZunoEventType)(enums_3.REALIGNMENT_EVENT_TYPES.REALIGNMENT_EVALUATED),
                payload: {
                    realignment_id: row.id,
                    user_id: params.user.id,
                    challenge_id: challenge.id,
                    level: row.level,
                    trigger_signal_id: row.trigger_signal_id,
                },
            });
            if (row.user_confirmation_required) {
                await this.outbox.enqueue(manager, {
                    aggregateType: (0, enums_2.asZunoAggregateType)(enums_3.REALIGNMENT_AGGREGATE),
                    aggregateId: row.id,
                    eventType: (0, enums_2.asZunoEventType)(enums_3.REALIGNMENT_EVENT_TYPES.REALIGNMENT_CONFIRMATION_REQUIRED),
                    payload: {
                        realignment_id: row.id,
                        user_id: params.user.id,
                        challenge_id: challenge.id,
                    },
                });
            }
            if (enums_3.REALIGNMENT_LEVEL_RANK[level] >
                enums_3.REALIGNMENT_LEVEL_RANK[enums_3.RealignmentLevel.NONE]) {
                this.moveChallenge(challenge, enums_1.ChallengeStatus.REALIGNMENT_REQUIRED, now);
                await manager.save(zuno_challenge_entity_1.ZunoChallenge, challenge);
            }
            return { row, changeRows };
        });
        return {
            realignment: saved.row,
            changes: saved.changeRows,
            idempotentReplay: false,
        };
    }
    async apply(params) {
        const loaded = await this.findOwned(params.user.id, params.realignmentId);
        this.ownership.assertVersion(loaded, params.expectedVersion);
        if (loaded.status === enums_3.RealignmentStatus.APPLIED) {
            return {
                realignment: loaded,
                cancelledItemIds: [],
                suppressedReminderIds: [],
                supersededProgramId: null,
                newPlanId: loaded.new_state_ref?.plan_id ?? null,
                targetApplied: false,
            };
        }
        if (loaded.status === enums_3.RealignmentStatus.AWAITING_USER_CONFIRMATION &&
            !params.userConfirmed) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: 'This one is your call. Confirm it and I will make the change.',
                internalDetail: `realignment ${loaded.id} requires user confirmation`,
            });
        }
        if (loaded.status !== enums_3.RealignmentStatus.EVALUATED &&
            loaded.status !== enums_3.RealignmentStatus.AWAITING_USER_CONFIRMATION) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `realignment ${loaded.id} is ${loaded.status}`,
            });
        }
        if (loaded.level === enums_3.RealignmentLevel.NONE) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: 'Nothing here changes our direction yet.',
                internalDetail: `realignment ${loaded.id} has level NONE`,
            });
        }
        const now = this.clock.now();
        return this.dataSource.transaction(async (manager) => {
            const realignment = await manager.findOne(zuno_realignment_entity_1.ZunoRealignment, {
                where: { id: loaded.id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!realignment) {
                throw zuno_exception_1.ZunoException.notFound(`realignment ${loaded.id} vanished`);
            }
            if (realignment.status === enums_3.RealignmentStatus.APPLIED) {
                throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                    internalDetail: `realignment ${realignment.id} already applied`,
                });
            }
            const ctx = {
                manager,
                userId: params.user.id,
                challengeId: realignment.challenge_id,
                realignmentId: realignment.id,
                occurredAt: now,
            };
            const direction = await this.target.loadCurrentDirection(ctx);
            const cancelled = await this.target.cancelPendingItems(ctx, {
                itemIds: direction.pendingItemIds,
                reasonCode: 'CANCELLED_BY_REALIGNMENT',
                reason: realignment.reason,
            });
            const suppressed = await this.target.suppressPendingReminders(ctx, {
                reminderIds: direction.pendingReminderIds,
                reason: realignment.reason,
            });
            const programme = await this.target.supersedeProgramme(ctx, {
                mkaProgramId: direction.mkaProgramId,
                reason: realignment.reason,
                refreshRequired: realignment.mka_refresh_required,
            });
            const plan = await this.target.activateSuccessorPlan(ctx, {
                mode: realignment.plan_change_mode === enums_3.PlanChangeMode.REGENERATE
                    ? 'REGENERATE'
                    : 'PATCH',
                previousPlanId: direction.planId,
                reason: realignment.reason,
                preserveItemIds: [],
            });
            await this.recordAppliedChanges(manager, realignment, {
                cancelled: cancelled.cancelledItemIds,
                suppressed: suppressed.suppressedReminderIds,
                supersededProgramId: programme.supersededProgramId,
                planId: plan.planId,
                previousPlanId: direction.planId,
            });
            realignment.status = this.transition(realignment.status, enums_3.RealignmentStatus.APPLIED);
            realignment.applied_at = now;
            realignment.completed_at = now;
            realignment.previous_state_ref = {
                ...realignment.previous_state_ref,
                plan_id: direction.planId,
                plan_version: direction.planVersion,
                mka_program_id: direction.mkaProgramId,
            };
            realignment.new_state_ref = {
                plan_id: plan.planId,
                plan_version: plan.planVersion,
                mka_program_id: programme.successorProgramId,
                cancelled_item_count: cancelled.cancelledItemIds.length,
                suppressed_reminder_count: suppressed.suppressedReminderIds.length,
                target_bound: direction.available,
            };
            await manager.save(zuno_realignment_entity_1.ZunoRealignment, realignment);
            await this.settleTriggerSignals(manager, realignment);
            const challenge = await manager.findOne(zuno_challenge_entity_1.ZunoChallenge, {
                where: { id: realignment.challenge_id },
            });
            if (challenge) {
                this.moveChallenge(challenge, enums_1.ChallengeStatus.ACTIVE, now);
                await manager.save(zuno_challenge_entity_1.ZunoChallenge, challenge);
            }
            await this.audit.record(manager, {
                actorType: params.userConfirmed ? 'USER' : 'SYSTEM',
                actorId: params.user.id,
                userId: params.user.id,
                action: 'REALIGNMENT_APPLIED',
                entityType: 'ZunoRealignment',
                entityId: realignment.id,
                before: { status: enums_3.RealignmentStatus.EVALUATED },
                after: { status: realignment.status, level: realignment.level },
                metadata: {
                    cancelled_items: cancelled.cancelledItemIds.length,
                    target_bound: direction.available,
                },
            });
            await this.outbox.enqueueMany(manager, [
                {
                    aggregateType: (0, enums_2.asZunoAggregateType)(enums_3.REALIGNMENT_AGGREGATE),
                    aggregateId: realignment.id,
                    eventType: (0, enums_2.asZunoEventType)(enums_3.REALIGNMENT_EVENT_TYPES.REALIGNMENT_APPLIED),
                    payload: {
                        realignment_id: realignment.id,
                        user_id: params.user.id,
                        challenge_id: realignment.challenge_id,
                        level: realignment.level,
                        plan_id: plan.planId,
                    },
                },
                {
                    aggregateType: (0, enums_2.asZunoAggregateType)(enums_3.REALIGNMENT_AGGREGATE),
                    aggregateId: realignment.id,
                    eventType: (0, enums_2.asZunoEventType)(enums_3.REALIGNMENT_EVENT_TYPES.REALIGNMENT_COMPLETED),
                    payload: {
                        realignment_id: realignment.id,
                        user_id: params.user.id,
                        challenge_id: realignment.challenge_id,
                    },
                },
            ]);
            return {
                realignment,
                cancelledItemIds: cancelled.cancelledItemIds,
                suppressedReminderIds: suppressed.suppressedReminderIds,
                supersededProgramId: programme.supersededProgramId,
                newPlanId: plan.planId,
                targetApplied: cancelled.applied ||
                    suppressed.applied ||
                    programme.applied ||
                    plan.applied,
            };
        });
    }
    async findOwned(userId, realignmentId) {
        const row = await this.realignments.findOne({
            where: { id: realignmentId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(row, userId, 'realignment');
    }
    async list(userId, challengeId, limit = 20) {
        return this.realignments.find({
            where: { user_id: userId, challenge_id: challengeId, deleted_at: (0, typeorm_2.IsNull)() },
            order: { created_at: 'DESC' },
            take: Math.min(limit, 100),
        });
    }
    async changesFor(realignmentId) {
        return this.dataSource
            .getRepository(zuno_realignment_change_entity_1.ZunoRealignmentChange)
            .find({ where: { realignment_id: realignmentId } });
    }
    async findOwnedChallenge(userId, challengeId) {
        const challenge = await this.challenges.findOne({
            where: { id: challengeId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(challenge, userId, 'challenge');
    }
    async loadTriggerSignal(userId, signalId) {
        const signal = await this.signals.findOne({
            where: { id: signalId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(signal, userId, 'life signal');
    }
    level(signals) {
        if (signals.length === 0)
            return enums_3.RealignmentLevel.NONE;
        const worst = signals.reduce((rank, signal) => Math.max(rank, enums_2.MATERIALITY_RANK[signal.materiality]), -1);
        if (worst >= enums_2.MATERIALITY_RANK[enums_2.LifeSignalMateriality.CRITICAL]) {
            return enums_3.RealignmentLevel.CRITICAL;
        }
        const invalidating = signals.some((signal) => [
            enums_2.LifeSignalType.STATUS_CHANGE,
            enums_2.LifeSignalType.GOAL_CHANGE,
            enums_2.LifeSignalType.SETBACK,
        ].includes(signal.signal_type));
        if (worst >= enums_2.MATERIALITY_RANK[enums_2.LifeSignalMateriality.HIGH]) {
            return invalidating ? enums_3.RealignmentLevel.MAJOR : enums_3.RealignmentLevel.PARTIAL;
        }
        if (worst >= enums_2.MATERIALITY_RANK[enums_2.LifeSignalMateriality.MEDIUM]) {
            return enums_3.RealignmentLevel.MICRO;
        }
        return enums_3.RealignmentLevel.NONE;
    }
    scope(level, signals) {
        switch (level) {
            case enums_3.RealignmentLevel.NONE:
            case enums_3.RealignmentLevel.MICRO:
                return enums_3.RealignmentScope.TASK;
            case enums_3.RealignmentLevel.PARTIAL:
                return enums_3.RealignmentScope.WEEK;
            case enums_3.RealignmentLevel.MAJOR:
                return signals.some((signal) => signal.signal_type === enums_2.LifeSignalType.GOAL_CHANGE)
                    ? enums_3.RealignmentScope.GOAL
                    : enums_3.RealignmentScope.THIRTY_DAY_PLAN;
            case enums_3.RealignmentLevel.CRITICAL:
                return enums_3.RealignmentScope.CHALLENGE;
        }
    }
    reasonCodes(signals) {
        const codes = new Set();
        for (const signal of signals) {
            for (const code of signal.reason_codes ?? [])
                codes.add(code);
        }
        if (signals.some((signal) => signal.signal_type === enums_2.LifeSignalType.STATUS_CHANGE)) {
            codes.add(enums_2.RealignmentReasonCode.PRIMARY_STRATEGY_INVALIDATED);
        }
        return Array.from(codes);
    }
    planChangeMode(level, signals) {
        if (level === enums_3.RealignmentLevel.NONE)
            return enums_3.PlanChangeMode.NONE;
        if (enums_3.REALIGNMENT_LEVEL_RANK[level] >=
            enums_3.REALIGNMENT_LEVEL_RANK[enums_3.RealignmentLevel.MAJOR]) {
            return enums_3.PlanChangeMode.REGENERATE;
        }
        return signals.length > enums_3.PLAN_PATCH_MAX_CHANGED_COMPONENTS
            ? enums_3.PlanChangeMode.REGENERATE
            : enums_3.PlanChangeMode.PATCH;
    }
    mkaRefreshRequired(level, codes) {
        if (enums_3.REALIGNMENT_LEVEL_RANK[level] >=
            enums_3.REALIGNMENT_LEVEL_RANK[enums_3.RealignmentLevel.MAJOR]) {
            return true;
        }
        return codes.some((code) => [
            enums_2.RealignmentReasonCode.GOAL_CHANGED,
            enums_2.RealignmentReasonCode.SAFETY_CHANGED,
            enums_2.RealignmentReasonCode.ASTRO_TIMING_CHANGED,
        ].includes(code));
    }
    confirmationRequired(level, codes) {
        if (codes.includes(enums_2.RealignmentReasonCode.NEW_FACT))
            return false;
        if (codes.includes(enums_2.RealignmentReasonCode.GOAL_CHANGED) ||
            codes.includes(enums_2.RealignmentReasonCode.PREFERENCE_CHANGED)) {
            return true;
        }
        return (enums_3.REALIGNMENT_LEVEL_RANK[level] >=
            enums_3.REALIGNMENT_LEVEL_RANK[enums_3.RealignmentLevel.MAJOR]);
    }
    explain(level, signals) {
        if (level === enums_3.RealignmentLevel.NONE || signals.length === 0) {
            return 'Nothing here changes our direction yet. Let us stay with the plan.';
        }
        const count = signals.length;
        switch (level) {
            case enums_3.RealignmentLevel.MICRO:
                return 'Small adjustment: the plan still holds, we are just changing the timing.';
            case enums_3.RealignmentLevel.PARTIAL:
                return `Part of the plan needs to change. ${count === 1 ? 'What you told me' : 'What you have told me'} affects one area; the rest stays as it is.`;
            case enums_3.RealignmentLevel.MAJOR:
                return 'This changes our focus. We are keeping what still helps and moving the priority to where it now matters.';
            case enums_3.RealignmentLevel.CRITICAL:
                return 'This needs our attention now. We are re-shaping the plan around what has just happened.';
        }
    }
    async writeDiff(manager, realignment, signals) {
        const rows = [];
        if (realignment.level === enums_3.RealignmentLevel.NONE)
            return rows;
        rows.push(manager.create(zuno_realignment_change_entity_1.ZunoRealignmentChange, {
            realignment_id: realignment.id,
            user_id: realignment.user_id,
            entity_type: enums_3.RealignmentEntityType.CHALLENGE,
            entity_id: realignment.challenge_id,
            change_type: enums_3.RealignmentChangeType.PRESERVE,
            before_value: null,
            after_value: { note: 'Progress and completed work are kept.' },
            reason: 'Step 14 section 35: regeneration preserves completed actions, user commitments and known constraints.',
            redacted_at: null,
        }));
        for (const signal of signals) {
            rows.push(manager.create(zuno_realignment_change_entity_1.ZunoRealignmentChange, {
                realignment_id: realignment.id,
                user_id: realignment.user_id,
                entity_type: enums_3.RealignmentEntityType.SCENARIO,
                entity_id: null,
                change_type: signal.signal_type === enums_2.LifeSignalType.OPPORTUNITY
                    ? enums_3.RealignmentChangeType.ADD
                    : enums_3.RealignmentChangeType.MODIFY,
                before_value: null,
                after_value: {
                    signal_id: signal.id,
                    signal_type: signal.signal_type,
                    materiality: signal.materiality,
                },
                reason: realignment.reason,
                redacted_at: null,
            }));
        }
        if (realignment.plan_change_mode === enums_3.PlanChangeMode.REGENERATE) {
            rows.push(manager.create(zuno_realignment_change_entity_1.ZunoRealignmentChange, {
                realignment_id: realignment.id,
                user_id: realignment.user_id,
                entity_type: enums_3.RealignmentEntityType.PLAN,
                entity_id: null,
                change_type: enums_3.RealignmentChangeType.REMOVE,
                before_value: { note: 'Actions that no longer fit the situation.' },
                after_value: null,
                reason: 'Step 14 section 15: actions that are no longer useful are retired, not carried forward.',
                redacted_at: null,
            }));
        }
        return manager.save(zuno_realignment_change_entity_1.ZunoRealignmentChange, rows);
    }
    async writeAssumptions(manager, realignment, signals) {
        const rows = signals
            .filter((signal) => [
            enums_2.LifeSignalType.STATUS_CHANGE,
            enums_2.LifeSignalType.GOAL_CHANGE,
            enums_2.LifeSignalType.PLAN_BLOCKER,
            enums_2.LifeSignalType.PREFERENCE_CHANGE,
        ].includes(signal.signal_type))
            .map((signal) => manager.create(zuno_realignment_assumption_entity_1.ZunoRealignmentAssumption, {
            realignment_id: realignment.id,
            user_id: realignment.user_id,
            assumption_key: `SIGNAL_${signal.signal_type}`,
            statement: this.assumptionStatement(signal.signal_type),
            source: 'CURRENT_REALITY',
            status: enums_3.AssumptionStatus.INVALIDATED,
            invalidated_by_signal_id: signal.id,
            affected_components: [],
            redacted_at: null,
        }));
        if (rows.length > 0) {
            await manager.save(zuno_realignment_assumption_entity_1.ZunoRealignmentAssumption, rows);
        }
    }
    assumptionStatement(type) {
        switch (type) {
            case enums_2.LifeSignalType.STATUS_CHANGE:
                return 'The situation this plan was built around has not changed.';
            case enums_2.LifeSignalType.GOAL_CHANGE:
                return 'The goal this plan works towards is still the one you want.';
            case enums_2.LifeSignalType.PLAN_BLOCKER:
                return 'The route this plan takes is still open.';
            case enums_2.LifeSignalType.PREFERENCE_CHANGE:
                return 'The kinds of action in this plan are ones you are willing to take.';
            default:
                return 'A condition this plan depended on.';
        }
    }
    async recordAppliedChanges(manager, realignment, applied) {
        const rows = [];
        if (applied.cancelled.length > 0) {
            rows.push(manager.create(zuno_realignment_change_entity_1.ZunoRealignmentChange, {
                realignment_id: realignment.id,
                user_id: realignment.user_id,
                entity_type: enums_3.RealignmentEntityType.PLAN_ITEM,
                entity_id: null,
                change_type: enums_3.RealignmentChangeType.ITEMS_CANCELLED,
                before_value: { item_ids: applied.cancelled },
                after_value: { status: 'CANCELLED_BY_REALIGNMENT' },
                reason: 'Step 14 section 74: cancelled because the situation changed, never counted as missed.',
                redacted_at: null,
            }));
        }
        if (applied.suppressed.length > 0) {
            rows.push(manager.create(zuno_realignment_change_entity_1.ZunoRealignmentChange, {
                realignment_id: realignment.id,
                user_id: realignment.user_id,
                entity_type: enums_3.RealignmentEntityType.REMINDER,
                entity_id: null,
                change_type: enums_3.RealignmentChangeType.REMINDERS_SUPPRESSED,
                before_value: { reminder_ids: applied.suppressed },
                after_value: null,
                reason: 'Roadmap section 66: notifications for obsolete actions are suppressed.',
                redacted_at: null,
            }));
        }
        if (applied.supersededProgramId) {
            rows.push(manager.create(zuno_realignment_change_entity_1.ZunoRealignmentChange, {
                realignment_id: realignment.id,
                user_id: realignment.user_id,
                entity_type: enums_3.RealignmentEntityType.MKA_PROGRAM,
                entity_id: applied.supersededProgramId,
                change_type: enums_3.RealignmentChangeType.MKA_SUPERSEDED,
                before_value: { mka_program_id: applied.supersededProgramId },
                after_value: null,
                reason: 'Step 14 section 51: the emotional and timing context changed.',
                redacted_at: null,
            }));
        }
        if (applied.planId) {
            rows.push(manager.create(zuno_realignment_change_entity_1.ZunoRealignmentChange, {
                realignment_id: realignment.id,
                user_id: realignment.user_id,
                entity_type: enums_3.RealignmentEntityType.PLAN,
                entity_id: applied.planId,
                change_type: realignment.plan_change_mode === enums_3.PlanChangeMode.REGENERATE
                    ? enums_3.RealignmentChangeType.PLAN_REPLACED
                    : enums_3.RealignmentChangeType.PLAN_PATCHED,
                before_value: { plan_id: applied.previousPlanId },
                after_value: { plan_id: applied.planId },
                reason: realignment.reason,
                redacted_at: null,
            }));
        }
        if (rows.length > 0) {
            await manager.save(zuno_realignment_change_entity_1.ZunoRealignmentChange, rows);
        }
    }
    async settleTriggerSignals(manager, realignment) {
        const pending = await manager.find(zuno_life_signal_entity_1.ZunoLifeSignal, {
            where: {
                user_id: realignment.user_id,
                challenge_id: realignment.challenge_id,
                status: enums_2.LifeSignalStatus.ACTIVE,
                realignment_required: true,
                deleted_at: (0, typeorm_2.IsNull)(),
            },
        });
        for (const signal of pending) {
            if (!(0, enums_2.isConfirmedSignal)(signal.confirmation_status))
                continue;
            signal.realignment_required = false;
            signal.processed_at = this.clock.now();
            await manager.save(zuno_life_signal_entity_1.ZunoLifeSignal, signal);
        }
    }
    moveChallenge(challenge, to, now) {
        if (challenge.status === to)
            return;
        if (!(0, enums_1.canTransitionChallenge)(challenge.status, to)) {
            this.logger.debug(`Challenge ${challenge.id} stays ${challenge.status}; ${to} is not reachable from there.`);
            return;
        }
        challenge.status = to;
        challenge.updated_at = now;
    }
    transition(from, to) {
        if (from === to)
            return to;
        if (!(0, enums_3.canTransitionRealignment)(from, to)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `illegal realignment transition ${from} -> ${to}`,
            });
        }
        return to;
    }
    triggerFingerprint(challengeId, triggerSignalId, contextVersion) {
        return (0, crypto_1.createHash)('sha256')
            .update(`${challengeId}|${triggerSignalId ?? 'none'}|${contextVersion}`)
            .digest('hex')
            .slice(0, 64);
    }
};
exports.RealignmentService = RealignmentService;
exports.RealignmentService = RealignmentService = RealignmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_realignment_entity_1.ZunoRealignment)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_challenge_entity_1.ZunoChallenge)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_life_signal_entity_1.ZunoLifeSignal)),
    __param(3, (0, common_1.Inject)(realignment_target_port_1.REALIGNMENT_TARGET)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object, life_signal_service_1.LifeSignalService,
        safety_service_1.SafetyService,
        rulebook_repository_service_1.RulebookRepositoryService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], RealignmentService);
//# sourceMappingURL=realignment.service.js.map