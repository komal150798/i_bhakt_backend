import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { FutureSelfMode } from '../enums/future-self.enum';
import { ZunoFutureSelfSource } from './zuno-future-self-source.entity';

/**
 * A generated Future Self narrative. Step 20 Data Model section 54,
 * Step 18 sections 36-37.
 *
 * Step 18 section 38 is the rule that shapes this table: every statement should
 * be traceable to stored facts, completed actions, user reflections or
 * confirmed Life Signals. That is why a narrative is never written without its
 * `zuno_future_self_sources` rows, in the same transaction - a narrative
 * without sources would look identical to one with them while being exactly the
 * thing the specification forbids.
 *
 * Not versioned with @VersionColumn: a narrative is a point-in-time synthesis,
 * not a mutable record. A later period produces a new row. `version` is kept as
 * a plain integer per Step 20 section 54 so a regeneration of the same period
 * can be numbered without implying the previous one was wrong.
 *
 * Step 24 section 43: these are private reflections and must not be surfaced in
 * sensitive detail through notifications.
 */
@Entity('zuno_future_self_narratives')
@Index('idx_zuno_fs_narratives_user_created', ['user_id', 'created_at'])
@Index('idx_zuno_fs_narratives_challenge_mode', ['challenge_id', 'mode'])
export class ZunoFutureSelfNarrative extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  @Column({ type: 'varchar', length: 24, name: 'mode' })
  mode: FutureSelfMode;

  @Column({ type: 'date', name: 'period_start', nullable: true })
  period_start: string | null;

  @Column({ type: 'date', name: 'period_end', nullable: true })
  period_end: string | null;

  /** The message the user reads. Step 21 section 62. */
  @Column({ type: 'text', name: 'summary' })
  summary: string;

  @Column({ type: 'jsonb', name: 'progress_themes', default: () => "'[]'::jsonb" })
  progress_themes: string[];

  @Column({ type: 'jsonb', name: 'open_loops', default: () => "'[]'::jsonb" })
  open_loops: string[];

  @Column({
    type: 'jsonb',
    name: 'strengths_observed',
    default: () => "'[]'::jsonb",
  })
  strengths_observed: string[];

  @Column({ type: 'jsonb', name: 'next_focus', default: () => "'[]'::jsonb" })
  next_focus: string[];

  /** Provenance. Build Rules 88-91. */
  @Column({
    type: 'varchar',
    length: 64,
    name: 'generation_model_version',
    nullable: true,
  })
  generation_model_version: string | null;

  @Column({ type: 'varchar', length: 64, name: 'engine_version' })
  engine_version: string;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'prompt_template_version',
    nullable: true,
  })
  prompt_template_version: string | null;

  @Column({ type: 'uuid', name: 'ai_generation_run_id', nullable: true })
  ai_generation_run_id: string | null;

  @Column({ type: 'uuid', name: 'safety_decision_id', nullable: true })
  safety_decision_id: string | null;

  /**
   * The version of the section 71 boundary this narrative was cleared against.
   *
   * Recorded so that tightening the boundary later makes it possible to find
   * everything cleared under the older, looser rule. A narrative that passed in
   * v1 is not automatically acceptable in v2, and without this column there
   * would be no way to tell which was which.
   */
  @Column({ type: 'varchar', length: 32, name: 'boundary_version' })
  boundary_version: string;

  @Column({ type: 'int', name: 'version', default: 1 })
  version: number;

  @Column({ type: 'timestamptz', name: 'redacted_at', nullable: true })
  redacted_at: Date | null;

  @ManyToOne(() => ZunoUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;

  @ManyToOne(() => ZunoChallenge, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge | null;

  @OneToMany(() => ZunoFutureSelfSource, (source) => source.narrative)
  sources?: ZunoFutureSelfSource[];
}
