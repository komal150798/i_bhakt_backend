import { DataSource, EntityManager, FindOperator, Repository } from 'typeorm';

import { KarmaService } from './karma.service';
import { DeterministicKarmaClassifier } from './deterministic-karma-classifier';
import { ZunoKarmaEntry } from '../entities/zuno-karma-entry.entity';
import { ZunoKarmaEntryRevision } from '../entities/zuno-karma-entry-revision.entity';
import { ZunoKarmaPattern } from '../entities/zuno-karma-pattern.entity';
import {
  KarmaActionOutcome,
  KarmaCategory,
  KarmaClassification,
  KarmaEffort,
  KarmaEntrySource,
  KarmaEntryStatus,
  KarmaIngestResult,
  KarmaIntent,
  KarmaRelevance,
  KarmaVisibility,
} from '../enums/karma.enum';
import {
  KarmaClassificationRequest,
  KarmaClassificationResult,
  KarmaClassifierPort,
} from '../ports/karma-classifier.port';
import {
  KarmaSourceAction,
  KarmaSourcePort,
  NullKarmaSourceAdapter,
  validateActionCompletedPayload,
} from '../ports/karma-source.port';
import {
  KARMA_SCORING_V1,
  assertNonPunitive,
  calculateKarmaPoints,
  requiresUserConfirmation,
  withConfidenceFloor,
} from '../scoring/karma-scoring';
import {
  KARMA_APPROVED_POINT_LABELS,
  KARMA_COPY,
  KARMA_POINTS_LABEL,
  assertKarmaCopyIsNeutral,
  assertNeutralCopy,
  findNeutralityViolations,
} from '../neutrality';

import { SafetyService } from '../../safety/services/safety.service';
import { SafetySignalDetector } from '../../safety/services/safety-signal-detector';
import {
  ZunoSafetyDecision,
  ZunoSafetyIncident,
} from '../../safety/entities';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { FixedClockService } from '../../common/services/clock.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { ZunoException } from '../../common/errors/zuno.exception';

/**
 * Karma Ledger tests.
 *
 * Roadmap section 58 gives the Phase 8 acceptance list, and each item has a
 * block below:
 *
 *   [ ] duplicate retry does not duplicate entry      -> 'idempotent ingest'
 *   [ ] neutral supported                             -> 'neutrality'
 *   [ ] user can challenge classification             -> 'user correction'
 *   [ ] cross-user access denied                      -> 'ownership'
 *   [ ] raw Karma text excluded from generic analytics-> 'privacy'
 *
 * Build Rule 96: where one of these fails, the implementation is what changes.
 */

// ---------------------------------------------------------------------------
// In-memory doubles
// ---------------------------------------------------------------------------

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-09-17T10:00:00.000Z');

/**
 * Evaluates a TypeORM `where` value against a row value.
 *
 * The service builds real FindOperators (IsNull, Not, MoreThanOrEqual, And),
 * so the fake repository has to understand them. Hand-writing this is
 * preferable to a mock that returns fixed arrays, because it means the tests
 * exercise the *actual* filters - a service that forgot `deleted_at IS NULL`
 * would still pass against a fixed array.
 */
function matchesCondition(value: unknown, condition: unknown): boolean {
  if (condition instanceof FindOperator) {
    switch (condition.type) {
      case 'isNull':
        return value === null || value === undefined;
      case 'not':
        return !matchesCondition(value, condition.value);
      case 'moreThanOrEqual':
        return (value as number) >= (condition.value as number);
      case 'lessThan':
        return (value as number) < (condition.value as number);
      case 'and':
        return (condition.value as unknown[]).every((inner) =>
          matchesCondition(value, inner),
        );
      default:
        return value === condition.value;
    }
  }
  return value === condition;
}

function matchesWhere(row: Record<string, unknown>, where: unknown): boolean {
  if (!where) return true;
  const clauses = Array.isArray(where) ? where : [where];
  return clauses.some((clause) =>
    Object.entries(clause as Record<string, unknown>).every(([key, condition]) =>
      matchesCondition(row[key], condition),
    ),
  );
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `00000000-0000-4000-8000-${String(idCounter).padStart(12, '0')}`;
}

class FakeTable<T extends Record<string, unknown>> {
  rows: T[] = [];

  create(input: Partial<T>): T {
    return { ...(input as T) };
  }

  async save(entity: T): Promise<T> {
    const row = entity as Record<string, unknown>;
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
    const index = this.rows.findIndex(
      (existing) => (existing as Record<string, unknown>).id === row.id,
    );
    if (index === -1) this.rows.push(entity);
    else this.rows[index] = entity;
    return entity;
  }

