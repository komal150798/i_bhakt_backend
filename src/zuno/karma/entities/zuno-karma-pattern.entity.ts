import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { KarmaPatternStatus, KarmaPatternType } from '../enums/karma.enum';

/**
 * A behavioural pattern derived from enough recorded entries.
 * Step 20 Data Model section 48, Step 17 sections 74-77.
 *
 * Step 17 section 74 is careful about what these are: "behavioural
 * observations, not spiritual judgments". Section 75 sets the bar - one action
 * must never produce "You are now highly disciplined" - which is why
 * `evidence_count` is a stored, queryable column rather than an implementation
 * detail. A pattern that cannot show its evidence does not get written.
 *
 * This is the aggregate state of the ledger. There is deliberately no
 * `karma_totals` or `karma_rank` table: Step 17 sections 38 and 61 say the
 * user's standing must never be summarised into a single stored figure, and
 * section 68 forbids anything that could be ordered across users. The daily and
 * weekly figures of sections 35-36 are computed per request from the entries
 * the caller owns.
 */
@Entity('zuno_karma_patterns')
@Index('idx_zuno_karma_patterns_user', ['user_id', 'status'])
@Index('idx_zuno_karma_patterns_user_type', ['user_id', 'pattern_type'])
@Index('idx_zuno_karma_patterns_challenge', ['challenge_id'])
export class ZunoKarmaPattern extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  @Column({ type: 'varchar', length: 48, name: 'pattern_type' })
  pattern_type: KarmaPatternType;

  /** Step 17 section 75: how many recorded entries support this. */
  @Column({ type: 'int', name: 'evidence_count', default: 0 })
  evidence_count: number;

  @Column({ type: 'numeric', precision: 4, scale: 3, nullable: true })
  confidence: string | null;

  @Column({ type: 'varchar', length: 16, default: KarmaPatternStatus.OBSERVED })
  status: KarmaPatternStatus;

  @Column({ type: 'timestamptz', name: 'first_observed_at' })
  first_observed_at: Date;

  @Column({ type: 'timestamptz', name: 'last_observed_at' })
  last_observed_at: Date;
}
