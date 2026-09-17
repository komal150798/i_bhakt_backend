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
var KarmaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarmaService = exports.KARMA_MIN_PATTERN_EVIDENCE = exports.KARMA_EMITTED_EVENTS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_karma_entry_entity_1 = require("../entities/zuno-karma-entry.entity");
const zuno_karma_entry_revision_entity_1 = require("../entities/zuno-karma-entry-revision.entity");
const zuno_karma_pattern_entity_1 = require("../entities/zuno-karma-pattern.entity");
const karma_enum_1 = require("../enums/karma.enum");
const karma_classifier_port_1 = require("../ports/karma-classifier.port");
const karma_source_port_1 = require("../ports/karma-source.port");
const karma_scoring_1 = require("../scoring/karma-scoring");
const neutrality_1 = require("../neutrality");
const safety_service_1 = require("../../safety/services/safety.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const rulebook_repository_service_1 = require("../../rulebook/services/rulebook-repository.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
exports.KARMA_EMITTED_EVENTS = {
    ENTRY_CREATED: 'zuno.karma.entry_created',
    ENTRY_CLASSIFIED: 'zuno.karma.entry_classified',
    ENTRY_CORRECTED: 'zuno.karma.entry_corrected',
    ENTRY_DELETED: 'zuno.karma.entry_deleted',
    PATTERN_DETECTED: 'zuno.karma.pattern_detected',
};
const KARMA_AGGREGATE = 'KARMA_ENTRY';
exports.KARMA_MIN_PATTERN_EVIDENCE = 3;
const PATTERN_WINDOW_DAYS = 30;
const SCORING_LOOKBACK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
let KarmaService = KarmaService_1 = class KarmaService {
    constructor(entries, patterns, classifier, source, safety, outbox, audit, ownership, rulebook, clock, dataSource) {
        this.entries = entries;
        this.patterns = patterns;
        this.classifier = classifier;
        this.source = source;
        this.safety = safety;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.rulebook = rulebook;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(KarmaService_1.name);
    }
    async createUserEntry(params) {
        const text = (params.text ?? '').trim();
        if (text.length === 0) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'text', code: 'REQUIRED' }]);
        }
        if (text.length > 5000) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'text', code: 'TOO_LONG' }]);
        }
        const assessment = this.safety.preCheck({
            operation: 'KARMA_ENTRY_CREATE',
            userId: params.userId,
            text,
            domains: [],
        });
        if (assessment.blocked) {
            await this.routeToSafety(params.userId, assessment, 'KARMA_ENTRY_CREATE');
        }
        const occurredAt = params.occurredAt ?? this.clock.now();
        const duplicate = await this.findUserTextDuplicate(params.userId, text, occurredAt);
        if (duplicate) {
            return {
                entry: duplicate,
                confirmationRequired: false,
                explanation: neutrality_1.KARMA_COPY.alreadyRecorded,
            };
        }
        const interpretation = await this.classifier.classify({
            text,
            source: karma_enum_1.KarmaEntrySource.USER_CREATED,
        });
        return this.dataSource.transaction(async (manager) => {
            const entry = await this.record(manager, {
                userId: params.userId,
                source: karma_enum_1.KarmaEntrySource.USER_CREATED,
                sourceEventId: null,
                challengeId: params.challengeId ?? null,
                planItemId: null,
                mkaItemId: null,
                rawText: text,
                occurredAt,
                interpretation,
                allowUnconstructive: true,
            });
            return {
                entry,
                confirmationRequired: !entry.user_confirmed,
                explanation: this.explanationFor(entry),
            };
        });
    }
    async handleActionCompleted(payload) {
        const problems = (0, karma_source_port_1.validateActionCompletedPayload)(payload);
        if (problems.length > 0) {
            this.logger.warn(`Rejected a karma action-completed event: invalid ${problems.join(',')}`);
            return {
                result: karma_enum_1.KarmaIngestResult.INVALID_EVENT,
                message: neutrality_1.KARMA_COPY.notLedgerEligible,
            };
        }
        const event = payload;
        const confirmed = await this.source.describeCompletedAction(event.user_id, {
            source: event.source,
            planItemId: event.plan_item_id ?? null,
            mkaItemId: event.mka_item_id ?? null,
        });
        if (confirmed && confirmed.userId !== event.user_id) {
            this.logger.warn('Rejected a karma action-completed event whose owner did not match the upstream record');
            return {
                result: karma_enum_1.KarmaIngestResult.INVALID_EVENT,
                message: neutrality_1.KARMA_COPY.notLedgerEligible,
            };
        }
        const outcome = confirmed?.outcome ?? event.outcome;
        const eligible = confirmed?.karmaLedgerEligible ?? event.karma_ledger_eligible;
        const astrologyDerived = confirmed?.astrologyDerived ?? event.astrology_derived ?? false;
        if (karma_enum_1.NON_PENALISING_OUTCOMES.includes(outcome)) {
            return {
                result: karma_enum_1.KarmaIngestResult.NO_PENALTY,
                message: this.nonPenalisingMessage(outcome),
            };
        }
        if (outcome !== karma_enum_1.KarmaActionOutcome.COMPLETED) {
            return {
                result: karma_enum_1.KarmaIngestResult.NO_PENALTY,
                message: neutrality_1.KARMA_COPY.actionNotCompleted,
            };
        }
        if (eligible !== true) {
            return {
                result: karma_enum_1.KarmaIngestResult.NOT_ELIGIBLE,
                message: neutrality_1.KARMA_COPY.notLedgerEligible,
            };
        }
        if (astrologyDerived) {
            const available = await this.isInterpretationAvailable();
            if (!available) {
                this.logger.debug('Skipped an astrology-derived karma candidate: no approved Rulebook is active');
                return {
                    result: karma_enum_1.KarmaIngestResult.INTERPRETATION_UNAVAILABLE,
                    message: neutrality_1.KARMA_COPY.interpretationUnavailable,
                };
            }
        }
        const existing = await this.findIngestDuplicate(event);
        if (existing) {
            return {
                result: karma_enum_1.KarmaIngestResult.DUPLICATE,
                entryId: existing.id,
                message: neutrality_1.KARMA_COPY.alreadyRecorded,
            };
        }
        const label = this.truncateLabel(confirmed?.actionLabel ?? event.action_label ?? null);
        if (label) {
            const assessment = this.safety.preCheck({
                operation: 'KARMA_ACTION_COMPLETED',
                userId: event.user_id,
                text: label,
                domains: [],
            });
            if (assessment.blocked) {
                await this.dataSource.transaction(async (manager) => {
                    const decision = await this.safety.recordDecision(manager, {
                        userId: event.user_id,
                        operation: 'KARMA_ACTION_COMPLETED',
                        assessment,
                    });
                    await this.safety.recordIncident(manager, {
                        userId: event.user_id,
                        safetyDecisionId: decision.id,
                        source: 'KARMA_ACTION_COMPLETED',
                        severity: assessment.riskLevel,
                        violations: [],
                    });
                });
                return {
                    result: karma_enum_1.KarmaIngestResult.SAFETY_ROUTED,
                    message: neutrality_1.KARMA_COPY.safetyRouted,
                };
            }
        }
        const interpretation = await this.classifier.classify({
            text: label ?? '',
            source: event.source,
            suggestedCategory: confirmed?.suggestedCategory ?? event.suggested_category,
            effortHint: confirmed?.effort ?? event.effort,
            relevanceHint: confirmed?.relevance ?? event.relevance,
        });
        const shaped = astrologyDerived
            ? {
                ...interpretation,
                category: karma_enum_1.KarmaCategory.CONSISTENCY,
                intent: karma_enum_1.KarmaIntent.INTENTIONAL_PRACTICE,
            }
            : interpretation;
        const entry = await this.dataSource.transaction(async (manager) => this.record(manager, {
            userId: event.user_id,
            source: event.source,
            sourceEventId: event.event_id,
            challengeId: confirmed?.challengeId ?? event.challenge_id ?? null,
            planItemId: event.plan_item_id ?? null,
            mkaItemId: event.mka_item_id ?? null,
            rawText: label,
            occurredAt: new Date(event.completed_at),
            interpretation: shaped,
            allowUnconstructive: false,
        }));
        return {
            result: karma_enum_1.KarmaIngestResult.RECORDED,
            entryId: entry.id,
            message: this.explanationFor(entry),
        };
    }
    async record(manager, input) {
        const now = this.clock.now();
        const interpretation = input.interpretation;
        let classification = (0, karma_scoring_1.withConfidenceFloor)(interpretation.classification, interpretation.confidence);
        if (!input.allowUnconstructive &&
            !karma_enum_1.SYSTEM_SOURCED_CLASSIFICATIONS.includes(classification)) {
            classification = karma_enum_1.KarmaClassification.NEUTRAL;
        }
        const recent = await this.recentEntriesFor(manager, input.userId, now);
        const breakdown = this.score(classification, interpretation, recent, now);
        const entry = manager.create(zuno_karma_entry_entity_1.ZunoKarmaEntry, {
            user_id: input.userId,
            challenge_id: input.challengeId,
            plan_item_id: input.planItemId,
            mka_item_id: input.mkaItemId,
            source: input.source,
            source_event_id: input.sourceEventId,
            raw_text: input.rawText,
            classification,
            category: interpretation.category,
            intent: interpretation.intent,
            impact_scope: interpretation.impactScope,
            points: breakdown.points,
            confidence: interpretation.confidence.toFixed(3),
            user_confirmed: !(0, karma_scoring_1.requiresUserConfirmation)(interpretation.confidence),
            visibility: karma_enum_1.KarmaVisibility.PRIVATE,
            scoring_model_version: breakdown.scoringModelVersion,
            classification_model_version: interpretation.modelVersion,
            score_factors: breakdown.factors,
            evidence: interpretation.evidence,
            status: karma_enum_1.KarmaEntryStatus.ACTIVE,
            occurred_at: input.occurredAt,
            redacted_at: null,
        });
        const saved = await manager.save(zuno_karma_entry_entity_1.ZunoKarmaEntry, entry);
        await this.audit.record(manager, {
            actorType: karma_enum_1.SYSTEM_KARMA_SOURCES.includes(input.source) ? 'SYSTEM' : 'USER',
            actorId: input.userId,
            userId: input.userId,
            action: 'KARMA_ENTRY_CREATED',
            entityType: 'ZunoKarmaEntry',
            entityId: saved.id,
            after: {
                classification: saved.classification,
                category: saved.category,
                points: saved.points,
            },
            metadata: {
                scoringModelVersion: saved.scoring_model_version,
                classificationModelVersion: saved.classification_model_version,
            },
        });
        await this.outbox.enqueueMany(manager, [
            {
                aggregateType: KARMA_AGGREGATE,
                aggregateId: saved.id,
                eventType: exports.KARMA_EMITTED_EVENTS.ENTRY_CREATED,
                payload: {
                    karma_entry_id: saved.id,
                    user_id: saved.user_id,
                    source: saved.source,
                    source_event_id: saved.source_event_id,
                    challenge_id: saved.challenge_id,
                },
            },
            {
                aggregateType: KARMA_AGGREGATE,
                aggregateId: saved.id,
                eventType: exports.KARMA_EMITTED_EVENTS.ENTRY_CLASSIFIED,
                payload: {
                    karma_entry_id: saved.id,
                    user_id: saved.user_id,
                    classification: saved.classification,
                    category: saved.category,
                    points: saved.points,
                    scoring_model_version: saved.scoring_model_version,
                    classification_model_version: saved.classification_model_version,
                },
            },
        ]);
        await this.refreshPatterns(manager, input.userId, [...recent, saved], now);
        return saved;
    }
    score(classification, interpretation, recent, now) {
        const dayStart = startOfUtcDay(now);
        const windowStart = new Date(now.getTime() - karma_scoring_1.KARMA_SCORING_V1.repetitionWindowDays * DAY_MS);
        const pointsRecordedToday = recent
            .filter((entry) => entry.created_at >= dayStart && countsTowardProgress(entry))
            .reduce((total, entry) => total + (entry.points ?? 0), 0);
        const priorInCategoryInWindow = recent.filter((entry) => entry.category === interpretation.category &&
            entry.created_at >= windowStart &&
            countsTowardProgress(entry)).length;
        return (0, karma_scoring_1.calculateKarmaPoints)({
            classification,
            category: interpretation.category,
            intent: interpretation.intent,
            effort: interpretation.effort,
            relevance: interpretation.relevance,
            priorInCategoryInWindow,
            pointsRecordedToday,
        }, karma_scoring_1.KARMA_SCORING_V1);
    }
    async list(params) {
        const where = {
            user_id: params.userId,
            deleted_at: (0, typeorm_2.IsNull)(),
            status: (0, typeorm_2.Not)(karma_enum_1.KarmaEntryStatus.DELETED),
        };
        if (params.category)
            where.category = params.category;
        if (params.classification)
            where.classification = params.classification;
        if (params.source)
            where.source = params.source;
        if (params.challengeId)
            where.challenge_id = params.challengeId;
        const cursorDate = params.cursor ? decodeCursor(params.cursor) : null;
        const upperBound = cursorDate ?? params.to ?? null;
        if (upperBound && params.from) {
            where.created_at = betweenExclusiveUpper(params.from, upperBound);
        }
        else if (upperBound) {
            where.created_at = (0, typeorm_2.LessThan)(upperBound);
        }
        else if (params.from) {
            where.created_at = (0, typeorm_2.MoreThanOrEqual)(params.from);
        }
        const rows = await this.entries.find({
            where,
            order: { created_at: 'DESC', id: 'DESC' },
            take: params.limit + 1,
        });
        const hasMore = rows.length > params.limit;
        const items = hasMore ? rows.slice(0, params.limit) : rows;
        const nextCursor = hasMore
            ? encodeCursor(items[items.length - 1].created_at)
            : null;
        return { items, nextCursor };
    }
    async findOwned(userId, entryId) {
        const entry = await this.entries.findOne({
            where: { id: entryId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        const owned = this.ownership.require(entry, userId, 'karma entry');
        if (owned.status === karma_enum_1.KarmaEntryStatus.DELETED) {
            throw zuno_exception_1.ZunoException.notFound('karma entry is deleted');
        }
        return owned;
    }
    async summary(userId) {
        const now = this.clock.now();
        const weekStart = new Date(startOfUtcDay(now).getTime() - 6 * DAY_MS);
        const dayStart = startOfUtcDay(now);
        const rows = await this.entries.find({
            where: {
                user_id: userId,
                deleted_at: (0, typeorm_2.IsNull)(),
                status: (0, typeorm_2.Not)(karma_enum_1.KarmaEntryStatus.DELETED),
                created_at: (0, typeorm_2.MoreThanOrEqual)(weekStart),
            },
            order: { created_at: 'DESC' },
        });
        const week = rows.filter(countsTowardProgress);
        const today = week.filter((entry) => entry.created_at >= dayStart);
        const categoryTotals = new Map();
        for (const entry of week) {
            categoryTotals.set(entry.category, (categoryTotals.get(entry.category) ?? 0) + 1);
        }
        let topCategory = null;
        let topCount = 0;
        for (const [category, count] of categoryTotals) {
            if (count > topCount) {
                topCategory = category;
                topCount = count;
            }
        }
        const daysActive = new Set(week.map((entry) => entry.created_at.toISOString().slice(0, 10))).size;
        const observed = await this.patterns.find({
            where: { user_id: userId, status: karma_enum_1.KarmaPatternStatus.OBSERVED },
            order: { last_observed_at: 'DESC' },
        });
        return {
            pointsLabel: neutrality_1.KARMA_POINTS_LABEL,
            framing: neutrality_1.KARMA_SCORE_FRAMING,
            today: {
                entriesRecorded: today.length,
                points: today.reduce((total, entry) => total + entry.points, 0),
            },
            thisWeek: {
                entriesRecorded: week.length,
                points: week.reduce((total, entry) => total + entry.points, 0),
                daysActive,
                topCategory,
                repairActions: week.filter((entry) => entry.category === karma_enum_1.KarmaCategory.REPAIR).length,
            },
            patterns: observed.map((pattern) => ({
                patternType: pattern.pattern_type,
                evidenceCount: pattern.evidence_count,
                lastObservedAt: pattern.last_observed_at.toISOString(),
            })),
        };
    }
    async correct(userId, entryId, params) {
        const entry = await this.findOwned(userId, entryId);
        this.ownership.assertVersion(entry, params.version);
        const before = snapshot(entry);
        const firstCorrection = entry.status === karma_enum_1.KarmaEntryStatus.ACTIVE;
        if (params.classification)
            entry.classification = params.classification;
        if (params.category)
            entry.category = params.category;
        if (params.intent)
            entry.intent = params.intent;
        const textChanged = typeof params.text === 'string' && params.text.trim() !== entry.raw_text;
        if (typeof params.text === 'string') {
            const text = params.text.trim();
            if (text.length === 0) {
                throw zuno_exception_1.ZunoException.validation([{ field: 'text', code: 'REQUIRED' }]);
            }
            if (text.length > 5000) {
                throw zuno_exception_1.ZunoException.validation([{ field: 'text', code: 'TOO_LONG' }]);
            }
            const assessment = this.safety.preCheck({
                operation: 'KARMA_ENTRY_CORRECT',
                userId,
                text,
                domains: [],
            });
            if (assessment.blocked) {
                await this.routeToSafety(userId, assessment, 'KARMA_ENTRY_CORRECT');
            }
            entry.raw_text = text;
        }
        entry.user_confirmed = true;
        entry.status = karma_enum_1.KarmaEntryStatus.EDITED;
        const now = this.clock.now();
        return this.dataSource.transaction(async (manager) => {
            if (firstCorrection && params.classification) {
                const recent = await this.recentEntriesFor(manager, userId, now);
                const recomputed = (0, karma_scoring_1.calculateKarmaPoints)({
                    classification: entry.classification,
                    category: entry.category,
                    intent: entry.intent ?? karma_enum_1.KarmaIntent.UNKNOWN,
                    effort: effortFromFactors(entry),
                    relevance: relevanceFromFactors(entry),
                    priorInCategoryInWindow: recent.filter((row) => row.id !== entry.id &&
                        row.category === entry.category &&
                        countsTowardProgress(row)).length,
                    pointsRecordedToday: recent
                        .filter((row) => row.id !== entry.id &&
                        row.created_at >= startOfUtcDay(now) &&
                        countsTowardProgress(row))
                        .reduce((total, row) => total + row.points, 0),
                }, karma_scoring_1.KARMA_SCORING_V1);
                entry.points = Math.max(entry.points, recomputed.points);
                entry.score_factors = [
                    ...recomputed.factors,
                    { factor: 'USER_CORRECTION', value: 1 },
                ];
            }
            const saved = await manager.save(zuno_karma_entry_entity_1.ZunoKarmaEntry, entry);
            const revision = manager.create(zuno_karma_entry_revision_entity_1.ZunoKarmaEntryRevision, {
                karma_entry_id: saved.id,
                user_id: userId,
                previous_value: before,
                new_value: snapshot(saved),
                changed_by: karma_enum_1.KarmaRevisionActor.USER,
                reason: params.comment ?? null,
                raw_text_changed: textChanged,
                redacted_at: null,
            });
            await manager.save(zuno_karma_entry_revision_entity_1.ZunoKarmaEntryRevision, revision);
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: userId,
                userId,
                action: 'KARMA_ENTRY_CORRECTED',
                entityType: 'ZunoKarmaEntry',
                entityId: saved.id,
                before,
                after: snapshot(saved),
            });
            await this.outbox.enqueue(manager, {
                aggregateType: KARMA_AGGREGATE,
                aggregateId: saved.id,
                eventType: exports.KARMA_EMITTED_EVENTS.ENTRY_CORRECTED,
                payload: {
                    karma_entry_id: saved.id,
                    user_id: userId,
                    classification: saved.classification,
                    category: saved.category,
                    accepted: params.accepted ?? null,
                },
            });
            return saved;
        });
    }
    async remove(userId, entryId) {
        const entry = await this.findOwned(userId, entryId);
        const before = snapshot(entry);
        const now = this.clock.now();
        await this.dataSource.transaction(async (manager) => {
            entry.status = karma_enum_1.KarmaEntryStatus.DELETED;
            entry.raw_text = null;
            entry.redacted_at = now;
            entry.deleted_at = now;
            const saved = await manager.save(zuno_karma_entry_entity_1.ZunoKarmaEntry, entry);
            const revision = manager.create(zuno_karma_entry_revision_entity_1.ZunoKarmaEntryRevision, {
                karma_entry_id: saved.id,
                user_id: userId,
                previous_value: before,
                new_value: snapshot(saved),
                changed_by: karma_enum_1.KarmaRevisionActor.USER,
                reason: null,
                raw_text_changed: true,
                redacted_at: null,
            });
            await manager.save(zuno_karma_entry_revision_entity_1.ZunoKarmaEntryRevision, revision);
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: userId,
                userId,
                action: 'KARMA_ENTRY_DELETED',
                entityType: 'ZunoKarmaEntry',
                entityId: saved.id,
                before,
                after: snapshot(saved),
            });
            await this.outbox.enqueue(manager, {
                aggregateType: KARMA_AGGREGATE,
                aggregateId: saved.id,
                eventType: exports.KARMA_EMITTED_EVENTS.ENTRY_DELETED,
                payload: { karma_entry_id: saved.id, user_id: userId },
            });
        });
    }
    async refreshPatterns(manager, userId, entries, now) {
        const windowStart = new Date(now.getTime() - PATTERN_WINDOW_DAYS * DAY_MS);
        const considered = entries.filter((entry) => entry.created_at >= windowStart && countsTowardProgress(entry));
        if (considered.length < exports.KARMA_MIN_PATTERN_EVIDENCE)
            return;
        const counts = [
            {
                type: karma_enum_1.KarmaPatternType.FOLLOW_THROUGH_INCREASING,
                evidence: considered.filter((entry) => entry.intent === karma_enum_1.KarmaIntent.FOLLOW_THROUGH).length,
            },
            {
                type: karma_enum_1.KarmaPatternType.SERVICE_CONSISTENT,
                evidence: considered.filter((entry) => entry.category === karma_enum_1.KarmaCategory.SERVICE).length,
            },
            {
                type: karma_enum_1.KarmaPatternType.REPAIR_BEHAVIOUR_INCREASING,
                evidence: considered.filter((entry) => entry.category === karma_enum_1.KarmaCategory.REPAIR).length,
            },
            {
                type: karma_enum_1.KarmaPatternType.STUDY_DISCIPLINE_IMPROVING,
                evidence: considered.filter((entry) => entry.category === karma_enum_1.KarmaCategory.LEARNING).length,
            },
            {
                type: karma_enum_1.KarmaPatternType.CONSISTENCY_STEADY,
                evidence: new Set(considered.map((entry) => entry.created_at.toISOString().slice(0, 10))).size,
            },
        ];
        for (const candidate of counts) {
            if (candidate.evidence < exports.KARMA_MIN_PATTERN_EVIDENCE)
                continue;
            const existing = await manager.findOne(zuno_karma_pattern_entity_1.ZunoKarmaPattern, {
                where: { user_id: userId, pattern_type: candidate.type },
            });
            if (existing) {
                existing.evidence_count = candidate.evidence;
                existing.last_observed_at = now;
                existing.status = karma_enum_1.KarmaPatternStatus.OBSERVED;
                existing.confidence = patternConfidence(candidate.evidence);
                await manager.save(zuno_karma_pattern_entity_1.ZunoKarmaPattern, existing);
                continue;
            }
            const pattern = manager.create(zuno_karma_pattern_entity_1.ZunoKarmaPattern, {
                user_id: userId,
                challenge_id: null,
                pattern_type: candidate.type,
                evidence_count: candidate.evidence,
                confidence: patternConfidence(candidate.evidence),
                status: karma_enum_1.KarmaPatternStatus.OBSERVED,
                first_observed_at: now,
                last_observed_at: now,
            });
            const saved = await manager.save(zuno_karma_pattern_entity_1.ZunoKarmaPattern, pattern);
            await this.outbox.enqueue(manager, {
                aggregateType: KARMA_AGGREGATE,
                aggregateId: saved.id,
                eventType: exports.KARMA_EMITTED_EVENTS.PATTERN_DETECTED,
                payload: {
                    karma_pattern_id: saved.id,
                    user_id: userId,
                    pattern_type: saved.pattern_type,
                    evidence_count: saved.evidence_count,
                },
            });
        }
    }
    async isInterpretationAvailable() {
        try {
            return await this.rulebook.isAstrologyAvailable();
        }
        catch (error) {
            this.logger.warn(`Rulebook availability check failed; treating astrology-derived karma as unavailable: ${error instanceof Error ? error.name : 'unknown'}`);
            return false;
        }
    }
    async routeToSafety(userId, assessment, operation) {
        await this.dataSource.transaction(async (manager) => {
            const decision = await this.safety.recordDecision(manager, {
                userId,
                operation,
                assessment,
            });
            await this.safety.recordIncident(manager, {
                userId,
                safetyDecisionId: decision.id,
                source: operation,
                severity: assessment.riskLevel,
                violations: [],
            });
        });
        throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
            message: assessment.boundaryMessage ?? neutrality_1.KARMA_COPY.safetyRouted,
            safety: {
                disposition: assessment.disposition,
                domain: assessment.domains[0],
            },
        });
    }
    async findIngestDuplicate(event) {
        const byEvent = await this.entries.findOne({
            where: {
                user_id: event.user_id,
                source_event_id: event.event_id,
                deleted_at: (0, typeorm_2.IsNull)(),
            },
        });
        if (byEvent)
            return byEvent;
        if (event.plan_item_id) {
            return this.entries.findOne({
                where: {
                    user_id: event.user_id,
                    plan_item_id: event.plan_item_id,
                    deleted_at: (0, typeorm_2.IsNull)(),
                },
            });
        }
        if (event.mka_item_id) {
            return this.entries.findOne({
                where: {
                    user_id: event.user_id,
                    mka_item_id: event.mka_item_id,
                    deleted_at: (0, typeorm_2.IsNull)(),
                },
            });
        }
        return null;
    }
    async findUserTextDuplicate(userId, text, occurredAt) {
        const dayStart = startOfUtcDay(occurredAt);
        const rows = await this.entries.find({
            where: {
                user_id: userId,
                deleted_at: (0, typeorm_2.IsNull)(),
                occurred_at: (0, typeorm_2.MoreThanOrEqual)(dayStart),
            },
        });
        const normalised = normaliseText(text);
        return (rows.find((row) => row.status !== karma_enum_1.KarmaEntryStatus.DELETED &&
            row.raw_text !== null &&
            normaliseText(row.raw_text) === normalised) ?? null);
    }
    async recentEntriesFor(manager, userId, now) {
        const since = new Date(now.getTime() - SCORING_LOOKBACK_DAYS * DAY_MS);
        return manager.find(zuno_karma_entry_entity_1.ZunoKarmaEntry, {
            where: {
                user_id: userId,
                deleted_at: (0, typeorm_2.IsNull)(),
                created_at: (0, typeorm_2.MoreThanOrEqual)(since),
            },
        });
    }
    explanationFor(entry) {
        const text = entry.points > 0
            ? `${entry.points} ${neutrality_1.KARMA_POINTS_LABEL} recorded for this action.`
            : 'Recorded in your ledger.';
        (0, neutrality_1.assertNeutralCopy)(text, 'KarmaService.explanationFor');
        return text;
    }
    nonPenalisingMessage(outcome) {
        switch (outcome) {
            case karma_enum_1.KarmaActionOutcome.CANCELLED_BY_REALIGNMENT:
                return neutrality_1.KARMA_COPY.cancelledByRealignment;
            case karma_enum_1.KarmaActionOutcome.DEFERRED:
                return neutrality_1.KARMA_COPY.actionDeferred;
            default:
                return neutrality_1.KARMA_COPY.actionNotCompleted;
        }
    }
    truncateLabel(label) {
        if (!label)
            return null;
        const trimmed = label.trim();
        if (trimmed.length === 0)
            return null;
        return trimmed.slice(0, karma_source_port_1.KARMA_ACTION_LABEL_MAX_LENGTH);
    }
};
exports.KarmaService = KarmaService;
exports.KarmaService = KarmaService = KarmaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_karma_entry_entity_1.ZunoKarmaEntry)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_karma_pattern_entity_1.ZunoKarmaPattern)),
    __param(2, (0, common_1.Inject)(karma_classifier_port_1.KARMA_CLASSIFIER)),
    __param(3, (0, common_1.Inject)(karma_source_port_1.KARMA_SOURCE_PORT)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, Object, Object, safety_service_1.SafetyService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        rulebook_repository_service_1.RulebookRepositoryService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], KarmaService);
