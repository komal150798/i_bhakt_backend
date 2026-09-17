type EntityClass<T = any> = new (...args: any[]) => T;
interface StoredRow {
    id: string;
    [key: string]: unknown;
}
export declare class FakeStore {
    private readonly tables;
    table(entity: EntityClass): Map<string, StoredRow>;
    rows<T>(entity: EntityClass<T>): T[];
    count(entity: EntityClass): number;
    seed<T extends object>(entity: EntityClass<T>, row: T): T;
}
interface StagedWrite {
    entity: EntityClass;
    row: StoredRow;
}
export declare class FakeEntityManager {
    private readonly store;
    readonly staged: StagedWrite[];
    constructor(store: FakeStore);
    create<T>(entity: EntityClass<T>, data: Partial<T>): T;
    save<T>(entity: EntityClass<T>, data: T | T[]): Promise<T | T[]>;
    find<T>(entity: EntityClass<T>, options?: FindOptions): Promise<T[]>;
    findOne<T>(entity: EntityClass<T>, options?: FindOptions): Promise<T | null>;
    delete<T>(entity: EntityClass<T>, criteria: Record<string, unknown>): Promise<void>;
    private visible;
    commit(): void;
}
export declare class FakeRepository<T> {
    private readonly store;
    private readonly entity;
    constructor(store: FakeStore, entity: EntityClass<T>);
    find(options?: FindOptions): Promise<T[]>;
    findOne(options?: FindOptions): Promise<T | null>;
    save(): Promise<never>;
}
export declare class FakeDataSource {
    readonly store: FakeStore;
    transactionCount: number;
    transaction: <T>(work: (manager: FakeEntityManager) => Promise<T>) => Promise<T>;
    getRepository<T>(entity: EntityClass<T>): FakeRepository<T>;
    repositoryFor<T>(entity: EntityClass<T>): FakeRepository<T>;
}
interface FindOptions {
    where?: Record<string, unknown> | Record<string, unknown>[];
    order?: Record<string, 'ASC' | 'DESC'>;
    take?: number;
    lock?: unknown;
}
export {};