  async find(options?: {
    where?: unknown;
    order?: Record<string, 'ASC' | 'DESC'>;
    take?: number;
  }): Promise<T[]> {
    let result = this.rows.filter((row) =>
      matchesWhere(row as Record<string, unknown>, options?.where),
    );
    const order = options?.order;
    if (order) {
      const [key, direction] = Object.entries(order)[0];
      result = [...result].sort((a, b) => {
        const left = a[key] as unknown as number;
        const right = b[key] as unknown as number;
        if (left === right) return 0;
        return direction === 'DESC'
          ? left < right
            ? 1
            : -1
          : left > right
            ? 1
            : -1;
      });
    }
    if (options?.take !== undefined) result = result.slice(0, options.take);
    return result;
  }

  async findOne(options?: { where?: unknown }): Promise<T | null> {
    const found = await this.find(options);
    return found[0] ?? null;
  }
}

/** Fake EntityManager routing entity classes to their table. */
function fakeManager(tables: Map<unknown, FakeTable<never>>): EntityManager {
  const tableFor = (target: unknown): FakeTable<Record<string, unknown>> => {
    const table = tables.get(target);
    if (!table) throw new Error(`no fake table registered for ${String(target)}`);
    return table as unknown as FakeTable<Record<string, unknown>>;
  };
  return {
    create: (target: unknown, input: Record<string, unknown>) =>
      tableFor(target).create(input),
    save: (target: unknown, entity: Record<string, unknown>) =>
      tableFor(target).save(entity),
    find: (target: unknown, options?: never) => tableFor(target).find(options),
    findOne: (target: unknown, options?: never) =>
      tableFor(target).findOne(options),
  } as unknown as EntityManager;
}

/** A classifier whose answer the test dictates. Step 17 section 21's boundary. */
class StubClassifier implements KarmaClassifierPort {
  constructor(private result: Partial<KarmaClassificationResult> = {}) {}

  set(result: Partial<KarmaClassificationResult>): void {
    this.result = result;
  }

  async classify(
    _request: KarmaClassificationRequest,
  ): Promise<KarmaClassificationResult> {
    return {
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.OTHER,
      intent: KarmaIntent.UNKNOWN,
      impactScope: 'SELF' as never,
      effort: KarmaEffort.MEDIUM,
      relevance: KarmaRelevance.MEDIUM,
      confidence: 0.9,
      evidence: ['TEST'],
      modelVersion: 'test-classifier-1.0',
      ...this.result,
    };
  }
}

interface Harness {
  service: KarmaService;
  entries: FakeTable<Record<string, unknown>>;
  revisions: FakeTable<Record<string, unknown>>;
  patterns: FakeTable<Record<string, unknown>>;
  classifier: StubClassifier;
  outbox: { enqueue: jest.Mock; enqueueMany: jest.Mock };
  audit: { record: jest.Mock };
  rulebook: { isAstrologyAvailable: jest.Mock };
  clock: FixedClockService;
  safetyDecisions: FakeTable<Record<string, unknown>>;
  safetyIncidents: FakeTable<Record<string, unknown>>;
}

