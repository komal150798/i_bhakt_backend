"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const life_signal_service_1 = require("./life-signal.service");
const signal_classifier_service_1 = require("./signal-classifier.service");
const safety_service_1 = require("../../safety/services/safety.service");
const safety_signal_detector_1 = require("../../safety/services/safety-signal-detector");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const request_context_service_1 = require("../../common/services/request-context.service");
const zuno_life_signal_entity_1 = require("../entities/zuno-life-signal.entity");
const zuno_life_signal_confirmation_entity_1 = require("../entities/zuno-life-signal-confirmation.entity");
const zuno_life_signal_source_entity_1 = require("../entities/zuno-life-signal-source.entity");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_event_outbox_entity_1 = require("../../common/entities/zuno-event-outbox.entity");
const enums_1 = require("../../common/enums");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const enums_2 = require("../enums");
const fake_datasource_1 = require("../testing/fake-datasource");
describe('LifeSignalService', () => {
    const NOW = new Date('2026-09-17T09:00:00.000Z');
    const USER_ID = '11111111-1111-4111-8111-111111111111';
    const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
    const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';
    let db;
    let service;
    let clock;
    let rulebook;
    const user = { id: USER_ID };
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
    beforeEach(() => {
        db = new fake_datasource_1.FakeDataSource();
        clock = new clock_service_1.FixedClockService(NOW);
        rulebook = { getActive: jest.fn().mockResolvedValue(null) };
        service = new life_signal_service_1.LifeSignalService(db.repositoryFor(zuno_life_signal_entity_1.ZunoLifeSignal), db.repositoryFor(zuno_challenge_entity_1.ZunoChallenge), new signal_classifier_service_1.SignalClassifierService(), new safety_service_1.SafetyService(new safety_signal_detector_1.SafetySignalDetector()), rulebook, new outbox_service_1.OutboxService(new request_context_service_1.RequestContextService()), new zuno_audit_service_1.ZunoAuditService(new request_context_service_1.RequestContextService()), new zuno_ownership_service_1.ZunoOwnershipService(), clock, db);
    });
    const record = (statement, extra = {}) => service.record({
        user,
        challengeId: CHALLENGE_ID,
        statement,
        ...extra,
    });
    describe('signal lifecycle', () => {
        beforeEach(() => seedChallenge());
        it('opens every user-reported signal as a CANDIDATE, never as fact', async () => {
            const result = await record('HR gave me my termination letter today.');
            expect(result.signal.status).toBe(enums_2.LifeSignalStatus.CANDIDATE);
            expect(result.signal.confirmation_status).toBe(enums_2.SignalConfirmationStatus.UNCONFIRMED);
            expect(result.signal.realignment_required).toBe(false);
        });
        it('moves CANDIDATE -> ACTIVE on confirmation and flags realignment', async () => {
            const created = await record('HR gave me my termination letter today.');
            const confirmed = await service.confirm(user, created.signal.id);
            expect(confirmed.status).toBe(enums_2.LifeSignalStatus.ACTIVE);
            expect(confirmed.confirmation_status).toBe(enums_2.SignalConfirmationStatus.CONFIRMED_USER_REPORTED);
            expect(confirmed.realignment_required).toBe(true);
        });
        it('moves CANDIDATE -> DISMISSED on rejection and stops asking', async () => {
            const created = await record('HR gave me my termination letter today.');
            const rejected = await service.reject(user, created.signal.id, 'Not me.');
            expect(rejected.status).toBe(enums_2.LifeSignalStatus.DISMISSED);
            expect(rejected.confirmation_status).toBe(enums_2.SignalConfirmationStatus.REJECTED);
            expect(rejected.realignment_required).toBe(false);
        });
        it('refuses to confirm a signal the user already rejected', async () => {
            const created = await record('HR gave me my termination letter today.');
            await service.reject(user, created.signal.id);
            await expect(service.confirm(user, created.signal.id)).rejects.toMatchObject({
                code: error_codes_enum_1.ZunoErrorCode.CONFLICT,
            });
        });
        it('supersedes the earlier signal when a later one contradicts it', async () => {
            const first = await record('My manager said my role is safe for now.');
            await service.confirm(user, first.signal.id);
            const second = await record('HR has now formally included my role in the restructuring.');
            await service.confirm(user, second.signal.id);
            const stored = db.store
                .rows(zuno_life_signal_entity_1.ZunoLifeSignal)
                .find((row) => row.id === first.signal.id);
            expect(stored.status).toBe(enums_2.LifeSignalStatus.SUPERSEDED);
            expect(stored.realignment_required).toBe(false);
        });
        it('records provenance for every confirmation transition', async () => {
            const created = await record('HR gave me my termination letter today.');
            await service.confirm(user, created.signal.id, 'Received by email.');
            const transitions = db.store
                .rows(zuno_life_signal_confirmation_entity_1.ZunoLifeSignalConfirmation)
                .filter((row) => row.life_signal_id === created.signal.id);
            expect(transitions).toHaveLength(2);
            expect(transitions.map((row) => row.to_status)).toContain(enums_2.SignalConfirmationStatus.CONFIRMED_USER_REPORTED);
        });
        it('keeps the evidence behind each signal', async () => {
            const created = await record('HR gave me my termination letter today.');
            const sources = db.store
                .rows(zuno_life_signal_source_entity_1.ZunoLifeSignalSource)
                .filter((row) => row.life_signal_id === created.signal.id);
            expect(sources).toHaveLength(1);
            expect(sources[0].source).toBe(enums_2.LifeSignalSource.USER_EXPLICIT);
        });
    });
    describe('unconfirmed inference is never presented as fact', () => {
        beforeEach(() => seedChallenge());
        it('marks a hedged high-impact statement as an inference needing clarification', async () => {
            const result = await record('My manager hinted that my role may be included in the restructuring.');
            expect(result.signal.is_inference).toBe(true);
            expect(result.signal.confirmation_status).toBe(enums_2.SignalConfirmationStatus.AWAITING_USER_CONFIRMATION);
            expect(result.clarificationRequired).toBe(true);
            expect(result.realignmentRecommended).toBe(false);
        });
        it('returns confirmed and unconfirmed signals in separate buckets', async () => {
            const confirmedSignal = await record('HR gave me my termination letter today.');
            await service.confirm(user, confirmedSignal.signal.id);
            await record('I think my project might be moved to another team.');
            const separated = await service.listSeparated({
                userId: USER_ID,
                challengeId: CHALLENGE_ID,
                limit: 50,
            });
            expect(separated.confirmed).toHaveLength(1);
            expect(separated.unconfirmed).toHaveLength(1);
            expect(separated.confirmed.every((row) => row.is_inference === false)).toBe(true);
        });
        it('never lets an unconfirmed signal reach the Realignment Engine', async () => {
            await record('I think they might restructure my department.');
            const actionable = await service.actionableSignals(USER_ID, CHALLENGE_ID);
            expect(actionable).toHaveLength(0);
        });
        it('clears the inference flag once the user vouches for it', async () => {
            const created = await record('I think I am being moved off the project.');
            expect(created.signal.is_inference).toBe(true);
            const confirmed = await service.confirm(user, created.signal.id);
            expect(confirmed.is_inference).toBe(false);
        });
    });
    describe('signal versus conversation', () => {
        beforeEach(() => seedChallenge());
        it('does not create a signal from an acknowledgement', async () => {
            const result = await record('Thanks');
            expect(result.signal).toBeNull();
            expect(result.ignoredAsNoise).toBe(true);
            expect(db.store.count(zuno_life_signal_entity_1.ZunoLifeSignal)).toBe(0);
        });
        it('treats plan progress as progress, not as a change of direction', async () => {
            const created = await record('I updated my CV today.');
            const confirmed = await service.confirm(user, created.signal.id);
            expect(confirmed.signal_type).toBe(enums_2.LifeSignalType.PLAN_PROGRESS);
            expect(confirmed.realignment_required).toBe(false);
        });
        it('collapses a repeated report into one signal', async () => {
            const first = await record('My interview is on Friday with the new team.');
            const second = await record('My interview is on Friday with the new team.');
            expect(second.deduplicated).toBe(true);
            expect(second.signal.id).toBe(first.signal.id);
            expect(db.store.count(zuno_life_signal_entity_1.ZunoLifeSignal)).toBe(1);
            expect(db.store.count(zuno_life_signal_source_entity_1.ZunoLifeSignalSource)).toBe(2);
        });
    });
    describe('stale signal suppression', () => {
        beforeEach(() => seedChallenge());
        it('excludes a decayed signal from the actionable set', async () => {
            const created = await record('I received an interview invitation.');
            await service.confirm(user, created.signal.id);
            expect(await service.actionableSignals(USER_ID, CHALLENGE_ID)).toHaveLength(1);
            clock.advanceMs(60 * 24 * 60 * 60 * 1000);
            expect(await service.actionableSignals(USER_ID, CHALLENGE_ID)).toHaveLength(0);
        });
        it('sweeps decayed signals into STALE and stops them asking for realignment', async () => {
            const created = await record('I received an interview invitation.');
            await service.confirm(user, created.signal.id);
            clock.advanceMs(60 * 24 * 60 * 60 * 1000);
            const swept = await service.sweepStale(USER_ID, CHALLENGE_ID);
            expect(swept).toBe(1);
            const stored = db.store
                .rows(zuno_life_signal_entity_1.ZunoLifeSignal)
                .find((row) => row.id === created.signal.id);
            expect(stored.status).toBe(enums_2.LifeSignalStatus.STALE);
            expect(stored.realignment_required).toBe(false);
            expect(db.store
                .rows(zuno_event_outbox_entity_1.ZunoEventOutbox)
                .some((row) => String(row.event_type) === enums_2.SIGNAL_EVENT_TYPES.LIFE_SIGNAL_STALE)).toBe(true);
        });
        it('does not decay a standing state fact', async () => {
            const created = await record('I have decided not to relocate this year.');
            expect(created.signal.stale_after).toBeNull();
            await service.confirm(user, created.signal.id);
            clock.advanceMs(365 * 24 * 60 * 60 * 1000);
            expect(await service.actionableSignals(USER_ID, CHALLENGE_ID)).toHaveLength(1);
        });
        it('keeps stale signals out of the user-facing list', async () => {
            const created = await record('I received an interview invitation.');
            await service.confirm(user, created.signal.id);
            clock.advanceMs(60 * 24 * 60 * 60 * 1000);
            const separated = await service.listSeparated({
                userId: USER_ID,
                challengeId: CHALLENGE_ID,
                limit: 50,
            });
            expect(separated.confirmed).toHaveLength(0);
        });
    });
    describe('ownership', () => {
        it('masks another user\'s challenge as not found', async () => {
            seedChallenge(OTHER_USER_ID);
            await expect(record('Something changed at work.')).rejects.toMatchObject({
                code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND,
            });
            expect(db.store.count(zuno_life_signal_entity_1.ZunoLifeSignal)).toBe(0);
        });
        it('masks another user\'s signal as not found on confirm', async () => {
            seedChallenge();
            const created = await record('HR gave me my termination letter today.');
            await expect(service.confirm({ id: OTHER_USER_ID }, created.signal.id)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
            const stored = db.store
                .rows(zuno_life_signal_entity_1.ZunoLifeSignal)
                .find((row) => row.id === created.signal.id);
            expect(stored.confirmation_status).toBe(enums_2.SignalConfirmationStatus.UNCONFIRMED);
        });
        it('masks another user\'s signal as not found on read', async () => {
            seedChallenge();
            const created = await record('HR gave me my termination letter today.');
            await expect(service.findOwned(OTHER_USER_ID, created.signal.id)).rejects.toBeInstanceOf(zuno_exception_1.ZunoException);
        });
    });
    describe('safety and rulebook boundaries', () => {
        beforeEach(() => seedChallenge());
        it('refuses a self-harm statement before classifying it', async () => {
            await expect(record('I lost my job and I do not want to live anymore.')).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.SAFETY_RESTRICTED });
            expect(db.store.count(zuno_life_signal_entity_1.ZunoLifeSignal)).toBe(0);
        });
        it('stores an astro timing signal without interpreting it when no Rulebook is active', async () => {
            const result = await record('A supportive period is beginning for me.', {
                signalType: enums_2.LifeSignalType.ASTRO_TIMING_CHANGE,
            });
            expect(rulebook.getActive).toHaveBeenCalled();
            expect(result.interpretationUnavailable).toBe(true);
            expect(result.signal.rulebook_version_id).toBeNull();
            expect(result.signal).not.toBeNull();
        });
        it('refuses a source that has no trust or consent controls yet', async () => {
            await expect(record('Your calendar shows an interview.', {
                source: enums_2.LifeSignalSource.EXTERNAL_SOURCE,
            })).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR });
        });
    });
});
//# sourceMappingURL=life-signal.service.spec.js.map