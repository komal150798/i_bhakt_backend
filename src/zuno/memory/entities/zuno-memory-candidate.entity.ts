import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import {
  MemoryCandidateStatus,
  MemoryEvidenceType,
  MemoryFactuality,
  MemoryRejectionReason,
  MemoryRetentionClass,
  MemoryScope,
  MemorySensitivity,
  MemorySource,
  MemoryType,
} from '../enums/memory.enum';
import { MemoryValue } from './memory.types';

/**
 * A proposed memory that has not yet become durable state.
 *
 * Step 18 section 21 and Build Rule 37, which requires memory to follow
 * candidate -> confirmed -> superseded -> expired -> deleted semantics rather
 * than being an unlimited transcript dump.
 *
 * Keeping candidates in their own table rather than as a status on
 * `zuno_memories` is deliberate. A candidate is not a memory yet: it has not
 * passed the worthiness test (section 57), the privacy filter, the duplicate
 * check or - where required - the user's confirmation. If it shared the table,
 * one forgotten status predicate in a retrieval query would put unconfirmed
 * inferences straight into a prompt.
 *
 * Rejected candidates are retained with a reason *label* only, never the
 * content that caused the rejection - Step 18 section 54 asks for audit
 * metadata without retaining prohibited content.
 */
@Entity('zuno_memory_candidates')
@Index('idx_zuno_memory_candidates_user_status', ['user_id', 'status'])
@Index('idx_zuno_memory_candidates_challenge', ['challenge_id'])
@Index('idx_zuno_memory_candidates_event', ['user_id', 'source_event_id'])
export class ZunoMemoryCandidate extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  @Column({ type: 'varchar', length: 32, name: 'scope', default: MemoryScope.GLOBAL })
  scope: MemoryScope;

  @Column({ type: 'varchar', length: 40, name: 'memory_type' })
  memory_type: MemoryType;

  @Column({ type: 'varchar', length: 120, name: 'memory_key' })
  memory_key: string;

  /**
   * Null once the candidate has been accepted or rejected.
   *
   * Step 18 section 116 (do not retain sensitive information because it might
   * someday be useful): a rejected candidate keeps its labels for audit and
   * quality metrics, but the proposed content itself is cleared.
   */
  @Column({ type: 'jsonb', name: 'proposed_value', nullable: true })
  proposed_value: MemoryValue | null;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'factuality',
    default: MemoryFactuality.FACT,
  })
  factuality: MemoryFactuality;

  @Column({ type: 'varchar', length: 32, name: 'source' })
  source: MemorySource;

  @Column({ type: 'varchar', length: 120, name: 'source_event_id', nullable: true })
  source_event_id: string | null;

  @Column({ type: 'varchar', length: 16, name: 'evidence_type' })
  evidence_type: MemoryEvidenceType;

  @Column({ type: 'numeric', precision: 4, scale: 3, name: 'confidence' })
  confidence: string;

  @Column({ type: 'varchar', length: 32, name: 'suggested_retention' })
  suggested_retention: MemoryRetentionClass;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'sensitivity_class',
    default: MemorySensitivity.STANDARD,
  })
  sensitivity_class: MemorySensitivity;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'status',
    default: MemoryCandidateStatus.PENDING,
  })
  status: MemoryCandidateStatus;

  /**
   * True when ZUNO will not store this without the user saying yes.
   *
   * Step 18 section 24 (do not present inferred preferences as facts without
   * sufficient confidence), section 30 (resolve or ask on contradiction),
   * section 70 (no sensitive attribute guessing) and Step 24 section 39.
   */
  @Column({ type: 'boolean', name: 'confirmation_required', default: false })
  confirmation_required: boolean;

  /** Label only, e.g. LOW_CONFIDENCE_INFERENCE, CONTRADICTS_ACTIVE_MEMORY. */
  @Column({
    type: 'varchar',
    length: 48,
    name: 'confirmation_reason',
    nullable: true,
  })
  confirmation_reason: string | null;

  @Column({
    type: 'varchar',
    length: 48,
    name: 'rejection_reason',
    nullable: true,
  })
  rejection_reason: MemoryRejectionReason | null;

  /** Set when the candidate became a memory, so the trail is complete. */
  @Column({ type: 'uuid', name: 'resulting_memory_id', nullable: true })
  resulting_memory_id: string | null;

  @Column({ type: 'timestamptz', name: 'decided_at', nullable: true })
  decided_at: Date | null;

  @ManyToOne(() => ZunoUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;
}