function buildHarness(
  options: {
    classifier?: KarmaClassifierPort;
    sourcePort?: KarmaSourcePort;
    astrologyAvailable?: boolean;
  } = {},
): Harness {
  const entries = new FakeTable<Record<string, unknown>>();
  const revisions = new FakeTable<Record<string, unknown>>();
  const patterns = new FakeTable<Record<string, unknown>>();

  // Safety writes its decision and incident rows through the same manager, so
  // they need a table too - the ledger is not allowed to bypass that path.
  const safetyDecisions = new FakeTable<Record<string, unknown>>();
  const safetyIncidents = new FakeTable<Record<string, unknown>>();

  const tables = new Map<unknown, FakeTable<never>>([
    [ZunoKarmaEntry, entries as unknown as FakeTable<never>],
    [ZunoKarmaEntryRevision, revisions as unknown as FakeTable<never>],
    [ZunoKarmaPattern, patterns as unknown as FakeTable<never>],
    [ZunoSafetyDecision, safetyDecisions as unknown as FakeTable<never>],
    [ZunoSafetyIncident, safetyIncidents as unknown as FakeTable<never>],
  ]);
  const manager = fakeManager(tables);

  const dataSource = {
    transaction: async <T>(work: (m: EntityManager) => Promise<T>): Promise<T> =>
      work(manager),
  } as unknown as DataSource;

  const outbox = { enqueue: jest.fn(), enqueueMany: jest.fn() };
  const audit = { record: jest.fn() };
  const rulebook = {
    isAstrologyAvailable: jest
      .fn()
      .mockResolvedValue(options.astrologyAvailable ?? false),
  };
  const classifier =
    (options.classifier as StubClassifier) ?? new StubClassifier();
  const clock = new FixedClockService(NOW);

  const service = new KarmaService(
    entries as unknown as Repository<ZunoKarmaEntry>,
    patterns as unknown as Repository<ZunoKarmaPattern>,
    classifier,
    options.sourcePort ?? new NullKarmaSourceAdapter(),
    new SafetyService(new SafetySignalDetector()),
    outbox as unknown as OutboxService,
    audit as unknown as ZunoAuditService,
    new ZunoOwnershipService(),
    rulebook as unknown as RulebookRepositoryService,
    clock,
    dataSource,
  );

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

function planCompletedEvent(overrides: Record<string, unknown> = {}) {
  return {
    event_id: 'outbox-row-1',
    user_id: USER_A,
    source: KarmaEntrySource.PLAN_COMPLETION,
    plan_item_id: '33333333-3333-4333-8333-333333333333',
    challenge_id: '44444444-4444-4444-8444-444444444444',
    completed_at: NOW.toISOString(),
    outcome: KarmaActionOutcome.COMPLETED,
    karma_ledger_eligible: true,
    action_label: 'Have the bank conversation',
    ...overrides,
  };
}

beforeEach(() => {
  idCounter = 0;
});

// ---------------------------------------------------------------------------

describe('karma scoring', () => {
  // Step 17 section 20: the formula is deterministic and versioned, and
  // section 21 keeps the arithmetic out of the model's hands.

  it('scores a first constructive action at the base value', () => {
    const result = calculateKarmaPoints({
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.SERVICE,
      intent: KarmaIntent.UNKNOWN,
      effort: KarmaEffort.MEDIUM,
      relevance: KarmaRelevance.MEDIUM,
      priorInCategoryInWindow: 0,
      pointsRecordedToday: 0,
    });

    expect(result.points).toBe(5);
    expect(result.scoringModelVersion).toBe('1.0');
    expect(result.softCapApplied).toBe(false);
  });

  it('is deterministic - the same observation always scores the same', () => {
    const observation = {
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.CAREER,
      intent: KarmaIntent.FOLLOW_THROUGH,
      effort: KarmaEffort.HIGH,
      relevance: KarmaRelevance.HIGH,
      priorInCategoryInWindow: 1,
      pointsRecordedToday: 0,
    };
    const first = calculateKarmaPoints(observation);
    const second = calculateKarmaPoints(observation);
    expect(first.points).toBe(second.points);
    expect(first.factors).toEqual(second.factors);
  });

  it('weights a high-effort, high-relevance follow-through more, still bounded', () => {
    // Step 17 section 65: a difficult one-time action reasonably carries more.
    // Step 17 section 17: and never more than the configured maximum.
    const result = calculateKarmaPoints({
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.COURAGE,
      intent: KarmaIntent.FOLLOW_THROUGH,
      effort: KarmaEffort.HIGH,
      relevance: KarmaRelevance.HIGH,
      priorInCategoryInWindow: 0,
      pointsRecordedToday: 0,
    });

    expect(result.points).toBeGreaterThan(5);
    expect(result.points).toBeLessThanOrEqual(KARMA_SCORING_V1.maxPointsPerEntry);
  });

  it('applies a diminishing curve to a repeated action in the same category', () => {
    // Step 17 sections 63-64: repetition is bounded so an identical low-effort
    // action cannot be farmed.
    const first = calculateKarmaPoints({
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.SELF_DISCIPLINE,
      intent: KarmaIntent.ROUTINE,
      effort: KarmaEffort.MEDIUM,
      relevance: KarmaRelevance.MEDIUM,
      priorInCategoryInWindow: 0,
      pointsRecordedToday: 0,
    });
    const fifth = calculateKarmaPoints({
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.SELF_DISCIPLINE,
      intent: KarmaIntent.ROUTINE,
      effort: KarmaEffort.MEDIUM,
      relevance: KarmaRelevance.MEDIUM,
      priorInCategoryInWindow: 5,
      pointsRecordedToday: 0,
    });

    expect(fifth.points).toBeLessThan(first.points);
    expect(fifth.points).toBeGreaterThanOrEqual(0);
  });

  it('trims by the daily soft cap without ever going below zero', () => {
    const result = calculateKarmaPoints({
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.SERVICE,
      intent: KarmaIntent.SUPPORT,
      effort: KarmaEffort.MEDIUM,
      relevance: KarmaRelevance.MEDIUM,
      priorInCategoryInWindow: 0,
      pointsRecordedToday: KARMA_SCORING_V1.dailySoftCap - 2,
    });

    expect(result.points).toBe(2);
    expect(result.softCapApplied).toBe(true);

    const beyond = calculateKarmaPoints({
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.SERVICE,
      intent: KarmaIntent.SUPPORT,
      effort: KarmaEffort.MEDIUM,
      relevance: KarmaRelevance.MEDIUM,
      priorInCategoryInWindow: 0,
      pointsRecordedToday: KARMA_SCORING_V1.dailySoftCap + 50,
    });
    expect(beyond.points).toBe(0);
  });

  it('scores an unconstructive action at zero, never below', () => {
    // Step 17 sections 17-18 and Rule 4. This is the load-bearing assertion of
    // the whole module: an unconstructive action is a reflection point.
    const result = calculateKarmaPoints({
      classification: KarmaClassification.UNCONSTRUCTIVE,
      category: KarmaCategory.COMMUNICATION,
      intent: KarmaIntent.UNKNOWN,
      effort: KarmaEffort.HIGH,
      relevance: KarmaRelevance.HIGH,
      priorInCategoryInWindow: 0,
      pointsRecordedToday: 0,
    });

    expect(result.points).toBe(0);
  });

  it('scores neutral and uncertain at zero', () => {
    for (const classification of [
      KarmaClassification.NEUTRAL,
      KarmaClassification.UNCERTAIN,
    ]) {
      const result = calculateKarmaPoints({
        classification,
        category: KarmaCategory.OTHER,
        intent: KarmaIntent.UNKNOWN,
        effort: KarmaEffort.MEDIUM,
        relevance: KarmaRelevance.MEDIUM,
        priorInCategoryInWindow: 0,
        pointsRecordedToday: 0,
      });
      expect(result.points).toBe(0);
    }
  });

  it('gives a mixed action partial credit rather than a binary verdict', () => {
    // Step 17 sections 11-12.
    const mixed = calculateKarmaPoints({
      classification: KarmaClassification.MIXED,
      category: KarmaCategory.COMMUNICATION,
      intent: KarmaIntent.SUPPORT,
      effort: KarmaEffort.MEDIUM,
      relevance: KarmaRelevance.MEDIUM,
      priorInCategoryInWindow: 0,
      pointsRecordedToday: 0,
    });
    expect(mixed.points).toBeGreaterThan(0);
    expect(mixed.points).toBeLessThan(5);
  });

  it('refuses to score at all if negative scoring is ever switched on', () => {
    // Step 17 section 19: enabling this needs Product, Safety, Behavioural
    // Design and SME Governance approval, not a config edit.
    const rogue = {
      ...KARMA_SCORING_V1,
      negativeScoringEnabled: true as unknown as false,
    };
    expect(() => assertNonPunitive(rogue, 0)).toThrow(ZunoException);
  });

  it('downgrades a low-confidence reading to UNCERTAIN', () => {
    // Step 17 sections 13 and 96.
    expect(
      withConfidenceFloor(KarmaClassification.UNCONSTRUCTIVE, 0.3),
    ).toBe(KarmaClassification.UNCERTAIN);
    expect(withConfidenceFloor(KarmaClassification.CONSTRUCTIVE, 0.9)).toBe(
      KarmaClassification.CONSTRUCTIVE,
    );
  });

  it('asks for confirmation below the configured threshold', () => {
    // Step 17 section 54.
    expect(requiresUserConfirmation(0.5)).toBe(true);
    expect(requiresUserConfirmation(0.95)).toBe(false);
  });

  it('explains every score without spiritual or moral language', () => {
    for (const classification of Object.values(KarmaClassification)) {
      for (const effort of Object.values(KarmaEffort)) {
        const result = calculateKarmaPoints({
          classification,
          category: KarmaCategory.OTHER,
          intent: KarmaIntent.REPAIR,
          effort,
          relevance: KarmaRelevance.HIGH,
          priorInCategoryInWindow: 3,
          pointsRecordedToday: 0,
        });
        expect(findNeutralityViolations(result.explanation)).toEqual([]);
      }
    }
  });
});

// ---------------------------------------------------------------------------

describe('karma neutrality', () => {
  it('ships only copy that passes the neutrality rules', () => {
    // Roadmap section 55.
    expect(() => assertKarmaCopyIsNeutral()).not.toThrow();
    for (const message of Object.values(KARMA_COPY)) {
      expect(findNeutralityViolations(message)).toEqual([]);
    }
  });

  it('uses only a headline label approved by Step 17 section 39', () => {
    expect(KARMA_APPROVED_POINT_LABELS).toContain(KARMA_POINTS_LABEL);
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
      expect(findNeutralityViolations(text).length).toBeGreaterThan(0);
      expect(() => assertNeutralCopy(text, 'test')).toThrow(ZunoException);
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
      expect(findNeutralityViolations(text)).toEqual([]);
    }
  });

  it('supports neutral and uncertain classification end to end', async () => {
    // Roadmap section 55 acceptance: "neutral supported".
    const harness = buildHarness();
    harness.classifier.set({
      classification: KarmaClassification.NEUTRAL,
      confidence: 0.9,
    });

    const { entry } = await harness.service.createUserEntry({
      userId: USER_A,
      text: 'Renewed my gym membership.',
    });

    expect(entry.classification).toBe(KarmaClassification.NEUTRAL);
    expect(entry.points).toBe(0);
  });

  it('never labels a completed plan action as unconstructive', async () => {
    // Step 17 Rule 2 / section 9: completing a planned step can never become a
    // judgement about the person, whatever the interpreter says.
    const harness = buildHarness();
    harness.classifier.set({
      classification: KarmaClassification.UNCONSTRUCTIVE,
      confidence: 0.95,
    });

    const outcome = await harness.service.handleActionCompleted(
      planCompletedEvent(),
    );

    expect(outcome.result).toBe(KarmaIngestResult.RECORDED);
    expect(harness.entries.rows[0].classification).toBe(
      KarmaClassification.NEUTRAL,
    );
    expect(harness.entries.rows[0].points).toBe(0);
  });

  it('records nothing and deducts nothing when a practice is missed', async () => {
    // Step 17 sections 28, 82, 97 and Rule 4 - "This is non-negotiable."
    const harness = buildHarness();

    const outcome = await harness.service.handleActionCompleted(
      planCompletedEvent({ outcome: KarmaActionOutcome.MISSED }),
    );

    expect(outcome.result).toBe(KarmaIngestResult.NO_PENALTY);
    expect(harness.entries.rows).toHaveLength(0);
    expect(findNeutralityViolations(outcome.message)).toEqual([]);
  });

  it('records nothing when an action is cancelled by realignment', async () => {
    // Step 17 sections 48, 83, 98 and Rule 5.
    const harness = buildHarness();

    const outcome = await harness.service.handleActionCompleted(
      planCompletedEvent({
        outcome: KarmaActionOutcome.CANCELLED_BY_REALIGNMENT,
      }),
    );

    expect(outcome.result).toBe(KarmaIngestResult.NO_PENALTY);
    expect(outcome.message).toBe(KARMA_COPY.cancelledByRealignment);
    expect(harness.entries.rows).toHaveLength(0);
  });

  it('treats a deferral as context rather than a fault', async () => {
    // Step 17 section 49.
    const harness = buildHarness();
    const outcome = await harness.service.handleActionCompleted(
      planCompletedEvent({ outcome: KarmaActionOutcome.DEFERRED }),
    );
    expect(outcome.result).toBe(KarmaIngestResult.NO_PENALTY);
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
      expect(row.points as number).toBeGreaterThanOrEqual(0);
      expect(row.points as number).toBeLessThanOrEqual(10);
    }
  });
});

