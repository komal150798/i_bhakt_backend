import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoDomain, ZunoRiskClass } from '../../common/enums';
import { ZunoChallenge } from './zuno-challenge.entity';

/**
 * Multi-domain support for a challenge. Step 20 Data Model section 22.
 *
 * This exists because Step 11 section 12 insists a multidimensional problem
 * must not be squashed into a single category. Ashish's layoff worry is
 * CAREER + FINANCE + FOREIGN_RESIDENCE, and the astrology routing (section 40)
 * needs all three.
 *
 * `risk_class` is stored per domain, not per challenge, because the safety
 * boundary differs by domain: the FOREIGN_RESIDENCE facet of a challenge is
 * HIGH_STAKES even when its CAREER facet is only MODERATE_RISK.
 */
@Entity('zuno_challenge_domains')
@Index('idx_zuno_challenge_domains_lookup', ['challenge_id', 'domain'], {
  unique: true,
})
export class ZunoChallengeDomain extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'challenge_id' })
  challenge_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 32 })
  domain: ZunoDomain;

  @Column({ type: 'varchar', length: 24, name: 'risk_class' })
  risk_class: ZunoRiskClass;

  @Column({ type: 'boolean', name: 'is_primary', default: false })
  is_primary: boolean;

  /** Classifier confidence for this domain, 0..1 (Step 21 section 27). */
  @Column({ type: 'numeric', precision: 4, scale: 3, nullable: true })
  confidence: string | null;

  @ManyToOne(() => ZunoChallenge, (challenge) => challenge.domains, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge;
}
