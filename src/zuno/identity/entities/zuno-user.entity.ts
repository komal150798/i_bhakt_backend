import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { OnboardingStatus, ZunoUserStatus } from '../../common/enums';
import { ZunoUserProfile } from './zuno-user-profile.entity';
import { ZunoBirthProfile } from './zuno-birth-profile.entity';

/**
 * ZUNO application-level user identity. Step 20 Data Model section 10.
 *
 * Bridging note (recorded in ZUNO_DECISION_LOG.md):
 * This project already authenticates against `cst_customer`. Step 20 section 10
 * says authentication credentials should stay with the authentication provider
 * rather than being duplicated, so this table holds no password, OTP or token -
 * it is the ZUNO-side identity that owns ZUNO state and links back to the
 * existing customer record.
 *
 * `auth_subject` stores the customer's `unique_id` (a UUID), not its bigint id,
 * because section 140 forbids an enumerable sequential id from being the
 * security boundary. `customer_id` is kept purely as a join key for reporting.
 */
@Entity('zuno_users')
@Index('idx_zuno_users_auth_subject', ['auth_subject'], { unique: true })
@Index('idx_zuno_users_status', ['status'])
export class ZunoUser extends ZunoBaseEntity {
  /** Stable external identity from the authentication provider. */
  @Column({ type: 'varchar', length: 255, name: 'auth_subject' })
  auth_subject: string;

  /** Join key back to the existing iBhakt customer row. */
  @Column({ type: 'bigint', name: 'customer_id', nullable: true })
  customer_id: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: ZunoUserStatus.ACTIVE,
  })
  status: ZunoUserStatus;

  /**
   * IANA timezone, e.g. Asia/Dubai. Step 20 section 6: persisted separately
   * from the UTC timestamps so presentation can convert deliberately.
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  timezone: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  locale: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'onboarding_status',
    default: OnboardingStatus.NOT_STARTED,
  })
  onboarding_status: OnboardingStatus;

  @OneToOne(() => ZunoUserProfile, (profile) => profile.user)
  profile?: ZunoUserProfile;

  @OneToMany(() => ZunoBirthProfile, (birth) => birth.user)
  birth_profiles?: ZunoBirthProfile[];
}
