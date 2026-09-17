import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { KarmaRescorePolicy, KarmaScoreConfigStatus } from '../enums/karma.enum';

/**
 * A versioned, deterministic scoring configuration.
 * Step 20 Data Model section 47, Step 17 sections 22, 23, 92 and 93.
 *
 * Step 17 section 92 asks for scoring parameters to be "configuration-driven
 * rather than buried in prompts", and sections 22-23 require historical scores
 * to stay explainable and never to be silently rewritten. Those two together
 * are why this is a table rather than a constant: the constant in
 * `scoring/karma-scoring.ts` is the seed for version 1.0, and any later version
 * is a new row with its own effective window.
 *
 * `rescore_policy` records what activating this version did to entries scored
 * under the previous one. It is FUTURE_ONLY for 1.0, and no code path in this
 * module performs a retroactive rescore - Step 17 section 23 requires user
 * opt-in or an audited admin migration for that, neither of which is a thing a
 * deployment should do by itself.
 */
@Entity('zuno_karma_score_configurations')
@Index('idx_zuno_karma_score_configs_status', ['status'])
export class ZunoKarmaScoreConfiguration extends ZunoBaseEntity {
  @Column({ type: 'varchar', length: 32, unique: true })
  version: string;

  /** The full KarmaScoringConfiguration, stored as data. */
  @Column({ type: 'jsonb' })
  configuration: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, default: KarmaScoreConfigStatus.DRAFT })
  status: KarmaScoreConfigStatus;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'rescore_policy',
    default: KarmaRescorePolicy.FUTURE_ONLY,
  })
  rescore_policy: KarmaRescorePolicy;

  @Column({ type: 'timestamptz', name: 'effective_from' })
  effective_from: Date;

  @Column({ type: 'timestamptz', name: 'effective_to', nullable: true })
  effective_to: Date | null;
}
