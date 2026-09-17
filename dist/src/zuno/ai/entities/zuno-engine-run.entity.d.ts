import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { EngineRunStatus, EngineType } from '../../common/enums';
export declare class ZunoEngineRun extends ZunoBaseEntity {
    user_id: string;
    challenge_id: string | null;
    engine_type: EngineType;
    status: EngineRunStatus;
    input_reference: Record<string, unknown>;
    output_reference: Record<string, unknown> | null;
    started_at: Date | null;
    completed_at: Date | null;
    error_code: string | null;
    progress: number;
}
