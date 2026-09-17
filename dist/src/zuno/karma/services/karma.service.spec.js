"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const karma_service_1 = require("./karma.service");
const deterministic_karma_classifier_1 = require("./deterministic-karma-classifier");
const zuno_karma_entry_entity_1 = require("../entities/zuno-karma-entry.entity");
const zuno_karma_entry_revision_entity_1 = require("../entities/zuno-karma-entry-revision.entity");
const zuno_karma_pattern_entity_1 = require("../entities/zuno-karma-pattern.entity");
const karma_enum_1 = require("../enums/karma.enum");
const karma_source_port_1 = require("../ports/karma-source.port");
const karma_scoring_1 = require("../scoring/karma-scoring");
const neutrality_1 = require("../neutrality");
const safety_service_1 = require("../../safety/services/safety.service");
const safety_signal_detector_1 = require("../../safety/services/safety-signal-detector");
const entities_1 = require("../../safety/entities");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-09-17T10:00:00.000Z');
function matchesCondition(value, condition) {
    if (condition instanceof typeorm_1.FindOperator) {
        switch (condition.type) {
            case 'isNull':
                return value === null || value === undefined;
            case 'not':
                return !matchesCondition(value, condition.value);
            case 'moreThanOrEqual':
                return value >= condition.value;
            case 'lessThan':
                return value < condition.value;
            case 'and':
                return condition.value.every((inner) => matchesCondition(value, inner));
            default:
                return value === condition.value;
        }
    }
    return value === condition;
}
function matchesWhere(row, where) {
    if (!where)
        return true;
    const clauses = Array.isArray(where) ? where : [where];
    return clauses.some((clause) => Object.entries(clause).every(([key, condition]) => matchesCondition(row[key], condition)));
}
let idCounter = 0;
function nextId() {
    idCounter += 1;
    return `00000000-0000-4000-8000-${String(idCounter).padStart(12, '0')}`;
}
class FakeTable {
    constructor() {
        this.rows = [];
    }
    create(input) {
        return { ...input };
    }
    async save(entity) {
        const row = entity;
        if (!row.id) {
            row.id = nextId();
            row.created_at = row.created_at ?? new Date(NOW);
            row.updated_at = new Date(NOW);
            row.version = row.version ?? 1;
            row.deleted_at = row.deleted_at ?? null;
            this.rows.push(entity);
            return entity;
        }
        row.updated_at = new Date(NOW);
        const index = this.rows.findIndex((existing) => existing.id === row.id);
        if (index === -1)
            this.rows.push(entity);
        else
            this.rows[index] = entity;
        return entity;
    }
    async find(options) {
        let result = this.rows.filter((row) => matchesWhere(row, options?.where));
        const order = options?.order;
        if (order) {
            const [key, direction] = Object.entries(order)[0];
            result = [...result].sort((a, b) => {
                const left = a[key];
                const right = b[key];
                if (left === right)
                    return 0;
                return direction === 'DESC'
                    ? left < right
                        ? 1
                        : -1
                    : left > right
                        ? 1
                        : -1;
            });
        }
        if (options?.take !== undefined)
            result = result.slice(0, options.take);
        return result;
    }
    async findOne(options) {
        const found = await this.find(options);
        return found[0] ?? null;
    }
}
function fakeManager(tables) {
    const tableFor = (target) => {
        const table = tables.get(target);
        if (!table)
            throw new Error(`no fake table registered for ${String(target)}`);
        return table;
    };
    return {
        create: (target, input) => tableFor(target).create(input),
        save: (target, entity) => tableFor(target).save(entity),
        find: (target, options) => tableFor(target).find(options),
        findOne: (target, options) => tableFor(target).findOne(options),
    };
}
class StubClassifier {
    constructor(result = {}) {
        this.result = result;
    }
    set(result) {
        this.result = result;
    }
    async classify(_request) {
        return {
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.OTHER,
            intent: karma_enum_1.KarmaIntent.UNKNOWN,
            impactScope: 'SELF',
            effort: karma_enum_1.KarmaEffort.MEDIUM,
            relevance: karma_enum_1.KarmaRelevance.MEDIUM,
            confidence: 0.9,
            evidence: ['TEST'],
            modelVersion: 'test-classifier-1.0',
            ...this.result,
        };
    }
}
function buildHarness(options = {}) {
    const entries = new FakeTable();
    const revisions = new FakeTable();
    const patterns = new FakeTable();
    const safetyDecisions = new FakeTable();
    const safetyIncidents = new FakeTable();
    const tables = new Map([
        [zuno_karma_entry_entity_1.ZunoKarmaEntry, entries],
        [zuno_karma_entry_revision_entity_1.ZunoKarmaEntryRevision, revisions],
        [zuno_karma_pattern_entity_1.ZunoKarmaPattern, patterns],
        [entities_1.ZunoSafetyDecision, safetyDecisions],
        [entities_1.ZunoSafetyIncident, safetyIncidents],
    ]);
    const manager = fakeManager(tables);
    const dataSource = {
        transaction: async (work) => work(manager),
    };
    const outbox = { enqueue: jest.fn(), enqueueMany: jest.fn() };
    const audit = { record: jest.fn() };
    const rulebook = {
        isAstrologyAvailable: jest
            .fn()
            .mockResolvedValue(options.astrologyAvailable ?? false),
    };
    const classifier = options.classifier ?? new StubClassifier();
    const clock = new clock_service_1.FixedClockService(NOW);
    const service = new karma_service_1.KarmaService(entries, patterns, classifier, options.sourcePort ?? new karma_source_port_1.NullKarmaSourceAdapter(), new safety_service_1.SafetyService(new safety_signal_detector_1.SafetySignalDetector()), outbox, audit, new zuno_ownership_service_1.ZunoOwnershipService(), rulebook, clock, dataSource);
    return {
        service,
        entries,
        revisions,
        patterns,
        classifier,
        outbox,
        audit,
        rulebook,
        clock,
        safetyDecisions,
        safetyIncidents,
    };
}
function planCompletedEvent(overrides = {}) {
    return {
        event_id: 'outbox-row-1',
        user_id: USER_A,
        source: karma_enum_1.KarmaEntrySource.PLAN_COMPLETION,
        plan_item_id: '33333333-3333-4333-8333-333333333333',
        challenge_id: '44444444-4444-4444-8444-444444444444',
        completed_at: NOW.toISOString(),
        outcome: karma_enum_1.KarmaActionOutcome.COMPLETED,
        karma_ledger_eligible: true,
        action_label: 'Have the bank conversation',
        ...overrides,
    };
}
beforeEach(() => {
    idCounter = 0;
});
describe('karma scoring', () => {
    it('scores a first constructive action at the base value', () => {
        const result = (0, karma_scoring_1.calculateKarmaPoints)({
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.SERVICE,
            intent: karma_enum_1.KarmaIntent.UNKNOWN,
            effort: karma_enum_1.KarmaEffort.MEDIUM,
            relevance: karma_enum_1.KarmaRelevance.MEDIUM,
            priorInCategoryInWindow: 0,
            pointsRecordedToday: 0,
        });
        expect(result.points).toBe(5);
        expect(result.scoringModelVersion).toBe('1.0');
        expect(result.softCapApplied).toBe(false);
    });
    it('is deterministic - the same observation always scores the same', () => {
        const observation = {
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.CAREER,
            intent: karma_enum_1.KarmaIntent.FOLLOW_THROUGH,
            effort: karma_enum_1.KarmaEffort.HIGH,
            relevance: karma_enum_1.KarmaRelevance.HIGH,
            priorInCategoryInWindow: 1,
            pointsRecordedToday: 0,
        };
        const first = (0, karma_scoring_1.calculateKarmaPoints)(observation);
        const second = (0, karma_scoring_1.calculateKarmaPoints)(observation);
        expect(first.points).toBe(second.points);
        expect(first.factors).toEqual(second.factors);
    });
    it('weights a high-effort, high-relevance follow-through more, still bounded', () => {
        const result = (0, karma_scoring_1.calculateKarmaPoints)({
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.COURAGE,
            intent: karma_enum_1.KarmaIntent.FOLLOW_THROUGH,
            effort: karma_enum_1.KarmaEffort.HIGH,
            relevance: karma_enum_1.KarmaRelevance.HIGH,
            priorInCategoryInWindow: 0,
            pointsRecordedToday: 0,
        });
        expect(result.points).toBeGreaterThan(5);
        expect(result.points).toBeLessThanOrEqual(karma_scoring_1.KARMA_SCORING_V1.maxPointsPerEntry);
    });
    it('applies a diminishing curve to a repeated action in the same category', () => {
        const first = (0, karma_scoring_1.calculateKarmaPoints)({
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.SELF_DISCIPLINE,
            intent: karma_enum_1.KarmaIntent.ROUTINE,
            effort: karma_enum_1.KarmaEffort.MEDIUM,
            relevance: karma_enum_1.KarmaRelevance.MEDIUM,
            priorInCategoryInWindow: 0,
            pointsRecordedToday: 0,
        });
        const fifth = (0, karma_scoring_1.calculateKarmaPoints)({
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.SELF_DISCIPLINE,
            intent: karma_enum_1.KarmaIntent.ROUTINE,
            effort: karma_enum_1.KarmaEffort.MEDIUM,
            relevance: karma_enum_1.KarmaRelevance.MEDIUM,
            priorInCategoryInWindow: 5,
            pointsRecordedToday: 0,
        });
        expect(fifth.points).toBeLessThan(first.points);
        expect(fifth.points).toBeGreaterThanOrEqual(0);
    });
    it('trims by the daily soft cap without ever going below zero', () => {
        const result = (0, karma_scoring_1.calculateKarmaPoints)({
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.SERVICE,
            intent: karma_enum_1.KarmaIntent.SUPPORT,
            effort: karma_enum_1.KarmaEffort.MEDIUM,
            relevance: karma_enum_1.KarmaRelevance.MEDIUM,
            priorInCategoryInWindow: 0,
            pointsRecordedToday: karma_scoring_1.KARMA_SCORING_V1.dailySoftCap - 2,
        });
        expect(result.points).toBe(2);
        expect(result.softCapApplied).toBe(true);
        const beyond = (0, karma_scoring_1.calculateKarmaPoints)({
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.SERVICE,
            intent: karma_enum_1.KarmaIntent.SUPPORT,
            effort: karma_enum_1.KarmaEffort.MEDIUM,
            relevance: karma_enum_1.KarmaRelevance.MEDIUM,
            priorInCategoryInWindow: 0,
            pointsRecordedToday: karma_scoring_1.KARMA_SCORING_V1.dailySoftCap + 50,
        });
        expect(beyond.points).toBe(0);
    });
    it('scores an unconstructive action at zero, never below', () => {
        const result = (0, karma_scoring_1.calculateKarmaPoints)({
            classification: karma_enum_1.KarmaClassification.UNCONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.COMMUNICATION,
            intent: karma_enum_1.KarmaIntent.UNKNOWN,
            effort: karma_enum_1.KarmaEffort.HIGH,
            relevance: karma_enum_1.KarmaRelevance.HIGH,
            priorInCategoryInWindow: 0,
            pointsRecordedToday: 0,
        });
        expect(result.points).toBe(0);
    });
    it('scores neutral and uncertain at zero', () => {
        for (const classification of [
            karma_enum_1.KarmaClassification.NEUTRAL,
            karma_enum_1.KarmaClassification.UNCERTAIN,
        ]) {
            const result = (0, karma_scoring_1.calculateKarmaPoints)({
                classification,
                category: karma_enum_1.KarmaCategory.OTHER,
                intent: karma_enum_1.KarmaIntent.UNKNOWN,
                effort: karma_enum_1.KarmaEffort.MEDIUM,
                relevance: karma_enum_1.KarmaRelevance.MEDIUM,
                priorInCategoryInWindow: 0,
                pointsRecordedToday: 0,
            });
            expect(result.points).toBe(0);
        }
    });
    it('gives a mixed action partial credit rather than a binary verdict', () => {
        const mixed = (0, karma_scoring_1.calculateKarmaPoints)({
            classification: karma_enum_1.KarmaClassification.MIXED,
            category: karma_enum_1.KarmaCategory.COMMUNICATION,
            intent: karma_enum_1.KarmaIntent.SUPPORT,
            effort: karma_enum_1.KarmaEffort.MEDIUM,
            relevance: karma_enum_1.KarmaRelevance.MEDIUM,
            priorInCategoryInWindow: 0,
            pointsRecordedToday: 0,
        });
        expect(mixed.points).toBeGreaterThan(0);
        expect(mixed.points).toBeLessThan(5);
    });
    it('refuses to score at all if negative scoring is ever switched on', () => {
        const rogue = {
            ...karma_scoring_1.KARMA_SCORING_V1,
            negativeScoringEnabled: true,
        };
        expect(() => (0, karma_scoring_1.assertNonPunitive)(rogue, 0)).toThrow(zuno_exception_1.ZunoException);
    });
    it('downgrades a low-confidence reading to UNCERTAIN', () => {
        expect((0, karma_scoring_1.withConfidenceFloor)(karma_enum_1.KarmaClassification.UNCONSTRUCTIVE, 0.3)).toBe(karma_enum_1.KarmaClassification.UNCERTAIN);
        expect((0, karma_scoring_1.withConfidenceFloor)(karma_enum_1.KarmaClassification.CONSTRUCTIVE, 0.9)).toBe(karma_enum_1.KarmaClassification.CONSTRUCTIVE);
    });
    it('asks for confirmation below the configured threshold', () => {
        expect((0, karma_scoring_1.requiresUserConfirmation)(0.5)).toBe(true);
        expect((0, karma_scoring_1.requiresUserConfirmation)(0.95)).toBe(false);
    });
    it('explains every score without spiritual or moral language', () => {
        for (const classification of Object.values(karma_enum_1.KarmaClassification)) {
            for (const effort of Object.values(karma_enum_1.KarmaEffort)) {
                const result = (0, karma_scoring_1.calculateKarmaPoints)({
                    classification,
                    category: karma_enum_1.KarmaCategory.OTHER,
                    intent: karma_enum_1.KarmaIntent.REPAIR,
                    effort,
                    relevance: karma_enum_1.KarmaRelevance.HIGH,
                    priorInCategoryInWindow: 3,
                    pointsRecordedToday: 0,
                });
                expect((0, neutrality_1.findNeutralityViolations)(result.explanation)).toEqual([]);
            }
        }
    });
});
describe('karma neutrality', () => {
    it('ships only copy that passes the neutrality rules', () => {
        expect(() => (0, neutrality_1.assertKarmaCopyIsNeutral)()).not.toThrow();
        for (const message of Object.values(neutrality_1.KARMA_COPY)) {
            expect((0, neutrality_1.findNeutralityViolations)(message)).toEqual([]);
        }
    });
    it('uses only a headline label approved by Step 17 section 39', () => {
        expect(neutrality_1.KARMA_APPROVED_POINT_LABELS).toContain(neutrality_1.KARMA_POINTS_LABEL);
    });
    it('rejects every anti-pattern Step 17 sections 102-107 names', () => {
        const forbidden = [
            'Your cosmic Karma balance is +842.',
            'You are becoming a bad person.',
            'You rank #14 in Nagpur for Karma.',
            'Premium members receive double Karma.',
            'Your Karma score has neutralized Saturn.',
            'You earned negative Karma because you missed your practice.',
            'This missed practice was penalized.',
            'You should feel ashamed of this week.',
        ];
        for (const text of forbidden) {
            expect((0, neutrality_1.findNeutralityViolations)(text).length).toBeGreaterThan(0);
            expect(() => (0, neutrality_1.assertNeutralCopy)(text, 'test')).toThrow(zuno_exception_1.ZunoException);
        }
    });
    it('does not flag ordinary supportive wording', () => {
        const allowed = [
            'You followed through on something you had been avoiding.',
            'This week your strongest pattern was following through.',
            'We postponed the financial review three times. Let us see what is making it difficult.',
            '8 Karma Ledger Points because it took real effort.',
        ];
        for (const text of allowed) {
            expect((0, neutrality_1.findNeutralityViolations)(text)).toEqual([]);
        }
    });
    it('supports neutral and uncertain classification end to end', async () => {
        const harness = buildHarness();
        harness.classifier.set({
            classification: karma_enum_1.KarmaClassification.NEUTRAL,
            confidence: 0.9,
        });
        const { entry } = await harness.service.createUserEntry({
            userId: USER_A,
            text: 'Renewed my gym membership.',
        });
        expect(entry.classification).toBe(karma_enum_1.KarmaClassification.NEUTRAL);
        expect(entry.points).toBe(0);
    });
    it('never labels a completed plan action as unconstructive', async () => {
        const harness = buildHarness();
        harness.classifier.set({
            classification: karma_enum_1.KarmaClassification.UNCONSTRUCTIVE,
            confidence: 0.95,
        });
        const outcome = await harness.service.handleActionCompleted(planCompletedEvent());
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.RECORDED);
        expect(harness.entries.rows[0].classification).toBe(karma_enum_1.KarmaClassification.NEUTRAL);
        expect(harness.entries.rows[0].points).toBe(0);
    });
    it('records nothing and deducts nothing when a practice is missed', async () => {
        const harness = buildHarness();
        const outcome = await harness.service.handleActionCompleted(planCompletedEvent({ outcome: karma_enum_1.KarmaActionOutcome.MISSED }));
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.NO_PENALTY);
        expect(harness.entries.rows).toHaveLength(0);
        expect((0, neutrality_1.findNeutralityViolations)(outcome.message)).toEqual([]);
    });
    it('records nothing when an action is cancelled by realignment', async () => {
        const harness = buildHarness();
        const outcome = await harness.service.handleActionCompleted(planCompletedEvent({
            outcome: karma_enum_1.KarmaActionOutcome.CANCELLED_BY_REALIGNMENT,
        }));
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.NO_PENALTY);
        expect(outcome.message).toBe(neutrality_1.KARMA_COPY.cancelledByRealignment);
        expect(harness.entries.rows).toHaveLength(0);
    });
    it('treats a deferral as context rather than a fault', async () => {
        const harness = buildHarness();
        const outcome = await harness.service.handleActionCompleted(planCompletedEvent({ outcome: karma_enum_1.KarmaActionOutcome.DEFERRED }));
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.NO_PENALTY);
        expect(harness.entries.rows).toHaveLength(0);
    });
    it('never writes a negative or out-of-bounds score', async () => {
        const harness = buildHarness();
        for (let i = 0; i < 12; i += 1) {
            await harness.service.createUserEntry({
                userId: USER_A,
                text: `Reviewed the budget, pass ${i}`,
            });
        }
        for (const row of harness.entries.rows) {
            expect(row.points).toBeGreaterThanOrEqual(0);
            expect(row.points).toBeLessThanOrEqual(10);
        }
    });
});
describe('karma ownership', () => {
    async function seedEntryFor(harness, userId) {
        const { entry } = await harness.service.createUserEntry({
            userId,
            text: 'Helped a colleague prepare for an interview.',
        });
        return entry;
    }
    it('masks another user\'s entry as NOT_FOUND, never FORBIDDEN', async () => {
        const harness = buildHarness();
        const entry = await seedEntryFor(harness, USER_A);
        await expect(harness.service.findOwned(USER_B, entry.id)).rejects.toThrow(zuno_exception_1.ZunoException);
        await harness.service.findOwned(USER_B, entry.id).catch((error) => {
            expect(error.code).toBe(error_codes_enum_1.ZunoErrorCode.NOT_FOUND);
        });
    });
    it('refuses a correction on another user\'s entry', async () => {
        const harness = buildHarness();
        const entry = await seedEntryFor(harness, USER_A);
        await expect(harness.service.correct(USER_B, entry.id, {
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
        })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
        expect(harness.revisions.rows).toHaveLength(0);
    });
    it('refuses a deletion on another user\'s entry', async () => {
        const harness = buildHarness();
        const entry = await seedEntryFor(harness, USER_A);
        await expect(harness.service.remove(USER_B, entry.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
        expect(harness.entries.rows[0].status).toBe(karma_enum_1.KarmaEntryStatus.ACTIVE);
    });
    it('never returns another user\'s entries in a list', async () => {
        const harness = buildHarness();
        await seedEntryFor(harness, USER_A);
        await seedEntryFor(harness, USER_B);
        const listed = await harness.service.list({ userId: USER_B, limit: 20 });
        expect(listed.items).toHaveLength(1);
        expect(listed.items.every((item) => item.user_id === USER_B)).toBe(true);
    });
    it('never counts another user\'s entries in a summary', async () => {
        const harness = buildHarness();
        await seedEntryFor(harness, USER_A);
        await seedEntryFor(harness, USER_A);
        await seedEntryFor(harness, USER_B);
        const summary = await harness.service.summary(USER_B);
        expect(summary.thisWeek.entriesRecorded).toBe(1);
    });
    it('refuses an event whose upstream owner does not match', async () => {
        const impostorPort = {
            async describeCompletedAction() {
                return {
                    userId: USER_B,
                    challengeId: null,
                    karmaLedgerEligible: true,
                    outcome: karma_enum_1.KarmaActionOutcome.COMPLETED,
                    astrologyDerived: false,
                };
            },
        };
        const harness = buildHarness({ sourcePort: impostorPort });
        const outcome = await harness.service.handleActionCompleted(planCompletedEvent({ user_id: USER_A }));
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.INVALID_EVENT);
        expect(harness.entries.rows).toHaveLength(0);
    });
    it('enforces optimistic concurrency on a correction', async () => {
        const harness = buildHarness();
        const entry = await seedEntryFor(harness, USER_A);
        await expect(harness.service.correct(USER_A, entry.id, {
            classification: karma_enum_1.KarmaClassification.MIXED,
            version: 99,
        })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
    });
});
describe('karma idempotent ingest', () => {
    it('creates exactly one entry when the same event is delivered twice', async () => {
        const harness = buildHarness();
        const event = planCompletedEvent();
        const first = await harness.service.handleActionCompleted(event);
        const second = await harness.service.handleActionCompleted(event);
        expect(first.result).toBe(karma_enum_1.KarmaIngestResult.RECORDED);
        expect(second.result).toBe(karma_enum_1.KarmaIngestResult.DUPLICATE);
        expect(second.entryId).toBe(first.entryId);
        expect(harness.entries.rows).toHaveLength(1);
    });
    it('does not double-credit points on a redelivery', async () => {
        const harness = buildHarness();
        const event = planCompletedEvent();
        await harness.service.handleActionCompleted(event);
        const awarded = harness.entries.rows[0].points;
        await harness.service.handleActionCompleted(event);
        await harness.service.handleActionCompleted(event);
        expect(harness.entries.rows).toHaveLength(1);
        expect(harness.entries.rows[0].points).toBe(awarded);
        const total = harness.entries.rows.reduce((sum, row) => sum + row.points, 0);
        expect(total).toBe(awarded);
    });
    it('emits the ledger events once, not once per delivery', async () => {
        const harness = buildHarness();
        const event = planCompletedEvent();
        await harness.service.handleActionCompleted(event);
        const callsAfterFirst = harness.outbox.enqueueMany.mock.calls.length;
        await harness.service.handleActionCompleted(event);
        expect(harness.outbox.enqueueMany.mock.calls.length).toBe(callsAfterFirst);
    });
    it('deduplicates on the upstream item even when the event id differs', async () => {
        const harness = buildHarness();
        await harness.service.handleActionCompleted(planCompletedEvent());
        const second = await harness.service.handleActionCompleted(planCompletedEvent({
            event_id: 'outbox-row-2',
            challenge_id: '55555555-5555-4555-8555-555555555555',
        }));
        expect(second.result).toBe(karma_enum_1.KarmaIngestResult.DUPLICATE);
        expect(harness.entries.rows).toHaveLength(1);
    });
    it('deduplicates a manual entry against the same words on the same day', async () => {
        const harness = buildHarness();
        const first = await harness.service.createUserEntry({
            userId: USER_A,
            text: 'Reviewed the home-loan clauses.',
        });
        const second = await harness.service.createUserEntry({
            userId: USER_A,
            text: '  reviewed the home-loan clauses  ',
        });
        expect(second.entry.id).toBe(first.entry.id);
        expect(harness.entries.rows).toHaveLength(1);
    });
    it('rejects a malformed payload without throwing at the consumer', async () => {
        const harness = buildHarness();
        const outcome = await harness.service.handleActionCompleted({
            event_id: '',
            user_id: 'not-a-uuid',
        });
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.INVALID_EVENT);
        expect(harness.entries.rows).toHaveLength(0);
    });
    it('validates the event contract field by field', () => {
        expect((0, karma_source_port_1.validateActionCompletedPayload)(planCompletedEvent())).toEqual([]);
        expect((0, karma_source_port_1.validateActionCompletedPayload)(planCompletedEvent({ plan_item_id: null, mka_item_id: null }))).toContain('plan_item_id|mka_item_id');
        expect((0, karma_source_port_1.validateActionCompletedPayload)(planCompletedEvent({
            plan_item_id: '33333333-3333-4333-8333-333333333333',
            mka_item_id: '66666666-6666-4666-8666-666666666666',
        }))).toContain('plan_item_id|mka_item_id');
        expect((0, karma_source_port_1.validateActionCompletedPayload)(planCompletedEvent({ outcome: 'NOPE' }))).toContain('outcome');
    });
});
describe('karma eligibility', () => {
    it('ignores a completed action the upstream module did not mark eligible', async () => {
        const harness = buildHarness();
        const outcome = await harness.service.handleActionCompleted(planCompletedEvent({
            karma_ledger_eligible: false,
            action_label: 'Open settings page',
        }));
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.NOT_ELIGIBLE);
        expect(harness.entries.rows).toHaveLength(0);
    });
    it('treats a missing eligibility flag as not eligible', async () => {
        const harness = buildHarness();
        const event = planCompletedEvent();
        delete event.karma_ledger_eligible;
        const outcome = await harness.service.handleActionCompleted(event);
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.INVALID_EVENT);
    });
    it('fails closed on an astrology-derived practice with no active Rulebook', async () => {
        const harness = buildHarness({ astrologyAvailable: false });
        const outcome = await harness.service.handleActionCompleted(planCompletedEvent({
            source: karma_enum_1.KarmaEntrySource.MKA_COMPLETION,
            plan_item_id: null,
            mka_item_id: '66666666-6666-4666-8666-666666666666',
            astrology_derived: true,
        }));
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.INTERPRETATION_UNAVAILABLE);
        expect(harness.entries.rows).toHaveLength(0);
        expect(harness.rulebook.isAstrologyAvailable).toHaveBeenCalled();
    });
    it('records a completed remedy as consistency when a Rulebook is active', async () => {
        const harness = buildHarness({ astrologyAvailable: true });
        const outcome = await harness.service.handleActionCompleted(planCompletedEvent({
            source: karma_enum_1.KarmaEntrySource.MKA_COMPLETION,
            plan_item_id: null,
            mka_item_id: '66666666-6666-4666-8666-666666666666',
            astrology_derived: true,
            action_label: 'Morning grounding practice',
        }));
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.RECORDED);
        expect(harness.entries.rows[0].category).toBe(karma_enum_1.KarmaCategory.CONSISTENCY);
        expect(harness.entries.rows[0].intent).toBe(karma_enum_1.KarmaIntent.INTENTIONAL_PRACTICE);
    });
    it('survives a Rulebook lookup failure by recording nothing', async () => {
        const harness = buildHarness();
        harness.rulebook.isAstrologyAvailable.mockRejectedValueOnce(new Error('rulebook down'));
        const outcome = await harness.service.handleActionCompleted(planCompletedEvent({ astrology_derived: true }));
        expect(outcome.result).toBe(karma_enum_1.KarmaIngestResult.INTERPRETATION_UNAVAILABLE);
        expect(harness.entries.rows).toHaveLength(0);
    });
});
describe('karma safety precedence', () => {
    it('routes a self-harm entry to safety instead of scoring it', async () => {
        const harness = buildHarness();
        await expect(harness.service.createUserEntry({
            userId: USER_A,
            text: 'I do not want to live anymore, there is no point',
        })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED });
        expect(harness.entries.rows).toHaveLength(0);
        expect(harness.outbox.enqueueMany).not.toHaveBeenCalled();
        expect(harness.safetyDecisions.rows).toHaveLength(1);
        expect(harness.safetyIncidents.rows).toHaveLength(1);
        expect(JSON.stringify(harness.safetyDecisions.rows)).not.toContain('do not want to live');
    });
});
describe('karma user correction', () => {
    it('lets the user overturn the classification and preserves the original', async () => {
        const harness = buildHarness();
        harness.classifier.set({
            classification: karma_enum_1.KarmaClassification.UNCONSTRUCTIVE,
            confidence: 0.8,
            category: karma_enum_1.KarmaCategory.COMMUNICATION,
        });
        const { entry } = await harness.service.createUserEntry({
            userId: USER_A,
            text: 'I told my manager the project timeline was unrealistic.',
        });
        expect(entry.classification).toBe(karma_enum_1.KarmaClassification.UNCONSTRUCTIVE);
        const corrected = await harness.service.correct(USER_A, entry.id, {
            classification: karma_enum_1.KarmaClassification.MIXED,
            accepted: false,
            comment: 'That was not my intention.',
        });
        expect(corrected.classification).toBe(karma_enum_1.KarmaClassification.MIXED);
        expect(corrected.status).toBe(karma_enum_1.KarmaEntryStatus.EDITED);
        expect(corrected.user_confirmed).toBe(true);
        expect(harness.revisions.rows).toHaveLength(1);
        const revision = harness.revisions.rows[0];
        expect(revision.previous_value.classification).toBe(karma_enum_1.KarmaClassification.UNCONSTRUCTIVE);
        expect(revision.new_value.classification).toBe(karma_enum_1.KarmaClassification.MIXED);
        expect(revision.reason).toBe('That was not my intention.');
    });
    it('never takes points away when the user corrects an entry', async () => {
        const harness = buildHarness();
        const { entry } = await harness.service.createUserEntry({
            userId: USER_A,
            text: 'Helped a colleague prepare for an interview.',
        });
        const awarded = entry.points;
        const corrected = await harness.service.correct(USER_A, entry.id, {
            classification: karma_enum_1.KarmaClassification.NEUTRAL,
        });
        expect(corrected.points).toBeGreaterThanOrEqual(awarded);
        expect(corrected.points).toBeGreaterThanOrEqual(0);
    });
    it('does not copy the user\'s words into the revision history', async () => {
        const harness = buildHarness();
        const { entry } = await harness.service.createUserEntry({
            userId: USER_A,
            text: 'A private thing I would rather not repeat anywhere else.',
        });
        await harness.service.correct(USER_A, entry.id, {
            text: 'A different private thing.',
        });
        const serialised = JSON.stringify(harness.revisions.rows);
        expect(serialised).not.toContain('private thing');
        expect(harness.revisions.rows[0].raw_text_changed).toBe(true);
    });
});
describe('karma privacy', () => {
    it('keeps raw ledger text out of every emitted event', async () => {
        const harness = buildHarness();
        const secret = 'Apologised to my brother about the inheritance argument.';
        await harness.service.createUserEntry({ userId: USER_A, text: secret });
        const emitted = JSON.stringify([
            ...harness.outbox.enqueue.mock.calls,
            ...harness.outbox.enqueueMany.mock.calls,
        ]);
        expect(emitted).not.toContain('inheritance');
        expect(emitted).not.toContain(secret);
        expect(emitted).toContain('zuno.karma.entry_created');
    });
    it('keeps raw ledger text out of the audit trail', async () => {
        const harness = buildHarness();
        const secret = 'Something I only want in my own ledger.';
        await harness.service.createUserEntry({ userId: USER_A, text: secret });
        const audited = JSON.stringify(harness.audit.record.mock.calls);
        expect(audited).not.toContain(secret);
    });
    it('marks every entry private, whatever the source', async () => {
        const harness = buildHarness();
        await harness.service.createUserEntry({ userId: USER_A, text: 'Went for a run.' });
        await harness.service.handleActionCompleted(planCompletedEvent());
        for (const row of harness.entries.rows) {
            expect(row.visibility).toBe(karma_enum_1.KarmaVisibility.PRIVATE);
        }
    });
    it('erases the words and stops counting the entry on delete', async () => {
        const harness = buildHarness();
        const { entry } = await harness.service.createUserEntry({
            userId: USER_A,
            text: 'Helped a colleague prepare for an interview.',
        });
        await harness.service.remove(USER_A, entry.id);
        const row = harness.entries.rows[0];
        expect(row.raw_text).toBeNull();
        expect(row.redacted_at).not.toBeNull();
        expect(row.status).toBe(karma_enum_1.KarmaEntryStatus.DELETED);
        const summary = await harness.service.summary(USER_A);
        expect(summary.thisWeek.entriesRecorded).toBe(0);
        await expect(harness.service.findOwned(USER_A, entry.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
    });
    it('offers no ranking or comparison in the summary', async () => {
        const harness = buildHarness();
        await harness.service.createUserEntry({
            userId: USER_A,
            text: 'Helped a colleague prepare for an interview.',
        });
        const summary = await harness.service.summary(USER_A);
        const keys = JSON.stringify(summary).toLowerCase();
        expect(keys).not.toContain('rank');
        expect(keys).not.toContain('leaderboard');
        expect(keys).not.toContain('percentile');
        expect(neutrality_1.KARMA_APPROVED_POINT_LABELS).toContain(summary.pointsLabel);
    });
});
describe('deterministic classifier golden cases', () => {
    const classifier = new deterministic_karma_classifier_1.DeterministicKarmaClassifier();
    it('reads a clear supportive action as constructive service', async () => {
        const result = await classifier.classify({
            text: 'I helped my colleague prepare for an interview.',
            source: karma_enum_1.KarmaEntrySource.USER_CREATED,
        });
        expect(result.classification).toBe(karma_enum_1.KarmaClassification.CONSTRUCTIVE);
        expect(result.category).toBe(karma_enum_1.KarmaCategory.SERVICE);
        expect(result.confidence).toBeGreaterThan(0.5);
    });
    it('refuses to judge an ambiguous statement', async () => {
        const result = await classifier.classify({
            text: 'I told him exactly what I thought.',
            source: karma_enum_1.KarmaEntrySource.USER_CREATED,
        });
        const settled = (0, karma_scoring_1.withConfidenceFloor)(result.classification, result.confidence);
        expect(settled).toBe(karma_enum_1.KarmaClassification.UNCERTAIN);
    });
    it('reads both directions in one sentence as MIXED', async () => {
        const result = await classifier.classify({
            text: 'I helped my colleague, but I should not have shared that information.',
            source: karma_enum_1.KarmaEntrySource.USER_CREATED,
        });
        expect(result.classification).toBe(karma_enum_1.KarmaClassification.MIXED);
    });
    it('recognises repair as its own constructive act', async () => {
        const result = await classifier.classify({
            text: 'I apologised after speaking harshly.',
            source: karma_enum_1.KarmaEntrySource.USER_CREATED,
        });
        expect(result.classification).toBe(karma_enum_1.KarmaClassification.CONSTRUCTIVE);
        expect(result.category).toBe(karma_enum_1.KarmaCategory.REPAIR);
        expect(result.intent).toBe(karma_enum_1.KarmaIntent.REPAIR);
    });
    it('never returns points', async () => {
        const result = await classifier.classify({
            text: 'Completed the bank discussion I had been avoiding.',
            source: karma_enum_1.KarmaEntrySource.USER_CREATED,
        });
        expect(result).not.toHaveProperty('points');
    });
    it('ends an ambiguous user entry at zero points, not a guess', async () => {
        const harness = buildHarness({ classifier: new deterministic_karma_classifier_1.DeterministicKarmaClassifier() });
        const { entry, confirmationRequired } = await harness.service.createUserEntry({
            userId: USER_A,
            text: 'I told him exactly what I thought.',
        });
        expect(entry.classification).toBe(karma_enum_1.KarmaClassification.UNCERTAIN);
        expect(entry.points).toBe(0);
        expect(confirmationRequired).toBe(true);
    });
});
describe('karma patterns', () => {
    it('needs enough evidence before observing a pattern', async () => {
        const harness = buildHarness();
        harness.classifier.set({
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.SERVICE,
            confidence: 0.9,
        });
        await harness.service.createUserEntry({ userId: USER_A, text: 'Helped once.' });
        expect(harness.patterns.rows).toHaveLength(0);
        await harness.service.createUserEntry({ userId: USER_A, text: 'Helped twice.' });
        await harness.service.createUserEntry({
            userId: USER_A,
            text: 'Helped a third time.',
        });
        const servicePattern = harness.patterns.rows.find((row) => row.pattern_type === 'SERVICE_CONSISTENT');
        expect(servicePattern).toBeDefined();
        expect(servicePattern?.evidence_count).toBeGreaterThanOrEqual(3);
    });
    it('describes patterns without moral language', async () => {
        const harness = buildHarness();
        harness.classifier.set({
            classification: karma_enum_1.KarmaClassification.CONSTRUCTIVE,
            category: karma_enum_1.KarmaCategory.REPAIR,
            confidence: 0.9,
        });
        for (let i = 0; i < 3; i += 1) {
            await harness.service.createUserEntry({
                userId: USER_A,
                text: `Made amends, attempt ${i}`,
            });
        }
        const summary = await harness.service.summary(USER_A);
        for (const pattern of summary.patterns) {
            expect((0, neutrality_1.findNeutralityViolations)(pattern.patternType.replace(/_/g, ' '))).toEqual([]);
        }
    });
});
//# sourceMappingURL=karma.service.spec.js.map