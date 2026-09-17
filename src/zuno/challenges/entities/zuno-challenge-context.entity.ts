import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from './zuno-challenge.entity';
import { ChallengeContextPayload } from './challenge-context.types';
import { EngineRouting } from '../../common/enums';

/**
 * One immutable version of a challenge's structured understanding.
 * Step 20 Data Model section 20, Step 11 sections 32/59.
 *
 * Why append-only rather than a single mutable row:
 * Step 11 Rule 8 - "preserve Challenge Context versions rather than silently
 * overwriting material history" - and Step 11 section 59 shows the intended
 * shape (v1 initial concern, v2 user confirms loan dependency, v3 restructuring
 * announced, v4 interview received). Realignment later has to answer "what
 * changed and why", which is impossible if each analysis overwrites the last.
 *
 * ZunoChallenge.context_version points at the highest version_number here.
 */
@Entity('zuno_challenge_contexts')
@Index(
  'idx_zuno_challenge_contexts_version',
  ['challenge_id', 'version_number'],
  { unique: true },
)
export class ZunoChallengeContext extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'challenge_id' })
  challenge_id: string;

  /** Denormalised for ownership scoping without a join (Step 20 section 85). */
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'int', name: 'version_number' })
  version_number: number;

  /** Plain-language understanding shown to the user. */
  @Column({ type: 'text' })
  summary: string;

  /**
   * The typed extraction. JSONB rather than a table per item type because
   * these are read as one whole object per version and are not independently
   * queried; Step 20 section 9 allows JSONB for exactly this, while the fields
   * that *are* queried (domain, status, urgency) stay as real columns on
   * ZunoChallenge.
   */
  @Column({ type: 'jsonb' })
  payload: ChallengeContextPayload;

  /** Step 11 sections 38-39: which downstream engines this challenge needs. */
  @Column({ type: 'jsonb' })
  routing: EngineRouting;

  /** Step 11 section 30: overall extraction confidence, 0..1. */
  @Column({ type: 'numeric', precision: 4, scale: 3 })
  confidence: string;

  @Column({ type: 'boolean', name: 'clarification_required', default: false })
  clarification_required: boolean;

  /**
   * Provenance. Step 11 section 60 and Build Rule 94: we must be able to answer
   * "which context version generated the plan, and what produced it".
   */
  @Column({ type: 'varchar', length: 64, name: 'extractor_version' })
  extractor_version: string;

  @Column({ type: 'uuid', name: 'ai_generation_run_id', nullable: true })
  ai_generation_run_id: string | null;

  /** What caused this version to be created, e.g. USER_MESSAGE, LIFE_SIGNAL. */
  @Column({ type: 'varchar', length: 48, name: 'created_reason' })
  created_reason: string;

  @ManyToOne(() => ZunoChallenge, (challenge) => challenge.contexts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge;
}
