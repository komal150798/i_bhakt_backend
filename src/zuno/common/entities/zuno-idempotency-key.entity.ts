import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';

/**
 * Idempotency records. Step 20 Data Model section 107, Step 21 section 16.
 *
 * Required for retry-prone writes: challenge creation, Karma entries, plan
 * completion, subscription writes and Rulebook activation (Build Rule 27).
 *
 * The Golden Contract Test in Step 21 section 126 is the acceptance case - a
 * client retries a completion after a timeout with the same key and must get
 * one completion, one event and one eligible Karma action, not two.
 *
 * `request_hash` guards against a client reusing a key for a *different* body,
 * which would otherwise silently return the wrong cached result.
 */
@Entity('zuno_idempotency_keys')
@Index('idx_zuno_idempotency_unique', ['operation', 'idempotency_key'], {
  unique: true,
})
@Index('idx_zuno_idempotency_expiry', ['expires_at'])
export class ZunoIdempotencyKey extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  user_id: string | null;

  @Column({ type: 'varchar', length: 64 })
  operation: string;

  @Column({ type: 'varchar', length: 200, name: 'idempotency_key' })
  idempotency_key: string;

  @Column({ type: 'varchar', length: 64, name: 'request_hash' })
  request_hash: string;

  /** Reference to what the first call produced, replayed on retry. */
  @Column({ type: 'jsonb', name: 'response_reference', nullable: true })
  response_reference: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 24, default: 'IN_PROGRESS' })
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expires_at: Date;
}
