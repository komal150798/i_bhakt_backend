import { Repository } from 'typeorm';
import { SignalTrendService } from './signal-trend.service';
import { FixedClockService } from '../../common/services/clock.service';
import { ZunoLifeSignal } from '../entities/zuno-life-signal.entity';
import { ZunoDomain } from '../../common/enums';
import {
  LifeSignalMateriality,
  LifeSignalNature,
  LifeSignalRelevance,
  LifeSignalReliability,
  LifeSignalSource,
  LifeSignalStatus,
  LifeSignalType,
  SignalConfirmationStatus,
  SignalTrendDirection,
  UrgencyChange,
} from '../enums';
import { FakeDataSource } from '../testing/fake-datasource';

/**
 * Category trends for My Journey. Step 13 sections 38-40.
 *
 * The tests that matter most here are the exclusions. A trend line is an
 * assertion about the user's life, and Step 13 Rule 3 forbids ZUNO asserting
 * anything it only inferred - so an unconfirmed signal must be counted and
 * shown, and must not move the line.
 */
describe('SignalTrendService', () => {
  const NOW = new Date('2026-09-17T09:00:00.000Z');
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';

  let db: FakeDataSource;
  let service: SignalTrendService;
  let clock: FixedClockService;
  let sequence = 0;

  beforeEach(() => {
    db = new FakeDataSource();
    clock = new FixedClockService(NOW);
    sequence = 0;
    service = new SignalTrendService(
      db.repositoryFor(ZunoLifeSignal) as unknown as Repository<ZunoLifeSignal>,
      clock,
    );
  });

  function seedSignal(overrides: Partial<ZunoLifeSignal>): ZunoLifeSignal {
    sequence += 1;
    return db.store.seed(ZunoLifeSignal, {
      user_id: USER_ID,
      challenge_id: CHALLENGE_ID,
      signal_type: LifeSignalType.OTHER,
      source: LifeSignalSource.USER_EXPLICIT,
      nature: LifeSignalNature.EVENT,
      domain: ZunoDomain.CAREER,
      raw_value: { statement: 'something' },
      normalized_value: null,
      confidence: '0.900',
      reliability: LifeSignalReliability.USER_CONFIRMED,
      confirmation_status: SignalConfirmationStatus.CONFIRMED_USER_REPORTED,
      materiality: LifeSignalMateriality.MEDIUM,
      relevance: LifeSignalRelevance.DIRECT,
      urgency_change: UrgencyChange.NONE,
      status: LifeSignalStatus.ACTIVE,
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
    } as ZunoLifeSignal);
  }

  it('reports INSUFFICIENT_EVIDENCE rather than guessing from one signal', async () => {
    // Step 13 section 78: do not overreact to thin evidence.
    seedSignal({ signal_type: LifeSignalType.SETBACK });

    const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
    expect(result.trends[0].direction).toBe(
      SignalTrendDirection.INSUFFICIENT_EVIDENCE,
    );
  });

  it('reports a declining category once there is a run of setbacks', async () => {
    for (let i = 0; i < 3; i += 1) {
      seedSignal({ signal_type: LifeSignalType.SETBACK });
    }

    const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
    expect(result.trends[0].direction).toBe(SignalTrendDirection.DECLINING);
    expect(result.trends[0].decliningCount).toBe(3);
  });

  it('reports improvement, because positive signals matter as much', async () => {
    // Step 13 section 54 / Rule 4.
    for (let i = 0; i < 3; i += 1) {
      seedSignal({ signal_type: LifeSignalType.OPPORTUNITY });
    }

    const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
    expect(result.trends[0].direction).toBe(SignalTrendDirection.IMPROVING);
  });

  it('never lets an unconfirmed signal move the trend', async () => {
    // Three inferences pointing one way; the line must not move at all.
    for (let i = 0; i < 3; i += 1) {
      seedSignal({
        signal_type: LifeSignalType.SETBACK,
        confirmation_status: SignalConfirmationStatus.UNCONFIRMED,
        is_inference: true,
        status: LifeSignalStatus.CANDIDATE,
      });
    }

    const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
    expect(result.trends[0].direction).toBe(
      SignalTrendDirection.INSUFFICIENT_EVIDENCE,
    );
    expect(result.trends[0].confirmedCount).toBe(0);
    // They are still surfaced, so the screen can ask the user about them.
    expect(result.trends[0].unconfirmedCount).toBe(3);
    expect(result.trends[0].basis).toBe('CONFIRMED_ONLY');
  });

  it('drops stale signals out of the trend', async () => {
    // Step 13 section 60: one bad week six months ago must not still shape the
    // current picture.
    for (let i = 0; i < 3; i += 1) {
      seedSignal({
        signal_type: LifeSignalType.SETBACK,
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
        signal_type: LifeSignalType.SETBACK,
        domain: ZunoDomain.CAREER,
      });
    }
    for (let i = 0; i < 3; i += 1) {
      seedSignal({
        signal_type: LifeSignalType.OPPORTUNITY,
        domain: ZunoDomain.FINANCE,
      });
    }

    const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
    const career = result.trends.find((row) => row.category === ZunoDomain.CAREER)!;
    const finance = result.trends.find(
      (row) => row.category === ZunoDomain.FINANCE,
    )!;

    expect(career.direction).toBe(SignalTrendDirection.DECLINING);
    expect(finance.direction).toBe(SignalTrendDirection.IMPROVING);
    expect(result.overall).toBe(SignalTrendDirection.MIXED);
  });

  it('names a reversal when the latest signal turns the run around', async () => {
    // Step 13 section 38: REVERSAL is more informative than "mixed".
    seedSignal({ signal_type: LifeSignalType.SETBACK });
    seedSignal({ signal_type: LifeSignalType.SETBACK });
    seedSignal({ signal_type: LifeSignalType.OPPORTUNITY });

    const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
    expect(result.trends[0].pattern).toBe('REVERSAL');
  });

  it('surfaces when the last material change happened', async () => {
    seedSignal({ materiality: LifeSignalMateriality.LOW });
    const material = seedSignal({
      signal_type: LifeSignalType.STATUS_CHANGE,
      materiality: LifeSignalMateriality.HIGH,
    });

    const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
    expect(result.trends[0].lastMaterialChangeAt).toBe(
      material.detected_at.toISOString(),
    );
  });

  it('excludes dismissed signals the user has already rejected', async () => {
    for (let i = 0; i < 3; i += 1) {
      seedSignal({
        signal_type: LifeSignalType.SETBACK,
        status: LifeSignalStatus.DISMISSED,
        confirmation_status: SignalConfirmationStatus.REJECTED,
      });
    }

    const result = await service.categoryTrends(USER_ID, CHALLENGE_ID);
    expect(result.trends).toHaveLength(0);
  });
});
