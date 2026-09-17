import { DataSource, EntityManager, Repository } from 'typeorm';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { FixedClockService } from '../../common/services/clock.service';
import { SafetyService } from '../../safety/services/safety.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
type Row = Record<string, any>;
export declare class FakeRepository<T extends Row = Row> {
    private readonly defaults;
    readonly rows: Row[];
    constructor(defaults?: Row);
    create(input: Row): Row;
    findOne(options: {
        where?: Row;
        order?: Row;
    }): Promise<Row | null>;
    find(options?: {
        where?: Row;
        order?: Row;
        take?: number;
    }): Promise<Row[]>;
    count(options?: {
        where?: Row;
    }): Promise<number>;
    save(input: Row | Row[]): Promise<Row | Row[]>;
    update(criteria: Row, patch: Row): Promise<void>;
    private saveOne;
    asRepository(): Repository<any>;
}
export declare class FakeEntityManager {
    private readonly registry;
    constructor(registry: Map<unknown, FakeRepository<Row>>);
    private repo;
    create(entity: unknown, input: Row): Row;
    save(entity: unknown, input: Row | Row[]): Promise<Row | Row[]>;
    find(entity: unknown, options?: Row): Promise<Row[]>;
    findOne(entity: unknown, options?: Row): Promise<Row | null>;
    count(entity: unknown, options?: Row): Promise<number>;
    update(entity: unknown, criteria: Row, patch: Row): Promise<void>;
    asEntityManager(): EntityManager;
}
export declare function fakeDataSource(manager: FakeEntityManager): DataSource;
export declare function realSafety(): SafetyService;
export declare function realOutbox(): OutboxService;
export declare function realAudit(): ZunoAuditService;
export declare function realOwnership(): ZunoOwnershipService;
export declare function fixedClock(iso?: string): FixedClockService;
export declare function fakeRulebook(options?: {
    active?: {
        versionId: string;
        version: string;
    } | null;
    rules?: Row[];
    remedies?: Row[];
    throwUnavailable?: boolean;
}): RulebookRepositoryService;
export {};
