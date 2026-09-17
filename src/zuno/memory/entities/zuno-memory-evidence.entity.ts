import { Column, Entity, Index } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { MemoryEvidenceRole } from '../enums/memory.enum';

/**
 * Evidence linking a memory to the structured facts behind it.
 * Step 20 Data Model section 52.
 *
 * The purpose named in the specification is precise: it links a derived memory
 * or pattern to evidence "without exposing chain-of-thought" (Step 18 Rule 13).
 * So this table holds entity *references*, never model reasoning and never the
 * text that prompted the inference.
 *
 * It is what makes Step 18 section 18 enforceable in code: a pattern requires
 * repeated evidence, and "repeated" here means a countable number of rows
 * pointing at distinct source entities - not a model's assertion that it has
 * noticed something.
 *
 * Immutable by construction (ZunoImmutableEntity). Evidence that could be
 * edited after the fact would not be evidence.
 */
@Entity('zuno_memory_evidence')
@Index('idx_zuno_memory_evidence_memory', ['memory_id'])
@Index('idx_zuno_memory_evidence_source', ['source_entity_type', 'source_entity_id'])
export class ZunoMemoryEvidence extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'memory_id' })
  memory_id: string;

  /** e.g. ZunoChallenge, ZunoResponse, ZunoMemoryCandidate, PlanItemEvent. */
  @Column({ type: 'varchar', length: 64, name: 'source_entity_type' })
  source_entity_type: string;

  @Column({ type: 'uuid', name: 'source_entity_id' })
  source_entity_id: string;

  @Column({ type: 'varchar', length: 24, name: 'evidence_role' })
  evidence_role: MemoryEvidenceRole;

  /**
   * Observation timestamp, which is not the same as when the row was written.
   * Pattern evidence needs to know the observations were spread over time
   * rather than all harvested from one session (Step 18 section 106).
   */
  @Column({ type: 'timestamptz', name: 'observed_at' })
  observed_at: Date;
}
