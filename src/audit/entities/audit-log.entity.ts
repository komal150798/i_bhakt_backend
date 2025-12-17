import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('audit_logs')
@Index(['entity_type', 'entity_id', 'is_deleted'])
@Index(['user_id', 'action', 'added_date'])
export class AuditLog extends BaseEntity {
  @Column({ type: 'bigint', nullable: true, name: 'user_id' })
  user_id: number | null;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'entity_type' })
  entity_type: string | null;

  @Column({ type: 'bigint', nullable: true, name: 'entity_id' })
  entity_id: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'entity_unique_id' })
  entity_unique_id: string | null;

  @Column({ type: 'text', nullable: true, name: 'old_values' })
  old_values: string | null;

  @Column({ type: 'text', nullable: true, name: 'new_values' })
  new_values: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  user_agent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}

