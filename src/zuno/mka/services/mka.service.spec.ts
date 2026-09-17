import { MkaService } from './mka.service';
import {
  FakeEntityManager,
  FakeRepository,
  fakeDataSource,
  fakeRulebook,
  fixedClock,
  realAudit,
  realOutbox,
  realOwnership,
  realSafety,
} from './mka-plan.test-harness';

import { ZunoMkaProgram } from '../entities/zuno-mka-program.entity';
import { ZunoMkaItem } from '../entities/zuno-mka-item.entity';
import { ZunoMkaCompletion } from '../entities/zuno-mka-completion.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../../challenges/entities/zuno-challenge-context.entity';
import { ZunoResponse } from '../../responses/entities/zuno-response.entity';
import { ZunoEventOutbox } from '../../common/entities/zuno-event-outbox.entity';
import { ZunoAuditEvent } from '../../common/entities/zuno-audit-event.entity';
import { ZunoSafetyDecision } from '../../safety/entities/zuno-safety-decision.entity';
import { ZunoSafetyIncident } from '../../safety/entities/zuno-safety-incident.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';

import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import {
  ChallengeStatus,
  EmotionalIntensity,
  MkaDimension,
  RuleSafetyClass,
  ZunoDomain,
} from '../../common/enums';
import {
  MKA_DIMENSION_LIMITS,
  MkaItemStatus,
  MkaProgramStatus,
  MkaRemedyStatus,
  MkaSourceType,
} from '../enums/mka.enum';
import { MkaPlanEventType } from '../enums/mka-plan-event.enum';

/**
 * MKA engine tests.
 *
 * The cases that matter most here are the ones the specification treats as
 * non-negotiable:
 *   - Golden Test 103: no approved astrology rule must still produce a valid
 *     programme, with no hallucinated remedy
 *   - Step 20 section 125: fail closed, and keep the safe functionality
 *   - Step 20 section 85: ownership is checked on every read and write
 *   - Step 15 sections 26-28: cognitive load is capped
 *   - Build Rule 179: an illegal lifecycle move fails loudly
 */
