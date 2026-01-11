import { BaseEntity } from '../../common/entities/base.entity';
export declare class AuditLog extends BaseEntity {
    user_id: number | null;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    entity_unique_id: string | null;
    old_values: string | null;
    new_values: string | null;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, any> | null;
}
