import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import {
  MemoryEvidenceType,
  MemoryFactuality,
  MemoryRetentionClass,
  MemoryScope,
  MemorySensitivity,
  MemorySource,
  MemoryStatus,
  MemoryType,
} from '../enums/memory.enum';
import { MemoryValue } from './memory.types';

/**
 * A durable memory. Step 20 Data Model section 49, Step 18 section 22.
 *
 * Table is `zuno_memories` rather than `memories` for the same reason
 * `zuno_challenges` is not `challenges`: this repository already owns an
 * unrelated iBhakt schema, and Master Index rule 5 forbids renaming working
 * tables to take a nicer name.
 *
 * Extends ZunoVersionedEntity because Step 20 section 8 names Memory
 * explicitly as a place where concurrent writes must not silently overwrite
 * each other - a user correction landing at the same moment as a Realignment
 * write is the exact case.
 *
 * What this entity is NOT:
 *   - a transcript row. Step 18 section 7 and Rule 1: conversation history and
 *     durable memory are different things, and this table holds only the
 *     second.
 *   - the source of truth for plan status, karma score or rulebook version
 *     (Step 18 section 97). Those are referenced through `memory_value.refs`.
 */
@Entity('zuno_memories')
// Step 20 section 1853 names (user_id, memory_type, status) as the retrieval
// index. Every filtered column in MemoryRetrievalService is covered by one of
// the three below.
@Index('idx_zuno_memories_user_type_status', ['user_id', 'memory_type', 'status'])
@Index('idx_zuno_memories_challenge_status', ['challenge_id', 'status'])
@Index('idx_zuno_memories_expiry', ['status', 'expires_at'])
export class ZunoMemory extends ZunoVersionedEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /**
   * Null means global. Step 18 section 63: "prefers concise guidance" is
   * global; "does not want to resign before another offer" belongs to the
   * career challenge and must not leak into an unrelated conversation
   * (section 109).
   */
  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  @Column({ type: 'varchar', length: 32, name: 'scope', default: MemoryScope.GLOBAL })
  scope: MemoryScope;

  @Column({ type: 'varchar', length: 40, name: 'memory_type' })
  memory_type: MemoryType;

  /**
   * Stable identifier for *what* is remembered, e.g. `guidance_style`.
   *
   * Step 18 section 59: "prefers concise answers" must not become seventeen
   * separate memories. The key is what makes deduplication and supersession
   * possible without semantic comparison.
   */
  @Column({ type: 'varchar', length: 120, name: 'memory_key' })
  memory_key: string;

  @Column({ type: 'jsonb', name: 'memory_value' })
  memory_value: MemoryValue;

  /**
   * Step 18 section 46. Separate from memory_type so a hypothetical exploration
   * of a decision cannot be mistaken for the decision.
   */
  @Column({
    type: 'varchar',
    length: 32,
    name: 'factuality',
    default: MemoryFactuality.FACT,
  })
  factuality: MemoryFactuality;

  @Column({ type: 'varchar', length: 32, name: 'source' })
  source: MemorySource;

  /**
   * Step 18 section 95: (source_event_id, memory_key, scope) is the idempotency
   * triple, so reprocessing an event does not create a second memory.
   */
  @Column({ type: 'varchar', length: 120, name: 'source_event_id', nullable: true })
  source_event_id: string | null;

  @Column({ type: 'varchar', length: 16, name: 'evidence_type' })
  evidence_type: MemoryEvidenceType;

  /** 0.000 - 1.000. Stored as numeric so it survives a round-trip exactly. */
  @Column({ type: 'numeric', precision: 4, scale: 3, name: 'confidence' })
  confidence: string;

  @Column({ type: 'varchar', length: 32, name: 'retention_class' })
  retention_class: MemoryRetentionClass;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'sensitivity_class',
    default: MemorySensitivity.STANDARD,
  })
  sensitivity_class: MemorySensitivity;

  @Column({ type: 'varchar', length: 32, name: 'status', default: MemoryStatus.ACTIVE })
  status: MemoryStatus;

  /**
   * Step 18 section 22 `last_confirmed_at`, used by decay (section 61) and by
   * deduplication, which updates confirmation metadata rather than writing a
   * second row (section 59).
   */
  @Column({ type: 'timestamptz', name: 'last_confirmed_at', nullable: true })
  last_confirmed_at: Date | null;

  /** How many times this memory has been re-observed. Feeds pattern evidence. */
  @Column({ type: 'int', name: 'confirmation_count', default: 1 })
  confirmation_count: number;

  /** Step 18 section 28. Null means it does not expire on a clock. */
  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expires_at: Date | null;

  /**
   * The memory this one replaced. Step 18 section 29: new facts do not
   * overwrite old history, they supersede it, and the chain stays auditable.
   */
  @Column({ type: 'uuid', name: 'supersedes_memory_id', nullable: true })
  supersedes_memory_id: string | null;

  /** Set on the older row when it is superseded, so the chain reads both ways. */
  @Column({ type: 'uuid', name: 'superseded_by_memory_id', nullable: true })
  superseded_by_memory_id: string | null;

  @Column({ type: 'timestamptz', name: 'superseded_at', nullable: true })
  superseded_at: Date | null;

  /**
   * When the user deleted this. Distinct from `deleted_at`, which TypeORM sets
   * for ordinary soft delete: Step 20 section 100 requires privacy deletion to
   * be distinguishable from domain deletion, and Step 24 section 95 says soft
   * delete is not automatically equivalent to privacy deletion.
   */
  @Column({ type: 'timestamptz', name: 'redacted_at', nullable: true })
  redacted_at: Date | null;

  /** Kept as a label, never as the deleted content. Step 18 section 54. */
  @Column({ type: 'varchar', length: 40, name: 'deletion_reason', nullable: true })
  deletion_reason: string | null;

  @ManyToOne(() => ZunoUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;

  @ManyToOne(() => ZunoChallenge, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge | null;
}
