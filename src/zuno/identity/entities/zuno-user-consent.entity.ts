import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ConsentType } from '../../common/enums';

/**
 * Consent and policy acceptance. Step 20 Data Model section 13.
 *
 * Consent is append-mostly: revoking sets `revoked_at` rather than deleting the
 * row, because proving what a user agreed to, and when, is exactly what this
 * table exists for. `policy_version` pins the wording that was accepted.
 */
@Entity('zuno_user_consents')
@Index('idx_zuno_user_consents_user_type', ['user_id', 'consent_type'])
export class ZunoUserConsent extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 64, name: 'consent_type' })
  consent_type: ConsentType;

  @Column({ type: 'varchar', length: 32, name: 'policy_version' })
  policy_version: string;

  @Column({ type: 'boolean', default: false })
  granted: boolean;

  @Column({ type: 'timestamptz', name: 'granted_at', nullable: true })
  granted_at: Date | null;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revoked_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
