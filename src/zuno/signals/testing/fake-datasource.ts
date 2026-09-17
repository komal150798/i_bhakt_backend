import { randomUUID } from 'crypto';
import { FindOperator } from 'typeorm';

/**
 * A transaction-accurate in-memory stand-in for DataSource and EntityManager.
 *
 * WHY THIS EXISTS RATHER THAN `jest.fn()` MOCKS
 *
 * The Phase 9 requirement that actually needs proving is atomicity: Roadmap
 * section 63 says a user must not end up with contradictory current plans, and
 * Step 14 section 88 says a realignment is all-or-nothing. A hand-rolled mock
 * whose `transaction` is `async (cb) => cb(manager)` cannot test that at all -
 * it commits every write the moment it happens, so a mid-operation failure
 * looks identical whether the code is transactional or not, and the test would
 * pass against an implementation with no transaction in it.
 *
 * So this harness models the one behaviour that matters. Writes made through a
 * transaction's EntityManager are *staged*, not stored. They become visible to
 * the outside world only when the transaction callback returns normally. If it
 * throws, the staged writes are discarded and the store is exactly as it was.
 *
 * The second half of the proof is `FakeRepository.save`, which throws. Injected
 * repositories open their own connection in real TypeORM and would escape the
 * enclosing transaction, so any write that goes through one instead of the
 * manager is a bug - and here it fails loudly rather than quietly succeeding.
 *
 * Reads inside a transaction see staged writes, as they would in Postgres.
 */

type EntityClass<T = any> = new (...args: any[]) => T;

interface StoredRow {
  id: string;
  [key: string]: unknown;
}

export class FakeStore {
  private readonly tables = new Map<string, Map<string, StoredRow>>();

  table(entity: EntityClass): Map<string, StoredRow> {
    const key = entity.name;
    if (!this.tables.has(key)) this.tables.set(key, new Map());
    return this.tables.get(key)!;
  }

  /** Every committed row of one kind. Test assertions read this. */
  rows<T>(entity: EntityClass<T>): T[] {
    return Array.from(this.table(entity).values()) as unknown as T[];
  }

  count(entity: EntityClass): number {
    return this.table(entity).size;
  }

  /** Seed committed state, bypassing the transaction machinery. */
  seed<T extends object>(entity: EntityClass<T>, row: T): T {
    const stored = row as unknown as StoredRow;
    if (!stored.id) stored.id = randomUUID();
    this.table(entity).set(stored.id, stored);
    return row;
  }
}

interface StagedWrite {
  entity: EntityClass;
  row: StoredRow;
}

export class FakeEntityManager {
  /** Writes not yet committed. Discarded wholesale if the callback throws. */
  readonly staged: StagedWrite[] = [];

  constructor(private readonly store: FakeStore) {}

  create<T>(entity: EntityClass<T>, data: Partial<T>): T {
    return Object.assign(new entity(), data);
  }

  async save<T>(entity: EntityClass<T>, data: T | T[]): Promise<T | T[]> {
    const rows = Array.isArray(data) ? data : [data];
    for (const row of rows) {
      const stored = row as unknown as StoredRow;
      if (!stored.id) stored.id = randomUUID();
      if (!stored.created_at) stored.created_at = new Date();
      stored.updated_at = new Date();
      if (stored.version === undefined) stored.version = 1;
      this.staged.push({ entity, row: stored });
    }
    return data;
  }

  async find<T>(entity: EntityClass<T>, options?: FindOptions): Promise<T[]> {
    return queryRows(this.visible(entity), options) as unknown as T[];
  }

  async findOne<T>(
    entity: EntityClass<T>,
    options?: FindOptions,
  ): Promise<T | null> {
    const rows = queryRows(this.visible(entity), options);
    return (rows[0] as unknown as T) ?? null;
  }

  async delete<T>(entity: EntityClass<T>, criteria: Record<string, unknown>): Promise<void> {
    for (const row of this.visible(entity)) {
      if (matchesWhere(row, criteria)) this.store.table(entity).delete(row.id);
    }
  }

  /** Committed rows plus this transaction's own staged writes. */
  private visible(entity: EntityClass): StoredRow[] {
    const committed = new Map(this.store.table(entity));
    for (const write of this.staged) {
      if (write.entity.name === entity.name) committed.set(write.row.id, write.row);
    }
    return Array.from(committed.values());
  }