// ---------------------------------------------------------------------------

describe('karma ownership', () => {
  // Roadmap section 56 / Step 21 section 106: strict ownership, and a
  // cross-user id must not even confirm the row exists.

  async function seedEntryFor(harness: Harness, userId: string) {
    const { entry } = await harness.service.createUserEntry({
      userId,
      text: 'Helped a colleague prepare for an interview.',
    });
    return entry;
  }

  it('masks another user\'s entry as NOT_FOUND, never FORBIDDEN', async () => {
    const harness = buildHarness();
    const entry = await seedEntryFor(harness, USER_A);

    await expect(harness.service.findOwned(USER_B, entry.id)).rejects.toThrow(
      ZunoException,
    );
    await harness.service.findOwned(USER_B, entry.id).catch((error) => {
      expect((error as ZunoException).code).toBe(ZunoErrorCode.NOT_FOUND);
    });
  });

  it('refuses a correction on another user\'s entry', async () => {
    const harness = buildHarness();
    const entry = await seedEntryFor(harness, USER_A);

    await expect(
      harness.service.correct(USER_B, entry.id, {
        classification: KarmaClassification.CONSTRUCTIVE,
      }),
    ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });

    // And the entry is untouched.
    expect(harness.revisions.rows).toHaveLength(0);
  });

  it('refuses a deletion on another user\'s entry', async () => {
    const harness = buildHarness();
    const entry = await seedEntryFor(harness, USER_A);

    await expect(harness.service.remove(USER_B, entry.id)).rejects.toMatchObject(
      { code: ZunoErrorCode.NOT_FOUND },
    );
    expect(harness.entries.rows[0].status).toBe(KarmaEntryStatus.ACTIVE);
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
    // A replayed or forged event must not be able to write into another
    // person's ledger even when the upstream row exists.
    const impostorPort: KarmaSourcePort = {
      async describeCompletedAction(): Promise<KarmaSourceAction> {
        return {
          userId: USER_B,
          challengeId: null,
          karmaLedgerEligible: true,
          outcome: KarmaActionOutcome.COMPLETED,
          astrologyDerived: false,
        };
      },
    };
    const harness = buildHarness({ sourcePort: impostorPort });

    const outcome = await harness.service.handleActionCompleted(
      planCompletedEvent({ user_id: USER_A }),
    );

    expect(outcome.result).toBe(KarmaIngestResult.INVALID_EVENT);
    expect(harness.entries.rows).toHaveLength(0);
  });

  it('enforces optimistic concurrency on a correction', async () => {
    // Step 21 section 108.
    const harness = buildHarness();
    const entry = await seedEntryFor(harness, USER_A);

    await expect(
      harness.service.correct(USER_A, entry.id, {
        classification: KarmaClassification.MIXED,
        version: 99,
      }),
    ).rejects.toMatchObject({ code: ZunoErrorCode.CONFLICT });
  });
});

