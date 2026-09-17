import { randomUUID } from 'crypto';
import { DataSource, EntityManager, FindOperator, Repository } from 'typeorm';
import { RequestContextService } from '../../common/services/request-context.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { FixedClockService } from '../../common/services/clock.service';
import { SafetyService } from '../../safety/services/safety.service';
import { SafetySignalDetector } from '../../safety/services/safety-signal-detector';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';

/**
 * In-memory test harness for the MKA and Plan engines.
 *
 * WHY THIS EXISTS RATHER THAN A NEST TESTING MODULE.
 * `safety.service.spec.ts` sets the pattern these engines follow: construct the
 * service directly with its real collaborators and fake only the edges. That
 * keeps the tests fast and, more importantly, keeps the *rules* under test -
 * capacity, the action lifecycle, ownership, rulebook fallback - running
 * against the real `ZunoOwnershipService` and the real `SafetyService` rather
 * than against mocks that would happily agree with whatever the code does.
 *
 * Only the database is faked. `FakeRepository` implements the narrow slice of
 * the TypeORM surface these services actually use, including the `In()` and
 * `IsNull()` operators, so a query that would not work against Postgres does
 * not quietly pass here.
 */

type Row = Record<string, any>;

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, expected]) => {
    const actual = row[key];
    if (expected instanceof FindOperator) {
      switch (expected.type) {
        case 'isNull':
          return actual === null || actual === undefined;
        case 'in':
          return (expected.value as unknown[]).includes(actual);
        case 'not': {
          const inner = expected.child;
          if (inner && inner.type === 'isNull') {
            return actual !== null && actual !== undefined;
          }
          return actual !== expected.value;
        }
        default:
          throw new Error(
            `FakeRepository does not implement the "${expected.type}" operator.`,
          );
      }
    }
    return actual === expected;
  });
}

function applyOrder(rows: Row[], order?: Row): Row[] {
  if (!order) return rows;
  const entries = Object.entries(order);
  return [...rows].sort((a, b) => {
    for (const [key, direction] of entries) {
      const dir = String(direction).toUpperCase() === 'DESC' ? -1 : 1;
      const av = a[key];
      const bv = b[key];
      if (av === bv) continue;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (av > bv ? 1 : -1) * dir;
    }
    return 0;
  });
}

export class FakeRepository<T extends Row = Row> {
  readonly rows: Row[] = [];

  constructor(private readonly defaults: Row = {}) {}

  create(input: Row): Row {
    return { ...this.defaults, ...input };
  }

  async findOne(options: { where?: Row; order?: Row }): Promise<Row | null> {
    const found = applyOrder(
      this.rows.filter((row) => matches(row, options.where ?? {})),
      options.order,
    );
    return found[0] ?? null;
  }

  async find(
    options: { where?: Row; order?: Row; take?: number } = {},
  ): Promise<Row[]> {
    const found = applyOrder(
      this.rows.filter((row) => matches(row, options.where ?? {})),
      options.order,
    );
    return options.take ? found.slice(0, options.take) : found;
  }

  async count(options: { where?: Row } = {}): Promise<number> {
    return this.rows.filter((row) => matches(row, options.where ?? {})).length;
  }

  async save(input: Row | Row[]): Promise<Row | Row[]> {
    if (Array.isArray(input)) return input.map((one) => this.saveOne(one));
    return this.saveOne(input);
  }

  async update(criteria: Row, patch: Row): Promise<void> {
    for (const row of this.rows) {
      if (matches(row, criteria)) Object.assign(row, patch);
    }
  }

  private saveOne(input: Row): Row {
    const existingIndex = input.id
      ? this.rows.findIndex((row) => row.id === input.id)
      : -1;

    if (existingIndex >= 0) {
      Object.assign(this.rows[existingIndex], input);
      // TypeORM increments the @VersionColumn on every save of a managed
      // entity; the optimistic-lock behaviour depends on that happening.
      if (typeof this.rows[existingIndex].version === 'number') {
        this.rows[existingIndex].version += 1;
      }
      return this.rows[existingIndex];
    }

    const row: Row = {
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      version: 1,
      ...input,
      id: input.id ?? randomUUID(),
    };
    this.rows.push(row);
    return row;
  }