function countsTowardProgress(entry) {
    return (entry.status !== karma_enum_1.KarmaEntryStatus.DELETED &&
        entry.status !== karma_enum_1.KarmaEntryStatus.SUPERSEDED &&
        entry.redacted_at === null);
}
function snapshot(entry) {
    return {
        classification: entry.classification,
        category: entry.category,
        intent: entry.intent,
        impact_scope: entry.impact_scope,
        points: entry.points,
        confidence: entry.confidence,
        status: entry.status,
        user_confirmed: entry.user_confirmed,
        scoring_model_version: entry.scoring_model_version,
        classification_model_version: entry.classification_model_version,
    };
}
function patternConfidence(evidence) {
    return Math.min(0.9, 0.5 + evidence * 0.05).toFixed(3);
}
function effortFromFactors(entry) {
    const factor = entry.score_factors.find((item) => item.factor.startsWith('EFFORT:'));
    const value = factor?.factor.split(':')[1];
    return isEnumValue(karma_enum_1.KarmaEffort, value) ? value : karma_enum_1.KarmaEffort.MEDIUM;
}
function relevanceFromFactors(entry) {
    const factor = entry.score_factors.find((item) => item.factor.startsWith('RELEVANCE:'));
    const value = factor?.factor.split(':')[1];
    return isEnumValue(karma_enum_1.KarmaRelevance, value) ? value : karma_enum_1.KarmaRelevance.MEDIUM;
}
function isEnumValue(target, value) {
    return value !== undefined && Object.values(target).includes(value);
}
function normaliseText(text) {
    return text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function startOfUtcDay(date) {
    const copy = new Date(date);
    copy.setUTCHours(0, 0, 0, 0);
    return copy;
}
function betweenExclusiveUpper(from, to) {
    return (0, typeorm_2.And)((0, typeorm_2.MoreThanOrEqual)(from), (0, typeorm_2.LessThan)(to));
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
//# sourceMappingURL=karma.service.js.map