// ---------------------------------------------------------------------------

describe('karma idempotent ingest', () => {
  // Roadmap section 58: "duplicate retry does not duplicate entry".
  // Step 17 section 91, Step 21 Golden Contract Test 126, Build Rule 79.

  it('creates exactly one entry when the same event is delivered twice', async () => {
    const harness = buildHarness();
    const event = planCompletedEvent();

    const first = await harness.service.handleActionCompleted(event);
    const second = await harness.service.handleActionCompleted(event);

    expect(first.result).toBe(KarmaIngestResult.RECORDED);
    expect(second.result).toBe(KarmaIngestResult.DUPLICATE);
    expect(second.entryId).toBe(first.entryId);
    expect(harness.entries.rows).toHaveLength(1);
  });

  it('does not double-credit points on a redelivery', async () => {
    const harness = buildHarness();
    const event = planCompletedEvent();

    await harness.service.handleActionCompleted(event);
    const awarded = harness.entries.rows[0].points as number;
    await harness.service.handleActionCompleted(event);
    await harness.service.handleActionCompleted(event);

    expect(harness.entries.rows).toHaveLength(1);
    expect(harness.entries.rows[0].points).toBe(awarded);
    const total = harness.entries.rows.reduce(
      (sum, row) => sum + (row.points as number),
      0,
    );
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
    // Step 17 sections 57 and 62: one action, one entry - including when the
    // same completion is emitted twice with fresh ids, or supports two
    // challenges.
    const harness = buildHarness();

    await harness.service.handleActionCompleted(planCompletedEvent());
    const second = await harness.service.handleActionCompleted(
      planCompletedEvent({
        event_id: 'outbox-row-2',
        challenge_id: '55555555-5555-4555-8555-555555555555',
      }),
    );

    expect(second.result).toBe(KarmaIngestResult.DUPLICATE);
    expect(harness.entries.rows).toHaveLength(1);
  });

  it('deduplicates a manual entry against the same words on the same day', async () => {
    // Step 17 section 99.
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
    // Build Rule 79: a consumer that throws on a bad message retries forever.
    const harness = buildHarness();

    const outcome = await harness.service.handleActionCompleted({
      event_id: '',
      user_id: 'not-a-uuid',
    });

    expect(outcome.result).toBe(KarmaIngestResult.INVALID_EVENT);
    expect(harness.entries.rows).toHaveLength(0);
  });

  it('validates the event contract field by field', () => {
    expect(validateActionCompletedPayload(planCompletedEvent())).toEqual([]);
    expect(
      validateActionCompletedPayload(
        planCompletedEvent({ plan_item_id: null, mka_item_id: null }),
      ),
    ).toContain('plan_item_id|mka_item_id');
    expect(
      validateActionCompletedPayload(
        planCompletedEvent({
          plan_item_id: '33333333-3333-4333-8333-333333333333',
          mka_item_id: '66666666-6666-4666-8666-666666666666',
        }),
      ),
    ).toContain('plan_item_id|mka_item_id');
    expect(
      validateActionCompletedPayload(planCompletedEvent({ outcome: 'NOPE' })),
    ).toContain('outcome');
  });
});

