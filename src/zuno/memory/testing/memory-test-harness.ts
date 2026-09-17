import { FindOperator } from 'typeorm';
import { randomUUID } from 'crypto';

/**
 * A small in-memory stand-in for TypeORM's Repository and EntityManager.
 *
 * Why this exists rather than a `jest.fn()` per call: the memory lifecycle is
 * about *state* - a memory that was superseded, a candidate that was accepted,
 * a row whose status changed - and assertions like "the deleted memory is not
 * returned by retrieval" are meaningless against a mock that returns whatever
 * the test told it to. The tests need a store that actually forgets things.
 *
 * It implements only the surface MemoryService uses, and deliberately no more.
 * Where it cannot faithfully reproduce PostgreSQL behaviour it does the
 * stricter thing, so a test cannot pass here and fail against the database.
 *
 * Not exported from any barrel and not referenced by production code.
 */
export class InMemoryStore {
  private readonly tables = new Map<string, Record<string, unknown>[]>();

  rows(entityName: string): Record<string, unknown>[] {
    if (!this.tables.has(entityName)) this.tables.set(entityName, []);
    return this.tables.get(entityName);
  }

  seed(entityName: string, rows: Record<string, unknown>[]): void {
    this.tables.set(entityName, rows);
  }

  clear(): void {
    this.tables.clear();
  }
}

type EntityTarget = { name: string } | string;

function nameOf(target: EntityTarget): string {
  return typeof target === 'string' ? target : target.name;
}

/** Matches one row against a TypeORM-style `where`, including an OR array. */
function matches(row: Record<string, unknown>, where: unknown): boolean {
  if (where === undefined || where === null) return true;
  if (Array.isArray(where)) {
    return where.some((clause) => matches(row, clause));
  }
  const clause = where as Record<string, unknown>;
  return Object.entries(clause).every(([key, expected]) => {
    const actual = row[key];
    if (expected instanceof FindOperator) {
      return matchOperator(actual, expected);
    }
    if (expected instanceof Date && actual instanceof Date) {
      return expected.getTime() === actual.getTime();
    }
    return actual === expected;
  });
}

function matchOperator(actual: unknown, operator: FindOperator<unknown>): boolean {
  const type = (operator as unknown as { type: string }).type;
  const value = operator.value as unknown;

  switch (type) {
    case 'isNull':
      return actual === null || actual === undefined;
    case 'not': {
      const inner = value as unknown;
      if (inner instanceof FindOperator) return !matchOperator(actual, inner);
      return actual !== inner;
    }
    case 'in':
      return Array.isArray(value) && (value as unknown[]).includes(actual);
    case 'lessThanOrEqual':
      return toTime(actual) <= toTime(value);
    case 'lessThan':
      return toTime(actual) < toTime(value);
    case 'moreThanOrEqual':
      return toTime(actual) >= toTime(value);
    case 'moreThan':
      return toTime(actual) > toTime(value);
    default:
      throw new Error(`InMemoryStore does not implement FindOperator "${type}"`);
  }
}

function toTime(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return new Date(value).getTime();
  return Number.NaN;
}

function applyOrder(
  rows: Record<string, unknown>[],
  order: Record<string, 'ASC' | 'DESC'> | undefined,
): Record<string, unknown>[] {
  if (!order) return rows;
  const entries = Object.entries(order);
  return [...rows].sort((a, b) => {
    for (const [key, direction] of entries) {
      const left = a[key];
      const right = b[key];
      if (left === right) continue;
      // NULLs sort last in both directions, which is the conservative choice:
      // a test must not come to depend on a null happening to sort first.
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;
      const cmp = toComparable(left) < toComparable(right) ? -1 : 1;
      return direction === 'DESC' ? -cmp : cmp;
    }
    return 0;
  });
}

function toComparable(value: unknown): number | string {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return String(value);
}

interface FindOptions {
  where?: unknown;
  order?: Record<string, 'ASC' | 'DESC'>;
  take?: number;
  select?: string[];
}

/** Repository surface: `find({ where })`, one argument. */
export class FakeRepository<T> {
  constructor(
    private readonly store: InMemoryStore,
    private readonly entityName: string,
  ) {}

  create(entity: Partial<T>): T {
    return { ...(entity as object) } as T;
  }

