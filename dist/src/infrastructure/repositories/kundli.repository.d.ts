import { Repository } from 'typeorm';
import { Kundli } from '../../kundli/entities/kundli.entity';
import { IKundliRepository, CreateKundliInput, UpdateKundliInput } from '../../core/interfaces/repositories/kundli-repository.interface';
export declare class KundliRepository implements IKundliRepository {
    private readonly kundliRepository;
    constructor(kundliRepository: Repository<Kundli>);
    findById(id: number): Promise<Kundli | null>;
    findByUniqueId(uniqueId: string): Promise<Kundli | null>;
    findByUserId(userId: number, options?: {
        is_deleted?: boolean;
    }): Promise<Kundli[]>;
    findOneByUserId(userId: number, options?: {
        is_deleted?: boolean;
    }): Promise<Kundli | null>;
    create(data: CreateKundliInput): Promise<Kundli>;
    update(kundli: Kundli, data: UpdateKundliInput): Promise<Kundli>;
    delete(kundli: Kundli): Promise<void>;
}
