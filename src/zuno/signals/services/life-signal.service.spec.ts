import { DataSource, Repository } from 'typeorm';
import { LifeSignalService } from './life-signal.service';
import { SignalClassifierService } from './signal-classifier.service';
import { SafetyService } from '../../safety/services/safety.service';
import { SafetySignalDetector } from '../../safety/services/safety-signal-detector';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { FixedClockService } from '../../common/services/clock.service';
import { RequestContextService } from '../../common/services/request-context.service';
import { ZunoLifeSignal } from '../entities/zuno-life-signal.entity';
import { ZunoLifeSignalConfirmation } from '../entities/zuno-life-signal-confirmation.entity';
import { ZunoLifeSignalSource } from '../entities/zuno-life-signal-source.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoEventOutbox } from '../../common/entities/zuno-event-outbox.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ChallengeStatus, ZunoDomain } from '../../common/enums';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { ZunoException } from '../../common/errors/zuno.exception';
import {
  LifeSignalSource,
  LifeSignalStatus,
  LifeSignalType,
  SIGNAL_EVENT_TYPES,
  SignalConfirmationStatus,
} from '../enums';
import { FakeDataSource } from '../testing/fake-datasource';

/**
 * Life Signal Engine tests.
 *
 * These cover the acceptance criteria in Roadmap section 66 that belong to this
 * engine: a minor signal must not over-trigger, a material one must, the user
 * must be able to reject a candidate, and provenance must be recorded. The
 * confirmed/unconfirmed separation is tested hardest because Step 13 Rule 3 is
 * the one guarantee whose failure shows a user a fabrication.
 */
