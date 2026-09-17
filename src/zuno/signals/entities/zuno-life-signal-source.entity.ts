import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoLifeSignal } from './zuno-life-signal.entity';
import {
  LifeSignalOrigin,
  LifeSignalReliability,
  LifeSignalSource,
} from '../enums';

/**
 * One piece of evidence behind a Life Signal. Step 13 sections 6 and 20.
 *
 * WHY THIS IS A SEPARATE TABLE RATHER THAN COLUMNS ON THE SIGNAL
 *
 * Step 13 section 20 requires deduplication: the user saying "My interview is
 * Friday" twice must produce one signal. But the second mention is still
 * evidence, and section 37 makes repetition meaningful in its own right
 * ("responsibilities reduced / excluded from meeting / project transferred").
 * Folding the extra mentions into the signal row would either lose them or
 * create the duplicate the spec forbids. A row per contributing source keeps
 * both: one signal, an honest count of what corroborates it.
 *
 * Immutable. Evidence is not edited after the fact; a correction arrives as a
 * new source row or a superseding signal (section 21).
 */
@Entity('zuno_life_signal_sources')
@Index('idx_zuno_life_signal_sources_signal', ['life_signal_id'])
@Index('idx_zuno_life_signal_sources_ref', ['source_event_id'])
export class ZunoLifeSignalSource extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'life_signal_id' })
  life_signal_id: string;

  /** Denormalised for ownership scoping without a join (Step 20 section 85). */
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 32 })
  source: LifeSignalSource;

  @Column({ type: 'varchar', length: 32 })
  origin: LifeSignalOrigin;

  @Column({ type: 'varchar', length: 24 })
  reliability: LifeSignalReliability;

  /**
   * Id of the thing that produced this evidence - a message, a plan item event,
   * a karma ledger entry. Step 13 section 88 lists it as an idempotency input.
   * Untyped uuid rather than an FK because the referent lives in modules that
   * are not built yet, and a dangling FK is worse than none.
   */
  @Column({ type: 'uuid', name: 'source_event_id', nullable: true })
  source_event_id: string | null;

  /** Human-readable pointer when the source is not a ZUNO row. */
  @Column({ type: 'varchar', length: 128, name: 'source_ref', nullable: true })
  source_ref: string | null;

  /**
   * Content fingerprint of this particular piece of evidence, so a retried
   * delivery of the same message does not count twice (section 88).
   */
  @Column({ type: 'varchar', length: 64 })
  fingerprint: string;

  /**
   * The evidence itself. Step 13 section 75 - stored once, here, rather than
   * replicated across analytics, logs and notifications.
   */
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'timestamptz', name: 'observed_at' })
  observed_at: Date;

  @ManyToOne(() => ZunoLifeSignal, (signal) => signal.sources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'life_signal_id' })
  signal?: ZunoLifeSignal;
}
