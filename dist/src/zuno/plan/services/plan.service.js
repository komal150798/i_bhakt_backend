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
var PlanService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_plan_entity_1 = require("../entities/zuno-plan.entity");
const zuno_plan_item_entity_1 = require("../entities/zuno-plan-item.entity");
const zuno_plan_item_event_entity_1 = require("../entities/zuno-plan-item-event.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_mka_program_entity_1 = require("../../mka/entities/zuno-mka-program.entity");
const mka_service_1 = require("../../mka/services/mka.service");
const mka_enum_1 = require("../../mka/enums/mka.enum");
const mka_plan_event_enum_1 = require("../../mka/enums/mka-plan-event.enum");
const mka_plan_outbox_1 = require("../../mka/enums/mka-plan-outbox");
const safety_service_1 = require("../../safety/services/safety.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
const plan_enum_1 = require("../enums/plan.enum");
const plan_capacity_1 = require("../enums/plan-capacity");
let PlanService = PlanService_1 = class PlanService {
    constructor(plans, items, itemEvents, challenges, mka, safety, outbox, audit, ownership, clock, dataSource) {
        this.plans = plans;
        this.items = items;
        this.itemEvents = itemEvents;
        this.challenges = challenges;
        this.mka = mka;
        this.safety = safety;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(PlanService_1.name);
    }
    async generate(params) {
        const planType = params.planType ?? plan_enum_1.PlanType.TODAY;
        const challenge = await this.findOwnedChallenge(params.user.id, params.challengeId);
        if (challenge.status === enums_1.ChallengeStatus.ARCHIVED ||
            challenge.status === enums_1.ChallengeStatus.RESOLVED) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `cannot build a plan for a ${challenge.status} challenge`,
            });
        }
        const initial = this.safety.preCheck({
            operation: 'PLAN_GENERATE',
            userId: params.user.id,
            challengeId: challenge.id,
            text: challenge.raw_user_statement,
            domains: [],
        });
        const domains = challenge.primary_domain
            ? [challenge.primary_domain]
            : [];
        const assessment = this.safety.refineWithDomains(initial, {
            operation: 'PLAN_GENERATE',
            userId: params.user.id,
            challengeId: challenge.id,
            text: challenge.raw_user_statement,
            domains,
        });
        if (assessment.blocked) {
            await this.dataSource.transaction(async (manager) => {
                const decision = await this.safety.recordDecision(manager, {
                    userId: params.user.id,
                    challengeId: challenge.id,
                    operation: 'PLAN_GENERATE',
                    assessment,
                });
                await this.safety.recordIncident(manager, {
                    userId: params.user.id,
                    safetyDecisionId: decision.id,
                    source: 'PLAN_GENERATE_PRECHECK',
                    domain: domains[0] ?? null,
                    severity: assessment.riskLevel,
                    violations: [],
                });
            });
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                message: assessment.boundaryMessage ??
                    'I am not able to build a plan around this one, and I would rather say so plainly.',
                safety: {
                    disposition: assessment.disposition,
                    domain: assessment.domains[0],
                },
            });
        }
        let program = await this.mka.findActiveProgram(params.user.id, challenge.id);
        if (!program) {
            const generated = await this.mka.generate({
                user: params.user,
                challengeId: challenge.id,
                period: mka_enum_1.MkaPeriodType.WEEK,
                reason: 'PLAN_REQUIREMENT',
            });
            program = generated.program;
        }
        const mkaItems = await this.mka.planEligibleItems(program.id);
        const existing = await this.findActivePlan(params.user.id, challenge.id, planType);
        if (existing &&
            !params.regenerate &&
            existing.mka_program_id === program.id &&
            existing.context_version === challenge.context_version) {
            return { plan: existing, items: await this.itemsFor(existing.id) };
        }
        const limits = (0, plan_capacity_1.planCapacityFor)(planType);
        const { startDate, endDate } = this.horizonWindow(planType);
        const candidates = this.rank(this.candidatesFromMka(mkaItems, challenge, startDate));
        const { active, overflow } = this.enforceCapacity(candidates, limits);
        return this.dataSource.transaction(async (manager) => {
            const decision = await this.safety.recordDecision(manager, {
                userId: params.user.id,
                challengeId: challenge.id,
                operation: 'PLAN_GENERATE',
                assessment,
            });
            const previous = existing
                ? await this.supersede(manager, existing, params.user.id)
                : null;
            const plan = manager.create(zuno_plan_entity_1.ZunoPlan, {
                user_id: params.user.id,
                challenge_id: challenge.id,
                mka_program_id: program.id,
                plan_type: planType,
                title: this.planTitle(planType),
                primary_goal: challenge.title ?? null,
                start_date: startDate,
                end_date: endDate,
                status: plan_enum_1.PlanStatus.DRAFT,
                timezone: params.user.timezone ?? null,
                review_trigger: planType === plan_enum_1.PlanType.TODAY
                    ? plan_enum_1.PlanReviewTrigger.END_OF_WEEK
                    : plan_enum_1.PlanReviewTrigger.END_OF_HORIZON,
                review_at: endDate,
                generated_from_realignment_id: null,
                superseded_by_id: null,
                context_version: challenge.context_version,
                safety_decision_id: decision.id,
                engine_version: plan_enum_1.PLAN_ENGINE_VERSION,
                generated_reason: params.reason ?? (previous ? 'REGENERATED' : 'INITIAL_GENERATION'),
                capacity_snapshot: limits,
                activated_at: null,
                completed_at: null,
            });
            const savedPlan = await manager.save(zuno_plan_entity_1.ZunoPlan, plan);
            if (previous) {
                previous.superseded_by_id = savedPlan.id;
                await manager.save(zuno_plan_entity_1.ZunoPlan, previous);
            }
            program.plan_id = savedPlan.id;
            await manager.save(zuno_mka_program_entity_1.ZunoMkaProgram, program);
            const activeRows = active.map((candidate, index) => this.toRow(manager, savedPlan, candidate, plan_enum_1.PlanItemStatus.PENDING, index));
            const overflowRows = overflow.map((candidate, index) => {
                const row = this.toRow(manager, savedPlan, candidate, plan_enum_1.PlanItemStatus.DEFERRED, active.length + index);
                row.scheduled_date = null;
                row.priority = plan_enum_1.PlanItemPriority.OPTIONAL;
                row.priority_rank = plan_enum_1.PLAN_ITEM_PRIORITY_RANK[plan_enum_1.PlanItemPriority.OPTIONAL];
                return row;
            });
            const savedItems = await manager.save(zuno_plan_item_entity_1.ZunoPlanItem, [
                ...activeRows,
                ...overflowRows,
            ]);
            for (const item of savedItems) {
                await this.recordItemEvent(manager, item, {
                    eventType: item.status === plan_enum_1.PlanItemStatus.DEFERRED
                        ? plan_enum_1.PlanItemEventType.CAPACITY_DEFERRED
                        : plan_enum_1.PlanItemEventType.CREATED,
                    oldStatus: null,
                    newStatus: item.status,
                    reason: item.status === plan_enum_1.PlanItemStatus.DEFERRED
                        ? 'Outside this horizon to keep the plan realistic.'
                        : null,
                    source: plan_enum_1.PlanItemEventSource.PLAN_ENGINE,
                });
            }
            await this.audit.record(manager, {
                actorType: 'SYSTEM',
                userId: params.user.id,
                action: 'PLAN_GENERATED',
                entityType: 'ZunoPlan',
                entityId: savedPlan.id,
                after: {
                    status: savedPlan.status,
                    plan_type: planType,
                    active_items: activeRows.length,
                    deferred_items: overflowRows.length,
                },
                metadata: {
                    challengeId: challenge.id,
                    mkaProgramId: program.id,
                    capacity: limits,
                },
            });
            await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.PLAN,
                aggregateId: savedPlan.id,
                eventType: mka_plan_event_enum_1.MkaPlanEventType.PLAN_GENERATED,
                payload: {
                    plan_id: savedPlan.id,
                    challenge_id: challenge.id,
                    user_id: params.user.id,
                    mka_program_id: program.id,
                    plan_type: planType,
                    active_item_count: activeRows.length,
                    deferred_item_count: overflowRows.length,
                },
            });
            if (activeRows.filter((row) => !row.is_practice).length < limits.minActions) {
                this.logger.log(`Plan ${savedPlan.id} has fewer than ${limits.minActions} actions; the challenge context did not support more.`);
            }
            return { plan: savedPlan, items: savedItems };
        });
    }
    enforceCapacity(candidates, limits) {
        const active = [];
        const overflow = [];
        let usage = {
            actions: 0,
            essentials: 0,
            practices: 0,
            estimatedMinutes: 0,
        };
        for (const candidate of candidates) {
            if ((0, plan_capacity_1.wouldExceedCapacity)(usage, limits, candidate)) {
                overflow.push(candidate);
                continue;
            }
            const admitted = !candidate.isPractice &&
                candidate.priority === plan_enum_1.PlanItemPriority.ESSENTIAL &&
                usage.essentials >= limits.maxEssential
                ? { ...candidate, priority: plan_enum_1.PlanItemPriority.IMPORTANT }
                : candidate;
            active.push(admitted);
            usage = (0, plan_capacity_1.measureCapacity)(active);
        }
        if (usage.estimatedMinutes > limits.maxEstimatedMinutes) {
            this.logger.log(`Plan load is ${usage.estimatedMinutes} estimated minutes against a guideline of ${limits.maxEstimatedMinutes}; flagged for plan-fit review.`);
        }
        return { active, overflow };
    }
    async currentUsage(planId) {
        const rows = await this.items.find({
            where: {
                plan_id: planId,
                status: (0, typeorm_2.In)([...plan_enum_1.CAPACITY_CONSUMING_STATUSES]),
                deleted_at: (0, typeorm_2.IsNull)(),
            },
        });
        return (0, plan_capacity_1.measureCapacity)(rows.map((row) => ({
            priority: row.priority,
            isPractice: row.is_practice,
            estimatedMinutes: row.estimated_minutes,
        })));
    }
    async addItem(user, planId, input) {
        const plan = await this.findOwnedPlan(user.id, planId);
        if (plan.status !== plan_enum_1.PlanStatus.ACTIVE && plan.status !== plan_enum_1.PlanStatus.DRAFT) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `cannot add an item to a ${plan.status} plan`,
            });
        }
        const limits = (0, plan_capacity_1.planCapacityFor)(plan.plan_type);
        const usage = await this.currentUsage(plan.id);
        const candidate = {
            title: input.title.trim(),
            description: input.description?.trim() ?? null,
            whyThisMatters: null,
            category: input.category ?? plan_enum_1.PlanItemCategory.OTHER,
            priority: input.priority ?? plan_enum_1.PlanItemPriority.IMPORTANT,
            isPractice: false,
            estimatedMinutes: input.estimatedMinutes ?? null,
            sourceType: input.isCommitment
                ? plan_enum_1.PlanItemSource.USER_COMMITMENT
                : plan_enum_1.PlanItemSource.USER_CREATED,
            sourceRefId: null,
            mkaItemId: null,
            scenarioScope: plan_enum_1.PlanItemScenarioScope.SHARED_ACROSS_SCENARIOS,
            karmaEligible: false,
            realignmentPolicy: plan_enum_1.PlanItemRealignmentPolicy.ALWAYS_PRESERVE,
            scheduledDate: input.scheduledDate ?? plan.start_date,
            dueAt: null,
        };
        if ((0, plan_capacity_1.wouldExceedCapacity)(usage, limits, candidate)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: 'This plan is already as full as it usefully can be. Finish, move or remove something first.',
                internalDetail: `plan ${plan.id} at capacity: ${usage.actions}/${limits.maxActions} actions, ${usage.practices}/${limits.maxPractices} practices`,
            });
        }
        return this.dataSource.transaction(async (manager) => {
            const order = await manager.count(zuno_plan_item_entity_1.ZunoPlanItem, {
                where: { plan_id: plan.id },
            });
            const row = this.toRow(manager, plan, candidate, plan_enum_1.PlanItemStatus.PENDING, order);
            const saved = await manager.save(zuno_plan_item_entity_1.ZunoPlanItem, row);
            await this.recordItemEvent(manager, saved, {
                eventType: plan_enum_1.PlanItemEventType.CREATED,
                oldStatus: null,
                newStatus: saved.status,
                reason: null,
                source: plan_enum_1.PlanItemEventSource.USER,
            });
            return saved;
        });
    }
    candidatesFromMka(mkaItems, challenge, startDate) {
        return mkaItems.map((item) => {
            const isPractice = item.dimension === enums_1.MkaDimension.MIND ||
                item.dimension === enums_1.MkaDimension.KARMA;
            return {
                title: item.title,
                description: item.description,
                whyThisMatters: item.purpose,
                category: this.categoryFor(item, challenge),
                priority: this.priorityFor(item.priority),
                isPractice,
                estimatedMinutes: item.duration_minutes,
                sourceType: this.sourceFor(item.dimension),
                sourceRefId: item.id,
                mkaItemId: item.id,
                scenarioScope: plan_enum_1.PlanItemScenarioScope.SHARED_ACROSS_SCENARIOS,
                karmaEligible: item.karma_eligible,
                realignmentPolicy: isPractice
                    ? plan_enum_1.PlanItemRealignmentPolicy.PRESERVE_IF_RELEVANT
                    : plan_enum_1.PlanItemRealignmentPolicy.REPLACEABLE,
                scheduledDate: startDate,
                dueAt: null,
            };
        });
    }
    rank(candidates) {
        return [...candidates].sort((a, b) => {
            const byPriority = plan_enum_1.PLAN_ITEM_PRIORITY_RANK[a.priority] - plan_enum_1.PLAN_ITEM_PRIORITY_RANK[b.priority];
            if (byPriority !== 0)
                return byPriority;
            const byScope = scopeRank(a.scenarioScope) - scopeRank(b.scenarioScope);
            if (byScope !== 0)
                return byScope;
            const aDue = a.dueAt ? a.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
            const bDue = b.dueAt ? b.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
            if (aDue !== bDue)
                return aDue - bDue;
            return Number(a.isPractice) - Number(b.isPractice);
        });
    }
    categoryFor(item, challenge) {
        if (item.dimension === enums_1.MkaDimension.MIND)
            return plan_enum_1.PlanItemCategory.MIND;
        if (item.dimension === enums_1.MkaDimension.KARMA)
            return plan_enum_1.PlanItemCategory.KARMA;
        return DOMAIN_TO_CATEGORY[challenge.primary_domain ?? enums_1.ZunoDomain.GENERAL];
    }
    priorityFor(priority) {
        switch (priority) {
            case mka_enum_1.MkaPriority.ESSENTIAL:
                return plan_enum_1.PlanItemPriority.ESSENTIAL;
            case mka_enum_1.MkaPriority.OPTIONAL:
                return plan_enum_1.PlanItemPriority.OPTIONAL;
            default:
                return plan_enum_1.PlanItemPriority.IMPORTANT;
        }
    }
    sourceFor(dimension) {
        switch (dimension) {
            case enums_1.MkaDimension.MIND:
                return plan_enum_1.PlanItemSource.MKA_MIND;
            case enums_1.MkaDimension.KARMA:
                return plan_enum_1.PlanItemSource.MKA_KARMA;
            default:
                return plan_enum_1.PlanItemSource.MKA_ACTION;
        }
    }
    toRow(manager, plan, candidate, status, order) {
        return manager.create(zuno_plan_item_entity_1.ZunoPlanItem, {
            plan_id: plan.id,
            user_id: plan.user_id,
            parent_item_id: null,
            title: candidate.title,
            description: candidate.description,
            why_this_matters: candidate.whyThisMatters,
            category: candidate.category,
            priority: candidate.priority,
            priority_rank: plan_enum_1.PLAN_ITEM_PRIORITY_RANK[candidate.priority],
            is_practice: candidate.isPractice,
            status,
            scheduled_date: candidate.scheduledDate,
            due_at: candidate.dueAt,
            due_source: null,
            estimated_minutes: candidate.estimatedMinutes,
            source_type: candidate.sourceType,
            source_ref_id: candidate.sourceRefId,
            mka_item_id: candidate.mkaItemId,
            scenario_scope: candidate.scenarioScope,
            scenario_refs: [],
            trigger_condition: null,
            depends_on_item_ids: [],
            karma_eligible: candidate.karmaEligible,
            realignment_policy: candidate.realignmentPolicy,
            is_hypothetical: false,
            display_order: order,
            started_at: null,
            completed_at: null,
            deferred_to: null,
            blocked_reason: null,
            deferral_count: 0,
            user_note: null,
        });
    }
    async transitionItem(params) {
        const item = await this.findOwnedItem(params.user.id, params.itemId);
        const plan = await this.findOwnedPlan(params.user.id, item.plan_id);
        if (plan.status !== plan_enum_1.PlanStatus.ACTIVE && plan.status !== plan_enum_1.PlanStatus.DRAFT) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `plan ${plan.id} is ${plan.status}; it no longer accepts progress`,
            });
        }
        const from = item.status;
        const to = this.assertTransition(from, params.to);
        if (to === plan_enum_1.PlanItemStatus.IN_PROGRESS ||
            to === plan_enum_1.PlanItemStatus.DONE) {
            await this.assertDependenciesSatisfied(item);
        }
        if (from === to)
            return item;
        const now = this.clock.now();
        return this.dataSource.transaction(async (manager) => {
            item.status = to;
            if (to === plan_enum_1.PlanItemStatus.IN_PROGRESS && !item.started_at) {
                item.started_at = now;
            }
            if (to === plan_enum_1.PlanItemStatus.DONE) {
                item.completed_at = now;
            }
            if (to === plan_enum_1.PlanItemStatus.DEFERRED) {
                item.deferred_to = params.deferredTo ?? null;
                item.deferral_count += 1;
            }
            if (to === plan_enum_1.PlanItemStatus.BLOCKED) {
                item.blocked_reason = params.reason ?? null;
            }
            if (params.note !== undefined) {
                item.user_note = params.note;
            }
            const saved = await manager.save(zuno_plan_item_entity_1.ZunoPlanItem, item);
            await this.recordItemEvent(manager, saved, {
                eventType: plan_enum_1.PlanItemEventType.STATUS_CHANGED,
                oldStatus: from,
                newStatus: to,
                reason: params.reason ?? null,
                source: params.source ?? plan_enum_1.PlanItemEventSource.USER,
            });
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: params.user.id,
                userId: params.user.id,
                action: `PLAN_ITEM_${to}`,
                entityType: 'ZunoPlanItem',
                entityId: saved.id,
                before: { status: from },
                after: { status: to },
            });
            const eventType = ITEM_EVENT_FOR_STATUS[to];
            if (eventType) {
                await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                    aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.PLAN_ITEM,
                    aggregateId: saved.id,
                    eventType,
                    payload: {
                        plan_item_id: saved.id,
                        plan_id: plan.id,
                        challenge_id: plan.challenge_id,
                        user_id: params.user.id,
                        mka_item_id: saved.mka_item_id,
                        category: saved.category,
                        priority: saved.priority,
                        karma_eligible: saved.karma_eligible,
                        from_status: from,
                        to_status: to,
                    },
                });
            }
            if (to === plan_enum_1.PlanItemStatus.DEFERRED && saved.deferral_count >= 3) {
                await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                    aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.PLAN,
                    aggregateId: plan.id,
                    eventType: mka_plan_event_enum_1.MkaPlanEventType.PLAN_FIT_REVIEW,
                    payload: {
                        plan_id: plan.id,
                        user_id: params.user.id,
                        plan_item_id: saved.id,
                        deferral_count: saved.deferral_count,
                        reason: 'REPEATED_DEFERRAL',
                    },
                });
            }
            return saved;
        });
    }
    async completeItem(user, itemId, options = {}) {
        return this.transitionItem({
            user,
            itemId,
            to: plan_enum_1.PlanItemStatus.DONE,
            note: options.note,
        });
    }
    async deferItem(user, itemId, options = {}) {
        return this.transitionItem({
            user,
            itemId,
            to: plan_enum_1.PlanItemStatus.DEFERRED,
            deferredTo: options.to,
            reason: options.reason,
        });
    }
    async skipItem(user, itemId, options = {}) {
        return this.transitionItem({
            user,
            itemId,
            to: plan_enum_1.PlanItemStatus.SKIPPED,
            reason: options.reason,
        });
    }
    async startItem(user, itemId) {
        return this.transitionItem({
            user,
            itemId,
            to: plan_enum_1.PlanItemStatus.IN_PROGRESS,
        });
    }
    async blockItem(user, itemId, reason) {
        return this.transitionItem({
            user,
            itemId,
            to: plan_enum_1.PlanItemStatus.BLOCKED,
            reason,
        });
    }
    async assertDependenciesSatisfied(item) {
        const ids = item.depends_on_item_ids ?? [];
        if (ids.length === 0)
            return;
        const blockers = await this.items.find({
            where: { id: (0, typeorm_2.In)(ids), user_id: item.user_id },
        });
        const unmet = blockers.filter((b) => b.status !== plan_enum_1.PlanItemStatus.DONE);
        if (unmet.length > 0) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: 'Something else needs to happen before this one.',
                internalDetail: `plan item ${item.id} depends on unfinished items: ${unmet
                    .map((b) => b.id)
                    .join(',')}`,
            });
        }
    }
    assertTransition(from, to) {
        if (from === to)
            return to;
        if (!(0, plan_enum_1.canTransitionPlanItem)(from, to)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: 'That is not a change we can make to this one.',
                internalDetail: `illegal plan item transition ${from} -> ${to}`,
            });
        }
        return to;
    }
    async activate(user, planId, expectedVersion) {
        const plan = await this.findOwnedPlan(user.id, planId);
        this.ownership.assertVersion(plan, expectedVersion);
        const limits = (0, plan_capacity_1.planCapacityFor)(plan.plan_type);
        const usage = await this.currentUsage(plan.id);
        if (usage.actions > limits.maxActions || usage.practices > limits.maxPractices) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: 'This plan is asking for more than a week can hold.',
                internalDetail: `plan ${plan.id} over capacity at activation: ${usage.actions}/${limits.maxActions} actions, ${usage.practices}/${limits.maxPractices} practices`,
            });
        }
        return this.dataSource.transaction(async (manager) => {
            const before = plan.status;
            plan.status = this.assertPlanTransition(before, plan_enum_1.PlanStatus.ACTIVE);
            plan.activated_at = this.clock.now();
            const saved = await manager.save(zuno_plan_entity_1.ZunoPlan, plan);
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: user.id,
                userId: user.id,
                action: 'PLAN_ACTIVATED',
                entityType: 'ZunoPlan',
                entityId: plan.id,
                before: { status: before },
                after: { status: saved.status },
            });
            await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.PLAN,
                aggregateId: plan.id,
                eventType: mka_plan_event_enum_1.MkaPlanEventType.PLAN_ACTIVATED,
                payload: {
                    plan_id: plan.id,
                    user_id: user.id,
                    challenge_id: plan.challenge_id,
                },
            });
            return saved;
        });
    }
    async patch(user, planId, input) {
        const plan = await this.findOwnedPlan(user.id, planId);
        this.ownership.assertVersion(plan, input.version);
        return this.dataSource.transaction(async (manager) => {
            const before = { status: plan.status, title: plan.title };
            if (input.title !== undefined)
                plan.title = input.title.trim();
            if (input.primaryGoal !== undefined) {
                plan.primary_goal = input.primaryGoal.trim() || null;
            }
            if (input.status !== undefined) {
                plan.status = this.assertPlanTransition(plan.status, input.status);
                if (input.status === plan_enum_1.PlanStatus.COMPLETED) {
                    plan.completed_at = this.clock.now();
                }
            }
            const saved = await manager.save(zuno_plan_entity_1.ZunoPlan, plan);
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: user.id,
                userId: user.id,
                action: 'PLAN_PATCHED',
                entityType: 'ZunoPlan',
                entityId: plan.id,
                before,
                after: { status: saved.status, title: saved.title },
            });
            await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.PLAN,
                aggregateId: plan.id,
                eventType: saved.status === plan_enum_1.PlanStatus.COMPLETED
                    ? mka_plan_event_enum_1.MkaPlanEventType.PLAN_COMPLETED
                    : mka_plan_event_enum_1.MkaPlanEventType.PLAN_PATCHED,
                payload: {
                    plan_id: plan.id,
                    user_id: user.id,
                    challenge_id: plan.challenge_id,
                    status: saved.status,
                },
            });
            return saved;
        });
    }
    async supersede(manager, plan, userId) {
        const before = plan.status;
        plan.status = this.assertPlanTransition(before, plan_enum_1.PlanStatus.SUPERSEDED);
        const saved = await manager.save(zuno_plan_entity_1.ZunoPlan, plan);
        const openItems = await manager.find(zuno_plan_item_entity_1.ZunoPlanItem, {
            where: {
                plan_id: plan.id,
                status: (0, typeorm_2.In)([
                    plan_enum_1.PlanItemStatus.PENDING,
                    plan_enum_1.PlanItemStatus.IN_PROGRESS,
                    plan_enum_1.PlanItemStatus.DEFERRED,
                    plan_enum_1.PlanItemStatus.BLOCKED,
                    plan_enum_1.PlanItemStatus.CONDITIONAL,
                ]),
            },
        });
        for (const item of openItems) {
            const from = item.status;
            item.status = this.assertTransition(from, plan_enum_1.PlanItemStatus.CANCELLED_BY_REALIGNMENT);
            await manager.save(zuno_plan_item_entity_1.ZunoPlanItem, item);
            await this.recordItemEvent(manager, item, {
                eventType: plan_enum_1.PlanItemEventType.STATUS_CHANGED,
                oldStatus: from,
                newStatus: item.status,
                reason: 'Replaced by a newer version of this plan.',
                source: plan_enum_1.PlanItemEventSource.PLAN_ENGINE,
            });
        }
        await this.audit.record(manager, {
            actorType: 'SYSTEM',
            userId,
            action: 'PLAN_SUPERSEDED',
            entityType: 'ZunoPlan',
            entityId: plan.id,
            before: { status: before },
            after: { status: saved.status },
        });
        await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
            aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.PLAN,
            aggregateId: plan.id,
            eventType: mka_plan_event_enum_1.MkaPlanEventType.PLAN_SUPERSEDED,
            payload: {
                plan_id: plan.id,
                user_id: userId,
                challenge_id: plan.challenge_id,
                cancelled_item_count: openItems.length,
            },
        });
        return saved;
    }
    assertPlanTransition(from, to) {
        if (from === to)
            return to;
        if (!(0, plan_enum_1.canTransitionPlan)(from, to)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `illegal plan transition ${from} -> ${to}`,
            });
        }
        return to;
    }
    async findOwnedChallenge(userId, challengeId) {
        const challenge = await this.challenges.findOne({
            where: { id: challengeId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(challenge, userId, 'challenge');
    }
    async findOwnedPlan(userId, planId) {
        const plan = await this.plans.findOne({
            where: { id: planId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(plan, userId, 'plan');
    }
    async findOwnedItem(userId, itemId) {
        const item = await this.items.findOne({
            where: { id: itemId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(item, userId, 'plan item');
    }
    async findActivePlan(userId, challengeId, planType) {
        return this.plans.findOne({
            where: {
                user_id: userId,
                challenge_id: challengeId,
                plan_type: planType,
                status: (0, typeorm_2.In)([plan_enum_1.PlanStatus.DRAFT, plan_enum_1.PlanStatus.ACTIVE]),
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            order: { created_at: 'DESC' },
        });
    }
    async itemsFor(planId) {
        return this.items.find({
            where: { plan_id: planId, deleted_at: (0, typeorm_2.IsNull)() },
            order: { display_order: 'ASC' },
        });
    }
    async detail(user, planId) {
        const plan = await this.findOwnedPlan(user.id, planId);
        return { plan, items: await this.itemsFor(plan.id) };
    }
    async listForChallenge(user, challengeId) {
        await this.findOwnedChallenge(user.id, challengeId);
        return this.plans.find({
            where: { user_id: user.id, challenge_id: challengeId, deleted_at: (0, typeorm_2.IsNull)() },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }
    async list(userId) {
        return this.plans.find({
            where: { user_id: userId, deleted_at: (0, typeorm_2.IsNull)() },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }
    async historyFor(user, itemId) {
        await this.findOwnedItem(user.id, itemId);
        return this.itemEvents.find({
            where: { plan_item_id: itemId, user_id: user.id },
            order: { created_at: 'ASC' },
        });
    }
    async recordItemEvent(manager, item, input) {
        const row = manager.create(zuno_plan_item_event_entity_1.ZunoPlanItemEvent, {
            plan_item_id: item.id,
            plan_id: item.plan_id,
            user_id: item.user_id,
            event_type: input.eventType,
            old_status: input.oldStatus,
            new_status: input.newStatus,
            reason: input.reason,
            source: input.source,
            redacted_at: null,
        });
        await manager.save(zuno_plan_item_event_entity_1.ZunoPlanItemEvent, row);
    }
    horizonWindow(planType) {
        const start = this.clock.now();
        const startDate = start.toISOString().slice(0, 10);
        const days = HORIZON_DAYS[planType];
        if (days === null)
            return { startDate, endDate: null };
        const end = new Date(start.getTime());
        end.setUTCDate(end.getUTCDate() + days - 1);
        return { startDate, endDate: end.toISOString().slice(0, 10) };
    }
    planTitle(planType) {
        return PLAN_TITLES[planType];
    }
};
exports.PlanService = PlanService;
exports.PlanService = PlanService = PlanService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_plan_entity_1.ZunoPlan)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_plan_item_entity_1.ZunoPlanItem)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_plan_item_event_entity_1.ZunoPlanItemEvent)),
    __param(3, (0, typeorm_1.InjectRepository)(zuno_challenge_entity_1.ZunoChallenge)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mka_service_1.MkaService,
        safety_service_1.SafetyService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], PlanService);
const HORIZON_DAYS = {
    [plan_enum_1.PlanType.TODAY]: 1,
    [plan_enum_1.PlanType.WEEKLY]: 7,
    [plan_enum_1.PlanType.THIRTY_DAY]: 30,
    [plan_enum_1.PlanType.LONG_TERM]: 90,
    [plan_enum_1.PlanType.CUSTOM]: 7,
};
const PLAN_TITLES = {
    [plan_enum_1.PlanType.TODAY]: 'Today',
    [plan_enum_1.PlanType.WEEKLY]: 'This week',
    [plan_enum_1.PlanType.THIRTY_DAY]: 'The next 30 days',
    [plan_enum_1.PlanType.LONG_TERM]: 'The direction from here',
    [plan_enum_1.PlanType.CUSTOM]: 'Your plan',
};
const ITEM_EVENT_FOR_STATUS = {
    [plan_enum_1.PlanItemStatus.IN_PROGRESS]: mka_plan_event_enum_1.MkaPlanEventType.PLAN_ITEM_STARTED,
    [plan_enum_1.PlanItemStatus.DONE]: mka_plan_event_enum_1.MkaPlanEventType.PLAN_ITEM_COMPLETED,
    [plan_enum_1.PlanItemStatus.DEFERRED]: mka_plan_event_enum_1.MkaPlanEventType.PLAN_ITEM_DEFERRED,
    [plan_enum_1.PlanItemStatus.SKIPPED]: mka_plan_event_enum_1.MkaPlanEventType.PLAN_ITEM_SKIPPED,
    [plan_enum_1.PlanItemStatus.BLOCKED]: mka_plan_event_enum_1.MkaPlanEventType.PLAN_ITEM_BLOCKED,
};
const DOMAIN_TO_CATEGORY = {
    [enums_1.ZunoDomain.CAREER]: plan_enum_1.PlanItemCategory.CAREER,
    [enums_1.ZunoDomain.FINANCE]: plan_enum_1.PlanItemCategory.FINANCE,
    [enums_1.ZunoDomain.BUSINESS]: plan_enum_1.PlanItemCategory.BUSINESS,
    [enums_1.ZunoDomain.EDUCATION]: plan_enum_1.PlanItemCategory.EDUCATION,
    [enums_1.ZunoDomain.RELATIONSHIP]: plan_enum_1.PlanItemCategory.RELATIONSHIP,
    [enums_1.ZunoDomain.MARRIAGE]: plan_enum_1.PlanItemCategory.RELATIONSHIP,
    [enums_1.ZunoDomain.FAMILY]: plan_enum_1.PlanItemCategory.FAMILY,
    [enums_1.ZunoDomain.HEALTH_WELLBEING]: plan_enum_1.PlanItemCategory.HEALTH_SUPPORT,
    [enums_1.ZunoDomain.PROPERTY]: plan_enum_1.PlanItemCategory.PROPERTY,
    [enums_1.ZunoDomain.LEGAL]: plan_enum_1.PlanItemCategory.LEGAL_SUPPORT,
    [enums_1.ZunoDomain.TRAVEL]: plan_enum_1.PlanItemCategory.PREPARATION,
    [enums_1.ZunoDomain.FOREIGN_RESIDENCE]: plan_enum_1.PlanItemCategory.LEGAL_SUPPORT,
    [enums_1.ZunoDomain.PERSONAL_GROWTH]: plan_enum_1.PlanItemCategory.PREPARATION,
    [enums_1.ZunoDomain.GENERAL]: plan_enum_1.PlanItemCategory.OTHER,
};
function scopeRank(scope) {
    switch (scope) {
        case plan_enum_1.PlanItemScenarioScope.SHARED_ACROSS_SCENARIOS:
            return 0;
        case plan_enum_1.PlanItemScenarioScope.SCENARIO_SPECIFIC:
            return 1;
        default:
            return 2;
    }
}
//# sourceMappingURL=plan.service.js.map