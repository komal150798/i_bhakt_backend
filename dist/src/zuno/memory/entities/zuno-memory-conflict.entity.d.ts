import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { MemoryConflictResolution } from '../enums/memory.enum';
export declare class ZunoMemoryConflict extends ZunoBaseEntity {
    user_id: string;
    memory_a_id: string;
    memory_b_id: string;
    resolution_status: MemoryConflictResolution;
    resolved_memory_id: string | null;
    authority_a: number | null;
    authority_b: number | null;
    resolved_at: Date | null;
    user?: ZunoUser;
}