  async save(entity: T | T[]): Promise<T | T[]> {
    if (Array.isArray(entity)) {
      const saved: T[] = [];
      for (const one of entity) saved.push((await this.save(one)) as T);
      return saved;
    }
    return persist(this.store, this.entityName, entity as Record<string, unknown>) as T;
  }

  async find(options: FindOptions = {}): Promise<T[]> {
    const rows = this.store
      .rows(this.entityName)
      .filter((row) => matches(row, options.where));
    const ordered = applyOrder(rows, options.order);
    return (options.take ? ordered.slice(0, options.take) : ordered) as T[];
  }

  async findOne(options: FindOptions = {}): Promise<T | null> {
    const found = await this.find({ ...options, take: 1 });
    return found.length > 0 ? found[0] : null;
  }

  async count(options: FindOptions = {}): Promise<number> {
    return (await this.find(options)).length;
  }
}

/** EntityManager surface: `find(Entity, { where })`, two arguments. */
export class FakeEntityManager {
  constructor(private readonly store: InMemoryStore) {}

  create<T>(target: EntityTarget, entity: Partial<T>): T {
    return { ...(entity as object) } as T;
  }

  async save<T>(target: EntityTarget, entity: T | T[]): Promise<T | T[]> {
    const name = nameOf(target);
    if (Array.isArray(entity)) {
      const saved: T[] = [];
      for (const one of entity) {
        saved.push(
          persist(this.store, name, one as Record<string, unknown>) as T,
        );
      }
      return saved;
    }
    return persist(this.store, name, entity as Record<string, unknown>) as T;
  }

  async find<T>(target: EntityTarget, options: FindOptions = {}): Promise<T[]> {
    const rows = this.store
      .rows(nameOf(target))
      .filter((row) => matches(row, options.where));
    return applyOrder(rows, options.order) as T[];
  }

  async findOne<T>(
    target: EntityTarget,
    options: FindOptions = {},
  ): Promise<T | null> {
    const found = await this.find<T>(target, options);
    return found.length > 0 ? found[0] : null;
  }

  async delete(target: EntityTarget, criteria: unknown): Promise<void> {
    const rows = this.store.rows(nameOf(target));
    const remaining = rows.filter((row) => !matches(row, criteria));
    this.store.seed(nameOf(target), remaining);
  }
}

/**
 * Upsert by identity.
 *
 * TypeORM's `save` mutates the passed entity and returns it, and MemoryService
 * relies on that - it reads `saved.id` straight after saving. The same object
 * reference is kept in the store so a later mutate-then-save behaves as it does
 * against the real repository.
 */
function persist(
  store: InMemoryStore,
  entityName: string,
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const rows = store.rows(entityName);
  const now = new Date();

  if (!entity.id) entity.id = randomUUID();
  if (!entity.created_at) entity.created_at = now;
  entity.updated_at = now;
  if (entity.version === undefined) entity.version = 1;
  if (entity.deleted_at === undefined) entity.deleted_at = null;

  const index = rows.findIndex((row) => row.id === entity.id);
  if (index >= 0) {
    rows[index] = entity;
  } else {
    rows.push(entity);
  }
  return entity;
}

/** A DataSource whose `transaction` simply runs the callback. */
export function fakeDataSource(store: InMemoryStore): {
  transaction: <T>(runner: (manager: FakeEntityManager) => Promise<T>) => Promise<T>;
} {
  const manager = new FakeEntityManager(store);
  return {
    transaction: async <T>(
      runner: (m: FakeEntityManager) => Promise<T>,
    ): Promise<T> => runner(manager),
  };
}

/** Outbox double that records what was enqueued so tests can assert events. */
export class RecordingOutbox {
  readonly events: { eventType: string; aggregateId: string }[] = [];

  async enqueue(
    _manager: unknown,
    event: { eventType: string; aggregateId: string },
  ): Promise<void> {
    this.events.push({
      eventType: String(event.eventType),
      aggregateId: event.aggregateId,
    });
  }

  async enqueueMany(
    manager: unknown,
    events: { eventType: string; aggregateId: string }[],
  ): Promise<void> {
    for (const event of events) await this.enqueue(manager, event);
  }

  types(): string[] {
    return this.events.map((event) => event.eventType);
  }
}

/** Audit double. Records actions only - the real one hashes payloads. */
export class RecordingAudit {
  readonly actions: string[] = [];

  async record(_manager: unknown, input: { action: string }): Promise<void> {
    this.actions.push(input.action);
  }
}
