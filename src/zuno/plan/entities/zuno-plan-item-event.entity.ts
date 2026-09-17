import { Column, Entity, Index } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import {
  PlanItemEventSource,
  PlanItemEventType,
  PlanItemStatus,
} from '../enums/plan.enum';

/**
 * Immutable history of meaningful plan-item state changes.
 * Step 20 Data Model section 43.
 *
 * Distinct from the transactional outbox. The outbox tells other services that
 * something happened; this table is the user's own progress history, and
 * Step 16 sections 49 and 92 require it to survive plan versioning, realignment
 * and audit. A relay that publishes and deletes an outbox row must not be able
 * to take the history with it.
 *
 * Extends ZunoImmutableEntity for the reason Step 20 section 43 gives - an
 * append-only trail. `reason` is where "what's blocking this?" (section 79) is
 * recorded, which is also what makes repeated deferral visible to the plan-fit
 * review in section 80.
 */
@Entity('zuno_plan_item_events')
@Index('idx_zuno_plan_item_events_item', ['plan_item_id', 'created_at'])
@Index('idx_zuno_plan_item_events_plan', ['plan_id', 'created_at'])
@Index('idx_zuno_plan_item_events_user', ['user_id', 'event_type'])
export class ZunoPlanItemEvent extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'plan_item_id' })
  plan_item_id: string;

  @Column({ type: 'uuid', name: 'plan_id' })
  plan_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 32, name: 'event_type' })
  event_type: PlanItemEventType;

  @Column({ type: 'varchar', length: 32, name: 'old_status', nullable: true })
  old_status: PlanItemStatus | null;

  @Column({ type: 'varchar', length: 32, name: 'new_status', nullable: true })
  new_status: PlanItemStatus | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 16, default: PlanItemEventSource.SYSTEM })
  source: PlanItemEventSource;
}
