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
var MkaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MkaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_mka_program_entity_1 = require("../entities/zuno-mka-program.entity");
const zuno_mka_item_entity_1 = require("../entities/zuno-mka-item.entity");
const zuno_mka_completion_entity_1 = require("../entities/zuno-mka-completion.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_challenge_context_entity_1 = require("../../challenges/entities/zuno-challenge-context.entity");
const zuno_response_entity_1 = require("../../responses/entities/zuno-response.entity");
const safety_service_1 = require("../../safety/services/safety.service");
const rulebook_repository_service_1 = require("../../rulebook/services/rulebook-repository.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
const mka_enum_1 = require("../enums/mka.enum");
const mka_plan_event_enum_1 = require("../enums/mka-plan-event.enum");
const mka_plan_outbox_1 = require("../enums/mka-plan-outbox");
const mka_practice_library_1 = require("./mka-practice-library");
let MkaService = MkaService_1 = class MkaService {
    constructor(programs, items, completions, challenges, contexts, responses, rulebook, safety, outbox, audit, ownership, clock, dataSource) {
        this.programs = programs;
        this.items = items;
        this.completions = completions;
        this.challenges = challenges;
        this.contexts = contexts;
        this.responses = responses;
        this.rulebook = rulebook;
        this.safety = safety;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(MkaService_1.name);
    }
    async generate(params) {
        const challenge = await this.findOwnedChallenge(params.user.id, params.challengeId);
        if (challenge.status === enums_1.ChallengeStatus.ARCHIVED ||
            challenge.status === enums_1.ChallengeStatus.RESOLVED) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `cannot generate MKA for a ${challenge.status} challenge`,
            });
        }
        const period = params.period ?? mka_enum_1.MkaPeriodType.WEEK;
        const initial = this.safety.preCheck({
            operation: 'MKA_GENERATE',
            userId: params.user.id,
            challengeId: challenge.id,
            text: challenge.raw_user_statement,
            domains: [],
        });
        const domains = this.domainsFor(challenge);
        const assessment = this.safety.refineWithDomains(initial, {
            operation: 'MKA_GENERATE',
            userId: params.user.id,
            challengeId: challenge.id,
            text: challenge.raw_user_statement,
            domains,
        });
        if (assessment.blocked) {
            await this.recordBlocked(params.user.id, challenge.id, assessment);
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                message: assessment.boundaryMessage ??
                    'I am not able to build a practice plan around this one, and I would rather say so plainly.',
                safety: {
                    disposition: assessment.disposition,
                    domain: assessment.domains[0],
                },
            });
        }
        const context = await this.contexts.findOne({
            where: { challenge_id: challenge.id },
            order: { version_number: 'DESC' },
        });
        const response = await this.responses.findOne({
            where: { challenge_id: challenge.id, user_id: params.user.id },
            order: { created_at: 'DESC' },
        });
        const remedyOutcome = await this.selectApprovedRemedies(domains, assessment);
        const existing = await this.findActiveProgram(params.user.id, challenge.id);
        if (existing &&
            !params.regenerate &&
            existing.period_type === period &&
            existing.context_version === challenge.context_version &&
            existing.rulebook_version_id === remedyOutcome.rulebookVersionId) {
            const currentItems = await this.itemsFor(existing.id);
            return { program: existing, items: currentItems };
        }
        const candidates = this.applyLoadLimits(this.deduplicate([
            this.mindCandidate(challenge),
            ...remedyOutcome.candidates,
            ...this.karmaFallbackCandidates(remedyOutcome.candidates),
            ...this.actionCandidates(challenge, context, response),
        ]));
        const { kept, rejected } = this.postCheckCandidates(params.user.id, challenge.id, candidates, assessment);
        const finalCandidates = this.ensurePracticalAction(kept);
        if (finalCandidates.length === 0) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                message: 'I could not put together a set of practices I was comfortable suggesting here.',
                safety: { disposition: assessment.disposition },
                internalDetail: 'every MKA candidate failed the safety post-check',
            });
        }
        const { startDate, endDate } = this.periodWindow(period);
        return this.dataSource.transaction(async (manager) => {
            const decision = await this.safety.recordDecision(manager, {
                userId: params.user.id,
                challengeId: challenge.id,
                operation: 'MKA_GENERATE',
                assessment,
            });
            for (const violation of rejected) {
                await this.safety.recordIncident(manager, {
                    userId: params.user.id,
                    safetyDecisionId: decision.id,
                    source: 'MKA_CANDIDATE_POST_CHECK',
                    domain: domains[0] ?? null,
                    severity: assessment.riskLevel,
                    violations: violation,
                });
            }
            const previous = existing
                ? await this.supersede(manager, existing, params.user.id)
                : null;
            const program = manager.create(zuno_mka_program_entity_1.ZunoMkaProgram, {
                user_id: params.user.id,
                challenge_id: challenge.id,
                plan_id: null,
                period_type: period,
                start_date: startDate,
                end_date: endDate,
                status: mka_enum_1.MkaProgramStatus.ACTIVE,
                rulebook_version_id: remedyOutcome.rulebookVersionId,
                remedy_status: remedyOutcome.remedyStatus,
                review_trigger: mka_enum_1.MkaReviewTrigger.END_OF_PERIOD,
                review_at: endDate,
                context_version: challenge.context_version,
                source_response_id: response?.id ?? null,
                safety_decision_id: decision.id,
                engine_version: mka_enum_1.MKA_ENGINE_VERSION,
                generated_reason: params.reason ?? (previous ? 'REGENERATED' : 'INITIAL_GENERATION'),
                superseded_by_id: null,
                activated_at: this.clock.now(),
                completed_at: null,
            });
            const savedProgram = await manager.save(zuno_mka_program_entity_1.ZunoMkaProgram, program);
            if (previous) {
                previous.superseded_by_id = savedProgram.id;
                await manager.save(zuno_mka_program_entity_1.ZunoMkaProgram, previous);
            }
            const rows = finalCandidates.map((candidate, index) => manager.create(zuno_mka_item_entity_1.ZunoMkaItem, {
                mka_program_id: savedProgram.id,
                user_id: params.user.id,
                dimension: candidate.dimension,
                title: candidate.title,
                description: candidate.description,
                purpose: candidate.purpose,
                source_type: candidate.sourceType,
                source_rule_key: candidate.sourceRuleKey,
                source_remedy_key: candidate.sourceRemedyKey,
                source_rule_id: candidate.sourceRuleId,
                rulebook_version_id: candidate.rulebookVersionId,
                frequency: candidate.frequency,
                schedule_data: candidate.scheduleData,
                duration_minutes: candidate.durationMinutes,
                priority: candidate.priority,
                valid_from: candidate.validFrom,
                valid_to: candidate.validTo,
                plan_eligible: candidate.planEligible,
                karma_eligible: candidate.karmaEligible,
                safety_class: candidate.safetyClass,
                is_devotional: candidate.isDevotional,
                alternative_keys: candidate.alternativeKeys,
                display_order: index,
                status: mka_enum_1.MkaItemStatus.ACTIVE,
            }));
            const savedItems = await manager.save(zuno_mka_item_entity_1.ZunoMkaItem, rows);
            await this.audit.record(manager, {
                actorType: 'SYSTEM',
                userId: params.user.id,
                action: 'MKA_GENERATED',
                entityType: 'ZunoMkaProgram',
                entityId: savedProgram.id,
                after: {
                    status: savedProgram.status,
                    remedy_status: savedProgram.remedy_status,
                    item_count: savedItems.length,
                },
                metadata: {
                    challengeId: challenge.id,
                    rulebookVersionId: remedyOutcome.rulebookVersionId,
                    supersededProgramId: previous?.id ?? null,
                },
            });
            await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.MKA_PROGRAM,
                aggregateId: savedProgram.id,
                eventType: mka_plan_event_enum_1.MkaPlanEventType.MKA_GENERATED,
                payload: {
                    mka_program_id: savedProgram.id,
                    challenge_id: challenge.id,
                    user_id: params.user.id,
                    period_type: period,
                    item_count: savedItems.length,
                    remedy_status: savedProgram.remedy_status,
                },
            });
            await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.MKA_PROGRAM,
                aggregateId: savedProgram.id,
                eventType: mka_plan_event_enum_1.MkaPlanEventType.MKA_ACTIVATED,
                payload: {
                    mka_program_id: savedProgram.id,
                    challenge_id: challenge.id,
                    user_id: params.user.id,
                },
            });
            if (remedyOutcome.remedyStatus === mka_enum_1.MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE) {
                await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                    aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.MKA_PROGRAM,
                    aggregateId: savedProgram.id,
                    eventType: mka_plan_event_enum_1.MkaPlanEventType.MKA_SME_REVIEW_CANDIDATE,
                    payload: {
                        mka_program_id: savedProgram.id,
                        user_id: params.user.id,
                        domains,
                        reason: 'NO_APPROVED_RULE_AVAILABLE',
                    },
                });
            }
            return { program: savedProgram, items: savedItems };
        });
    }
    async selectApprovedRemedies(domains, assessment) {
        if (assessment.astrologySuppressed) {
            return {
                candidates: [],
                rulebookVersionId: null,
                remedyStatus: mka_enum_1.MkaRemedyStatus.SUPPRESSED_BY_SAFETY,
            };
        }
        const active = await this.rulebook.getActive();
        if (!active) {
            this.logger.log('No active Rulebook; MKA continues with Mind and Action guidance only.');
            return {
                candidates: [],
                rulebookVersionId: null,
                remedyStatus: mka_enum_1.MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
            };
        }
        try {
            const rules = await this.rulebook.findRules({ domains });
            const remedyKeys = Array.from(new Set(rules.flatMap((rule) => rule.remedy_keys ?? [])));
            if (remedyKeys.length === 0) {
                return {
                    candidates: [],
                    rulebookVersionId: active.versionId,
                    remedyStatus: mka_enum_1.MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
                };
            }
            const remedies = await this.rulebook.findRemedies(remedyKeys);
            const ruleByRemedyKey = new Map();
            for (const rule of rules) {
                for (const key of rule.remedy_keys ?? []) {
                    if (!ruleByRemedyKey.has(key))
                        ruleByRemedyKey.set(key, rule);
                }
            }
            const candidates = remedies
                .filter((remedy) => !remedy.has_financial_cost)
                .filter((remedy) => remedy.safety_class !== enums_1.RuleSafetyClass.REQUIRES_CAUTION)
                .map((remedy) => {
                const rule = ruleByRemedyKey.get(remedy.external_remedy_key) ?? null;
                return {
                    dimension: remedy.mka_dimension,
                    title: remedy.name,
                    description: remedy.instructions,
                    purpose: remedy.user_explanation ?? remedy.purpose,
                    sourceType: mka_enum_1.MkaSourceType.APPROVED_ASTRO_REMEDY,
                    sourceRuleKey: rule?.external_rule_key ?? null,
                    sourceRemedyKey: remedy.external_remedy_key,
                    sourceRuleId: rule?.id ?? null,
                    rulebookVersionId: active.versionId,
                    frequency: this.mapRemedyFrequency(remedy.frequency),
                    durationMinutes: null,
                    priority: mka_enum_1.MkaPriority.IMPORTANT,
                    safetyClass: remedy.safety_class,
                    isDevotional: remedy.is_devotional,
                    alternativeKeys: remedy.alternative_keys ?? [],
                    karmaEligible: true,
                    planEligible: true,
                    scheduleData: {
                        preferred_time: remedy.preferred_time ?? null,
                        duration_text: remedy.duration ?? null,
                    },
                    validFrom: null,
                    validTo: null,
                    dedupeKey: `REMEDY:${remedy.external_remedy_key}`,
                };
            })
                .slice(0, mka_enum_1.MKA_MAX_ASTRO_REMEDIES);
            return {
                candidates,
                rulebookVersionId: active.versionId,
                remedyStatus: candidates.length > 0
                    ? mka_enum_1.MkaRemedyStatus.APPROVED_RULE_APPLIED
                    : mka_enum_1.MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
            };
        }
        catch (error) {
            if (error instanceof zuno_exception_1.ZunoException &&
                error.code === error_codes_enum_1.ZunoErrorCode.RULEBOOK_UNAVAILABLE) {
                this.logger.warn('Rulebook became unavailable mid-generation; continuing without astrology.');
                return {
                    candidates: [],
                    rulebookVersionId: null,
                    remedyStatus: mka_enum_1.MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
                };
            }
            throw error;
        }
    }
    mapRemedyFrequency(frequency) {
        switch (frequency) {
            case 'DAILY':
                return mka_enum_1.MkaFrequency.DAILY;
            case 'WEEKLY':
                return mka_enum_1.MkaFrequency.WEEKLY;
            case 'ONE_TIME':
                return mka_enum_1.MkaFrequency.ONCE;
            case 'MONTHLY':
            case 'OCCASIONAL':
                return mka_enum_1.MkaFrequency.CUSTOM;
            default:
                return mka_enum_1.MkaFrequency.CUSTOM;
        }
    }
    mindCandidate(challenge) {
        const intensity = challenge.emotional_intensity ?? enums_1.EmotionalIntensity.MODERATE;
        const template = mka_practice_library_1.MIND_PRACTICES[intensity] ?? mka_practice_library_1.MIND_PRACTICES.MODERATE;
        return this.fromTemplate(template);
    }
    karmaFallbackCandidates(astro) {
        const hasKarma = astro.some((c) => c.dimension === enums_1.MkaDimension.KARMA);
        if (hasKarma)
            return [];
        return [this.fromTemplate(mka_practice_library_1.NEUTRAL_KARMA_PRACTICES[0])];
    }
    actionCandidates(challenge, context, response) {
        const fromResponse = this.prioritiesFromResponse(response);
        if (fromResponse.length > 0)
            return fromResponse;
        const controllable = context?.payload?.factors?.controllable ?? [];
        if (controllable.length > 0) {
            return controllable
                .slice(0, mka_enum_1.MKA_DIMENSION_LIMITS[enums_1.MkaDimension.ACTION])
                .map((factor, index) => ({
                ...this.fromTemplate(mka_practice_library_1.FALLBACK_ACTION),
                title: this.trim(factor, 300),
                description: this.trim(factor, 2000),
                purpose: 'This is one of the parts of the situation that is actually within your control.',
                sourceType: mka_enum_1.MkaSourceType.WHATNOW,
                priority: index === 0 ? mka_enum_1.MkaPriority.ESSENTIAL : mka_enum_1.MkaPriority.IMPORTANT,
                dedupeKey: `ACTION:${normaliseKey(factor)}`,
            }));
        }
        const outcomes = context?.payload?.desired_outcomes ?? [];
        if (outcomes.length > 0) {
            return outcomes
                .slice(0, mka_enum_1.MKA_DIMENSION_LIMITS[enums_1.MkaDimension.ACTION])
                .map((outcome, index) => ({
                ...this.fromTemplate(mka_practice_library_1.FALLBACK_ACTION),
                title: this.trim(`Take one step towards: ${outcome.goal}`, 300),
                description: this.trim(`Choose the smallest concrete step that moves this forward: ${outcome.goal}`, 2000),
                purpose: 'Keep the goal moving rather than waiting for certainty.',
                sourceType: mka_enum_1.MkaSourceType.USER_GOAL,
                priority: index === 0 ? mka_enum_1.MkaPriority.ESSENTIAL : mka_enum_1.MkaPriority.IMPORTANT,
                dedupeKey: `ACTION:${normaliseKey(outcome.goal)}`,
            }));
        }
        this.logger.debug(`Challenge ${challenge.id} had no actionable context; using the fallback preparation action.`);
        return [this.fromTemplate(mka_practice_library_1.FALLBACK_ACTION)];
    }
    prioritiesFromResponse(response) {
        const section = response?.structured_payload?.sections?.find((s) => s.type === enums_1.ResponseSectionType.FOCUS_PRIORITIES);
        if (!section)
            return [];
        const payload = section.payload;
        const priorities = payload?.priorities ?? [];
        return priorities
            .slice(0, mka_enum_1.MKA_DIMENSION_LIMITS[enums_1.MkaDimension.ACTION])
            .map((priority, index) => ({
            ...this.fromTemplate(mka_practice_library_1.FALLBACK_ACTION),
            title: this.trim(priority.title, 300),
            description: this.trim(priority.why || priority.title, 2000),
            purpose: this.trim(priority.why, 2000),
            sourceType: mka_enum_1.MkaSourceType.WHATNOW,
            priority: index === 0 ? mka_enum_1.MkaPriority.ESSENTIAL : mka_enum_1.MkaPriority.IMPORTANT,
            dedupeKey: `ACTION:${normaliseKey(priority.title)}`,
        }));
    }
    fromTemplate(template) {
        return {
            dimension: template.dimension,
            title: template.title,
            description: template.description,
            purpose: template.purpose,
            sourceType: template.sourceType,
            sourceRuleKey: null,
            sourceRemedyKey: null,
            sourceRuleId: null,
            rulebookVersionId: null,
            frequency: template.frequency,
            durationMinutes: template.durationMinutes,
            priority: template.priority,
            safetyClass: enums_1.RuleSafetyClass.LOW_RISK,
            isDevotional: false,
            alternativeKeys: [],
            karmaEligible: template.karmaEligible,
            planEligible: true,
            scheduleData: {},
            validFrom: null,
            validTo: null,
            dedupeKey: `TEMPLATE:${template.key}`,
        };
    }
    deduplicate(candidates) {
        const seen = new Set();
        const result = [];
        for (const candidate of candidates) {
            if (seen.has(candidate.dedupeKey))
                continue;
            seen.add(candidate.dedupeKey);
            result.push(candidate);
        }
        return result;
    }
    applyLoadLimits(candidates) {
        const perDimension = new Map();
        let astroCount = 0;
        const kept = [];
        for (const candidate of candidates) {
            const used = perDimension.get(candidate.dimension) ?? 0;
            if (used >= mka_enum_1.MKA_DIMENSION_LIMITS[candidate.dimension])
                continue;
            const isAstro = mka_enum_1.ASTRO_DERIVED_SOURCE_TYPES.includes(candidate.sourceType);
            if (isAstro && astroCount >= mka_enum_1.MKA_MAX_ASTRO_REMEDIES)
                continue;
            perDimension.set(candidate.dimension, used + 1);
            if (isAstro)
                astroCount += 1;
            kept.push(candidate);
        }
        return kept;
    }
    ensurePracticalAction(candidates) {
        if (candidates.length === 0)
            return candidates;
        if (candidates.some((c) => c.dimension === enums_1.MkaDimension.ACTION)) {
            return candidates;
        }
        return [...candidates, this.fromTemplate(mka_practice_library_1.FALLBACK_ACTION)];
    }
    postCheckCandidates(userId, challengeId, candidates, assessment) {
        const kept = [];
        const rejected = [];
        for (const candidate of candidates) {
            const result = this.safety.postCheck({
                userId,
                challengeId,
                candidateText: [candidate.title, candidate.description, candidate.purpose]
                    .filter(Boolean)
                    .join(' '),
                assessment,
            });
            if (result.allowed) {
                kept.push(candidate);
            }
            else {
                this.logger.warn(`MKA candidate ${candidate.dedupeKey} blocked by the post-check: ${result.violations.join(',')}`);
                rejected.push(result.violations);
            }
        }
        return { kept, rejected };
    }
    async findOwnedChallenge(userId, challengeId) {
        const challenge = await this.challenges.findOne({
            where: { id: challengeId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(challenge, userId, 'challenge');
    }
    async findOwnedProgram(userId, programId) {
        const program = await this.programs.findOne({
            where: { id: programId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(program, userId, 'mka programme');
    }
    async findOwnedItem(userId, itemId) {
        const item = await this.items.findOne({
            where: { id: itemId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(item, userId, 'mka item');
    }
    async findActiveProgram(userId, challengeId) {
        return this.programs.findOne({
            where: {
                user_id: userId,
                challenge_id: challengeId,
                status: mka_enum_1.MkaProgramStatus.ACTIVE,
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            order: { created_at: 'DESC' },
        });
    }
    async itemsFor(programId) {
        return this.items.find({
            where: { mka_program_id: programId, deleted_at: (0, typeorm_2.IsNull)() },
            order: { display_order: 'ASC' },
        });
    }
    async planEligibleItems(programId) {
        return this.items.find({
            where: {
                mka_program_id: programId,
                plan_eligible: true,
                status: mka_enum_1.MkaItemStatus.ACTIVE,
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            order: { display_order: 'ASC' },
        });
    }
    async currentForChallenge(user, challengeId) {
        await this.findOwnedChallenge(user.id, challengeId);
        const program = await this.findActiveProgram(user.id, challengeId);
        if (!program) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.PROCESSING, {
                message: 'We have not built your practice plan for this yet.',
                internalDetail: `no active MKA programme for challenge ${challengeId}`,
            });
        }
        return { program, items: await this.itemsFor(program.id) };
    }
    async listPrograms(userId, challengeId) {
        return this.programs.find({
            where: {
                user_id: userId,
                deleted_at: (0, typeorm_2.IsNull)(),
                ...(challengeId ? { challenge_id: challengeId } : {}),
            },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }
    async completeItem(user, itemId, options = {}) {
        return this.recordCompletion(user, itemId, mka_enum_1.MkaCompletionStatus.DONE, options);
    }
    async skipItem(user, itemId, options = {}) {
        return this.recordCompletion(user, itemId, mka_enum_1.MkaCompletionStatus.SKIPPED, options);
    }
    async recordCompletion(user, itemId, status, options) {
        const item = await this.findOwnedItem(user.id, itemId);
        const program = await this.findOwnedProgram(user.id, item.mka_program_id);
        if (program.status !== mka_enum_1.MkaProgramStatus.ACTIVE &&
            program.status !== mka_enum_1.MkaProgramStatus.EXPIRED) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `cannot record against a ${program.status} MKA programme`,
            });
        }
        if (item.status !== mka_enum_1.MkaItemStatus.ACTIVE) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `cannot record against a ${item.status} MKA item`,
            });
        }
        const date = options.date ?? this.clock.today();
        const existing = await this.completions.findOne({
            where: { mka_item_id: item.id, completion_date: date },
        });
        if (existing)
            return existing;
        return this.dataSource.transaction(async (manager) => {
            const completion = manager.create(zuno_mka_completion_entity_1.ZunoMkaCompletion, {
                mka_item_id: item.id,
                mka_program_id: program.id,
                user_id: user.id,
                completion_date: date,
                status,
                user_note: options.note ?? null,
                source: mka_enum_1.MkaCompletionSource.USER,
                karma_eligible: item.karma_eligible,
                redacted_at: null,
            });
            const saved = await manager.save(zuno_mka_completion_entity_1.ZunoMkaCompletion, completion);
            if (status === mka_enum_1.MkaCompletionStatus.DONE &&
                item.frequency === mka_enum_1.MkaFrequency.ONCE) {
                item.status = this.transitionItem(item.status, mka_enum_1.MkaItemStatus.COMPLETED);
                await manager.save(zuno_mka_item_entity_1.ZunoMkaItem, item);
            }
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: user.id,
                userId: user.id,
                action: `MKA_ITEM_${status}`,
                entityType: 'ZunoMkaItem',
                entityId: item.id,
                after: { status, completion_date: date },
            });
            await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.MKA_ITEM,
                aggregateId: item.id,
                eventType: status === mka_enum_1.MkaCompletionStatus.DONE
                    ? mka_plan_event_enum_1.MkaPlanEventType.MKA_ITEM_COMPLETED
                    : mka_plan_event_enum_1.MkaPlanEventType.MKA_ITEM_SKIPPED,
                payload: {
                    mka_item_id: item.id,
                    mka_program_id: program.id,
                    mka_completion_id: saved.id,
                    challenge_id: program.challenge_id,
                    user_id: user.id,
                    dimension: item.dimension,
                    karma_eligible: item.karma_eligible,
                    completion_date: date,
                    status,
                },
            });
            return saved;
        });
    }
    async completionsFor(userId, programId) {
        return this.completions.find({
            where: { user_id: userId, mka_program_id: programId },
            order: { completion_date: 'DESC' },
            take: 200,
        });
    }
    async completeProgram(user, programId, expectedVersion) {
        const program = await this.findOwnedProgram(user.id, programId);
        this.ownership.assertVersion(program, expectedVersion);
        return this.dataSource.transaction(async (manager) => {
            const before = program.status;
            program.status = this.transitionProgram(before, mka_enum_1.MkaProgramStatus.COMPLETED);
            program.completed_at = this.clock.now();
            const saved = await manager.save(zuno_mka_program_entity_1.ZunoMkaProgram, program);
            await manager.update(zuno_mka_item_entity_1.ZunoMkaItem, { mka_program_id: program.id, status: mka_enum_1.MkaItemStatus.ACTIVE }, { status: mka_enum_1.MkaItemStatus.COMPLETED });
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: user.id,
                userId: user.id,
                action: 'MKA_COMPLETED',
                entityType: 'ZunoMkaProgram',
                entityId: program.id,
                before: { status: before },
                after: { status: saved.status },
            });
            await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
                aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.MKA_PROGRAM,
                aggregateId: program.id,
                eventType: mka_plan_event_enum_1.MkaPlanEventType.MKA_COMPLETED,
                payload: {
                    mka_program_id: program.id,
                    user_id: user.id,
                    challenge_id: program.challenge_id,
                },
            });
            return saved;
        });
    }
    async supersede(manager, program, userId) {
        const before = program.status;
        program.status = this.transitionProgram(before, mka_enum_1.MkaProgramStatus.SUPERSEDED);
        const saved = await manager.save(zuno_mka_program_entity_1.ZunoMkaProgram, program);
        await manager.update(zuno_mka_item_entity_1.ZunoMkaItem, {
            mka_program_id: program.id,
            status: (0, typeorm_2.In)([mka_enum_1.MkaItemStatus.ACTIVE, mka_enum_1.MkaItemStatus.EXPIRED]),
        }, { status: mka_enum_1.MkaItemStatus.CANCELLED_BY_REALIGNMENT });
        await this.audit.record(manager, {
            actorType: 'SYSTEM',
            userId,
            action: 'MKA_SUPERSEDED',
            entityType: 'ZunoMkaProgram',
            entityId: program.id,
            before: { status: before },
            after: { status: saved.status },
        });
        await (0, mka_plan_outbox_1.enqueueMkaPlanEvent)(this.outbox, manager, {
            aggregateType: mka_plan_event_enum_1.MkaPlanAggregateType.MKA_PROGRAM,
            aggregateId: program.id,
            eventType: mka_plan_event_enum_1.MkaPlanEventType.MKA_SUPERSEDED,
            payload: {
                mka_program_id: program.id,
                user_id: userId,
                challenge_id: program.challenge_id,
            },
        });
        return saved;
    }
    transitionProgram(from, to) {
        if (from === to)
            return to;
        if (!(0, mka_enum_1.canTransitionMkaProgram)(from, to)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `illegal MKA programme transition ${from} -> ${to}`,
            });
        }
        return to;
    }
    transitionItem(from, to) {
        if (from === to)
            return to;
        if (!(0, mka_enum_1.canTransitionMkaItem)(from, to)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `illegal MKA item transition ${from} -> ${to}`,
            });
        }
        return to;
    }
    domainsFor(challenge) {
        return challenge.primary_domain ? [challenge.primary_domain] : [];
    }
    periodWindow(period) {
        const start = this.clock.now();
        const days = mka_enum_1.MKA_PERIOD_DAYS[period] ?? mka_enum_1.MKA_PERIOD_DAYS[mka_enum_1.MkaPeriodType.WEEK];
        const end = new Date(start.getTime());
        end.setUTCDate(end.getUTCDate() + days - 1);
        return {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
        };
    }
    async recordBlocked(userId, challengeId, assessment) {
        await this.dataSource.transaction(async (manager) => {
            const decision = await this.safety.recordDecision(manager, {
                userId,
                challengeId,
                operation: 'MKA_GENERATE',
                assessment,
            });
            await this.safety.recordIncident(manager, {
                userId,
                safetyDecisionId: decision.id,
                source: 'MKA_GENERATE_PRECHECK',
                domain: assessment.domains[0] ?? null,
                severity: assessment.riskLevel,
                violations: [],
            });
        });
    }
    trim(value, max) {
        const clean = (value ?? '').trim();
        return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
    }
};
exports.MkaService = MkaService;
exports.MkaService = MkaService = MkaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_mka_program_entity_1.ZunoMkaProgram)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_mka_item_entity_1.ZunoMkaItem)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_mka_completion_entity_1.ZunoMkaCompletion)),
    __param(3, (0, typeorm_1.InjectRepository)(zuno_challenge_entity_1.ZunoChallenge)),
    __param(4, (0, typeorm_1.InjectRepository)(zuno_challenge_context_entity_1.ZunoChallengeContext)),
    __param(5, (0, typeorm_1.InjectRepository)(zuno_response_entity_1.ZunoResponse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        rulebook_repository_service_1.RulebookRepositoryService,
        safety_service_1.SafetyService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], MkaService);
function normaliseKey(value) {
    return (value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}
//# sourceMappingURL=mka.service.js.map