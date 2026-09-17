import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { MemoryCandidateStatus, MemoryEvidenceType, MemoryFactuality, MemoryRejectionReason, MemoryRetentionClass, MemoryScope, MemorySensitivity, MemorySource, MemoryType } from '../enums/memory.enum';
import { MemoryValue } from './memory.types';
export declare class ZunoMemoryCandidate extends ZunoBaseEntity {
    user_id: string;
    challenge_id: string | null;
    scope: MemoryScope;
    memory_type: MemoryType;
    memory_key: string;
    proposed_value: MemoryValue | null;
    factuality: MemoryFactuality;
    source: MemorySource;
    source_event_id: string | null;
    evidence_type: MemoryEvidenceType;
    confidence: string;
    suggested_retention: MemoryRetentionClass;
    sensitivity_class: MemorySensitivity;
    status: MemoryCandidateStatus;
    confirmation_required: boolean;
    confirmation_reason: string | null;
    rejection_reason: MemoryRejectionReason | null;
    resulting_memory_id: string | null;
    decided_at: Date | null;
    user?: ZunoUser;
}
