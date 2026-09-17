import { Column, Entity, Index } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { SafetyViolation, ZunoDomain, ZunoRiskClass } from '../../common/enums';

/**
 * A safety event that needs human visibility. Step 20 Data Model section 63.
 *
 * Raised when the post-check blocks or rewrites candidate output
 * (Step 21 section 129), or when a critical flag is detected.
 *
 * Step 20 section 63: "store minimum necessary sensitive content". This
 * deliberately holds violation *labels* and entity references, not the offending
 * text, so an incident queue can be reviewed without exposing a user's private
 * challenge to whoever is on rota.
 */
@Entity('zuno_safety_incidents')
@Index('idx_zuno_safety_incidents_status', ['status', 'created_at'])
export class ZunoSafetyIncident extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  user_id: string | null;

  @Column({ type: 'uuid', name: 'safety_decision_id', nullable: true })
  safety_decision_id: string | null;

  @Column({ type: 'uuid', name: 'related_response_id', nullable: true })
  related_response_id: string | null;

  /** Which layer raised it, e.g. SAFETY_POST_CHECK, WHATNOW_PRE_CHECK. */
  @Column({ type: 'varchar', length: 48 })
  source: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  domain: ZunoDomain | null;

  @Column({ type: 'varchar', length: 24 })
  severity: ZunoRiskClass;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  violations: SafetyViolation[];

  @Column({ type: 'varchar', length: 24, default: 'OPEN' })
  status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

  @Column({ type: 'varchar', length: 16, name: 'policy_version' })
  policy_version: string;

  @Column({ type: 'timestamptz', name: 'resolved_at', nullable: true })
  resolved_at: Date | null;
}
