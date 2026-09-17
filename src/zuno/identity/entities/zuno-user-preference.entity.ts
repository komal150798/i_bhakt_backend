import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { PreferenceSource } from '../../common/enums';

/**
 * Explicit personalisation settings. Step 20 Data Model section 12.
 *
 * Key/value rather than columns because the set of preferences is expected to
 * evolve with the product; `is_active` plus the partial unique index below give
 * the supersession behaviour section 12 asks for without deleting history.
 */
@Entity('zuno_user_preferences')
@Index('idx_zuno_user_prefs_lookup', ['user_id', 'preference_key', 'is_active'])
export class ZunoUserPreference extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 100, name: 'preference_key' })
  preference_key: string;

  @Column({ type: 'jsonb', name: 'preference_value' })
  preference_value: unknown;

  @Column({
    type: 'varchar',
    length: 32,
    default: PreferenceSource.USER_EXPLICIT,
  })
  source: PreferenceSource;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active: boolean;
}