// ---------------------------------------------------------------------------

describe('karma eligibility', () => {
  it('ignores a completed action the upstream module did not mark eligible', async () => {
    // Step 17 sections 6, 25 and 108: not every checkbox is karma.
    const harness = buildHarness();

    const outcome = await harness.service.handleActionCompleted(
      planCompletedEvent({
        karma_ledger_eligible: false,
        action_label: 'Open settings page',
      }),
    );

    expect(outcome.result).toBe(KarmaIngestResult.NOT_ELIGIBLE);
    expect(harness.entries.rows).toHaveLength(0);
  });

  it('treats a missing eligibility flag as not eligible', async () => {
    const harness = buildHarness();
    const event = planCompletedEvent();
    delete (event as Record<string, unknown>).karma_ledger_eligible;

    const outcome = await harness.service.handleActionCompleted(event);
    expect(outcome.result).toBe(KarmaIngestResult.INVALID_EVENT);
  });

  it('fails closed on an astrology-derived practice with no active Rulebook', async () => {
    // Build Rules 51, 118 and 130: no approved rule, no invented meaning - and
    // no deduction either.
    const harness = buildHarness({ astrologyAvailable: false });

    const outcome = await harness.service.handleActionCompleted(
      planCompletedEvent({
        source: KarmaEntrySource.MKA_COMPLETION,
        plan_item_id: null,
        mka_item_id: '66666666-6666-4666-8666-666666666666',
        astrology_derived: true,
      }),
    );

    expect(outcome.result).toBe(KarmaIngestResult.INTERPRETATION_UNAVAILABLE);
    expect(harness.entries.rows).toHaveLength(0);
    expect(harness.rulebook.isAstrologyAvailable).toHaveBeenCalled();
  });

  it('records a completed remedy as consistency when a Rulebook is active', async () => {
    // Step 17 section 27: consistency and intentional practice, never
    // "cosmic protection".
    const harness = buildHarness({ astrologyAvailable: true });

    const outcome = await harness.service.handleActionCompleted(
      planCompletedEvent({
        source: KarmaEntrySource.MKA_COMPLETION,
        plan_item_id: null,
        mka_item_id: '66666666-6666-4666-8666-666666666666',
        astrology_derived: true,
        action_label: 'Morning grounding practice',
      }),
    );

    expect(outcome.result).toBe(KarmaIngestResult.RECORDED);
    expect(harness.entries.rows[0].category).toBe(KarmaCategory.CONSISTENCY);
    expect(harness.entries.rows[0].intent).toBe(KarmaIntent.INTENTIONAL_PRACTICE);
  });

  it('survives a Rulebook lookup failure by recording nothing', async () => {
    const harness = buildHarness();
    harness.rulebook.isAstrologyAvailable.mockRejectedValueOnce(
      new Error('rulebook down'),
    );

    const outcome = await harness.service.handleActionCompleted(
      planCompletedEvent({ astrology_derived: true }),
    );

    expect(outcome.result).toBe(KarmaIngestResult.INTERPRETATION_UNAVAILABLE);
    expect(harness.entries.rows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------

describe('karma safety precedence', () => {
  it('routes a self-harm entry to safety instead of scoring it', async () => {
    // Step 17 sections 30-31, 100 and Rule 8; Build Rule 69.
    const harness = buildHarness();

    await expect(
      harness.service.createUserEntry({
        userId: USER_A,
        text: 'I do not want to live anymore, there is no point',
      }),
    ).rejects.toMatchObject({ code: ZunoErrorCode.SAFETY_RESTRICTED });

    expect(harness.entries.rows).toHaveLength(0);
    expect(harness.outbox.enqueueMany).not.toHaveBeenCalled();

    // The refusal is recorded rather than silently dropped (Step 20 sections
    // 62-63), and none of it carries the user's words.
    expect(harness.safetyDecisions.rows).toHaveLength(1);
    expect(harness.safetyIncidents.rows).toHaveLength(1);
    expect(JSON.stringify(harness.safetyDecisions.rows)).not.toContain(
      'do not want to live',
    );
  });
});

// ---------------------------------------------------------------------------

describe('karma user correction', () => {
  // Roadmap section 58: "user can challenge classification".
  // Step 17 sections 14, 55, 101, 109 and Rule 7.

  it('lets the user overturn the classification and preserves the original', async () => {
    const harness = buildHarness();
    harness.classifier.set({
      classification: KarmaClassification.UNCONSTRUCTIVE,
      confidence: 0.8,
      category: KarmaCategory.COMMUNICATION,
    });
    const { entry } = await harness.service.createUserEntry({
      userId: USER_A,
      text: 'I told my manager the project timeline was unrealistic.',
    });
    expect(entry.classification).toBe(KarmaClassification.UNCONSTRUCTIVE);

    const corrected = await harness.service.correct(USER_A, entry.id, {
      classification: KarmaClassification.MIXED,
      accepted: false,
      comment: 'That was not my intention.',
    });

    expect(corrected.classification).toBe(KarmaClassification.MIXED);
    expect(corrected.status).toBe(KarmaEntryStatus.EDITED);
    expect(corrected.user_confirmed).toBe(true);

    expect(harness.revisions.rows).toHaveLength(1);
    const revision = harness.revisions.rows[0];
    expect(
      (revision.previous_value as Record<string, unknown>).classification,
    ).toBe(KarmaClassification.UNCONSTRUCTIVE);
    expect((revision.new_value as Record<string, unknown>).classification).toBe(
      KarmaClassification.MIXED,
    );
    expect(revision.reason).toBe('That was not my intention.');
  });

  it('never takes points away when the user corrects an entry', async () => {
    // Step 17 sections 18 and 41: nothing already recorded is removed, or the
    // user learns not to correct.
    const harness = buildHarness();
    const { entry } = await harness.service.createUserEntry({
      userId: USER_A,
      text: 'Helped a colleague prepare for an interview.',
    });
    const awarded = entry.points;

    const corrected = await harness.service.correct(USER_A, entry.id, {
      classification: KarmaClassification.NEUTRAL,
    });

    expect(corrected.points).toBeGreaterThanOrEqual(awarded);
    expect(corrected.points).toBeGreaterThanOrEqual(0);
  });

  it('does not copy the user\'s words into the revision history', async () => {
    // Step 17 section 70 / Build Rule 34.
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

// ---------------------------------------------------------------------------

describe('karma privacy', () => {
  // Roadmap section 56 and 58's "raw Karma text excluded from generic
  // analytics"; Step 17 sections 3, 70, 71; Build Rules 34, 36, 113.

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
      expect(row.visibility).toBe(KarmaVisibility.PRIVATE);
    }
  });

  it('erases the words and stops counting the entry on delete', async () => {
    // Step 17 sections 56, 71 / Build Rule 143.
    const harness = buildHarness();
    const { entry } = await harness.service.createUserEntry({
      userId: USER_A,
      text: 'Helped a colleague prepare for an interview.',
    });

    await harness.service.remove(USER_A, entry.id);

    const row = harness.entries.rows[0];
    expect(row.raw_text).toBeNull();
    expect(row.redacted_at).not.toBeNull();
    expect(row.status).toBe(KarmaEntryStatus.DELETED);

    const summary = await harness.service.summary(USER_A);
    expect(summary.thisWeek.entriesRecorded).toBe(0);

    await expect(
      harness.service.findOwned(USER_A, entry.id),
    ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
  });

  it('offers no ranking or comparison in the summary', async () => {
    // Step 17 sections 68, 106 and Rule 10.
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
    expect(KARMA_APPROVED_POINT_LABELS).toContain(summary.pointsLabel);
  });
});

// ---------------------------------------------------------------------------

describe('deterministic classifier golden cases', () => {
  // Step 17 sections 94-96. The interpreter is swappable, but whatever is bound
  // has to get these right.

  const classifier = new DeterministicKarmaClassifier();

  it('reads a clear supportive action as constructive service', async () => {
    // Golden Test 95.
    const result = await classifier.classify({
      text: 'I helped my colleague prepare for an interview.',
      source: KarmaEntrySource.USER_CREATED,
    });

    expect(result.classification).toBe(KarmaClassification.CONSTRUCTIVE);
    expect(result.category).toBe(KarmaCategory.SERVICE);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('refuses to judge an ambiguous statement', async () => {
    // Golden Test 96: not automatic positive or negative judgement.
    const result = await classifier.classify({
      text: 'I told him exactly what I thought.',
      source: KarmaEntrySource.USER_CREATED,
    });

    const settled = withConfidenceFloor(
      result.classification,
      result.confidence,
    );
    expect(settled).toBe(KarmaClassification.UNCERTAIN);
  });

  it('reads both directions in one sentence as MIXED', async () => {
    // Step 17 section 12's worked example.
    const result = await classifier.classify({
      text: 'I helped my colleague, but I should not have shared that information.',
      source: KarmaEntrySource.USER_CREATED,
    });

    expect(result.classification).toBe(KarmaClassification.MIXED);
  });

  it('recognises repair as its own constructive act', async () => {
    // Step 17 section 33.
    const result = await classifier.classify({
      text: 'I apologised after speaking harshly.',
      source: KarmaEntrySource.USER_CREATED,
    });

    expect(result.classification).toBe(KarmaClassification.CONSTRUCTIVE);
    expect(result.category).toBe(KarmaCategory.REPAIR);
    expect(result.intent).toBe(KarmaIntent.REPAIR);
  });

  it('never returns points', async () => {
    // Step 17 Rule 3 / section 21: the interpreter classifies, the backend
    // scores. This asserts the contract shape itself.
    const result = await classifier.classify({
      text: 'Completed the bank discussion I had been avoiding.',
      source: KarmaEntrySource.USER_CREATED,
    });
    expect(result).not.toHaveProperty('points');
  });

  it('ends an ambiguous user entry at zero points, not a guess', async () => {
    const harness = buildHarness({ classifier: new DeterministicKarmaClassifier() as never });
    const { entry, confirmationRequired } = await harness.service.createUserEntry({
      userId: USER_A,
      text: 'I told him exactly what I thought.',
    });

    expect(entry.classification).toBe(KarmaClassification.UNCERTAIN);
    expect(entry.points).toBe(0);
    expect(confirmationRequired).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe('karma patterns', () => {
  it('needs enough evidence before observing a pattern', async () => {
    // Step 17 section 75: one action never produces "you are now disciplined".
    const harness = buildHarness();
    harness.classifier.set({
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.SERVICE,
      confidence: 0.9,
    });

    await harness.service.createUserEntry({ userId: USER_A, text: 'Helped once.' });
    expect(harness.patterns.rows).toHaveLength(0);

    await harness.service.createUserEntry({ userId: USER_A, text: 'Helped twice.' });
    await harness.service.createUserEntry({
      userId: USER_A,
      text: 'Helped a third time.',
    });

    const servicePattern = harness.patterns.rows.find(
      (row) => row.pattern_type === 'SERVICE_CONSISTENT',
    );
    expect(servicePattern).toBeDefined();
    expect(servicePattern?.evidence_count as number).toBeGreaterThanOrEqual(3);
  });

  it('describes patterns without moral language', async () => {
    const harness = buildHarness();
    harness.classifier.set({
      classification: KarmaClassification.CONSTRUCTIVE,
      category: KarmaCategory.REPAIR,
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
      expect(findNeutralityViolations(pattern.patternType.replace(/_/g, ' '))).toEqual(
        [],
      );
    }
  });
});
