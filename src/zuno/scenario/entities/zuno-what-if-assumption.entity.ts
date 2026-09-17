import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoWhatIfSession } from './zuno-what-if-session.entity';
import { WhatIfAssumptionType } from '../enums/scenario.enum';

/**
 * One assumption held inside a What-If exploration.
 * Step 20 Data Model section 30, Step 12 section 41.
 *
 * Step 20 section 30 closes with the rule that governs this whole table:
 *   "Nothing in these tables should automatically become confirmed Challenge
 *    facts."
 *
 * `assumption_type` is how that stays checkable. A USER_STATED assumption is the
 * hypothetical the user asked about. A DERIVED_DEPENDENCY follows from a
 * dependency already recorded in the Challenge Context - Step 12 section 44
 * forbids speculative cascades that are not supported by a known dependency, so
 * a derived assumption carries the edge it came from. A CONTEXT_CARRIED
 * assumption is a real fact carried forward unchanged; it is marked as carried
 * precisely so that nothing downstream mistakes the hypothetical ones for it.
 */
@Entity('zuno_what_if_assumptions')
@Index('idx_zuno_what_if_assumptions_session', ['what_if_session_id'])
@Index('idx_zuno_what_if_assumptions_user', ['user_id'])
export class ZunoWhatIfAssumption extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'what_if_session_id' })
  what_if_session_id: string;

  /** Denormalised for ownership scoping without a join (Step 20 section 85). */
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'text', name: 'assumption_text' })
  assumption_text: string;

  @Column({ type: 'varchar', length: 32, name: 'assumption_type' })
  assumption_type: WhatIfAssumptionType;

  /**
   * Structured form of the assumption when there is one, e.g. the dependency
   * edge a DERIVED_DEPENDENCY followed. Step 20 section 30 types this as
   * nullable JSONB.
   */
  @Column({ type: 'jsonb', nullable: true })
  value: Record<string, unknown> | null;

  @ManyToOne(() => ZunoWhatIfSession, (session) => session.assumptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'what_if_session_id' })
  session?: ZunoWhatIfSession;
}
