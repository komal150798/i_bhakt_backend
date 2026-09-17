import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoRealignment } from './zuno-realignment.entity';
import { AssumptionStatus } from '../enums';

/**
 * An assumption the previous direction rested on, and what became of it.
 * Step 14 sections 24-25.
 *
 * WHY THIS TABLE EARNS ITS PLACE
 *
 * Step 14 section 24 says assumption tracking is what "makes realignment
 * explainable and deterministic", and section 90 forbids exposing private model
 * reasoning as the explanation. Without a recorded assumption, the only
 * available answer to "why did my plan change?" is whatever the model says
 * now - which is a new opinion, not evidence. With it, the answer is concrete:
 * the plan assumed employment would continue, that stopped being true on this
 * date because of this signal, and these items depended on it.
 */
@Entity('zuno_realignment_assumptions')
@Index('idx_zuno_realignment_assumptions_realignment', ['realignment_id'])
@Index('idx_zuno_realignment_assumptions_status', ['status'])
export class ZunoRealignmentAssumption extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'realignment_id' })
  realignment_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /** Stable key, e.g. EMPLOYMENT_CONTINUES. */
  @Column({ type: 'varchar', length: 128, name: 'assumption_key' })
  assumption_key: string;

  /** The assumption in plain language, e.g. "Current employment continues". */
  @Column({ type: 'text' })
  statement: string;

  @Column({ type: 'varchar', length: 32 })
  source: string;

  @Column({ type: 'varchar', length: 16 })
  status: AssumptionStatus;

  /** The Life Signal that invalidated it, when one did. */
  @Column({ type: 'uuid', name: 'invalidated_by_signal_id', nullable: true })
  invalidated_by_signal_id: string | null;

  /** Ids of plan items, scenarios or programmes that depended on it. */
  @Column({
    type: 'jsonb',
    name: 'affected_components',
    default: () => "'[]'::jsonb",
  })
  affected_components: string[];

  @ManyToOne(() => ZunoRealignment, (realignment) => realignment.assumptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'realignment_id' })
  realignment?: ZunoRealignment;
}
