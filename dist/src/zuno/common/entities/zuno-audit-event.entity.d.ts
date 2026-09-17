import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
export declare class ZunoAuditEvent extends ZunoImmutableEntity {
    actor_type: string;
    actor_id: string | null;
    user_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    before_hash: string | null;
    after_hash: string | null;
    metadata: Record<string, unknown> | null;
}
