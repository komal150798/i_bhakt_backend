"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plan_service_1 = require("./plan.service");
const mka_service_1 = require("../../mka/services/mka.service");
const mka_plan_test_harness_1 = require("../../mka/services/mka-plan.test-harness");
const zuno_plan_entity_1 = require("../entities/zuno-plan.entity");
const zuno_plan_item_entity_1 = require("../entities/zuno-plan-item.entity");
const zuno_plan_item_event_entity_1 = require("../entities/zuno-plan-item-event.entity");
const zuno_mka_program_entity_1 = require("../../mka/entities/zuno-mka-program.entity");
const zuno_mka_item_entity_1 = require("../../mka/entities/zuno-mka-item.entity");
const zuno_mka_completion_entity_1 = require("../../mka/entities/zuno-mka-completion.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_challenge_context_entity_1 = require("../../challenges/entities/zuno-challenge-context.entity");
const zuno_response_entity_1 = require("../../responses/entities/zuno-response.entity");
const zuno_event_outbox_entity_1 = require("../../common/entities/zuno-event-outbox.entity");
const zuno_audit_event_entity_1 = require("../../common/entities/zuno-audit-event.entity");
const zuno_safety_decision_entity_1 = require("../../safety/entities/zuno-safety-decision.entity");
const zuno_safety_incident_entity_1 = require("../../safety/entities/zuno-safety-incident.entity");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
const plan_enum_1 = require("../enums/plan.enum");
const plan_capacity_1 = require("../enums/plan-capacity");
const mka_plan_event_enum_1 = require("../../mka/enums/mka-plan-event.enum");
describe('PlanService', () => {
    const USER_ID = '11111111-1111-4111-8111-111111111111';
    const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
    const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';
    let plans;
    let items;
    let itemEvents;
    let challenges;
    let mkaPrograms;
    let mkaItems;
    let contexts;
    let outboxRows;
    let service;
    const user = { id: USER_ID, timezone: 'Asia/Dubai' };
    beforeEach(() => {
        delete process.env.ZUNO_PLAN_CAPACITY_JSON;
        build();
    });
    afterEach(() => {
        delete process.env.ZUNO_PLAN_CAPACITY_JSON;
    });
    function build() {
        plans = new mka_plan_test_harness_1.FakeRepository();
        items = new mka_plan_test_harness_1.FakeRepository();
        itemEvents = new mka_plan_test_harness_1.FakeRepository();
        challenges = new mka_plan_test_harness_1.FakeRepository();
        mkaPrograms = new mka_plan_test_harness_1.FakeRepository();
        mkaItems = new mka_plan_test_harness_1.FakeRepository();
        contexts = new mka_plan_test_harness_1.FakeRepository();
        outboxRows = new mka_plan_test_harness_1.FakeRepository();
        const mkaCompletions = new mka_plan_test_harness_1.FakeRepository();
        const responses = new mka_plan_test_harness_1.FakeRepository();
        const registry = new Map([
            [zuno_plan_entity_1.ZunoPlan, plans],
            [zuno_plan_item_entity_1.ZunoPlanItem, items],
            [zuno_plan_item_event_entity_1.ZunoPlanItemEvent, itemEvents],
            [zuno_challenge_entity_1.ZunoChallenge, challenges],
            [zuno_mka_program_entity_1.ZunoMkaProgram, mkaPrograms],
            [zuno_mka_item_entity_1.ZunoMkaItem, mkaItems],
            [zuno_mka_completion_entity_1.ZunoMkaCompletion, mkaCompletions],
            [zuno_challenge_context_entity_1.ZunoChallengeContext, contexts],
            [zuno_response_entity_1.ZunoResponse, responses],
            [zuno_event_outbox_entity_1.ZunoEventOutbox, outboxRows],
            [zuno_audit_event_entity_1.ZunoAuditEvent, new mka_plan_test_harness_1.FakeRepository()],
            [zuno_safety_decision_entity_1.ZunoSafetyDecision, new mka_plan_test_harness_1.FakeRepository()],
            [zuno_safety_incident_entity_1.ZunoSafetyIncident, new mka_plan_test_harness_1.FakeRepository()],
        ]);
        const manager = new mka_plan_test_harness_1.FakeEntityManager(registry);
        const dataSource = (0, mka_plan_test_harness_1.fakeDataSource)(manager);
        const mka = new mka_service_1.MkaService(mkaPrograms.asRepository(), mkaItems.asRepository(), mkaCompletions.asRepository(), challenges.asRepository(), contexts.asRepository(), responses.asRepository(), (0, mka_plan_test_harness_1.fakeRulebook)({ active: null }), (0, mka_plan_test_harness_1.realSafety)(), (0, mka_plan_test_harness_1.realOutbox)(), (0, mka_plan_test_harness_1.realAudit)(), (0, mka_plan_test_harness_1.realOwnership)(), (0, mka_plan_test_harness_1.fixedClock)(), dataSource);
        service = new plan_service_1.PlanService(plans.asRepository(), items.asRepository(), itemEvents.asRepository(), challenges.asRepository(), mka, (0, mka_plan_test_harness_1.realSafety)(), (0, mka_plan_test_harness_1.realOutbox)(), (0, mka_plan_test_harness_1.realAudit)(), (0, mka_plan_test_harness_1.realOwnership)(), (0, mka_plan_test_harness_1.fixedClock)(), dataSource);
    }
    function seedChallenge(overrides = {}) {
        challenges.rows.push({
            id: CHALLENGE_ID,
            user_id: USER_ID,
            title: 'Career and financial resilience',
            raw_user_statement: 'There have been layoffs at my company and I have a home loan to think about.',
            primary_domain: enums_1.ZunoDomain.CAREER,
            status: enums_1.ChallengeStatus.ACTIVE,
            emotional_intensity: enums_1.EmotionalIntensity.HIGH,
            context_version: 1,
            deleted_at: null,
            version: 1,
            ...overrides,
        });
    }
    function seedContext(count) {
        contexts.rows.push({
            id: 'ctx-1',
            challenge_id: CHALLENGE_ID,
            user_id: USER_ID,
            version_number: 1,
            summary: 'Career uncertainty with financial exposure.',
            payload: {
                summary: 'Career uncertainty with financial exposure.',
                items: [],
                dependencies: [],
                desired_outcomes: [],
                decisions: [],
                factors: {
                    controllable: Array.from({ length: count }, (_, index) => `Practical step ${index + 1}`),
                    external: [],
                },
                temporal_anchors: [],
                missing_information: [],
                emotional_signals: [],
                subthemes: [],
            },
        });
    }
    function seedMkaProgram(actionCount, options = {}) {
        const programId = 'mka-prog-1';
        mkaPrograms.rows.push({
            id: programId,
            user_id: USER_ID,
            challenge_id: CHALLENGE_ID,
            status: 'ACTIVE',
            plan_id: null,
            deleted_at: null,
            version: 1,
        });
        const essentials = options.essentials ?? actionCount;
        for (let index = 0; index < actionCount; index += 1) {
            mkaItems.rows.push({
                id: `mka-action-${index}`,
                mka_program_id: programId,
                user_id: USER_ID,
                dimension: 'ACTION',
                title: `Practical step ${index + 1}`,
                description: 'Something concrete and useful.',
                purpose: 'Move the situation forward.',
                priority: index < essentials ? 'ESSENTIAL' : 'IMPORTANT',
                duration_minutes: 30,
                plan_eligible: true,
                karma_eligible: true,
                status: 'ACTIVE',
                display_order: index,
                deleted_at: null,
            });
        }
        if (options.practices !== false) {
            mkaItems.rows.push({
                id: 'mka-mind-1',
                mka_program_id: programId,
                user_id: USER_ID,
                dimension: 'MIND',
                title: 'Stay with facts, not fear',
                description: 'Five quiet minutes each morning.',
                purpose: 'Start the day from facts.',
                priority: 'ESSENTIAL',
                duration_minutes: 5,
                plan_eligible: true,
                karma_eligible: false,
                status: 'ACTIVE',
                display_order: 100,
                deleted_at: null,
            }, {
                id: 'mka-karma-1',
                mka_program_id: programId,
                user_id: USER_ID,
                dimension: 'KARMA',
                title: 'One small commitment, kept',
                description: 'The same small thing, daily.',
                purpose: 'Something steady and within your control.',
                priority: 'IMPORTANT',
                duration_minutes: 10,
                plan_eligible: true,
                karma_eligible: true,
                status: 'ACTIVE',
                display_order: 101,
                deleted_at: null,
            });
        }
    }
    const activeItems = () => items.rows.filter((row) => row.status === plan_enum_1.PlanItemStatus.PENDING);
    describe('plan capacity', () => {
        it('caps a TODAY plan at three meaningful actions', async () => {
            seedChallenge();
            seedMkaProgram(8);
            await service.generate({ user, challengeId: CHALLENGE_ID, planType: plan_enum_1.PlanType.TODAY });
            const actions = activeItems().filter((row) => !row.is_practice);
            expect(actions).toHaveLength((0, plan_capacity_1.planCapacityFor)(plan_enum_1.PlanType.TODAY).maxActions);
            expect(actions).toHaveLength(3);
        });
        it('caps a WEEKLY plan at seven meaningful actions', async () => {
            seedChallenge();
            seedMkaProgram(15);
            await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.WEEKLY,
            });
            const actions = activeItems().filter((row) => !row.is_practice);
            expect(actions).toHaveLength(7);
        });
        it('defers the overflow rather than discarding it', async () => {
            seedChallenge();
            seedMkaProgram(8);
            await service.generate({ user, challengeId: CHALLENGE_ID, planType: plan_enum_1.PlanType.TODAY });
            const deferred = items.rows.filter((row) => row.status === plan_enum_1.PlanItemStatus.DEFERRED);
            expect(deferred.length).toBe(5);
            const events = itemEvents.rows.filter((row) => row.event_type === 'CAPACITY_DEFERRED');
            expect(events.length).toBe(5);
        });
        it('lets MKA practices sit alongside the action budget', async () => {
            seedChallenge();
            seedMkaProgram(3);
            await service.generate({ user, challengeId: CHALLENGE_ID, planType: plan_enum_1.PlanType.TODAY });
            const active = activeItems();
            expect(active.filter((row) => !row.is_practice)).toHaveLength(3);
            expect(active.filter((row) => row.is_practice)).toHaveLength(2);
            expect(active).toHaveLength(5);
        });
        it('caps practices separately, and defers the surplus', async () => {
            seedChallenge();
            seedMkaProgram(0, { practices: true });
            mkaItems.rows.push({
                id: 'mka-mind-2',
                mka_program_id: 'mka-prog-1',
                user_id: USER_ID,
                dimension: 'MIND',
                title: 'Close the day honestly',
                description: 'One line at the end of the day.',
                purpose: 'Keep a clear view of progress.',
                priority: 'OPTIONAL',
                duration_minutes: 3,
                plan_eligible: true,
                karma_eligible: false,
                status: 'ACTIVE',
                display_order: 102,
                deleted_at: null,
            });
            await service.generate({ user, challengeId: CHALLENGE_ID, planType: plan_enum_1.PlanType.TODAY });
            expect(activeItems().filter((row) => row.is_practice)).toHaveLength(2);
            expect(items.rows.filter((row) => row.status === plan_enum_1.PlanItemStatus.DEFERRED)).toHaveLength(1);
        });
        it('admits only one ESSENTIAL action and demotes the rest', async () => {
            seedChallenge();
            seedMkaProgram(3, { essentials: 3, practices: false });
            await service.generate({ user, challengeId: CHALLENGE_ID, planType: plan_enum_1.PlanType.TODAY });
            const active = activeItems();
            const essentials = active.filter((row) => row.priority === plan_enum_1.PlanItemPriority.ESSENTIAL);
            expect(essentials).toHaveLength(1);
            expect(active).toHaveLength(3);
            expect(active.filter((row) => row.priority === plan_enum_1.PlanItemPriority.IMPORTANT)).toHaveLength(2);
            for (const row of active) {
                expect(row.priority_rank).toBe(row.priority === plan_enum_1.PlanItemPriority.ESSENTIAL ? 1 : 2);
            }
        });
        it('honours the configurable override', async () => {
            process.env.ZUNO_PLAN_CAPACITY_JSON = JSON.stringify({
                TODAY: { maxActions: 1, maxPractices: 0 },
            });
            seedChallenge();
            seedMkaProgram(5);
            await service.generate({ user, challengeId: CHALLENGE_ID, planType: plan_enum_1.PlanType.TODAY });
            const active = activeItems();
            expect(active.filter((row) => !row.is_practice)).toHaveLength(1);
            expect(active.filter((row) => row.is_practice)).toHaveLength(0);
        });
        it('ignores a nonsensical override rather than emptying the plan', async () => {
            process.env.ZUNO_PLAN_CAPACITY_JSON = JSON.stringify({
                TODAY: { maxActions: 0 },
            });
            expect((0, plan_capacity_1.planCapacityFor)(plan_enum_1.PlanType.TODAY).maxActions).toBe(3);
        });
        it('refuses a user-added task when the plan is already full', async () => {
            seedChallenge();
            seedMkaProgram(5);
            const { plan } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            await expect(service.addItem(user, plan.id, { title: 'Call the bank' })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
        });
        it('accepts a user-added task when there is room', async () => {
            seedChallenge();
            seedMkaProgram(1, { practices: false });
            const { plan } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            const added = await service.addItem(user, plan.id, {
                title: 'Call the bank tomorrow',
                isCommitment: true,
            });
            expect(added.source_type).toBe('USER_COMMITMENT');
            expect(added.status).toBe(plan_enum_1.PlanItemStatus.PENDING);
        });
        it('refuses to activate a plan that is over capacity', async () => {
            seedChallenge();
            seedMkaProgram(2, { practices: false });
            const { plan } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            process.env.ZUNO_PLAN_CAPACITY_JSON = JSON.stringify({
                TODAY: { maxActions: 1 },
            });
            await expect(service.activate(user, plan.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
        });
        it('activates a plan that fits', async () => {
            seedChallenge();
            seedMkaProgram(2, { practices: false });
            const { plan } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            const activated = await service.activate(user, plan.id);
            expect(activated.status).toBe(plan_enum_1.PlanStatus.ACTIVE);
            expect(activated.activated_at).not.toBeNull();
        });
    });
    describe('action lifecycle', () => {
        const allStatuses = Object.values(plan_enum_1.PlanItemStatus);
        const illegalPairs = [];
        for (const from of allStatuses) {
            for (const to of allStatuses) {
                if (from === to)
                    continue;
                if (!plan_enum_1.PLAN_ITEM_STATUS_TRANSITIONS[from].includes(to)) {
                    illegalPairs.push([from, to]);
                }
            }
        }
        it('has illegal transitions to test', () => {
            expect(illegalPairs.length).toBeGreaterThan(0);
        });
        it.each(illegalPairs)('refuses %s -> %s', (from, to) => {
            expect(() => service.assertTransition(from, to)).toThrow(zuno_exception_1.ZunoException);
            try {
                service.assertTransition(from, to);
            }
            catch (error) {
                expect(error.code).toBe(error_codes_enum_1.ZunoErrorCode.CONFLICT);
            }
        });
        it('never silently passes an illegal transition', () => {
            expect(() => service.assertTransition(plan_enum_1.PlanItemStatus.DONE, plan_enum_1.PlanItemStatus.PENDING)).toThrow(zuno_exception_1.ZunoException);
        });
        it('keeps completed work safe from a realignment', () => {
            expect(() => service.assertTransition(plan_enum_1.PlanItemStatus.DONE, plan_enum_1.PlanItemStatus.CANCELLED_BY_REALIGNMENT)).toThrow(zuno_exception_1.ZunoException);
        });
        it('never lets a realignment cancellation become a missed task', () => {
            expect(() => service.assertTransition(plan_enum_1.PlanItemStatus.CANCELLED_BY_REALIGNMENT, plan_enum_1.PlanItemStatus.MISSED)).toThrow(zuno_exception_1.ZunoException);
        });
        it('will not complete a dormant conditional action', () => {
            expect(() => service.assertTransition(plan_enum_1.PlanItemStatus.CONDITIONAL, plan_enum_1.PlanItemStatus.DONE)).toThrow(zuno_exception_1.ZunoException);
        });
        it.each([
            [plan_enum_1.PlanItemStatus.PENDING, plan_enum_1.PlanItemStatus.IN_PROGRESS],
            [plan_enum_1.PlanItemStatus.PENDING, plan_enum_1.PlanItemStatus.DONE],
            [plan_enum_1.PlanItemStatus.IN_PROGRESS, plan_enum_1.PlanItemStatus.DONE],
            [plan_enum_1.PlanItemStatus.MISSED, plan_enum_1.PlanItemStatus.PENDING],
            [plan_enum_1.PlanItemStatus.SKIPPED, plan_enum_1.PlanItemStatus.PENDING],
            [plan_enum_1.PlanItemStatus.BLOCKED, plan_enum_1.PlanItemStatus.DONE],
            [plan_enum_1.PlanItemStatus.CONDITIONAL, plan_enum_1.PlanItemStatus.PENDING],
        ])('allows %s -> %s', (from, to) => {
            expect(service.assertTransition(from, to)).toBe(to);
        });
        it('rejects an illegal transition end to end, leaving the row untouched', async () => {
            seedChallenge();
            seedMkaProgram(1, { practices: false });
            const { plan, items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            await service.activate(user, plan.id);
            const item = created[0];
            await service.completeItem(user, item.id);
            await expect(service.deferItem(user, item.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
            expect(items.rows.find((row) => row.id === item.id).status).toBe(plan_enum_1.PlanItemStatus.DONE);
        });
        it('writes an immutable event row for every status change', async () => {
            seedChallenge();
            seedMkaProgram(1, { practices: false });
            const { plan, items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            await service.activate(user, plan.id);
            const item = created[0];
            await service.startItem(user, item.id);
            await service.completeItem(user, item.id);
            const history = itemEvents.rows.filter((row) => row.plan_item_id === item.id);
            expect(history.map((row) => row.new_status)).toEqual([
                plan_enum_1.PlanItemStatus.PENDING,
                plan_enum_1.PlanItemStatus.IN_PROGRESS,
                plan_enum_1.PlanItemStatus.DONE,
            ]);
        });
        it('emits the completion event the Karma Ledger consumes', async () => {
            seedChallenge();
            seedMkaProgram(1, { practices: false });
            const { plan, items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            await service.activate(user, plan.id);
            outboxRows.rows.length = 0;
            await service.completeItem(user, created[0].id);
            const event = outboxRows.rows.find((row) => row.event_type === mka_plan_event_enum_1.MkaPlanEventType.PLAN_ITEM_COMPLETED);
            expect(event).toBeDefined();
            expect(event.payload.karma_eligible).toBe(true);
            expect(event.payload.plan_item_id).toBe(created[0].id);
            expect(event.payload.title).toBeUndefined();
        });
        it('emits no event for a missed task', async () => {
            seedChallenge();
            seedMkaProgram(1, { practices: false });
            const { plan, items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            await service.activate(user, plan.id);
            outboxRows.rows.length = 0;
            await service.transitionItem({
                user,
                itemId: created[0].id,
                to: plan_enum_1.PlanItemStatus.MISSED,
            });
            expect(outboxRows.rows).toHaveLength(0);
            expect(itemEvents.rows.some((row) => row.new_status === plan_enum_1.PlanItemStatus.MISSED)).toBe(true);
        });
        it('asks for a plan-fit review after repeated deferral, not a nudge', async () => {
            seedChallenge();
            seedMkaProgram(1, { practices: false });
            const { plan, items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            await service.activate(user, plan.id);
            const item = created[0];
            for (let round = 0; round < 3; round += 1) {
                await service.deferItem(user, item.id);
                await service.transitionItem({
                    user,
                    itemId: item.id,
                    to: plan_enum_1.PlanItemStatus.PENDING,
                });
            }
            expect(outboxRows.rows.some((row) => row.event_type === mka_plan_event_enum_1.MkaPlanEventType.PLAN_FIT_REVIEW)).toBe(true);
        });
        it('will not start an item whose dependency is unfinished', async () => {
            seedChallenge();
            seedMkaProgram(2, { practices: false });
            const { plan, items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            await service.activate(user, plan.id);
            const [first, second] = created;
            items.rows.find((row) => row.id === second.id).depends_on_item_ids = [
                first.id,
            ];
            await expect(service.startItem(user, second.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
            await service.completeItem(user, first.id);
            const started = await service.startItem(user, second.id);
            expect(started.status).toBe(plan_enum_1.PlanItemStatus.IN_PROGRESS);
        });
        it('will not accept progress against a superseded plan', async () => {
            seedChallenge();
            seedMkaProgram(1, { practices: false });
            const first = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            const item = first.items[0];
            await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
                regenerate: true,
            });
            await expect(service.completeItem(user, item.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
        });
        it('cancels open items on supersede without marking them missed', async () => {
            seedChallenge();
            seedMkaProgram(2, { practices: false });
            const first = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            await service.activate(user, first.plan.id);
            await service.completeItem(user, first.items[0].id);
            await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
                regenerate: true,
            });
            const completed = items.rows.find((row) => row.id === first.items[0].id);
            const open = items.rows.find((row) => row.id === first.items[1].id);
            expect(completed.status).toBe(plan_enum_1.PlanItemStatus.DONE);
            expect(open.status).toBe(plan_enum_1.PlanItemStatus.CANCELLED_BY_REALIGNMENT);
            expect(open.status).not.toBe(plan_enum_1.PlanItemStatus.MISSED);
        });
    });
    describe('ownership', () => {
        it('refuses to generate a plan for someone else\'s challenge', async () => {
            seedChallenge({ user_id: OTHER_USER_ID });
            await expect(service.generate({ user, challengeId: CHALLENGE_ID })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            expect(plans.rows).toHaveLength(0);
        });
        it('refuses to complete someone else\'s plan item, and changes nothing', async () => {
            items.rows.push({
                id: 'item-x',
                plan_id: 'plan-x',
                user_id: OTHER_USER_ID,
                status: plan_enum_1.PlanItemStatus.PENDING,
                deleted_at: null,
            });
            await expect(service.completeItem(user, 'item-x')).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            expect(items.rows[0].status).toBe(plan_enum_1.PlanItemStatus.PENDING);
            expect(itemEvents.rows).toHaveLength(0);
        });
        it('refuses to read someone else\'s plan', async () => {
            plans.rows.push({ id: 'plan-x', user_id: OTHER_USER_ID, deleted_at: null });
            await expect(service.findOwnedPlan(USER_ID, 'plan-x')).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
        });
        it('refuses to add an item to someone else\'s plan', async () => {
            plans.rows.push({
                id: 'plan-x',
                user_id: OTHER_USER_ID,
                plan_type: plan_enum_1.PlanType.TODAY,
                status: plan_enum_1.PlanStatus.ACTIVE,
                deleted_at: null,
            });
            await expect(service.addItem(user, 'plan-x', { title: 'Sneak this in' })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            expect(items.rows).toHaveLength(0);
        });
    });
    describe('when no rulebook is active', () => {
        it('still builds a usable plan, generating the MKA programme it needs', async () => {
            seedChallenge();
            seedContext(3);
            const { plan, items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            expect(plan.status).toBe(plan_enum_1.PlanStatus.DRAFT);
            expect(created.length).toBeGreaterThan(0);
            expect(created.some((item) => !item.is_practice)).toBe(true);
            expect(mkaPrograms.rows).toHaveLength(1);
            expect(mkaPrograms.rows[0].plan_id).toBe(plan.id);
        });
        it('records the capacity that was in force', async () => {
            seedChallenge();
            seedContext(2);
            const { plan } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            expect(plan.capacity_snapshot.maxActions).toBe(3);
            expect(plan.capacity_snapshot.maxPractices).toBe(2);
        });
    });
    describe('safety', () => {
        it('builds nothing when the pre-check blocks', async () => {
            seedChallenge({
                raw_user_statement: 'I am thinking about killing myself, none of this matters',
            });
            await expect(service.generate({ user, challengeId: CHALLENGE_ID })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED });
            expect(plans.rows).toHaveLength(0);
            expect(items.rows).toHaveLength(0);
        });
    });
    describe('optimistic concurrency', () => {
        it('refuses a stale write with 409', async () => {
            seedChallenge();
            seedMkaProgram(1, { practices: false });
            const { plan } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                planType: plan_enum_1.PlanType.TODAY,
            });
            plans.rows[0].version = 5;
            await expect(service.patch(user, plan.id, { title: 'Stale', version: 4 })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
        });
    });
});
//# sourceMappingURL=plan.service.spec.js.map