import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
export declare class ZunoIdempotencyKey extends ZunoBaseEntity {
    user_id: string | null;
    operation: string;
    idempotency_key: string;
    request_hash: string;
    response_reference: Record<string, unknown> | null;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    expires_at: Date;
}