  commit(): void {
    for (const write of this.staged) {
      this.store.table(write.entity).set(write.row.id, write.row);
    }
    this.staged.length = 0;
  }
}

/**
 * Read-only repository double.
 *
 * `save` throws on purpose. See the file header: a write through an injected
 * repository escapes the enclosing transaction in real TypeORM, so the harness
 * refuses it rather than letting a non-atomic implementation pass the test.
 */
export class FakeRepository<T> {
  constructor(
    private readonly store: FakeStore,
    private readonly entity: EntityClass<T>,
  ) {}

  async find(options?: FindOptions): Promise<T[]> {
    return queryRows(this.store.rows(this.entity) as StoredRow[], options) as unknown as T[];
  }

  async findOne(options?: FindOptions): Promise<T | null> {
    const rows = queryRows(
      this.store.rows(this.entity) as StoredRow[],
      options,
    );
    return (rows[0] as unknown as T) ?? null;
  }

  async save(): Promise<never> {
    throw new Error(
      `FakeRepository.save called for ${this.entity.name}: this write would escape the enclosing transaction. Use the transaction's EntityManager.`,
    );
  }
}

export class FakeDataSource {
  readonly store = new FakeStore();
  /** Number of transactions opened, so a test can assert "exactly one". */
  transactionCount = 0;

  transaction = async <T>(
    work: (manager: FakeEntityManager) => Promise<T>,
  ): Promise<T> => {
    this.transactionCount += 1;
    const manager = new FakeEntityManager(this.store);
    // No try/catch: a throw propagates and `commit()` is never reached, so
    // every staged write is discarded. That IS the rollback.
    const result = await work(manager);
    manager.commit();
    return result;
  };

  getRepository<T>(entity: EntityClass<T>): FakeRepository<T> {
    return new FakeRepository(this.store, entity);
  }

  repositoryFor<T>(entity: EntityClass<T>): FakeRepository<T> {
    return new FakeRepository(this.store, entity);
  }
}

// ------------------------------------------------------------------ querying

interface FindOptions {
  where?: Record<string, unknown> | Record<string, unknown>[];
  order?: Record<string, 'ASC' | 'DESC'>;
  take?: number;
  lock?: unknown;
}

function queryRows(rows: StoredRow[], options?: FindOptions): StoredRow[] {
  let result = rows;
  if (options?.where) {
    const clauses = Array.isArray(options.where) ? options.where : [options.where];
    result = result.filter((row) =>
      clauses.some((clause) => matchesWhere(row, clause)),
    );
  }
  if (options?.order) {
    const [field, direction] = Object.entries(options.order)[0];
    result = [...result].sort((a, b) => {
      const left = sortable(a[field]);
      const right = sortable(b[field]);
      if (left === right) return 0;
      const cmp = left < right ? -1 : 1;
      return direction === 'DESC' ? -cmp : cmp;
    });
  }
  if (options?.take !== undefined) result = result.slice(0, options.take);
  return result;
}

function sortable(value: unknown): number | string {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' || typeof value === 'string') return value;
  return '';
}

function matchesWhere(
  row: StoredRow,
  where: Record<string, unknown>,
): boolean {
  return Object.entries(where).every(([field, condition]) =>
    matchesValue(row[field], condition),
  );
}

/**
 * Supports the FindOperators this module actually uses: In, Not, IsNull and
 * LessThan. Anything else falls through to strict equality, which fails loudly
 * in a test rather than matching everything.
 */
function matchesValue(value: unknown, condition: unknown): boolean {
  if (condition instanceof FindOperator) {
    const operator = condition as FindOperator<unknown>;
    switch (operator.type) {
      case 'in':
        return (operator.value as unknown[]).includes(value as never);
      case 'not':
        return !matchesValue(value, operator.child ?? operator.value);
      case 'isNull':
        return value === null || value === undefined;
      case 'lessThan':
        return compare(value, operator.value) < 0;
      case 'moreThan':
        return compare(value, operator.value) > 0;
      default:
        throw new Error(`FakeDataSource: unsupported operator ${operator.type}`);
    }
  }
  if (condition === undefined) return true;
  return value === condition;
}

function compare(left: unknown, right: unknown): number {
  const a = left instanceof Date ? left.getTime() : Number(left);
  const b = right instanceof Date ? right.getTime() : Number(right);
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
