import { Column, Entity, Index } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';

/**
 * Immutable audit record for sensitive state changes.
 * Step 20 Data Model section 79.
 *
 * Separate from the existing iBhakt `audit_logs` table because that one stores
 * `old_values`/`new_values` as raw text. Step 20 section 79 explicitly says to
 * "avoid unnecessary raw sensitive values", so this records *hashes* of the
 * before and after states instead: enough to prove that something changed and
 * to detect tampering, without copying a user's private challenge or birth data
 * into a second table with a longer retention period.
 *
 * Step 20 section 100/132: audit retains only what is legally or permissibly
 * necessary after a privacy deletion, which is why `redacted_at` exists on the
 * immutable base rather than a destructive delete.
 */
@Entity('zuno_audit_events')
@Index('idx_zuno_audit_entity', ['entity_type', 'entity_id'])
@Index('idx_zuno_audit_user', ['user_id', 'created_at'])
export class ZunoAuditEvent extends ZunoImmutableEntity {
  /** USER, ADMIN, SYSTEM or SERVICE. */
  @Column({ type: 'varchar', length: 16, name: 'actor_type' })
  actor_type: string;

  @Column({ type: 'uuid', name: 'actor_id', nullable: true })
  actor_id: string | null;

  /** Subject of the change, when it concerns a specific user's data. */
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  user_id: string | null;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ type: 'varchar', length: 64, name: 'entity_type' })
  entity_type: string;

  @Column({ type: 'uuid', name: 'entity_id', nullable: true })
  entity_id: string | null;

  @Column({ type: 'varchar', length: 64, name: 'before_hash', nullable: true })
  before_hash: string | null;

  @Column({ type: 'varchar', length: 64, name: 'after_hash', nullable: true })
  after_hash: string | null;

  /** Non-sensitive context only: request id, status transition, reason code. */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
