"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mka_service_1 = require("./mka.service");
const mka_plan_test_harness_1 = require("./mka-plan.test-harness");
const zuno_mka_program_entity_1 = require("../entities/zuno-mka-program.entity");
const zuno_mka_item_entity_1 = require("../entities/zuno-mka-item.entity");
const zuno_mka_completion_entity_1 = require("../entities/zuno-mka-completion.entity");
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
const mka_enum_1 = require("../enums/mka.enum");
const mka_plan_event_enum_1 = require("../enums/mka-plan-event.enum");
describe('MkaService', () => {
    const USER_ID = '11111111-1111-4111-8111-111111111111';
    const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
    const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';
    let programs;
    let items;
    let completions;
    let challenges;
    let contexts;
    let responses;
    let outboxRows;
    const user = { id: USER_ID, timezone: 'Asia/Dubai' };
    function buildService(rulebook = (0, mka_plan_test_harness_1.fakeRulebook)({ active: null })) {
        programs = new mka_plan_test_harness_1.FakeRepository();
        items = new mka_plan_test_harness_1.FakeRepository();
        completions = new mka_plan_test_harness_1.FakeRepository();
        challenges = new mka_plan_test_harness_1.FakeRepository();
        contexts = new mka_plan_test_harness_1.FakeRepository();
        responses = new mka_plan_test_harness_1.FakeRepository();
        outboxRows = new mka_plan_test_harness_1.FakeRepository();
        const registry = new Map([
            [zuno_mka_program_entity_1.ZunoMkaProgram, programs],
            [zuno_mka_item_entity_1.ZunoMkaItem, items],
            [zuno_mka_completion_entity_1.ZunoMkaCompletion, completions],
            [zuno_challenge_entity_1.ZunoChallenge, challenges],
            [zuno_challenge_context_entity_1.ZunoChallengeContext, contexts],
            [zuno_response_entity_1.ZunoResponse, responses],
            [zuno_event_outbox_entity_1.ZunoEventOutbox, outboxRows],
            [zuno_audit_event_entity_1.ZunoAuditEvent, new mka_plan_test_harness_1.FakeRepository()],
            [zuno_safety_decision_entity_1.ZunoSafetyDecision, new mka_plan_test_harness_1.FakeRepository()],
            [zuno_safety_incident_entity_1.ZunoSafetyIncident, new mka_plan_test_harness_1.FakeRepository()],
        ]);
        const manager = new mka_plan_test_harness_1.FakeEntityManager(registry);
        return new mka_service_1.MkaService(programs.asRepository(), items.asRepository(), completions.asRepository(), challenges.asRepository(), contexts.asRepository(), responses.asRepository(), rulebook, (0, mka_plan_test_harness_1.realSafety)(), (0, mka_plan_test_harness_1.realOutbox)(), (0, mka_plan_test_harness_1.realAudit)(), (0, mka_plan_test_harness_1.realOwnership)(), (0, mka_plan_test_harness_1.fixedClock)(), (0, mka_plan_test_harness_1.fakeDataSource)(manager));
    }
    function seedChallenge(overrides = {}) {
        challenges.rows.push({
            id: CHALLENGE_ID,
            user_id: USER_ID,
            title: 'Job security and the home loan',
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
    function seedContext(controllable) {
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
                factors: { controllable, external: ['Whether the company restructures'] },
                temporal_anchors: [],
                missing_information: [],
                emotional_signals: [],
                subthemes: [],
            },
        });
    }
    describe('when no rulebook is active', () => {
        it('still produces a valid programme, and says astrology contributed nothing', async () => {
            const service = buildService((0, mka_plan_test_harness_1.fakeRulebook)({ active: null }));
            seedChallenge();
            seedContext(['Update my CV', 'Speak to two trusted contacts']);
            const { program, items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            expect(program.remedy_status).toBe(mka_enum_1.MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE);
            expect(program.rulebook_version_id).toBeNull();
            expect(program.status).toBe(mka_enum_1.MkaProgramStatus.ACTIVE);
            const dimensions = created.map((item) => item.dimension);
            expect(dimensions).toContain(enums_1.MkaDimension.MIND);
            expect(dimensions).toContain(enums_1.MkaDimension.KARMA);
            expect(dimensions).toContain(enums_1.MkaDimension.ACTION);
        });
        it('invents no remedy: nothing claims astrological provenance', async () => {
            const service = buildService((0, mka_plan_test_harness_1.fakeRulebook)({ active: null }));
            seedChallenge();
            seedContext(['Update my CV']);
            const { items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            for (const item of created) {
                expect(item.source_type).not.toBe(mka_enum_1.MkaSourceType.APPROVED_ASTRO_REMEDY);
                expect(item.rulebook_version_id).toBeNull();
                expect(item.source_remedy_key).toBeNull();
            }
        });
        it('raises an SME review candidate rather than filling the gap', async () => {
            const service = buildService((0, mka_plan_test_harness_1.fakeRulebook)({ active: null }));
            seedChallenge();
            seedContext(['Update my CV']);
            await service.generate({ user, challengeId: CHALLENGE_ID });
            const types = outboxRows.rows.map((row) => row.event_type);
            expect(types).toContain(mka_plan_event_enum_1.MkaPlanEventType.MKA_SME_REVIEW_CANDIDATE);
            expect(types).toContain(mka_plan_event_enum_1.MkaPlanEventType.MKA_GENERATED);
        });
        it('degrades gracefully when the rulebook refuses mid-generation', async () => {
            const service = buildService((0, mka_plan_test_harness_1.fakeRulebook)({
                active: { versionId: 'rb-1', version: '0.4' },
                throwUnavailable: true,
            }));
            seedChallenge();
            seedContext(['Review the loan terms']);
            const { program, items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            expect(program.remedy_status).toBe(mka_enum_1.MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE);
            expect(created.length).toBeGreaterThan(0);
        });
    });
    describe('when an approved remedy exists', () => {
        const rulebookWithRemedy = () => (0, mka_plan_test_harness_1.fakeRulebook)({
            active: { versionId: 'rb-1', version: '0.4' },
            rules: [
                {
                    id: 'rule-uuid-1',
                    external_rule_key: 'RULE-CAREER-007',
                    remedy_keys: ['REM-GROUND-001'],
                },
            ],
            remedies: [
                {
                    external_remedy_key: 'REM-GROUND-001',
                    name: 'A steady weekly practice',
                    mka_dimension: enums_1.MkaDimension.KARMA,
                    instructions: 'Keep it simple and consistent through the week.',
                    purpose: 'Support steadiness during the current period.',
                    user_explanation: 'A grounding practice for this period.',
                    frequency: 'WEEKLY',
                    duration: '7 days',
                    preferred_time: 'morning',
                    safety_class: enums_1.RuleSafetyClass.LOW_RISK,
                    has_financial_cost: false,
                    is_devotional: false,
                    alternative_keys: [],
                },
            ],
        });
        it('carries the rulebook version and rule key on the item', async () => {
            const service = buildService(rulebookWithRemedy());
            seedChallenge();
            seedContext(['Update my CV']);
            const { items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            const karma = created.find((item) => item.source_type === mka_enum_1.MkaSourceType.APPROVED_ASTRO_REMEDY);
            expect(karma).toBeDefined();
            expect(karma.rulebook_version_id).toBe('rb-1');
            expect(karma.source_remedy_key).toBe('REM-GROUND-001');
            expect(karma.source_rule_key).toBe('RULE-CAREER-007');
        });
        it('preserves the SME wording character for character', async () => {
            const service = buildService(rulebookWithRemedy());
            seedChallenge();
            seedContext(['Update my CV']);
            const { items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            const karma = created.find((item) => item.source_type === mka_enum_1.MkaSourceType.APPROVED_ASTRO_REMEDY);
            expect(karma.description).toBe('Keep it simple and consistent through the week.');
        });
        it('refuses a remedy that costs money', async () => {
            const service = buildService((0, mka_plan_test_harness_1.fakeRulebook)({
                active: { versionId: 'rb-1', version: '0.4' },
                rules: [
                    {
                        id: 'rule-uuid-1',
                        external_rule_key: 'RULE-CAREER-007',
                        remedy_keys: ['REM-COSTLY-001'],
                    },
                ],
                remedies: [
                    {
                        external_remedy_key: 'REM-COSTLY-001',
                        name: 'An expensive ritual',
                        mka_dimension: enums_1.MkaDimension.KARMA,
                        instructions: 'Purchase and perform.',
                        purpose: 'n/a',
                        frequency: 'ONE_TIME',
                        safety_class: enums_1.RuleSafetyClass.LOW_RISK,
                        has_financial_cost: true,
                        is_devotional: true,
                        alternative_keys: [],
                    },
                ],
            }));
            seedChallenge();
            seedContext(['Update my CV']);
            const { items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            expect(created.some((item) => item.source_remedy_key === 'REM-COSTLY-001')).toBe(false);
            expect(created.some((item) => item.dimension === enums_1.MkaDimension.KARMA)).toBe(true);
        });
    });
    describe('cognitive load', () => {
        it('never exceeds the per-dimension ceiling', async () => {
            const service = buildService();
            seedChallenge();
            seedContext(Array.from({ length: 10 }, (_, index) => `Practical step ${index + 1}`));
            const { items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            for (const dimension of Object.values(enums_1.MkaDimension)) {
                const count = created.filter((item) => item.dimension === dimension).length;
                expect(count).toBeLessThanOrEqual(mka_enum_1.MKA_DIMENSION_LIMITS[dimension]);
            }
            expect(created.length).toBeLessThanOrEqual(6);
        });
        it('always includes a practical action', async () => {
            const service = buildService();
            seedChallenge();
            const { items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            expect(created.some((item) => item.dimension === enums_1.MkaDimension.ACTION)).toBe(true);
        });
    });
    describe('ownership', () => {
        it('refuses to generate against someone else\'s challenge', async () => {
            const service = buildService();
            seedChallenge({ user_id: OTHER_USER_ID });
            await expect(service.generate({ user, challengeId: CHALLENGE_ID })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
        });
        it('refuses to complete someone else\'s MKA item', async () => {
            const service = buildService();
            items.rows.push({
                id: 'item-1',
                mka_program_id: 'prog-1',
                user_id: OTHER_USER_ID,
                status: mka_enum_1.MkaItemStatus.ACTIVE,
                deleted_at: null,
            });
            await expect(service.completeItem(user, 'item-1')).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            expect(completions.rows).toHaveLength(0);
        });
        it('refuses to read someone else\'s programme', async () => {
            const service = buildService();
            programs.rows.push({
                id: 'prog-1',
                user_id: OTHER_USER_ID,
                deleted_at: null,
            });
            await expect(service.findOwnedProgram(USER_ID, 'prog-1')).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
        });
    });
    describe('safety', () => {
        it('generates nothing when the pre-check blocks', async () => {
            const service = buildService();
            seedChallenge({
                raw_user_statement: 'I do not want to live anymore, there is no point to any of this',
            });
            await expect(service.generate({ user, challengeId: CHALLENGE_ID })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED });
            expect(programs.rows).toHaveLength(0);
            expect(items.rows).toHaveLength(0);
        });
    });
    describe('completion', () => {
        it('emits the event the Karma Ledger consumes, carrying eligibility only', async () => {
            const service = buildService();
            seedChallenge();
            seedContext(['Update my CV']);
            const { items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            const action = created.find((item) => item.dimension === enums_1.MkaDimension.ACTION);
            outboxRows.rows.length = 0;
            await service.completeItem(user, action.id, { note: 'Done this morning.' });
            const event = outboxRows.rows.find((row) => row.event_type === mka_plan_event_enum_1.MkaPlanEventType.MKA_ITEM_COMPLETED);
            expect(event).toBeDefined();
            expect(event.payload.karma_eligible).toBe(action.karma_eligible);
            expect(event.payload.score).toBeUndefined();
        });
        it('is idempotent for the same item on the same day', async () => {
            const service = buildService();
            seedChallenge();
            seedContext(['Update my CV']);
            const { items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            const mind = created.find((item) => item.dimension === enums_1.MkaDimension.MIND);
            const first = await service.completeItem(user, mind.id);
            const second = await service.completeItem(user, mind.id);
            expect(second.id).toBe(first.id);
            expect(completions.rows).toHaveLength(1);
        });
        it('records a skip with no penalty of any kind', async () => {
            const service = buildService();
            seedChallenge();
            seedContext(['Update my CV']);
            const { items: created } = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
            });
            const mind = created.find((item) => item.dimension === enums_1.MkaDimension.MIND);
            const completion = await service.skipItem(user, mind.id);
            expect(completion.status).toBe('SKIPPED');
            const stored = items.rows.find((row) => row.id === mind.id);
            expect(stored.status).toBe(mka_enum_1.MkaItemStatus.ACTIVE);
        });
    });
    describe('lifecycle', () => {
        it('supersedes the previous programme rather than editing it', async () => {
            const service = buildService();
            seedChallenge();
            seedContext(['Update my CV']);
            const first = await service.generate({ user, challengeId: CHALLENGE_ID });
            const second = await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                regenerate: true,
            });
            expect(second.program.id).not.toBe(first.program.id);
            const stored = programs.rows.find((row) => row.id === first.program.id);
            expect(stored.status).toBe(mka_enum_1.MkaProgramStatus.SUPERSEDED);
            expect(stored.superseded_by_id).toBe(second.program.id);
        });
        it('returns the existing programme for identical inputs', async () => {
            const service = buildService();
            seedChallenge();
            seedContext(['Update my CV']);
            const first = await service.generate({ user, challengeId: CHALLENGE_ID });
            const again = await service.generate({ user, challengeId: CHALLENGE_ID });
            expect(again.program.id).toBe(first.program.id);
            expect(programs.rows).toHaveLength(1);
        });
        it.each([
            [mka_enum_1.MkaProgramStatus.SUPERSEDED, mka_enum_1.MkaProgramStatus.ACTIVE],
            [mka_enum_1.MkaProgramStatus.COMPLETED, mka_enum_1.MkaProgramStatus.ACTIVE],
            [mka_enum_1.MkaProgramStatus.CANCELLED, mka_enum_1.MkaProgramStatus.ACTIVE],
            [mka_enum_1.MkaProgramStatus.DRAFT, mka_enum_1.MkaProgramStatus.COMPLETED],
        ])('refuses the programme transition %s -> %s', (from, to) => {
            const service = buildService();
            expect(() => service.transitionProgram(from, to)).toThrow(zuno_exception_1.ZunoException);
        });
        it.each([
            [mka_enum_1.MkaItemStatus.COMPLETED, mka_enum_1.MkaItemStatus.ACTIVE],
            [mka_enum_1.MkaItemStatus.COMPLETED, mka_enum_1.MkaItemStatus.CANCELLED_BY_REALIGNMENT],
            [mka_enum_1.MkaItemStatus.CANCELLED_BY_REALIGNMENT, mka_enum_1.MkaItemStatus.ACTIVE],
            [mka_enum_1.MkaItemStatus.NO_LONGER_RELEVANT, mka_enum_1.MkaItemStatus.COMPLETED],
        ])('refuses the item transition %s -> %s', (from, to) => {
            const service = buildService();
            expect(() => service.transitionItem(from, to)).toThrow(zuno_exception_1.ZunoException);
        });
        it('will not record progress against a superseded programme', async () => {
            const service = buildService();
            seedChallenge();
            seedContext(['Update my CV']);
            const first = await service.generate({ user, challengeId: CHALLENGE_ID });
            const item = first.items[0];
            await service.generate({
                user,
                challengeId: CHALLENGE_ID,
                regenerate: true,
            });
            await expect(service.completeItem(user, item.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
        });
    });
});
//# sourceMappingURL=mka.service.spec.js.map