"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realignment_service_1 = require("./realignment.service");
const life_signal_service_1 = require("../../signals/services/life-signal.service");
const signal_classifier_service_1 = require("../../signals/services/signal-classifier.service");
const safety_service_1 = require("../../safety/services/safety.service");
const safety_signal_detector_1 = require("../../safety/services/safety-signal-detector");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const request_context_service_1 = require("../../common/services/request-context.service");
const zuno_realignment_entity_1 = require("../entities/zuno-realignment.entity");
const zuno_realignment_change_entity_1 = require("../entities/zuno-realignment-change.entity");
const zuno_realignment_assumption_entity_1 = require("../entities/zuno-realignment-assumption.entity");
const zuno_life_signal_entity_1 = require("../../signals/entities/zuno-life-signal.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_event_outbox_entity_1 = require("../../common/entities/zuno-event-outbox.entity");
const enums_1 = require("../../common/enums");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const noop_realignment_target_1 = require("../ports/noop-realignment-target");
const enums_2 = require("../enums");
const fake_datasource_1 = require("../../signals/testing/fake-datasource");
describe('RealignmentService', () => {
    const NOW = new Date('2026-09-17T09:00:00.000Z');
    const USER_ID = '11111111-1111-4111-8111-111111111111';
    const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
    const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';
    const PLAN_ID = '44444444-4444-4444-8444-444444444444';
    const MKA_ID = '55555555-5555-4555-8555-555555555555';
    let db;
    let clock;
    let signals;
    let service;
    let target;
    const user = { id: USER_ID };
    class RecordingTarget {
        constructor() {
            this.failAt = null;
            this.calls = [];
        }
        async loadCurrentDirection(ctx) {
            this.calls.push('loadCurrentDirection');
            if (this.failAt === 'loadCurrentDirection')
                throw new Error('plan read failed');
            return {
                planId: PLAN_ID,
                planVersion: 1,
                mkaProgramId: MKA_ID,
                pendingItemIds: ['item-1', 'item-2'],
                pendingReminderIds: ['reminder-1'],
                assumptions: [
                    { key: 'EMPLOYMENT_CONTINUES', statement: 'Current employment continues' },
                ],
                available: true,
            };
        }
        async cancelPendingItems(ctx) {
            this.calls.push('cancelPendingItems');
            await ctx.manager.save(zuno_realignment_change_entity_1.ZunoRealignmentChange, [
                ctx.manager.create(zuno_realignment_change_entity_1.ZunoRealignmentChange, {
                    realignment_id: ctx.realignmentId,
                    user_id: ctx.userId,
                    entity_type: 'PLAN_ITEM',
                    entity_id: null,
                    change_type: 'ITEMS_CANCELLED',
                    before_value: { item_ids: ['item-1', 'item-2'] },
                    after_value: null,
                    reason: 'target write',
                    redacted_at: null,
                }),
            ]);
            if (this.failAt === 'cancelPendingItems')
                throw new Error('cancel failed');
            return { cancelledItemIds: ['item-1', 'item-2'], applied: true };
        }
        async suppressPendingReminders(ctx) {
            this.calls.push('suppressPendingReminders');
            if (this.failAt === 'suppressPendingReminders') {
                throw new Error('reminder suppression failed');
            }
            return { suppressedReminderIds: ['reminder-1'], applied: true };
        }
        async supersedeProgramme(ctx) {
            this.calls.push('supersedeProgramme');
            if (this.failAt === 'supersedeProgramme')
                throw new Error('mka failed');
            return {
                supersededProgramId: MKA_ID,
                successorProgramId: null,
                applied: true,
            };
        }
        async activateSuccessorPlan(ctx) {
            this.calls.push('activateSuccessorPlan');
            if (this.failAt === 'activateSuccessorPlan')
                throw new Error('plan write failed');
            return {
                planId: 'new-plan',
                planVersion: 2,
                archivedPlanId: PLAN_ID,
                applied: true,
            };
        }
    }
    function seedChallenge(ownerId = USER_ID) {
        return db.store.seed(zuno_challenge_entity_1.ZunoChallenge, {
            id: CHALLENGE_ID,
            user_id: ownerId,
            title: 'Job security',
            raw_user_statement: 'There have been layoffs at my company.',
            primary_domain: enums_1.ZunoDomain.CAREER,
            theme: 'JOB_SECURITY',
            status: enums_1.ChallengeStatus.ACTIVE,
            mode: null,
            urgency: null,
            emotional_intensity: null,
            priority: null,
            context_version: 1,
            opened_at: NOW,
            resolved_at: null,
            resolution_note: null,
            version: 1,
            created_at: NOW,
            updated_at: NOW,
            deleted_at: null,
        });
    }
    function build(realignmentTarget) {
        return new realignment_service_1.RealignmentService(db.repositoryFor(zuno_realignment_entity_1.ZunoRealignment), db.repositoryFor(zuno_challenge_entity_1.ZunoChallenge), db.repositoryFor(zuno_life_signal_entity_1.ZunoLifeSignal), realignmentTarget, signals, new safety_service_1.SafetyService(new safety_signal_detector_1.SafetySignalDetector()), { getActive: jest.fn().mockResolvedValue(null) }, new outbox_service_1.OutboxService(new request_context_service_1.RequestContextService()), new zuno_audit_service_1.ZunoAuditService(new request_context_service_1.RequestContextService()), new zuno_ownership_service_1.ZunoOwnershipService(), clock, db);
    }
    beforeEach(() => {
        db = new fake_datasource_1.FakeDataSource();
        clock = new clock_service_1.FixedClockService(NOW);
        signals = new life_signal_service_1.LifeSignalService(db.repositoryFor(zuno_life_signal_entity_1.ZunoLifeSignal), db.repositoryFor(zuno_challenge_entity_1.ZunoChallenge), new signal_classifier_service_1.SignalClassifierService(), new safety_service_1.SafetyService(new safety_signal_detector_1.SafetySignalDetector()), { getActive: jest.fn().mockResolvedValue(null) }, new outbox_service_1.OutboxService(new request_context_service_1.RequestContextService()), new zuno_audit_service_1.ZunoAuditService(new request_context_service_1.RequestContextService()), new zuno_ownership_service_1.ZunoOwnershipService(), clock, db);
        target = new RecordingTarget();
        service = build(target);
    });
    async function confirmedTermination() {
        const created = await signals.record({
            user,
            challengeId: CHALLENGE_ID,
            statement: 'HR gave me my termination letter. My last working day is next month.',
        });
        return signals.confirm(user, created.signal.id);
    }
    describe('evaluation', () => {
        beforeEach(() => seedChallenge());
        it('produces a MAJOR realignment for a confirmed termination', async () => {
            const signal = await confirmedTermination();
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            expect(decision.realignment.level).toBe(enums_2.RealignmentLevel.MAJOR);
            expect(decision.realignment.plan_change_mode).toBe(enums_2.PlanChangeMode.REGENERATE);
            expect(decision.realignment.mka_refresh_required).toBe(true);
            expect(decision.realignment.user_confirmation_required).toBe(false);
        });
        it('records what stays as well as what changes', async () => {
            const signal = await confirmedTermination();
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            expect(decision.changes.some((row) => row.change_type === 'PRESERVE')).toBe(true);
        });
        it('names the assumption that stopped holding', async () => {
            const signal = await confirmedTermination();
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            const assumptions = db.store
                .rows(zuno_realignment_assumption_entity_1.ZunoRealignmentAssumption)
                .filter((row) => row.realignment_id === decision.realignment.id);
            expect(assumptions).toHaveLength(1);
            expect(assumptions[0].status).toBe('INVALIDATED');
            expect(assumptions[0].invalidated_by_signal_id).toBe(signal.id);
        });
        it('returns NONE when the trigger signal is only an inference', async () => {
            const created = await signals.record({
                user,
                challengeId: CHALLENGE_ID,
                statement: 'I think my role might be at risk in the restructuring.',
            });
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: created.signal.id,
            });
            expect(decision.realignment.level).toBe(enums_2.RealignmentLevel.NONE);
        });
        it('returns NONE when the only confirmed signal has gone stale', async () => {
            const created = await signals.record({
                user,
                challengeId: CHALLENGE_ID,
                statement: 'I received an interview invitation from another company.',
            });
            const signal = await signals.confirm(user, created.signal.id);
            expect(signal.realignment_required).toBe(true);
            clock.advanceMs(365 * 24 * 60 * 60 * 1000);
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            expect(decision.realignment.level).toBe(enums_2.RealignmentLevel.NONE);
        });
        it('does not over-trigger on plan progress', async () => {
            const created = await signals.record({
                user,
                challengeId: CHALLENGE_ID,
                statement: 'I updated my CV today.',
            });
            await signals.confirm(user, created.signal.id);
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: created.signal.id,
            });
            expect(decision.realignment.level).toBe(enums_2.RealignmentLevel.NONE);
            expect(decision.realignment.plan_change_mode).toBe(enums_2.PlanChangeMode.NONE);
            expect(db.store.count(zuno_realignment_change_entity_1.ZunoRealignmentChange)).toBe(0);
        });
        it('asks the user before dropping a path they chose', async () => {
            const created = await signals.record({
                user,
                challengeId: CHALLENGE_ID,
                statement: 'I no longer want to stay in this company even if they retain me.',
            });
            await signals.confirm(user, created.signal.id);
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: created.signal.id,
            });
            expect(decision.realignment.user_confirmation_required).toBe(true);
            expect(decision.realignment.status).toBe(enums_2.RealignmentStatus.AWAITING_USER_CONFIRMATION);
        });
        it('returns the same decision for a repeated trigger', async () => {
            const signal = await confirmedTermination();
            const first = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            const second = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            expect(second.idempotentReplay).toBe(true);
            expect(second.realignment.id).toBe(first.realignment.id);
            expect(db.store.count(zuno_realignment_entity_1.ZunoRealignment)).toBe(1);
        });
    });
    describe('atomic realignment (Roadmap section 63)', () => {
        beforeEach(() => seedChallenge());
        async function evaluated() {
            const signal = await confirmedTermination();
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            return decision.realignment.id;
        }
        it('applies plan, MKA and reminders together in ONE transaction', async () => {
            const realignmentId = await evaluated();
            const before = db.transactionCount;
            const applied = await service.apply({ user, realignmentId });
            expect(db.transactionCount - before).toBe(1);
            expect(applied.realignment.status).toBe(enums_2.RealignmentStatus.APPLIED);
            expect(applied.cancelledItemIds).toEqual(['item-1', 'item-2']);
            expect(applied.suppressedReminderIds).toEqual(['reminder-1']);
            expect(applied.supersededProgramId).toBe(MKA_ID);
            expect(applied.newPlanId).toBe('new-plan');
            expect(target.calls).toEqual([
                'loadCurrentDirection',
                'cancelPendingItems',
                'suppressPendingReminders',
                'supersedeProgramme',
                'activateSuccessorPlan',
            ]);
        });
        const failurePoints = [
            'loadCurrentDirection',
            'cancelPendingItems',
            'suppressPendingReminders',
            'supersedeProgramme',
            'activateSuccessorPlan',
        ];
        it.each(failurePoints)('persists NOTHING when %s fails mid-operation', async (failAt) => {
            const realignmentId = await evaluated();
            const changesBefore = db.store.count(zuno_realignment_change_entity_1.ZunoRealignmentChange);
            const outboxBefore = db.store.count(zuno_event_outbox_entity_1.ZunoEventOutbox);
            const challengeBefore = db.store
                .rows(zuno_challenge_entity_1.ZunoChallenge)
                .find((row) => row.id === CHALLENGE_ID).status;
            const signalBefore = db.store
                .rows(zuno_life_signal_entity_1.ZunoLifeSignal)
                .map((row) => row.realignment_required);
            target.failAt = failAt;
            await expect(service.apply({ user, realignmentId })).rejects.toThrow();
            const stored = db.store
                .rows(zuno_realignment_entity_1.ZunoRealignment)
                .find((row) => row.id === realignmentId);
            expect(stored.status).toBe(enums_2.RealignmentStatus.EVALUATED);
            expect(stored.applied_at).toBeNull();
            expect(stored.new_state_ref).toEqual({});
            expect(db.store.count(zuno_realignment_change_entity_1.ZunoRealignmentChange)).toBe(changesBefore);
            expect(db.store.count(zuno_event_outbox_entity_1.ZunoEventOutbox)).toBe(outboxBefore);
            expect(db.store.rows(zuno_challenge_entity_1.ZunoChallenge).find((row) => row.id === CHALLENGE_ID)
                .status).toBe(challengeBefore);
            expect(db.store.rows(zuno_life_signal_entity_1.ZunoLifeSignal).map((row) => row.realignment_required)).toEqual(signalBefore);
        });
        it('can be retried successfully after a failure', async () => {
            const realignmentId = await evaluated();
            target.failAt = 'activateSuccessorPlan';
            await expect(service.apply({ user, realignmentId })).rejects.toThrow();
            target.failAt = null;
            const applied = await service.apply({ user, realignmentId });
            expect(applied.realignment.status).toBe(enums_2.RealignmentStatus.APPLIED);
            expect(applied.newPlanId).toBe('new-plan');
        });
        it('clears the signal that asked for it, so it cannot ask again', async () => {
            const realignmentId = await evaluated();
            await service.apply({ user, realignmentId });
            expect(db.store.rows(zuno_life_signal_entity_1.ZunoLifeSignal).every((row) => !row.realignment_required)).toBe(true);
        });
        it('records cancellations as realignment-driven, never as missed', async () => {
            const realignmentId = await evaluated();
            await service.apply({ user, realignmentId });
            const cancelChange = db.store
                .rows(zuno_realignment_change_entity_1.ZunoRealignmentChange)
                .find((row) => row.change_type === 'ITEMS_CANCELLED' && row.after_value);
            expect(cancelChange.after_value).toEqual({
                status: 'CANCELLED_BY_REALIGNMENT',
            });
        });
        it('refuses to apply while the user has not agreed', async () => {
            const created = await signals.record({
                user,
                challengeId: CHALLENGE_ID,
                statement: 'I no longer want to stay in this company even if they retain me.',
            });
            await signals.confirm(user, created.signal.id);
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: created.signal.id,
            });
            await expect(service.apply({ user, realignmentId: decision.realignment.id })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
            expect(target.calls).toHaveLength(0);
        });
        it('refuses to apply a NONE realignment', async () => {
            const decision = await service.evaluate({ user, challengeId: CHALLENGE_ID });
            expect(decision.realignment.level).toBe(enums_2.RealignmentLevel.NONE);
            await expect(service.apply({ user, realignmentId: decision.realignment.id })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
            expect(target.calls).toHaveLength(0);
        });
        it('is a no-op when applied twice', async () => {
            const realignmentId = await evaluated();
            await service.apply({ user, realignmentId });
            const calls = target.calls.length;
            const second = await service.apply({ user, realignmentId });
            expect(second.realignment.status).toBe(enums_2.RealignmentStatus.APPLIED);
            expect(target.calls).toHaveLength(calls);
        });
    });
    describe('with no REALIGNMENT_TARGET bound', () => {
        beforeEach(() => seedChallenge());
        it('records the decision honestly and claims no plan change', async () => {
            const standalone = build(new noop_realignment_target_1.NoopRealignmentTarget());
            const signal = await confirmedTermination();
            const decision = await standalone.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            const applied = await standalone.apply({
                user,
                realignmentId: decision.realignment.id,
            });
            expect(applied.realignment.status).toBe(enums_2.RealignmentStatus.APPLIED);
            expect(applied.targetApplied).toBe(false);
            expect(applied.newPlanId).toBeNull();
            expect(applied.realignment.new_state_ref.target_bound).toBe(false);
        });
    });
    describe('ownership', () => {
        it('masks another user\'s challenge as not found on evaluate', async () => {
            seedChallenge(OTHER_USER_ID);
            await expect(service.evaluate({ user, challengeId: CHALLENGE_ID })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            expect(db.store.count(zuno_realignment_entity_1.ZunoRealignment)).toBe(0);
        });
        it('masks another user\'s realignment as not found on apply', async () => {
            seedChallenge();
            const signal = await confirmedTermination();
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            await expect(service.apply({
                user: { id: OTHER_USER_ID },
                realignmentId: decision.realignment.id,
            })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            const stored = db.store
                .rows(zuno_realignment_entity_1.ZunoRealignment)
                .find((row) => row.id === decision.realignment.id);
            expect(stored.status).toBe(enums_2.RealignmentStatus.EVALUATED);
            expect(target.calls).toHaveLength(0);
        });
        it('rejects a stale optimistic-lock version', async () => {
            seedChallenge();
            const signal = await confirmedTermination();
            const decision = await service.evaluate({
                user,
                challengeId: CHALLENGE_ID,
                triggerSignalId: signal.id,
            });
            await expect(service.apply({
                user,
                realignmentId: decision.realignment.id,
                expectedVersion: decision.realignment.version + 5,
            })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.CONFLICT });
        });
    });
});
//# sourceMappingURL=realignment.service.spec.js.map