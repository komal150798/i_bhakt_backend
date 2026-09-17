import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import {
  ChallengeMode,
  ChallengeStatus,
  EmotionalIntensity,
  Urgency,
  ZunoDomain,
} from '../../common/enums';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoChallengeContext } from './zuno-challenge-context.entity';
import { ZunoChallengeDomain } from './zuno-challenge-domain.entity';

/**
 * A WhatNow: the canonical representation of a user's current challenge.
 * Step 20 Data Model section 18, Step 11 WhatNow Engine.
 *
 * Table is `zuno_challenges`, not `challenges`, because this project already
 * uses `challenges` for 7/30/108-day devotional programmes - an unrelated
 * concept. Renaming the existing table would break working endpoints, which
 * Master Index rule 5 forbids. Decision recorded in ZUNO_DECISION_LOG.md.
 *
 * What this entity is NOT:
 *   - a chat session. Master Index section 5: a WhatNow survives across
 *     hundreds of messages and many conversations.
 *   - a category the user picked. Step 11 Rule 2: the user never selects a
 *     life domain before explaining their problem; classification is internal.
 *
 * Extends ZunoVersionedEntity because Step 20 section 8 names Challenge as a
 * place where concurrent updates must not silently overwrite each other - a
 * Realignment writing here at the same time as a user edit is a real case.
 */
@Entity('zuno_challenges')
@Index('idx_zuno_challenges_user_status', ['user_id', 'status'])
@Index('idx_zuno_challenges_user_opened', ['user_id', 'opened_at'])
export class ZunoChallenge extends ZunoVersionedEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /**
   * Short human label, generated from understanding rather than from the raw
   * first sentence. Nullable until the WhatNow engine has run.
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string | null;

  /**
   * Exactly what the user typed, preserved verbatim.
   *
   * Step 11 section 63 and Step 24 govern its retention. It is kept because
   * provenance (Step 11 Rule 7) requires being able to show which words the
   * user actually used versus what ZUNO inferred - but it is never logged and
   * never sent to analytics (Build Rules 34 and 36).
   */
  @Column({ type: 'text', name: 'raw_user_statement' })
  raw_user_statement: string;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'primary_domain',
    nullable: true,
  })
  primary_domain: ZunoDomain | null;

  /** Step 11 section 13: e.g. JOB_SECURITY within CAREER. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  theme: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: ChallengeStatus.NEW,
  })
  status: ChallengeStatus;

  /** Step 00 section 13: the operating mode this WhatNow is currently in. */
  @Column({
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  mode: ChallengeMode | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  urgency: Urgency | null;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'emotional_intensity',
    nullable: true,
  })
  emotional_intensity: EmotionalIntensity | null;

  /**
   * Internal ranking only. Step 11 section 36 warns against exposing a robotic
   * numerical score to the user without a clear UX reason, so this never
   * reaches a DTO.
   */
  @Column({ type: 'int', nullable: true })
  priority: number | null;

  /** Points at the current ZunoChallengeContext version (section 59). */
  @Column({ type: 'int', name: 'context_version', default: 0 })
  context_version: number;

  @Column({ type: 'timestamptz', name: 'opened_at' })
  opened_at: Date;

  @Column({ type: 'timestamptz', name: 'resolved_at', nullable: true })
  resolved_at: Date | null;

  /**
   * Free-text reason captured when the user resolves or reopens. Helps the
   * Learning stage (Step 02 section 23) compare expected against actual.
   */
  @Column({ type: 'text', name: 'resolution_note', nullable: true })
  resolution_note: string | null;

  @ManyToOne(() => ZunoUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;

  @OneToMany(() => ZunoChallengeContext, (context) => context.challenge)
  contexts?: ZunoChallengeContext[];

  @OneToMany(() => ZunoChallengeDomain, (domain) => domain.challenge)
  domains?: ZunoChallengeDomain[];
}
