export declare class InMemoryStore {
    private readonly tables;
    rows(entityName: string): Record<string, unknown>[];
    seed(entityName: string, rows: Record<string, unknown>[]): void;
    clear(): void;
}
type EntityTarget = {
    name: string;
} | string;
interface FindOptions {
    where?: unknown;
    order?: Record<string, 'ASC' | 'DESC'>;
    take?: number;
    select?: string[];
}
export declare class FakeRepository<T> {
    private readonly store;
    private readonly entityName;
    constructor(store: InMemoryStore, entityName: string);
    create(entity: Partial<T>): T;
    save(entity: T | T[]): Promise<T | T[]>;
    find(options?: FindOptions): Promise<T[]>;
    findOne(options?: FindOptions): Promise<T | null>;
    count(options?: FindOptions): Promise<number>;
}
export declare class FakeEntityManager {
    private readonly store;
    constructor(store: InMemoryStore);
    create<T>(target: EntityTarget, entity: Partial<T>): T;
    save<T>(target: EntityTarget, entity: T | T[]): Promise<T | T[]>;
    find<T>(target: EntityTarget, options?: FindOptions): Promise<T[]>;
    findOne<T>(target: EntityTarget, options?: FindOptions): Promise<T | null>;
    delete(target: EntityTarget, criteria: unknown): Promise<void>;
}
export declare function fakeDataSource(store: InMemoryStore): {
    transaction: <T>(runner: (manager: FakeEntityManager) => Promise<T>) => Promise<T>;
};
export declare class RecordingOutbox {
    readonly events: {
        eventType: string;
        aggregateId: string;
    }[];
    enqueue(_manager: unknown, event: {
        eventType: string;
        aggregateId: string;
    }): Promise<void>;
    enqueueMany(manager: unknown, events: {
        eventType: string;
        aggregateId: string;
    }[]): Promise<void>;
    types(): string[];
}
export declare class RecordingAudit {
    readonly actions: string[];
    record(_manager: unknown, input: {
        action: string;
    }): Promise<void>;
}
export {};
