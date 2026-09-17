import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoWhatIfAssumption } from './zuno-what-if-assumption.entity';
import { WhatIfSessionStatus } from '../enums/scenario.enum';
import { WhatIfResultPayload } from './scenario.types';

/**
 * An isolated hypothetical exploration. Step 20 Data Model section 29,
 * Step 12 sections 38-44.
 *
 * THE POINT OF THIS TABLE IS ISOLATION.
 *
 * Step 20 Rule 4: "Hypothetical scenarios must remain isolated from confirmed
 * facts." Step 12 section 39 lists what a What-If must not do: alter the
 * current Plan, alter active priorities, change WhatNow state, trigger a Life
 * Signal, change the Operating Mode, persist as reality, or trigger
 * notifications. Step 29 Build Rule 42 says the same in one line, and Step 12
 * section 102 names silent state change as the anti-pattern.
 *
 * Three things enforce that here rather than leaving it to good intentions:
 *
 *   1. This is a separate table. Nothing in the challenge, context, scenario or
 *      plan tables is written by the What-If path. WhatIfService holds no
 *      repository that could write one.
 *   2. `is_hypothetical` exists and is constrained to `true` by
 *      chk_zuno_what_if_sessions_hypothetical in the migration. A row that
 *      claims to be factual cannot be inserted at all.
 *   3. `expires_at` means a stale exploration ages out rather than quietly
 *      becoming part of the user's record (Step 20 section 29).
 *
 * Step 12 section 62 additionally forbids saving every hypothetical as memory.
 * This entity is the reason that is easy: memory candidates are drawn from the
 * challenge tables, and nothing here is in them.
 */
@Entity('zuno_what_if_sessions')
@Index('idx_zuno_what_if_sessions_challenge', ['challenge_id', 'created_at'])
@Index('idx_zuno_what_if_sessions_user_status', ['user_id', 'status'])
export class ZunoWhatIfSession extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id' })
  challenge_id: string;

  /** The user's own question, verbatim. Step 21 section 39. */
  @Column({ type: 'text' })
  prompt: string;

  @Column({
    type: 'varchar',
    length: 24,
    default: WhatIfSessionStatus.ACTIVE,
  })
  status: WhatIfSessionStatus;

  /**
   * Always true. Never a variable, never set from a request body.
   *
   * It is a column rather than an implicit property of the table because
   * Step 12 section 42's contract puts `"hypothetical": true` on the wire, and
   * because a CHECK constraint is a stronger statement than a comment.
   */
  @Column({ type: 'boolean', name: 'is_hypothetical', default: true })
  is_hypothetical: boolean;

  /**
   * Step 12 section 42. The isolated analysis.
   * Null while the exploration is still being produced.
   */
  @Column({ type: 'jsonb', nullable: true })
  result: WhatIfResultPayload | null;

  /**
   * Step 12 section 41: "NO ACTIVE STATE CHANGE". Persisted as data rather than
   * asserted only in prose, so an API consumer, a test and an auditor all read
   * the same claim from the same place.
   */
  @Column({ type: 'boolean', name: 'current_plan_changed', default: false })
  current_plan_changed: boolean;

  /** Which challenge context version this branched from. Step 12 section 41. */
  @Column({ type: 'int', name: 'challenge_context_version', nullable: true })
  challenge_context_version: number | null;

  @Column({ type: 'varchar', length: 64, name: 'engine_version' })
  engine_version: string;

  @Column({ type: 'uuid', name: 'safety_decision_id', nullable: true })
  safety_decision_id: string | null;

  @Column({ type: 'uuid', name: 'ai_generation_run_id', nullable: true })
  ai_generation_run_id: string | null;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expires_at: Date | null;

  @ManyToOne(() => ZunoUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;

  @ManyToOne(() => ZunoChallenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge;

  @OneToMany(() => ZunoWhatIfAssumption, (assumption) => assumption.session)
  assumptions?: ZunoWhatIfAssumption[];
}
