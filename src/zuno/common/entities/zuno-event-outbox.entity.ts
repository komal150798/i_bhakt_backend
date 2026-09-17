import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { OutboxStatus, ZunoAggregateType, ZunoEventType } from '../enums';

/**
 * Transactional outbox. Step 20 Data Model sections 105-106.
 *
 * The problem it solves, in the spec's own example (section 106): marking a
 * Plan item DONE must reliably produce downstream events for Karma eligibility,
 * Life Signal evaluation, analytics and notifications. If the row is committed
 * but the event publish fails, those never happen and the system quietly
 * diverges. Writing the event into the *same transaction* as the state change
 * removes that gap.
 *
 * Build Rule 113: prefer ids over sensitive payloads. Payloads written here
 * carry entity references, not challenge text or birth data - a consumer
 * re-reads authorised state rather than trusting the queue.
 */
@Entity('zuno_event_outbox')
@Index('idx_zuno_outbox_dispatch', ['status', 'created_at'])
@Index('idx_zuno_outbox_aggregate', ['aggregate_type', 'aggregate_id'])
export class ZunoEventOutbox extends ZunoBaseEntity {
  @Column({ type: 'varchar', length: 32, name: 'aggregate_type' })
  aggregate_type: ZunoAggregateType;

  @Column({ type: 'uuid', name: 'aggregate_id' })
  aggregate_id: string;

  @Column({ type: 'varchar', length: 64, name: 'event_type' })
  event_type: ZunoEventType;

  /**
   * Event schema version. Build Rule 80: schema changes must be
   * version-compatible or explicitly migrated, so consumers can branch on this
   * instead of guessing from shape.
   */
  @Column({ type: 'varchar', length: 16, name: 'event_version', default: '1' })
  event_version: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 24, default: OutboxStatus.PENDING })
  status: OutboxStatus;

  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  published_at: Date | null;

  @Column({ type: 'int', name: 'retry_count', default: 0 })
  retry_count: number;

  @Column({ type: 'text', name: 'last_error', nullable: true })
  last_error: string | null;

  /** Correlation id of the request that produced the event (Step 21 s.15). */
  @Column({ type: 'varchar', length: 128, name: 'request_id', nullable: true })
  request_id: string | null;
}
