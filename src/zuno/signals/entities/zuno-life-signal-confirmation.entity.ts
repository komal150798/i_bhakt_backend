import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoLifeSignal } from './zuno-life-signal.entity';
import { SignalConfirmationActor, SignalConfirmationStatus } from '../enums';

/**
 * One transition of a signal's confirmation state. Roadmap section 60
 * (candidate / user confirmation / rejection), Step 13 section 82.
 *
 * WHY HISTORY RATHER THAN A CURRENT VALUE
 *
 * `ZunoLifeSignal.confirmation_status` already holds the current state, and for
 * a while that looks sufficient. It is not, for two reasons the specification
 * is explicit about. Step 14 section 89 requires realignment to be able to
 * answer "did the user approve?" long after the fact, and Step 13 section 92
 * wants the clarification rate as a quality metric - both need the transitions,
 * not the endpoint. A user who rejects a candidate and later confirms it leaves
 * no trace at all in a single mutable column.
 *
 * Immutable: a confirmation is a record of something a person did.
 */
@Entity('zuno_life_signal_confirmations')
@Index('idx_zuno_life_signal_confirmations_signal', [
  'life_signal_id',
  'created_at',
])
export class ZunoLifeSignalConfirmation extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'life_signal_id' })
  life_signal_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 32, name: 'from_status' })
  from_status: SignalConfirmationStatus;

  @Column({ type: 'varchar', length: 32, name: 'to_status' })
  to_status: SignalConfirmationStatus;

  @Column({ type: 'varchar', length: 16, name: 'actor_type' })
  actor_type: SignalConfirmationActor;

  @Column({ type: 'uuid', name: 'actor_id', nullable: true })
  actor_id: string | null;

  /**
   * The question ZUNO asked, when it asked one. Step 13 section 82 shows the
   * shape: "has HR formally confirmed your role is ending, or are you still in
   * consultation?" Kept so the answer is interpretable later.
   */
  @Column({ type: 'text', name: 'prompt_text', nullable: true })
  prompt_text: string | null;

  /** Free-text correction the user supplied while rejecting or confirming. */
  @Column({ type: 'text', name: 'response_note', nullable: true })
  response_note: string | null;

  @ManyToOne(() => ZunoLifeSignal, (signal) => signal.confirmations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'life_signal_id' })
  signal?: ZunoLifeSignal;
}
