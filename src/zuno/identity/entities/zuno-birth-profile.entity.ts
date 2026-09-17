import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { BirthProfileSource, BirthTimeAccuracy } from '../../common/enums';
import { ZunoUser } from './zuno-user.entity';

/**
 * User-provided birth context. Step 20 Data Model section 14.
 *
 * Step 20 section 14 flags this as sensitive personal information requiring
 * stronger access controls, and Build Rule 34 forbids logging its contents.
 * Nothing here is ever included in a log line, an analytics event or an error
 * message.
 *
 * The rules that shape this table are all about *not guessing*:
 *   Build Rule 52  never invent birth time, place, coordinates or timezone
 *   Build Rule 53  preserve uncertainty; never silently promote APPROXIMATE
 *                  or UNKNOWN to EXACT
 *   Step 21 s.22   coordinates come from a trusted location service, never
 *                  from an LLM
 *
 * Hence latitude/longitude/timezone_at_birth are all nullable: a birth profile
 * with an unresolved place is a valid, honest state. The astrology layer is
 * expected to refuse rather than fabricate when they are missing.
 */
@Entity('zuno_birth_profiles')
@Index('idx_zuno_birth_profiles_user', ['user_id'])
export class ZunoBirthProfile extends ZunoVersionedEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'date', name: 'date_of_birth' })
  date_of_birth: string;

  /**
   * Local clock time at the place of birth, not UTC. Step 21 section 18:
   * "birth time remains local birth time plus location/timezone metadata".
   * Null when `time_accuracy` is UNKNOWN.
   */
  @Column({ type: 'time', name: 'time_of_birth', nullable: true })
  time_of_birth: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'time_accuracy',
    default: BirthTimeAccuracy.UNKNOWN,
  })
  time_accuracy: BirthTimeAccuracy;

  @Column({ type: 'varchar', length: 200, name: 'place_name' })
  place_name: string;

  @Column({ type: 'varchar', length: 2, name: 'place_country_code', nullable: true })
  place_country_code: string | null;

  /** Null until resolved by a trusted location source. Never model-supplied. */
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: string | null;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'timezone_at_birth',
    nullable: true,
  })
  timezone_at_birth: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: BirthProfileSource.USER_PROVIDED,
  })
  source: BirthProfileSource;

  @ManyToOne(() => ZunoUser, (user) => user.birth_profiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;

  /**
   * True only when the astrology layer has everything it needs.
   *
   * Deliberately a derived getter rather than a stored column: a stored flag
   * would drift out of sync with the fields it summarises, and Step 20 section 9
   * says integrity-critical values should be explicit rather than cached.
   */
  get isCalculationReady(): boolean {
    return (
      this.latitude !== null &&
      this.longitude !== null &&
      this.timezone_at_birth !== null &&
      this.time_accuracy !== BirthTimeAccuracy.UNKNOWN &&
      this.time_of_birth !== null
    );
  }
}