describe('MkaService', () => {
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
  const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';

  let programs: FakeRepository<any>;
  let items: FakeRepository<any>;
  let completions: FakeRepository<any>;
  let challenges: FakeRepository<any>;
  let contexts: FakeRepository<any>;
  let responses: FakeRepository<any>;
  let outboxRows: FakeRepository<any>;

  const user = { id: USER_ID, timezone: 'Asia/Dubai' } as ZunoUser;

  function buildService(
    rulebook = fakeRulebook({ active: null }),
  ): MkaService {
    programs = new FakeRepository();
    items = new FakeRepository();
    completions = new FakeRepository();
    challenges = new FakeRepository();
    contexts = new FakeRepository();
    responses = new FakeRepository();
    outboxRows = new FakeRepository();

    const registry = new Map<unknown, FakeRepository<any>>([
      [ZunoMkaProgram, programs],
      [ZunoMkaItem, items],
      [ZunoMkaCompletion, completions],
      [ZunoChallenge, challenges],
      [ZunoChallengeContext, contexts],
      [ZunoResponse, responses],
      [ZunoEventOutbox, outboxRows],
      [ZunoAuditEvent, new FakeRepository()],
      [ZunoSafetyDecision, new FakeRepository()],
      [ZunoSafetyIncident, new FakeRepository()],
    ]);
    const manager = new FakeEntityManager(registry);

    return new MkaService(
      programs.asRepository(),
      items.asRepository(),
      completions.asRepository(),
      challenges.asRepository(),
      contexts.asRepository(),
      responses.asRepository(),
      rulebook,
      realSafety(),
      realOutbox(),
      realAudit(),
      realOwnership(),
      fixedClock(),
      fakeDataSource(manager),
    );
  }

  function seedChallenge(overrides: Record<string, unknown> = {}): void {
    challenges.rows.push({
      id: CHALLENGE_ID,
      user_id: USER_ID,
      title: 'Job security and the home loan',
      raw_user_statement:
        'There have been layoffs at my company and I have a home loan to think about.',
      primary_domain: ZunoDomain.CAREER,
      status: ChallengeStatus.ACTIVE,
      emotional_intensity: EmotionalIntensity.HIGH,
      context_version: 1,
      deleted_at: null,
      version: 1,
      ...overrides,
    });
  }

  function seedContext(controllable: string[]): void {
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

  // -------------------------------------------------------------------------
  // Golden Test 103 - no approved astrology rule
  // -------------------------------------------------------------------------
  describe('when no rulebook is active', () => {
    it('still produces a valid programme, and says astrology contributed nothing', async () => {
      const service = buildService(fakeRulebook({ active: null }));
      seedChallenge();
      seedContext(['Update my CV', 'Speak to two trusted contacts']);

      const { program, items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      // Step 15 section 51: the absence is recorded, not silently papered over.
      expect(program.remedy_status).toBe(
        MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
      );
      expect(program.rulebook_version_id).toBeNull();
      expect(program.status).toBe(MkaProgramStatus.ACTIVE);

      // Golden Test 103: Mind allowed, Karma as a safe non-astrology practice,
      // Action allowed, astrological remedy NONE.
      const dimensions = created.map((item) => item.dimension);
      expect(dimensions).toContain(MkaDimension.MIND);
      expect(dimensions).toContain(MkaDimension.KARMA);
      expect(dimensions).toContain(MkaDimension.ACTION);
    });

    it('invents no remedy: nothing claims astrological provenance', async () => {
      const service = buildService(fakeRulebook({ active: null }));
      seedChallenge();
      seedContext(['Update my CV']);

      const { items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      // Step 15 Rule 1 and Anti-Pattern 110.
      for (const item of created) {
        expect(item.source_type).not.toBe(MkaSourceType.APPROVED_ASTRO_REMEDY);
        expect(item.rulebook_version_id).toBeNull();
        expect(item.source_remedy_key).toBeNull();
      }
    });

    it('raises an SME review candidate rather than filling the gap', async () => {
      const service = buildService(fakeRulebook({ active: null }));
      seedChallenge();
      seedContext(['Update my CV']);

      await service.generate({ user, challengeId: CHALLENGE_ID });

      // Step 15 section 52: the gap is routed for review; the user is not made
      // to wait for it.
      const types = outboxRows.rows.map((row) => row.event_type);
      expect(types).toContain(MkaPlanEventType.MKA_SME_REVIEW_CANDIDATE);
      expect(types).toContain(MkaPlanEventType.MKA_GENERATED);
    });

    it('degrades gracefully when the rulebook refuses mid-generation', async () => {
      // Step 20 section 125: fail closed for astrology, continue the safe
      // functionality. A RULEBOOK_UNAVAILABLE from findRules must not surface
      // as a 503 on a plan the user can perfectly well be given.
      const service = buildService(
        fakeRulebook({
          active: { versionId: 'rb-1', version: '0.4' },
          throwUnavailable: true,
        }),
      );
      seedChallenge();
      seedContext(['Review the loan terms']);

      const { program, items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      expect(program.remedy_status).toBe(
        MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
      );
      expect(created.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Approved remedies
  // -------------------------------------------------------------------------
  describe('when an approved remedy exists', () => {
    const rulebookWithRemedy = () =>
      fakeRulebook({
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
            mka_dimension: MkaDimension.KARMA,
            instructions: 'Keep it simple and consistent through the week.',
            purpose: 'Support steadiness during the current period.',
            user_explanation: 'A grounding practice for this period.',
            frequency: 'WEEKLY',
            duration: '7 days',
            preferred_time: 'morning',
            safety_class: RuleSafetyClass.LOW_RISK,
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
      const karma = created.find(
        (item) => item.source_type === MkaSourceType.APPROVED_ASTRO_REMEDY,
      );

      // Step 15 section 17: provenance is mandatory for auditability.
      expect(karma).toBeDefined();
      expect(karma!.rulebook_version_id).toBe('rb-1');
      expect(karma!.source_remedy_key).toBe('REM-GROUND-001');
      expect(karma!.source_rule_key).toBe('RULE-CAREER-007');
    });

    it('preserves the SME wording character for character', async () => {
      const service = buildService(rulebookWithRemedy());
      seedChallenge();
      seedContext(['Update my CV']);

      const { items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });
      const karma = created.find(
        (item) => item.source_type === MkaSourceType.APPROVED_ASTRO_REMEDY,
      );

      // Step 08 section 48 / Step 15 section 72: nothing rewrites the approved
      // instructions.
      expect(karma!.description).toBe(
        'Keep it simple and consistent through the week.',
      );
    });

    it('refuses a remedy that costs money', async () => {
      // Step 15 section 21 and Build Rule 63: a remedy must not require
      // significant spending unless the user independently chooses it.
      const service = buildService(
        fakeRulebook({
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
              mka_dimension: MkaDimension.KARMA,
              instructions: 'Purchase and perform.',
              purpose: 'n/a',
              frequency: 'ONE_TIME',
              safety_class: RuleSafetyClass.LOW_RISK,
              has_financial_cost: true,
              is_devotional: true,
              alternative_keys: [],
            },
          ],
        }),
      );
      seedChallenge();
      seedContext(['Update my CV']);

      const { items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      expect(
        created.some(
          (item) => item.source_remedy_key === 'REM-COSTLY-001',
        ),
      ).toBe(false);
      // The Karma slot is still filled - by a neutral practice, not a vacuum.
      expect(
        created.some((item) => item.dimension === MkaDimension.KARMA),
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Cognitive load
  // -------------------------------------------------------------------------
  describe('cognitive load', () => {
    it('never exceeds the per-dimension ceiling', async () => {
      const service = buildService();
      seedChallenge();
      // Ten controllable factors: far more than the Action ceiling of three.
      seedContext(
        Array.from({ length: 10 }, (_, index) => `Practical step ${index + 1}`),
      );

      const { items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      // Step 15 sections 26-28 and Anti-Pattern 112.
      for (const dimension of Object.values(MkaDimension)) {
        const count = created.filter(
          (item) => item.dimension === dimension,
        ).length;
        expect(count).toBeLessThanOrEqual(MKA_DIMENSION_LIMITS[dimension]);
      }
      expect(created.length).toBeLessThanOrEqual(6);
    });

    it('always includes a practical action', async () => {
      // Step 15 section 26 and Rule 3: "3 remedies, 0 practical actions" is an
      // invalid set for a real-world challenge.
      const service = buildService();
      seedChallenge();

      const { items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });

      expect(
        created.some((item) => item.dimension === MkaDimension.ACTION),
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Ownership
  // -------------------------------------------------------------------------
  describe('ownership', () => {
    it('refuses to generate against someone else\'s challenge', async () => {
      const service = buildService();
      seedChallenge({ user_id: OTHER_USER_ID });

      // Step 21 Golden Contract Test 125: NOT_FOUND, never FORBIDDEN - a 403
      // would confirm the id exists.
      await expect(
        service.generate({ user, challengeId: CHALLENGE_ID }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
    });

    it('refuses to complete someone else\'s MKA item', async () => {
      const service = buildService();
      items.rows.push({
        id: 'item-1',
        mka_program_id: 'prog-1',
        user_id: OTHER_USER_ID,
        status: MkaItemStatus.ACTIVE,
        deleted_at: null,
      });

      await expect(
        service.completeItem(user, 'item-1'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
      expect(completions.rows).toHaveLength(0);
    });

    it('refuses to read someone else\'s programme', async () => {
      const service = buildService();
      programs.rows.push({
        id: 'prog-1',
        user_id: OTHER_USER_ID,
        deleted_at: null,
      });

      await expect(
        service.findOwnedProgram(USER_ID, 'prog-1'),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
    });
  });

  // -------------------------------------------------------------------------
  // Safety
  // -------------------------------------------------------------------------
  describe('safety', () => {
    it('generates nothing when the pre-check blocks', async () => {
      // Build Rule 163 and Step 19 section 50: safety runs before anything is
      // produced, and a block means no programme exists at all.
      const service = buildService();
      seedChallenge({
        raw_user_statement:
          'I do not want to live anymore, there is no point to any of this',
      });

      await expect(
        service.generate({ user, challengeId: CHALLENGE_ID }),
      ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

      expect(programs.rows).toHaveLength(0);
      expect(items.rows).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Completion and events
  // -------------------------------------------------------------------------
  describe('completion', () => {
    it('emits the event the Karma Ledger consumes, carrying eligibility only', async () => {
      const service = buildService();
      seedChallenge();
      seedContext(['Update my CV']);
      const { items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });
      const action = created.find(
        (item) => item.dimension === MkaDimension.ACTION,
      )!;
      outboxRows.rows.length = 0;

      await service.completeItem(user, action.id, { note: 'Done this morning.' });

      const event = outboxRows.rows.find(
        (row) => row.event_type === MkaPlanEventType.MKA_ITEM_COMPLETED,
      );
      expect(event).toBeDefined();
      expect(event!.payload.karma_eligible).toBe(action.karma_eligible);
      // Step 15 section 65 / Step 17: the ledger owns scoring, so no score
      // travels on the event.
      expect(event!.payload.score).toBeUndefined();
    });

    it('is idempotent for the same item on the same day', async () => {
      const service = buildService();
      seedChallenge();
      seedContext(['Update my CV']);
      const { items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });
      const mind = created.find((item) => item.dimension === MkaDimension.MIND)!;

      const first = await service.completeItem(user, mind.id);
      const second = await service.completeItem(user, mind.id);

      expect(second.id).toBe(first.id);
      expect(completions.rows).toHaveLength(1);
    });

    it('records a skip with no penalty of any kind', async () => {
      // Step 15 sections 66-68, Build Rule 64.
      const service = buildService();
      seedChallenge();
      seedContext(['Update my CV']);
      const { items: created } = await service.generate({
        user,
        challengeId: CHALLENGE_ID,
      });
      const mind = created.find((item) => item.dimension === MkaDimension.MIND)!;

      const completion = await service.skipItem(user, mind.id);

      expect(completion.status).toBe('SKIPPED');
      // The item is untouched: skipping does not retire a practice.
      const stored = items.rows.find((row) => row.id === mind.id);
      expect(stored.status).toBe(MkaItemStatus.ACTIVE);
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
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
      // Step 15 section 76: the old version stays readable.
      expect(stored.status).toBe(MkaProgramStatus.SUPERSEDED);
      expect(stored.superseded_by_id).toBe(second.program.id);
    });

    it('returns the existing programme for identical inputs', async () => {
      // Step 15 section 92 and sections 93-95: reopening a screen is not a
      // reason to regenerate.
      const service = buildService();
      seedChallenge();
      seedContext(['Update my CV']);

      const first = await service.generate({ user, challengeId: CHALLENGE_ID });
      const again = await service.generate({ user, challengeId: CHALLENGE_ID });

      expect(again.program.id).toBe(first.program.id);
      expect(programs.rows).toHaveLength(1);
    });

    it.each([
      [MkaProgramStatus.SUPERSEDED, MkaProgramStatus.ACTIVE],
      [MkaProgramStatus.COMPLETED, MkaProgramStatus.ACTIVE],
      [MkaProgramStatus.CANCELLED, MkaProgramStatus.ACTIVE],
      [MkaProgramStatus.DRAFT, MkaProgramStatus.COMPLETED],
    ])('refuses the programme transition %s -> %s', (from, to) => {
      const service = buildService();
      expect(() => service.transitionProgram(from, to)).toThrow(ZunoException);
    });

    it.each([
      [MkaItemStatus.COMPLETED, MkaItemStatus.ACTIVE],
      [MkaItemStatus.COMPLETED, MkaItemStatus.CANCELLED_BY_REALIGNMENT],
      [MkaItemStatus.CANCELLED_BY_REALIGNMENT, MkaItemStatus.ACTIVE],
      [MkaItemStatus.NO_LONGER_RELEVANT, MkaItemStatus.COMPLETED],
    ])('refuses the item transition %s -> %s', (from, to) => {
      const service = buildService();
      expect(() => service.transitionItem(from, to)).toThrow(ZunoException);
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

      // Build Rule 46, applied to MKA: a replaced programme must not continue
      // behaving as current.
      await expect(
        service.completeItem(user, item.id),
      ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
    });
  });
});
