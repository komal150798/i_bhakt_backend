import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { MemoryEvidenceRole } from '../enums/memory.enum';
export declare class ZunoMemoryEvidence extends ZunoImmutableEntity {
    memory_id: string;
    source_entity_type: string;
    source_entity_id: string;
    evidence_role: MemoryEvidenceRole;
    observed_at: Date;
}
