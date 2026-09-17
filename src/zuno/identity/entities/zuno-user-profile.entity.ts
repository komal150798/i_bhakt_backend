import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from './zuno-user.entity';

/**
 * Ordinary profile information. Step 20 Data Model section 11.
 *
 * Section 11 closes with "avoid collecting profile fields merely because they
 * may someday be useful", and Build Rule 35 repeats it, so this table stays
 * deliberately short. Anything richer belongs in Memory (Step 18), which has
 * retention and supersession semantics that a profile column does not.
 */
@Entity('zuno_user_profiles')
@Index('idx_zuno_user_profiles_user', ['user_id'], { unique: true })
export class ZunoUserProfile extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /** What ZUNO calls the user in conversation. */
  @Column({ type: 'varchar', length: 100, name: 'preferred_name', nullable: true })
  preferred_name: string | null;

  @Column({ type: 'varchar', length: 200, name: 'display_name', nullable: true })
  display_name: string | null;

  @Column({ type: 'varchar', length: 2, name: 'country_code', nullable: true })
  country_code: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  occupation: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'preferred_language',
    nullable: true,
  })
  preferred_language: string | null;

  @OneToOne(() => ZunoUser, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;
}
