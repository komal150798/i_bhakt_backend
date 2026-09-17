import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { MemoryConflictResolution } from '../enums/memory.enum';

/**
 * A detected contradiction between two memories. Step 20 section 53.
 *
 * Step 18 section 30 is the rule this table exists to keep honest: on conflict,
 * detect, assess source authority, then resolve or ask - and explicitly "do not
 * silently combine contradictions". Merging two contradictory statements into
 * one plausible-sounding memory is the failure mode; a row here is the
 * alternative.
 *
 * Most conflicts resolve immediately by supersession, because source authority
 * (Step 18 section 31) usually settles it: a current explicit user correction
 * outranks an older inference without needing to ask. The row is still written,
 * so the resolution is auditable rather than invisible.
 */
@Entity('zuno_memory_conflicts')
@Index('idx_zuno_memory_conflicts_user_status', ['user_id', 'resolution_status'])
@Index('idx_zuno_memory_conflicts_memory_a', ['memory_a_id'])
@Index('idx_zuno_memory_conflicts_memory_b', ['memory_b_id'])
export class ZunoMemoryConflict extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /** The older, incumbent memory. */
  @Column({ type: 'uuid', name: 'memory_a_id' })
  memory_a_id: string;

  /** The newer, challenging memory. */
  @Column({ type: 'uuid', name: 'memory_b_id' })
  memory_b_id: string;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'resolution_status',
    default: MemoryConflictResolution.UNRESOLVED,
  })
  resolution_status: MemoryConflictResolution;

  @Column({ type: 'uuid', name: 'resolved_memory_id', nullable: true })
  resolved_memory_id: string | null;

  /**
   * The authority gap that decided it, recorded as two numbers rather than as
   * prose. Step 18 section 31 makes precedence a rule, and a rule that was
   * applied should be reproducible from the row.
   */
  @Column({ type: 'int', name: 'authority_a', nullable: true })
  authority_a: number | null;

  @Column({ type: 'int', name: 'authority_b', nullable: true })
  authority_b: number | null;

  @Column({ type: 'timestamptz', name: 'resolved_at', nullable: true })
  resolved_at: Date | null;

  @ManyToOne(() => ZunoUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;
}
