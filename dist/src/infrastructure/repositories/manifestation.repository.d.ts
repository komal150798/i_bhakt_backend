import { Repository } from 'typeorm';
import { ManifestationLog } from '../../manifestation/entities/manifestation-log.entity';
import { IManifestationRepository, CreateManifestationLogInput, UpdateManifestationLogInput } from '../../core/interfaces/repositories/manifestation-repository.interface';
export declare class ManifestationRepository implements IManifestationRepository {
    private readonly manifestationRepository;
    constructor(manifestationRepository: Repository<ManifestationLog>);
    findById(id: number): Promise<ManifestationLog | null>;
    findByUniqueId(uniqueId: string): Promise<ManifestationLog | null>;
    findByUserId(userId: number): Promise<ManifestationLog[]>;
    findAll(options?: {
        is_deleted?: boolean;
    }): Promise<ManifestationLog[]>;
    create(data: CreateManifestationLogInput): Promise<ManifestationLog>;
    update(manifestationLog: ManifestationLog, data: UpdateManifestationLogInput): Promise<ManifestationLog>;
    delete(manifestationLog: ManifestationLog): Promise<void>;
}
