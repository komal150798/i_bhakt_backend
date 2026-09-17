import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { EngineRunStatus, EngineType } from '../../common/enums';

/**
 * Execution state for a long-running engine invocation.
 * Step 20 Data Model sections 108-109.
 *
 * Backs the public job-status contract in Step 21 section 110, which exists so
 * that Step 21 section 109 can be honoured: expose PROCESSING / COMPLETED /
 * FAILED honestly rather than pretending an asynchronous pipeline is
 * synchronous.
 *
 * `error_code` holds a ZunoErrorCode, never a provider stack trace
 * (Step 21 section 110: do not expose internal infrastructure details).
 */
@Entity('zuno_engine_runs')
@Index('idx_zuno_engine_runs_challenge', ['challenge_id', 'engine_type'])
@Index('idx_zuno_engine_runs_status', ['status', 'created_at'])
export class ZunoEngineRun extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  @Column({ type: 'varchar', length: 32, name: 'engine_type' })
  engine_type: EngineType;

  @Column({ type: 'varchar', length: 24, default: EngineRunStatus.PENDING })
  status: EngineRunStatus;

  @Column({ type: 'jsonb', name: 'input_reference' })
  input_reference: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'output_reference', nullable: true })
  output_reference: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'varchar', length: 48, name: 'error_code', nullable: true })
  error_code: string | null;

  @Column({ type: 'int', default: 0 })
  progress: number;
}
