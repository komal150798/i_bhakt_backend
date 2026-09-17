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
var ScenarioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_scenario_set_entity_1 = require("../entities/zuno-scenario-set.entity");
const zuno_scenario_entity_1 = require("../entities/zuno-scenario.entity");
const zuno_scenario_condition_entity_1 = require("../entities/zuno-scenario-condition.entity");
const scenario_port_1 = require("../ports/scenario.port");
const scenario_context_service_1 = require("./scenario-context.service");
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
const RELEVANCE_PROBABILITY_LABEL = {
    [scenario_enum_1.ScenarioRelevance.HIGH]: 'PRIMARY',
    [scenario_enum_1.ScenarioRelevance.MEDIUM]: 'PLAUSIBLE',
    [scenario_enum_1.ScenarioRelevance.LOW]: 'SECONDARY',
    [scenario_enum_1.ScenarioRelevance.CONTINGENCY]: 'CONTINGENCY',
};
let ScenarioService = ScenarioService_1 = class ScenarioService {
    constructor(sets, scenarios, conditions, engine, context, safety, outbox, audit, ownership, clock, dataSource) {
        this.sets = sets;
        this.scenarios = scenarios;
        this.conditions = conditions;
        this.engine = engine;
        this.context = context;
        this.safety = safety;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(ScenarioService_1.name);
    }
    async generate(params) {
        const { user, challengeId } = params;
        const projection = await this.context.project(user.id, challengeId);
        const assessment = this.safety.preCheck({
            operation: 'SCENARIO_GENERATE',
            userId: user.id,
            challengeId: projection.challenge.id,
            text: projection.safetyText,
            domains: projection.domains,
        });
        if (assessment.blocked) {
            await this.recordBlocked(user, projection.challenge.id, assessment, 'SCENARIO_GENERATE_PRECHECK');
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                message: assessment.boundaryMessage ??
                    'I am not able to map out possibilities for this one, and I would rather say so plainly.',
                safety: {
                    disposition: assessment.disposition,
                    domain: assessment.domains[0],
                },
            });
        }
        const astro = await this.context.loadAstroContext(projection.domains);
        const rejectedPaths = await this.rejectedPaths(projection.challenge.id);
        const result = await this.engine.generate({
            summary: projection.summary,
            facts: projection.facts,
            concerns: projection.concerns,
            dependencies: projection.dependencies,
            decisions: projection.decisions,
            controllable: projection.controllable,
            external: projection.external,
            temporal_anchors: projection.temporalAnchors,
            domains: projection.domains,
            mode: projection.challenge.mode,
            astro,
            rejected_paths: rejectedPaths,
            max_scenarios: scenario_enum_1.SCENARIO_MAX_USER_FACING,
        });
        const shaped = this.shape(result.generation.scenarios, projection.concerns);
        if (shaped.length === 0) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE, {
                internalDetail: 'every candidate scenario was removed as unsupported, duplicate, or non-possibility language',
            });
        }
        const sharedPreparation = this.deriveSharedPreparation(result.generation.shared_preparation, shaped);
        const postCheck = this.safety.postCheck({
            userId: user.id,
            challengeId: projection.challenge.id,
            candidateText: collectScenarioText(shaped, sharedPreparation, result.generation.watch_signals),
            assessment,
        });
        const previous = await this.currentSet(projection.challenge.id);
        return this.dataSource.transaction(async (manager) => {
            const decision = await this.safety.recordDecision(manager, {
                userId: user.id,
                challengeId: projection.challenge.id,
                operation: 'SCENARIO_GENERATE',
                assessment,
            });
            if (!postCheck.allowed) {
                await this.safety.recordIncident(manager, {
                    userId: user.id,
                    safetyDecisionId: decision.id,
                    source: 'SCENARIO_POST_CHECK',
                    domain: projection.domains[0] ?? null,
                    severity: assessment.riskLevel,
                    violations: postCheck.violations,
                });
                this.logger.warn(`Post-check blocked a scenario set for challenge ${projection.challenge.id}: ${postCheck.violations.join(',')}`);
                throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED, {
                    message: 'I could not put these possibilities in a way I was comfortable sending. Let us approach it differently.',
                    safety: { disposition: assessment.disposition },
                });
            }
            if (previous) {
                previous.status = scenario_enum_1.ScenarioSetStatus.SUPERSEDED;
                await manager.save(zuno_scenario_set_entity_1.ZunoScenarioSet, previous);
            }
            const previousScenarios = previous
                ? await manager.find(zuno_scenario_entity_1.ZunoScenario, {
                    where: { scenario_set_id: previous.id },
                })
                : [];
            const versionNumber = (previous?.version_number ?? 0) + 1;
            const userFacing = shaped.filter((entry) => entry.userFacing);
            const set = manager.create(zuno_scenario_set_entity_1.ZunoScenarioSet, {
                challenge_id: projection.challenge.id,
                user_id: user.id,
                version_number: versionNumber,
                status: scenario_enum_1.ScenarioSetStatus.CURRENT,
                generated_reason: params.reason ?? (previous ? 'REGENERATION' : 'INITIAL_ANALYSIS'),
                shared_preparation: sharedPreparation,
                watch_signals: unique(result.generation.watch_signals),
                seeds: result.generation.seeds,
                comparison: result.generation.comparison,
                diff: this.buildDiff(previousScenarios, shaped),
                decision_readiness: projection.decisions.length > 0
                    ? result.generation.decision_readiness
                    : null,
                provenance: {
                    challenge_context_version: projection.context?.version_number ?? 0,
                    rulebook_version_id: astro?.rulebook_version_id ?? null,
                    scenario_engine_version: result.engineVersion,
                    prompt_version: result.promptVersion,
                    astro_available: astro !== null,
                },
                user_facing_count: userFacing.length,
                safety_decision_id: decision.id,
                ai_generation_run_id: result.aiGenerationRunId,
            });
            const savedSet = await manager.save(zuno_scenario_set_entity_1.ZunoScenarioSet, set);
            const savedScenarios = [];
            for (let index = 0; index < shaped.length; index++) {
                const entry = shaped[index];
                const row = manager.create(zuno_scenario_entity_1.ZunoScenario, {
                    scenario_set_id: savedSet.id,
                    challenge_id: projection.challenge.id,
                    user_id: user.id,
                    name: entry.candidate.title,
                    description: entry.candidate.summary,
                    scenario_type: entry.candidate.scenario_type,
                    case_class: scenario_enum_1.SCENARIO_TYPE_CASE_CLASS[entry.candidate.scenario_type],
                    status: scenario_enum_1.ScenarioStatus.ACTIVE_CANDIDATE,
                    relevance: entry.relevance,
                    impact: entry.impact,
                    horizon: entry.candidate.horizon,
                    probability_label: this.probabilityLabel(entry.relevance),
                    confidence: entry.candidate.confidence.toFixed(3),
                    hypothetical: false,
                    user_facing: entry.userFacing,
                    display_order: index,
                    option_ref: entry.candidate.option_ref,
                    payload: this.buildPayload(entry.candidate, astro),
                    user_decision_note: null,
                    triggered_at: null,
                });
                const savedScenario = await manager.save(zuno_scenario_entity_1.ZunoScenario, row);
                savedScenarios.push(savedScenario);
                const conditionRows = [
                    ...entry.candidate.signals_for.map((description) => ({
                        type: scenario_enum_1.ScenarioConditionType.SIGNAL_FOR,
                        description,
                    })),
                    ...entry.candidate.signals_against.map((description) => ({
                        type: scenario_enum_1.ScenarioConditionType.SIGNAL_AGAINST,
                        description,
                    })),
                    ...entry.candidate.dependencies.map((edge) => ({
                        type: scenario_enum_1.ScenarioConditionType.DEPENDENCY,
                        description: `${edge.from} -> ${edge.to}`,
                    })),
                ].map((condition) => manager.create(zuno_scenario_condition_entity_1.ZunoScenarioCondition, {
                    scenario_id: savedScenario.id,
                    user_id: user.id,
                    condition_type: condition.type,
                    description: condition.description,
                    signal_definition: {},
                }));
                if (conditionRows.length > 0) {
                    await manager.save(zuno_scenario_condition_entity_1.ZunoScenarioCondition, conditionRows);
                }
            }
            await this.audit.record(manager, {
                actorType: 'SYSTEM',
                userId: user.id,
                action: 'SCENARIO_SET_GENERATED',
                entityType: 'ZunoScenarioSet',
                entityId: savedSet.id,
                before: previous ? { version: previous.version_number } : undefined,
                after: { version: versionNumber, scenarios: savedScenarios.length },
                metadata: { astro_available: astro !== null },
            });
            await this.outbox.enqueue(manager, {
                aggregateType: enums_1.ZunoAggregateType.CHALLENGE,
                aggregateId: projection.challenge.id,
                eventType: (0, scenario_events_1.scenarioEvent)(scenario_events_1.SCENARIO_EVENT_TYPES.SCENARIO_SET_GENERATED),
                payload: {
                    scenario_set_id: savedSet.id,
                    challenge_id: projection.challenge.id,
                    user_id: user.id,
                    version: versionNumber,
                    scenario_count: savedScenarios.length,
                    changes: savedSet.diff.length,
                },
            });
            return { set: savedSet, scenarios: savedScenarios };
        });
    }
    async currentSet(challengeId) {
        return this.sets.findOne({
            where: { challenge_id: challengeId, status: scenario_enum_1.ScenarioSetStatus.CURRENT },
            order: { version_number: 'DESC' },
        });
    }
    async listCurrent(user, challengeId, options = {}) {
        await this.context.requireOwnedChallenge(user.id, challengeId);
        const set = await this.currentSet(challengeId);
        if (!set)
            return null;
        const rows = await this.scenarios.find({
            where: { scenario_set_id: set.id },
            order: { display_order: 'ASC' },
        });
        const scenarios = options.includeAll
            ? rows
            : rows.filter((row) => row.user_facing);
        return { set, scenarios };
    }
    async findOwnedScenario(userId, scenarioId) {
        const scenario = await this.scenarios.findOne({ where: { id: scenarioId } });
        return this.ownership.require(scenario, userId, 'scenario');
    }
    async decide(user, scenarioId, status, note, expectedVersion) {
        const scenario = await this.findOwnedScenario(user.id, scenarioId);
        this.ownership.assertVersion(scenario, expectedVersion);
        if (!(0, scenario_enum_1.canTransitionScenario)(scenario.status, status)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `illegal scenario transition ${scenario.status} -> ${status}`,
            });
        }
        return this.dataSource.transaction(async (manager) => {
            const before = scenario.status;
            scenario.status = status;
            scenario.user_decision_note = note ?? null;
            if (status === scenario_enum_1.ScenarioStatus.USER_REJECTED || status === scenario_enum_1.ScenarioStatus.DISMISSED) {
                scenario.user_facing = false;
            }
            const saved = await manager.save(zuno_scenario_entity_1.ZunoScenario, scenario);
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: user.id,
                userId: user.id,
                action: 'SCENARIO_DECISION_RECORDED',
                entityType: 'ZunoScenario',
                entityId: saved.id,
                before: { status: before },
                after: { status: saved.status },
            });
            await this.outbox.enqueue(manager, {
                aggregateType: enums_1.ZunoAggregateType.CHALLENGE,
                aggregateId: saved.challenge_id,
                eventType: (0, scenario_events_1.scenarioEvent)(scenario_events_1.SCENARIO_EVENT_TYPES.SCENARIO_CHANGED),
                payload: {
                    scenario_id: saved.id,
                    challenge_id: saved.challenge_id,
                    user_id: user.id,
                    before: before,
                    after: saved.status,
                },
            });
            return saved;
        });
    }
    async markTriggered(user, scenarioId, note, expectedVersion) {
        const scenario = await this.findOwnedScenario(user.id, scenarioId);
        this.ownership.assertVersion(scenario, expectedVersion);
        if (!(0, scenario_enum_1.canTransitionScenario)(scenario.status, scenario_enum_1.ScenarioStatus.TRIGGERED)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                internalDetail: `illegal scenario transition ${scenario.status} -> TRIGGERED`,
            });
        }
        return this.dataSource.transaction(async (manager) => {
            const before = scenario.status;
            scenario.status = scenario_enum_1.ScenarioStatus.TRIGGERED;
            scenario.triggered_at = this.clock.now();
            scenario.user_decision_note = note ?? scenario.user_decision_note;
            const saved = await manager.save(zuno_scenario_entity_1.ZunoScenario, scenario);
            await this.audit.record(manager, {
                actorType: 'USER',
                actorId: user.id,
                userId: user.id,
                action: 'SCENARIO_TRIGGERED',
                entityType: 'ZunoScenario',
                entityId: saved.id,
                before: { status: before },
                after: { status: saved.status },
            });
            await this.outbox.enqueue(manager, {
                aggregateType: enums_1.ZunoAggregateType.CHALLENGE,
                aggregateId: saved.challenge_id,
                eventType: (0, scenario_events_1.scenarioEvent)(scenario_events_1.SCENARIO_EVENT_TYPES.SCENARIO_TRIGGERED),
                payload: {
                    scenario_id: saved.id,
                    challenge_id: saved.challenge_id,
                    user_id: user.id,
                    became_reality: true,
                },
            });
            return saved;
        });
    }
    shape(candidates, concerns) {
        const supported = candidates.filter((candidate) => this.isSupported(candidate));
        const distinct = this.deduplicate(supported);
        const assessed = distinct
            .map((candidate) => this.assess(candidate, concerns))
            .filter((entry) => entry !== null);
        const clean = assessed.filter((entry) => {
            const claims = [
                ...(0, deterministic_language_guard_1.findDeterministicClaims)(entry.candidate.title, 'title'),
                ...(0, deterministic_language_guard_1.findDeterministicClaims)(entry.candidate.summary, 'summary'),
            ];
            if (claims.length > 0) {
                this.logger.warn(`Dropped a scenario asserting a determined outcome: ${claims
                    .map((claim) => claim.kind)
                    .join(',')}`);
                return false;
            }
            return true;
        });
        const ordered = [...clean].sort((a, b) => {
            const byRelevance = scenario_enum_1.SCENARIO_RELEVANCE_WEIGHT[b.relevance] - scenario_enum_1.SCENARIO_RELEVANCE_WEIGHT[a.relevance];
            if (byRelevance !== 0)
                return byRelevance;
            const byImpact = scenario_enum_1.SCENARIO_IMPACT_WEIGHT[b.impact] - scenario_enum_1.SCENARIO_IMPACT_WEIGHT[a.impact];
            if (byImpact !== 0)
                return byImpact;
            return b.candidate.confidence - a.candidate.confidence;
        });
        return ordered.map((entry, index) => ({
            ...entry,
            userFacing: index < scenario_enum_1.SCENARIO_MAX_USER_FACING,
        }));
    }
    isSupported(candidate) {
        if (candidate.basis.length === 0)
            return false;
        return candidate.basis.some((entry) => !scenario_enum_1.UNSUPPORTED_EVIDENCE_CLASSES.includes(entry.type));
    }
    deduplicate(candidates) {
        const kept = [];
        for (const candidate of candidates) {
            const isDuplicate = kept.some((existing) => this.isSemanticDuplicate(existing, candidate));
            if (isDuplicate) {
                this.logger.debug(`Merged a duplicate scenario: "${candidate.title}" (Step 12 s.52)`);
                continue;
            }
            kept.push(candidate);
        }
        return kept;
    }
    isSemanticDuplicate(a, b) {
        if (a.scenario_type !== b.scenario_type) {
            return false;
        }
        const titleOverlap = tokenOverlap(a.title, b.title);
        const summaryOverlap = tokenOverlap(a.summary, b.summary);
        return titleOverlap >= 0.67 || summaryOverlap >= 0.67;
    }
    assess(candidate, concerns) {
        const impact = candidate.impact;
        let relevance = candidate.relevance;
        const lowConfidence = candidate.confidence < scenario_enum_1.SCENARIO_LOW_CONFIDENCE_THRESHOLD;
        const highImpact = impact === scenario_enum_1.ScenarioImpact.HIGH || impact === scenario_enum_1.ScenarioImpact.CRITICAL;
        if (lowConfidence && !highImpact) {
            this.logger.debug(`Dropped a low-confidence, low-impact scenario: "${candidate.title}" (Step 12 s.51)`);
            return null;
        }
        if (lowConfidence && highImpact) {
            relevance = scenario_enum_1.ScenarioRelevance.CONTINGENCY;
        }
        if (relevance === scenario_enum_1.ScenarioRelevance.LOW &&
            concerns.some((concern) => tokenOverlap(concern, candidate.summary) >= 0.4)) {
            relevance = scenario_enum_1.ScenarioRelevance.MEDIUM;
        }
        if (candidate.scenario_type === scenario_enum_1.ScenarioType.CONTINGENCY &&
            relevance === scenario_enum_1.ScenarioRelevance.HIGH) {
            relevance = scenario_enum_1.ScenarioRelevance.CONTINGENCY;
        }
        return { candidate, relevance, impact, userFacing: true };
    }
    deriveSharedPreparation(proposed, shaped) {
        const counts = new Map();
        for (const entry of shaped) {
            const seen = new Set();
            for (const prep of entry.candidate.scenario_specific_preparation) {
                const key = normalise(prep.action);
                if (key.length === 0 || seen.has(key))
                    continue;
                seen.add(key);
                const existing = counts.get(key);
                counts.set(key, {
                    action: existing?.action ?? prep.action,
                    count: (existing?.count ?? 0) + 1,
                });
            }
        }
        const derived = Array.from(counts.values())
            .filter((entry) => entry.count >= 2)
            .map((entry) => ({
            action: entry.action,
            classification: scenario_enum_1.PreparationClass.COMMON,
        }));
        const combined = [
            ...proposed.map((entry) => ({
                action: entry.action,
                classification: scenario_enum_1.PreparationClass.COMMON,
            })),
            ...derived,
        ];
        const seen = new Set();
        return combined.filter((entry) => {
            const key = normalise(entry.action);
            if (key.length === 0 || seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
    buildDiff(previous, current) {
        const diff = [];
        const previousByKey = new Map(previous.map((row) => [normalise(row.name), row]));
        const currentKeys = new Set(current.map((entry) => normalise(entry.candidate.title)));
        for (const entry of current) {
            const key = normalise(entry.candidate.title);
            const before = previousByKey.get(key);
            if (!before) {
                diff.push({ scenario_title: entry.candidate.title, change: 'ADDED' });
                continue;
            }
            if (before.relevance !== entry.relevance) {
                const increased = scenario_enum_1.SCENARIO_RELEVANCE_WEIGHT[entry.relevance] >
                    scenario_enum_1.SCENARIO_RELEVANCE_WEIGHT[before.relevance];
                diff.push({
                    scenario_title: entry.candidate.title,
                    change: increased ? 'RELEVANCE_INCREASED' : 'RELEVANCE_DECREASED',
                    before: before.relevance,
                    after: entry.relevance,
                });
            }
            if (before.impact !== entry.impact) {
                diff.push({
                    scenario_title: entry.candidate.title,
                    change: 'IMPACT_CHANGED',
                    before: before.impact,
                    after: entry.impact,
                });
            }
        }
        for (const row of previous) {
            if (!currentKeys.has(normalise(row.name))) {
                diff.push({ scenario_title: row.name, change: 'REMOVED' });
            }
        }
        return diff;
    }
    buildPayload(candidate, astro) {
        return {
            basis: candidate.basis.map((entry) => ({
                type: entry.type,
                reference: entry.reference,
            })),
            signals_for: candidate.signals_for,
            signals_against: candidate.signals_against,
            dependencies: candidate.dependencies,
            risks: candidate.risks,
            opportunities: candidate.opportunities,
            controllable_factors: candidate.controllable_factors,
            impact_areas: candidate.impact_areas,
            scenario_specific_preparation: candidate.scenario_specific_preparation,
            benefits: candidate.benefits,
            constraints: candidate.constraints,
            reversibility: candidate.scenario_type === scenario_enum_1.ScenarioType.DECISION
                ? candidate.reversibility
                : null,
            astro_context: astro,
        };
    }
    probabilityLabel(relevance) {
        const label = RELEVANCE_PROBABILITY_LABEL[relevance];
        if (!(0, deterministic_language_guard_1.isQualitativeProbabilityLabel)(label)) {
            throw zuno_exception_1.ZunoException.internal(`probability label "${label}" is not qualitative (Step 12 s.16)`);
        }
        return label;
    }
    async rejectedPaths(challengeId) {
        const rows = await this.scenarios.find({
            where: { challenge_id: challengeId, status: scenario_enum_1.ScenarioStatus.USER_REJECTED },
        });
        return rows.map((row) => row.name);
    }
    async recordBlocked(user, challengeId, assessment, source) {
        await this.dataSource.transaction(async (manager) => {
            const decision = await this.safety.recordDecision(manager, {
                userId: user.id,
                challengeId,
                operation: 'SCENARIO_GENERATE',
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
exports.ScenarioService = ScenarioService;
exports.ScenarioService = ScenarioService = ScenarioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_scenario_set_entity_1.ZunoScenarioSet)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_scenario_entity_1.ZunoScenario)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_scenario_condition_entity_1.ZunoScenarioCondition)),
    __param(3, (0, common_1.Inject)(scenario_port_1.SCENARIO_ENGINE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object, scenario_context_service_1.ScenarioContextService,
        safety_service_1.SafetyService,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], ScenarioService);
function collectScenarioText(shaped, sharedPreparation, watchSignals) {
    const parts = [];
    for (const entry of shaped) {
        parts.push(entry.candidate.title, entry.candidate.summary);
        parts.push(...entry.candidate.risks);
        parts.push(...entry.candidate.opportunities);
        parts.push(...entry.candidate.signals_for);
        parts.push(...entry.candidate.signals_against);
        parts.push(...entry.candidate.benefits);
        parts.push(...entry.candidate.constraints);
        parts.push(...entry.candidate.scenario_specific_preparation.map((prep) => prep.action));
    }
    parts.push(...sharedPreparation.map((prep) => prep.action));
    parts.push(...watchSignals);
    return parts.filter(Boolean).join(' ');
}
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'to', 'of', 'in', 'on',
    'at', 'for', 'and', 'or', 'with', 'your', 'you', 'their', 'they', 'it',
    'this', 'that', 'while', 'as', 'by', 'from', 'my', 'i', 'we',
]);
function meaningfulTokens(text) {
    return new Set(text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token)));
}
function tokenOverlap(a, b) {
    const left = meaningfulTokens(a);
    const right = meaningfulTokens(b);
    if (left.size === 0 || right.size === 0)
        return 0;
    let shared = 0;
    for (const token of left) {
        if (right.has(token))
            shared++;
    }
    return shared / Math.min(left.size, right.size);
}
function normalise(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function unique(values) {
    return Array.from(new Set(values));
}
//# sourceMappingURL=scenario.service.js.map