import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { OutboxStatus, ZunoAggregateType, ZunoEventType } from '../enums';
export declare class ZunoEventOutbox extends ZunoBaseEntity {
    aggregate_type: ZunoAggregateType;
    aggregate_id: string;
    event_type: ZunoEventType;
    event_version: string;
    payload: Record<string, unknown>;
    status: OutboxStatus;
    published_at: Date | null;
    retry_count: number;
    last_error: string | null;
    request_id: string | null;
}
