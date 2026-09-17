import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoLifeSignal } from './zuno-life-signal.entity';
import { SignalImpactEntityType, SignalImpactType } from '../enums';

/**
 * What a Life Signal asserts about something else.
 * Step 20 Data Model section 33 (`life_signal_impacts`).
 *
 * This is the evidence trail Step 14 section 24 depends on: a plan carries the
 * assumptions it rests on, and a signal that invalidates one of them has to say
 * so explicitly for the realignment to be explainable rather than a model's
 * opinion. `entity_id` is a bare uuid, not an FK, because the referents live in
 * the Plan, MKA and Scenario modules, which are being built separately - a
 * cross-module FK would couple the schema to their delivery order.
 */
@Entity('zuno_life_signal_impacts')
@Index('idx_zuno_life_signal_impacts_signal', ['life_signal_id'])
@Index('idx_zuno_life_signal_impacts_entity', ['entity_type', 'entity_id'])
export class ZunoLifeSignalImpact extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'life_signal_id' })
  life_signal_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 32, name: 'entity_type' })
  entity_type: SignalImpactEntityType;

  @Column({ type: 'uuid', name: 'entity_id', nullable: true })
  entity_id: string | null;

  /** Stable key when the target is not a row, e.g. an assumption statement. */
  @Column({ type: 'varchar', length: 128, name: 'entity_key', nullable: true })
  entity_key: string | null;

  @Column({ type: 'varchar', length: 24, name: 'impact_type' })
  impact_type: SignalImpactType;

  /**
   * How strongly, 0..1. Internal ranking only - Step 13 section 80 keeps the
   * numeric detail away from the user, who needs "this is a meaningful change",
   * not a score.
   */
  @Column({
    type: 'numeric',
    precision: 4,
    scale: 3,
    name: 'impact_score',
    nullable: true,
  })
  impact_score: string | null;

  @ManyToOne(() => ZunoLifeSignal, (signal) => signal.impacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'life_signal_id' })
  signal?: ZunoLifeSignal;
}