  /** Cast for injection into a service that expects a real TypeORM repository. */
  asRepository(): Repository<any> {
    return this as unknown as Repository<any>;
  }
}

/**
 * An EntityManager backed by the same FakeRepositories the service reads
 * through, so a write inside a transaction is visible to a later read.
 */
export class FakeEntityManager {
  constructor(private readonly registry: Map<unknown, FakeRepository<Row>>) {}

  private repo(entity: unknown): FakeRepository<Row> {
    const found = this.registry.get(entity);
    if (!found) {
      // A missing registration is a test bug that would otherwise silently
      // swallow writes, so it fails loudly.
      const name = (entity as { name?: string })?.name ?? String(entity);
      throw new Error(`FakeEntityManager has no repository registered for ${name}`);
    }
    return found;
  }

  create(entity: unknown, input: Row): Row {
    return this.repo(entity).create(input);
  }

  async save(entity: unknown, input: Row | Row[]): Promise<Row | Row[]> {
    return this.repo(entity).save(input as Row);
  }

  async find(entity: unknown, options: Row = {}): Promise<Row[]> {
    return this.repo(entity).find(options);
  }

  async findOne(entity: unknown, options: Row = {}): Promise<Row | null> {
    return this.repo(entity).findOne(options);
  }

  async count(entity: unknown, options: Row = {}): Promise<number> {
    return this.repo(entity).count(options);
  }

  async update(entity: unknown, criteria: Row, patch: Row): Promise<void> {
    return this.repo(entity).update(criteria, patch);
  }

  asEntityManager(): EntityManager {
    return this as unknown as EntityManager;
  }
}

/** A DataSource whose `transaction` simply runs the callback. */
export function fakeDataSource(manager: FakeEntityManager): DataSource {
  return {
    transaction: async (work: (m: EntityManager) => Promise<unknown>) =>
      work(manager.asEntityManager()),
  } as unknown as DataSource;
}

/** Real safety service - these tests must exercise the real policy. */
export function realSafety(): SafetyService {
  return new SafetyService(new SafetySignalDetector());
}

export function realOutbox(): OutboxService {
  return new OutboxService(new RequestContextService());
}

export function realAudit(): ZunoAuditService {
  return new ZunoAuditService(new RequestContextService());
}

export function realOwnership(): ZunoOwnershipService {
  return new ZunoOwnershipService();
}

export function fixedClock(iso = '2026-09-17T09:00:00.000Z'): FixedClockService {
  return new FixedClockService(new Date(iso));
}

/**
 * A rulebook repository stub.
 *
 * `active: null` is the state of this deployment today - no rulebook has been
 * loaded - and is the case Step 15 section 51 and Golden Test 103 are about.
 * `throwUnavailable` reproduces the other half of the fail-closed contract:
 * `findRules` raising RULEBOOK_UNAVAILABLE mid-generation.
 */
export function fakeRulebook(
  options: {
    active?: { versionId: string; version: string } | null;
    rules?: Row[];
    remedies?: Row[];
    throwUnavailable?: boolean;
  } = {},
): RulebookRepositoryService {
  const active = options.active ?? null;
  return {
    async getActive() {
      return active
        ? { ...active, activatedAt: new Date(), hash: 'test-hash' }
        : null;
    },
    async requireActive() {
      if (!active) throw new Error('no active rulebook');
      return { ...active, activatedAt: new Date(), hash: 'test-hash' };
    },
    async isAstrologyAvailable() {
      return active !== null;
    },
    async findRules() {
      if (options.throwUnavailable) {
        const { ZunoException } = await import('../../common/errors/zuno.exception');
        const { ZunoErrorCode } = await import(
          '../../common/errors/error-codes.enum'
        );
        throw new ZunoException(ZunoErrorCode.RULEBOOK_UNAVAILABLE, {});
      }
      return options.rules ?? [];
    },
    async findRemedies() {
      return options.remedies ?? [];
    },
  } as unknown as RulebookRepositoryService;
}