describe('LifeSignalService', () => {
  const NOW = new Date('2026-09-17T09:00:00.000Z');
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
  const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';

  let db: FakeDataSource;
  let service: LifeSignalService;
  let clock: FixedClockService;
  let rulebook: { getActive: jest.Mock };

  const user = { id: USER_ID } as ZunoUser;

  function seedChallenge(ownerId = USER_ID): ZunoChallenge {
    return db.store.seed(ZunoChallenge, {
      id: CHALLENGE_ID,
      user_id: ownerId,
      title: 'Job security',
      raw_user_statement: 'There have been layoffs at my company.',
      primary_domain: ZunoDomain.CAREER,
      theme: 'JOB_SECURITY',
      status: ChallengeStatus.ACTIVE,
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
    } as ZunoChallenge);
  }

  beforeEach(() => {
    db = new FakeDataSource();
    clock = new FixedClockService(NOW);
    // The Rulebook has no active version in this build, which is the
    // fail-closed path Step 20 section 125 requires. Tests assert ZUNO copes
    // rather than that it has rules.
    rulebook = { getActive: jest.fn().mockResolvedValue(null) };

    service = new LifeSignalService(
      db.repositoryFor(ZunoLifeSignal) as unknown as Repository<ZunoLifeSignal>,
      db.repositoryFor(ZunoChallenge) as unknown as Repository<ZunoChallenge>,
      new SignalClassifierService(),
      new SafetyService(new SafetySignalDetector()),
      rulebook as unknown as RulebookRepositoryService,
      new OutboxService(new RequestContextService()),
      new ZunoAuditService(new RequestContextService()),
      new ZunoOwnershipService(),
      clock,
      db as unknown as DataSource,
    );
  });

  const record = (statement: string, extra: Record<string, unknown> = {}) =>
    service.record({
      user,
      challengeId: CHALLENGE_ID,
      statement,
      ...extra,
    } as Parameters<LifeSignalService['record']>[0]);

  // -------------------------------------------------------------- lifecycle

  describe('signal lifecycle', () => {
    beforeEach(() => seedChallenge());

    it('opens every user-reported signal as a CANDIDATE, never as fact', async () => {
      const result = await record('HR gave me my termination letter today.');

      // Roadmap section 60: candidate first. Step 13 Rule 3: nothing is
      // promoted to fact by ZUNO's own reading of it.
      expect(result.signal!.status).toBe(LifeSignalStatus.CANDIDATE);
      expect(result.signal!.confirmation_status).toBe(
        SignalConfirmationStatus.UNCONFIRMED,
      );
      expect(result.signal!.realignment_required).toBe(false);
    });

    it('moves CANDIDATE -> ACTIVE on confirmation and flags realignment', async () => {
      const created = await record('HR gave me my termination letter today.');
      const confirmed = await service.confirm(user, created.signal!.id);

      expect(confirmed.status).toBe(LifeSignalStatus.ACTIVE);
      expect(confirmed.confirmation_status).toBe(
        SignalConfirmationStatus.CONFIRMED_USER_REPORTED,
      );
      // Step 13 section 79 / Rule 9: a confirmed material change must not be
      // under-reacted to.
      expect(confirmed.realignment_required).toBe(true);
    });

    it('moves CANDIDATE -> DISMISSED on rejection and stops asking', async () => {
      const created = await record('HR gave me my termination letter today.');
      const rejected = await service.reject(user, created.signal!.id, 'Not me.');

      // Roadmap section 66: the user can reject a candidate signal.
      expect(rejected.status).toBe(LifeSignalStatus.DISMISSED);
      expect(rejected.confirmation_status).toBe(SignalConfirmationStatus.REJECTED);
      expect(rejected.realignment_required).toBe(false);
    });

    it('refuses to confirm a signal the user already rejected', async () => {
      const created = await record('HR gave me my termination letter today.');
      await service.reject(user, created.signal!.id);

      await expect(service.confirm(user, created.signal!.id)).rejects.toMatchObject({
        code: ZunoErrorCode.CONFLICT,
      });
    });

    it('supersedes the earlier signal when a later one contradicts it', async () => {
      // Step 13 sections 21-22: both states must never look active at once.
      const first = await record('My manager said my role is safe for now.');
      await service.confirm(user, first.signal!.id);

      const second = await record(
        'HR has now formally included my role in the restructuring.',
      );
      await service.confirm(user, second.signal!.id);

      const stored = db.store
        .rows(ZunoLifeSignal)
        .find((row) => row.id === first.signal!.id)!;
      expect(stored.status).toBe(LifeSignalStatus.SUPERSEDED);
      expect(stored.realignment_required).toBe(false);
    });

    it('records provenance for every confirmation transition', async () => {
      const created = await record('HR gave me my termination letter today.');
      await service.confirm(user, created.signal!.id, 'Received by email.');

      const transitions = db.store
        .rows(ZunoLifeSignalConfirmation)
        .filter((row) => row.life_signal_id === created.signal!.id);
      // One for detection, one for the confirmation. Step 14 section 89 needs
      // to be able to answer "did the user approve?" long afterwards.
      expect(transitions).toHaveLength(2);
      expect(transitions.map((row) => row.to_status)).toContain(
        SignalConfirmationStatus.CONFIRMED_USER_REPORTED,
      );
    });

    it('keeps the evidence behind each signal', async () => {
      const created = await record('HR gave me my termination letter today.');
      const sources = db.store
        .rows(ZunoLifeSignalSource)
        .filter((row) => row.life_signal_id === created.signal!.id);
      expect(sources).toHaveLength(1);
      expect(sources[0].source).toBe(LifeSignalSource.USER_EXPLICIT);
    });
  });

  // ------------------------------------------------- confirmed vs inferred

  describe('unconfirmed inference is never presented as fact', () => {
    beforeEach(() => seedChallenge());

    it('marks a hedged high-impact statement as an inference needing clarification', async () => {
      // Step 13 section 18's own example: "They hinted something may happen"
      // must not become TERMINATION_CONFIRMED.
      const result = await record(
        'My manager hinted that my role may be included in the restructuring.',
      );

      expect(result.signal!.is_inference).toBe(true);
      expect(result.signal!.confirmation_status).toBe(
        SignalConfirmationStatus.AWAITING_USER_CONFIRMATION,
      );
      expect(result.clarificationRequired).toBe(true);
      expect(result.realignmentRecommended).toBe(false);
    });

    it('returns confirmed and unconfirmed signals in separate buckets', async () => {
      const confirmedSignal = await record(
        'HR gave me my termination letter today.',
      );
      await service.confirm(user, confirmedSignal.signal!.id);
      await record('I think my project might be moved to another team.');

      const separated = await service.listSeparated({
        userId: USER_ID,
        challengeId: CHALLENGE_ID,
        limit: 50,
      });

      expect(separated.confirmed).toHaveLength(1);
      expect(separated.unconfirmed).toHaveLength(1);
      expect(
        separated.confirmed.every((row) => row.is_inference === false),
      ).toBe(true);
    });

    it('never lets an unconfirmed signal reach the Realignment Engine', async () => {
      await record('I think they might restructure my department.');

      const actionable = await service.actionableSignals(USER_ID, CHALLENGE_ID);
      expect(actionable).toHaveLength(0);
    });

    it('clears the inference flag once the user vouches for it', async () => {
      const created = await record('I think I am being moved off the project.');
      expect(created.signal!.is_inference).toBe(true);

      const confirmed = await service.confirm(user, created.signal!.id);
      expect(confirmed.is_inference).toBe(false);
    });
  });

  // ----------------------------------------------------- noise vs material

  describe('signal versus conversation', () => {
    beforeEach(() => seedChallenge());

    it('does not create a signal from an acknowledgement', async () => {
      // Step 13 section 5 and Rule 1: a signal represents change, not
      // conversation volume.
      const result = await record('Thanks');
      expect(result.signal).toBeNull();
      expect(result.ignoredAsNoise).toBe(true);
      expect(db.store.count(ZunoLifeSignal)).toBe(0);
    });

    it('treats plan progress as progress, not as a change of direction', async () => {
      // Step 13 section 53 and Rule 6.
      const created = await record('I updated my CV today.');
      const confirmed = await service.confirm(user, created.signal!.id);

      expect(confirmed.signal_type).toBe(LifeSignalType.PLAN_PROGRESS);
      expect(confirmed.realignment_required).toBe(false);
    });

    it('collapses a repeated report into one signal', async () => {
      // Step 13 sections 20 and 88: one event, one signal, one downstream
      // realignment.
      const first = await record('My interview is on Friday with the new team.');
      const second = await record('My interview is on Friday with the new team.');

      expect(second.deduplicated).toBe(true);
      expect(second.signal!.id).toBe(first.signal!.id);
      expect(db.store.count(ZunoLifeSignal)).toBe(1);
      // The repetition is still kept as evidence.
      expect(db.store.count(ZunoLifeSignalSource)).toBe(2);
    });
  });

  // ---------------------------------------------------------------- stale

  describe('stale signal suppression', () => {
    beforeEach(() => seedChallenge());

    it('excludes a decayed signal from the actionable set', async () => {
      const created = await record('I received an interview invitation.');
      await service.confirm(user, created.signal!.id);
      expect(await service.actionableSignals(USER_ID, CHALLENGE_ID)).toHaveLength(1);

      // Step 13 section 60: relevance decays with time.
      clock.advanceMs(60 * 24 * 60 * 60 * 1000);
      expect(await service.actionableSignals(USER_ID, CHALLENGE_ID)).toHaveLength(0);
    });

    it('sweeps decayed signals into STALE and stops them asking for realignment', async () => {
      const created = await record('I received an interview invitation.');
      await service.confirm(user, created.signal!.id);

      clock.advanceMs(60 * 24 * 60 * 60 * 1000);
      const swept = await service.sweepStale(USER_ID, CHALLENGE_ID);

      expect(swept).toBe(1);
      const stored = db.store
        .rows(ZunoLifeSignal)
        .find((row) => row.id === created.signal!.id)!;
      expect(stored.status).toBe(LifeSignalStatus.STALE);
      expect(stored.realignment_required).toBe(false);
      expect(
        db.store
          .rows(ZunoEventOutbox)
          .some(
            (row) =>
              String(row.event_type) === SIGNAL_EVENT_TYPES.LIFE_SIGNAL_STALE,
          ),
      ).toBe(true);
    });

    it('does not decay a standing state fact', async () => {
      // Step 13 section 61: "I have decided not to move" is true until it is
      // not, however long ago it was said.
      const created = await record('I have decided not to relocate this year.');
      expect(created.signal!.stale_after).toBeNull();

      await service.confirm(user, created.signal!.id);
      clock.advanceMs(365 * 24 * 60 * 60 * 1000);
      expect(await service.actionableSignals(USER_ID, CHALLENGE_ID)).toHaveLength(1);
    });

    it('keeps stale signals out of the user-facing list', async () => {
      const created = await record('I received an interview invitation.');
      await service.confirm(user, created.signal!.id);
      clock.advanceMs(60 * 24 * 60 * 60 * 1000);

      const separated = await service.listSeparated({
        userId: USER_ID,
        challengeId: CHALLENGE_ID,
        limit: 50,
      });
      expect(separated.confirmed).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------- ownership

  describe('ownership', () => {
    it('masks another user\'s challenge as not found', async () => {
      seedChallenge(OTHER_USER_ID);

      // Step 21 section 125: a 403 would confirm the id exists, which turns the
      // endpoint into an enumeration oracle.
      await expect(record('Something changed at work.')).rejects.toMatchObject({
        code: ZunoErrorCode.NOT_FOUND,
      });
      expect(db.store.count(ZunoLifeSignal)).toBe(0);
    });

    it('masks another user\'s signal as not found on confirm', async () => {
      seedChallenge();
      const created = await record('HR gave me my termination letter today.');

      await expect(
        service.confirm({ id: OTHER_USER_ID } as ZunoUser, created.signal!.id),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });

      const stored = db.store
        .rows(ZunoLifeSignal)
        .find((row) => row.id === created.signal!.id)!;
      expect(stored.confirmation_status).toBe(SignalConfirmationStatus.UNCONFIRMED);
    });

    it('masks another user\'s signal as not found on read', async () => {
      seedChallenge();
      const created = await record('HR gave me my termination letter today.');

      await expect(
        service.findOwned(OTHER_USER_ID, created.signal!.id),
      ).rejects.toBeInstanceOf(ZunoException);
    });
  });

  // ------------------------------------------------------- safety and rules

  describe('safety and rulebook boundaries', () => {
    beforeEach(() => seedChallenge());

    it('refuses a self-harm statement before classifying it', async () => {
      // Step 13 section 71: safety precedence. This must not be filed as
      // CAREER_SETBACK and passed downstream.
      await expect(
        record('I lost my job and I do not want to live anymore.'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

      expect(db.store.count(ZunoLifeSignal)).toBe(0);
    });

    it('stores an astro timing signal without interpreting it when no Rulebook is active', async () => {
      // Step 20 section 125 fail-closed: no active Rulebook means no
      // interpretation, and never an invented one (Build Rule 51).
      const result = await record('A supportive period is beginning for me.', {
        signalType: LifeSignalType.ASTRO_TIMING_CHANGE,
      });

      expect(rulebook.getActive).toHaveBeenCalled();
      expect(result.interpretationUnavailable).toBe(true);
      expect(result.signal!.rulebook_version_id).toBeNull();
      expect(result.signal).not.toBeNull();
    });

    it('refuses a source that has no trust or consent controls yet', async () => {
      await expect(
        record('Your calendar shows an interview.', {
          source: LifeSignalSource.EXTERNAL_SOURCE,
        }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.VALIDATION_ERROR });
    });
  });
});
