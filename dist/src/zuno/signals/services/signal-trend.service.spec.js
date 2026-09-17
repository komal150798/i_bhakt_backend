"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signal_trend_service_1 = require("./signal-trend.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_life_signal_entity_1 = require("../entities/zuno-life-signal.entity");
const enums_1 = require("../../common/enums");
const enums_2 = require("../enums");
const fake_datasource_1 = require("../testing/fake-datasource");
describe('SignalTrendService', () => {
    const NOW = new Date('2026-09-17T09:00:00.000Z');
    const USER_ID = '11111111-1111-4111-8111-111111111111';
    const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';
    let db;
    let service;
    let clock;
    let sequence = 0;
    beforeEach(() => {
        db = new fake_datasource_1.FakeDataSource();
        clock = new clock_service_1.FixedClockService(NOW);
        sequence = 0;
        service = new signal_trend_service_1.SignalTrendService(db.repositoryFor(zuno_life_signal_entity_1.ZunoLifeSignal), clock);
    });
    function seedSignal(overrides) {
        sequence += 1;
        return db.store.seed(zuno_life_signal_entity_1.ZunoLifeSignal, {
            user_id: USER_ID,
            challenge_id: CHALLENGE_ID,
            signal_type: enums_2.LifeSignalType.OTHER,
            source: enums_2.LifeSignalSource.USER_EXPLICIT,
            nature: enums_2.LifeSignalNature.EVENT,
            domain: enums_1.ZunoDomain.CAREER,
            raw_value: { statement: 'something' },
            normalized_value: null,
            confidence: '0.900',
            reliability: enums_2.LifeSignalReliability.USER_CONFIRMED,
            confirmation_status: enums_2.SignalConfirmationStatus.CONFIRMED_USER_REPORTED,
            materiality: enums_2.LifeSignalMateriality.MEDIUM,
            relevance: enums_2.LifeSignalRelevance.DIRECT,
            urgency_change: enums_2.UrgencyChange.NONE,
            status: enums_2.LifeSignalStatus.ACTIVE,
            is_inference: false,
            clarification_required: false,
            realignment_required: false,
            reason_codes: [],
            fingerprint: `fp-${sequence}`,
            supersedes_signal_id: null,
            occurred_at: null,
            detected_at: new Date(NOW.getTime() + sequence * 1000),
            processed_at: null,
            stale_after: null,
            rulebook_version_id: null,
            detector_version: 'test',
            safety_decision_id: null,
            version: 1,
            created_at: NOW,
            updated_at: NOW,
            deleted_at: null,
            ...overrides,
        });
    }
    it('reports INSUFFICIENT_EVIDENCE rather than guessing from one signal', async () => {
        seedSignal({ signal_type: enums_2.LifeSignalType.SETBACK });
        const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
        expect(result.trends[0].direction).toBe(enums_2.SignalTrendDirection.INSUFFICIENT_EVIDENCE);
    });
    it('reports a declining category once there is a run of setbacks', async () => {
        for (let i = 0; i < 3; i += 1) {
            seedSignal({ signal_type: enums_2.LifeSignalType.SETBACK });
        }
        const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
        expect(result.trends[0].direction).toBe(enums_2.SignalTrendDirection.DECLINING);
        expect(result.trends[0].decliningCount).toBe(3);
    });
    it('reports improvement, because positive signals matter as much', async () => {
        for (let i = 0; i < 3; i += 1) {
            seedSignal({ signal_type: enums_2.LifeSignalType.OPPORTUNITY });
        }
        const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
        expect(result.trends[0].direction).toBe(enums_2.SignalTrendDirection.IMPROVING);
    });
    it('never lets an unconfirmed signal move the trend', async () => {
        for (let i = 0; i < 3; i += 1) {
            seedSignal({
                signal_type: enums_2.LifeSignalType.SETBACK,
                confirmation_status: enums_2.SignalConfirmationStatus.UNCONFIRMED,
                is_inference: true,
                status: enums_2.LifeSignalStatus.CANDIDATE,
            });
        }
        const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
        expect(result.trends[0].direction).toBe(enums_2.SignalTrendDirection.INSUFFICIENT_EVIDENCE);
        expect(result.trends[0].confirmedCount).toBe(0);
        expect(result.trends[0].unconfirmedCount).toBe(3);
        expect(result.trends[0].basis).toBe('CONFIRMED_ONLY');
    });
    it('drops stale signals out of the trend', async () => {
        for (let i = 0; i < 3; i += 1) {
            seedSignal({
                signal_type: enums_2.LifeSignalType.SETBACK,
                stale_after: new Date(NOW.getTime() - 1000),
            });
        }
        const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
        expect(result.totalConfirmed).toBe(0);
        expect(result.trends).toHaveLength(0);
    });
    it('separates categories so one hard area does not colour another', async () => {
        for (let i = 0; i < 3; i += 1) {
            seedSignal({
                signal_type: enums_2.LifeSignalType.SETBACK,
                domain: enums_1.ZunoDomain.CAREER,
            });
        }
        for (let i = 0; i < 3; i += 1) {
            seedSignal({
                signal_type: enums_2.LifeSignalType.OPPORTUNITY,
                domain: enums_1.ZunoDomain.FINANCE,
            });
        }
        const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
        const career = result.trends.find((row) => row.category === enums_1.ZunoDomain.CAREER);
        const finance = result.trends.find((row) => row.category === enums_1.ZunoDomain.FINANCE);
        expect(career.direction).toBe(enums_2.SignalTrendDirection.DECLINING);
        expect(finance.direction).toBe(enums_2.SignalTrendDirection.IMPROVING);
        expect(result.overall).toBe(enums_2.SignalTrendDirection.MIXED);
    });
    it('names a reversal when the latest signal turns the run around', async () => {
        seedSignal({ signal_type: enums_2.LifeSignalType.SETBACK });
        seedSignal({ signal_type: enums_2.LifeSignalType.SETBACK });
        seedSignal({ signal_type: enums_2.LifeSignalType.OPPORTUNITY });
        const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
        expect(result.trends[0].pattern).toBe('REVERSAL');
    });
    it('surfaces when the last material change happened', async () => {
        seedSignal({ materiality: enums_2.LifeSignalMateriality.LOW });
        const material = seedSignal({
            signal_type: enums_2.LifeSignalType.STATUS_CHANGE,
            materiality: enums_2.LifeSignalMateriality.HIGH,
        });
        const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
        expect(result.trends[0].lastMaterialChangeAt).toBe(material.detected_at.toISOString());
    });
    it('excludes dismissed signals the user has already rejected', async () => {
        for (let i = 0; i < 3; i += 1) {
            seedSignal({
                signal_type: enums_2.LifeSignalType.SETBACK,
                status: enums_2.LifeSignalStatus.DISMISSED,
                confirmation_status: enums_2.SignalConfirmationStatus.REJECTED,
            });
        }
        const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
        expect(result.trends).toHaveLength(0);
    });
});
//# sourceMappingURL=signal-trend.service.spec.js.map