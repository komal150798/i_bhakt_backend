import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import {
  MkaPeriodType,
  MkaProgramStatus,
  MkaRemedyStatus,
  MkaReviewTrigger,
} from '../enums/mka.enum';
import { ZunoMkaItem } from './zuno-mka-item.entity';

/**
 * A Mind-Karma-Action programme for one challenge over one time window.
 * Step 20 Data Model section 36, Step 15 sections 8 and 76.
 *
 * Table is `zuno_mka_programs`, matching the data model's `mka_programs` with
 * the project's mandatory `zuno_` prefix.
 *
 * Extends ZunoVersionedEntity because a Realignment and a user completion can
 * arrive concurrently (Step 16 section 89) and the later write must not silently
 * discard the earlier one.
 *
 * Two fields here exist purely so the programme can be explained years later
 * without guessing:
 *
 *   `remedy_status`  - Step 15 section 51. When no approved rule matched, the
 *                      programme records that fact. Without it, a reader cannot
 *                      distinguish "astrology said nothing applied" from
 *                      "astrology was unavailable", and the difference matters
 *                      for both audit and re-generation.
 *   `rulebook_version_id` - Step 15 section 77. A later Rulebook upload must
 *                      never silently rewrite historical MKA, which is only
 *                      enforceable if each programme pins the version it used.
 */
@Entity('zuno_mka_programs')
@Index('idx_zuno_mka_programs_user', ['user_id', 'status'])
@Index('idx_zuno_mka_programs_challenge', ['challenge_id', 'status'])
@Index('idx_zuno_mka_programs_period', ['user_id', 'start_date', 'end_date'])
@Index('idx_zuno_mka_programs_review', ['status', 'review_at'])
export class ZunoMkaProgram extends ZunoVersionedEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id' })
  challenge_id: string;

  /**
   * The Plan that scheduled this programme, once one exists.
   *
   * Nullable and set later: Step 15 section 25 makes the MKA Engine formulate
   * the practice and the Plan Engine schedule it, so a programme is valid
   * before any plan has been built from it.
   */
  @Column({ type: 'uuid', name: 'plan_id', nullable: true })
  plan_id: string | null;

  @Column({ type: 'varchar', length: 16, name: 'period_type' })
  period_type: MkaPeriodType;

  @Column({ type: 'date', name: 'start_date' })
  start_date: string;

  @Column({ type: 'date', name: 'end_date' })
  end_date: string;

  @Column({ type: 'varchar', length: 24, default: MkaProgramStatus.DRAFT })
  status: MkaProgramStatus;

  /** Step 15 section 77. Null when the programme used no astrology at all. */
  @Column({ type: 'uuid', name: 'rulebook_version_id', nullable: true })
  rulebook_version_id: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    name: 'remedy_status',
    default: MkaRemedyStatus.NO_APPROVED_RULE_AVAILABLE,
  })
  remedy_status: MkaRemedyStatus;

  /** Step 15 section 32: every programme has a review condition. */
  @Column({
    type: 'varchar',
    length: 32,
    name: 'review_trigger',
    default: MkaReviewTrigger.END_OF_PERIOD,
  })
  review_trigger: MkaReviewTrigger;

  @Column({ type: 'date', name: 'review_at', nullable: true })
  review_at: string | null;

  /**
   * Provenance block. Step 15 section 79.
   *
   * The challenge context version and response id are recorded so that
   * "why did you suggest this?" (section 80) can be answered from the exact
   * understanding that produced the programme, not from whatever the challenge
   * has drifted to since.
   */
  @Column({ type: 'int', name: 'context_version', default: 0 })
  context_version: number;

  @Column({ type: 'uuid', name: 'source_response_id', nullable: true })
  source_response_id: string | null;

  @Column({ type: 'uuid', name: 'safety_decision_id', nullable: true })
  safety_decision_id: string | null;

  @Column({ type: 'varchar', length: 64, name: 'engine_version' })
  engine_version: string;

  @Column({ type: 'varchar', length: 48, name: 'generated_reason' })
  generated_reason: string;

  /** Set when a newer programme replaces this one. Step 15 section 76. */
  @Column({ type: 'uuid', name: 'superseded_by_id', nullable: true })
  superseded_by_id: string | null;

  @Column({ type: 'timestamptz', name: 'activated_at', nullable: true })
  activated_at: Date | null;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completed_at: Date | null;

  @ManyToOne(() => ZunoUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;

  @ManyToOne(() => ZunoChallenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge;

  @OneToMany(() => ZunoMkaItem, (item) => item.program)
  items?: ZunoMkaItem[];
}
