import { Column, Entity, Index } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { MkaCompletionSource, MkaCompletionStatus } from '../enums/mka.enum';

/**
 * One recorded occurrence of an MKA practice.
 * Step 20 Data Model section 38.
 *
 * Immutable by design. A completion is evidence of what the user reported on a
 * given day; editing it in place would let a later realignment rewrite personal
 * history, which Step 16 section 109 forbids and which the Karma Ledger
 * (Step 17) could not reconcile.
 *
 * The unique index on (item, date) is what makes a double-tap on "Mark Done"
 * idempotent rather than a second ledger-eligible event.
 *
 * NOTHING HERE IS PUNITIVE.
 * Step 20 section 38 states it directly: "missing a remedy must never create
 * negative Karma automatically". MISSED and NOT_DONE are recorded so the Plan
 * Engine can notice overload (Step 16 section 28) and offer simplification -
 * the only downstream use this module permits.
 */
@Entity('zuno_mka_completions')
@Index('idx_zuno_mka_completions_item', ['mka_item_id', 'completion_date'], {
  unique: true,
})
@Index('idx_zuno_mka_completions_user', ['user_id', 'completion_date'])
@Index('idx_zuno_mka_completions_program', ['mka_program_id', 'status'])
export class ZunoMkaCompletion extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'mka_item_id' })
  mka_item_id: string;

  @Column({ type: 'uuid', name: 'mka_program_id' })
  mka_program_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /** UTC calendar date. Step 20 section 6; the user's zone is applied at the edge. */
  @Column({ type: 'date', name: 'completion_date' })
  completion_date: string;

  @Column({ type: 'varchar', length: 32 })
  status: MkaCompletionStatus;

  /**
   * Optional self-report. Step 15 section 70 forbids demanding photos or proof
   * of prayer, donation or ritual - a note is the most ZUNO ever asks for, and
   * even that is optional.
   */
  @Column({ type: 'text', name: 'user_note', nullable: true })
  user_note: string | null;

  @Column({ type: 'varchar', length: 16, default: MkaCompletionSource.USER })
  source: MkaCompletionSource;

  /** Copied from the item at completion time so the Karma Ledger need not join. */
  @Column({ type: 'boolean', name: 'karma_eligible', default: false })
  karma_eligible: boolean;
}
