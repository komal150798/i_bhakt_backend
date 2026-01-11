import { Repository } from 'typeorm';
import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
import { IKarmaRepository, CreateKarmaEntryInput, UpdateKarmaEntryInput } from '../../core/interfaces/repositories/karma-repository.interface';
export declare class KarmaRepository implements IKarmaRepository {
    private readonly karmaRepository;
    constructor(karmaRepository: Repository<KarmaEntry>);
    findById(id: number): Promise<KarmaEntry | null>;
    findByUniqueId(uniqueId: string): Promise<KarmaEntry | null>;
    private buildWhereClause;
    findByUserId(userId: number, options?: {
        karma_type?: string;
    }): Promise<KarmaEntry[]>;
    findByUserIdAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<KarmaEntry[]>;
    findAll(options?: {
        karma_type?: string;
        is_deleted?: boolean;
    }): Promise<KarmaEntry[]>;
    create(data: CreateKarmaEntryInput): Promise<KarmaEntry>;
    update(karmaEntry: KarmaEntry, data: UpdateKarmaEntryInput): Promise<KarmaEntry>;
    delete(karmaEntry: KarmaEntry): Promise<void>;
}
