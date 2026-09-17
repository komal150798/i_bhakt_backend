import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ZunoDomain } from '../../common/enums';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import {
  LifeSignalMateriality,
  LifeSignalNature,
  LifeSignalRelevance,
  LifeSignalReliability,
  LifeSignalSource,
  LifeSignalStatus,
  LifeSignalType,
  RealignmentReasonCode,
  SignalConfirmationStatus,
  UrgencyChange,
} from '../enums';
import { ZunoLifeSignalSource } from './zuno-life-signal-source.entity';
import { ZunoLifeSignalConfirmation } from './zuno-life-signal-confirmation.entity';
import { ZunoLifeSignalImpact } from './zuno-life-signal-impact.entity';

/**
 * A detected change in the user's life. Step 20 Data Model section 31,
 * Step 13 Life Signal Engine.
 *
 * Extends ZunoVersionedEntity because Step 20 section 8 names Life Signal as a
 * place where concurrent writes must not silently overwrite each other - a
 * user confirming a signal while a time job marks it stale is a real race.
 *
 * TWO INDEPENDENT AXES, DELIBERATELY
 *
 *   `status`              is this signal currently in play?
 *   `confirmation_status` do we actually know it happened?
 *
 * Collapsing them into one column is the obvious simplification and it is
 * wrong. Step 13 Rule 3 forbids promoting a fear to a fact without evidence,
 * and Step 13 section 18 gives the exact failure: "They hinted something may
 * happen" must not become TERMINATION_CONFIRMED. A single column forces a
 * choice between representing relevance and representing certainty, and every
 * reader then has to reconstruct the other from context. Keeping them apart
 * means `isConfirmedSignal(confirmation_status)` is the only check a consumer
 * needs before treating a signal as real.
 *
 * Nothing here interprets astrology. ASTRO_TIMING_CHANGE signals are stored
 * like any other, and their interpretation is resolved through
 * RulebookRepositoryService at read time or not at all (Build Rule 51).
 */
@Entity('zuno_life_signals')
@Index('idx_zuno_life_signals_user_challenge_status', [
  'user_id',
  'challenge_id',
  'status',
])
@Index('idx_zuno_life_signals_user_detected', ['user_id', 'detected_at'])
@Index('idx_zuno_life_signals_challenge', ['challenge_id'])
@Index('idx_zuno_life_signals_confirmation', ['confirmation_status'])
@Index('idx_zuno_life_signals_fingerprint', ['challenge_id', 'fingerprint'])
export class ZunoLifeSignal extends ZunoVersionedEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /**
   * Nullable because Step 13 section 12 asks "WHICH challenge does it affect?"
   * and honestly allows the answer to be "not yet known". Step 20 section 31
   * has the column nullable for the same reason.
   */
  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  @Column({ type: 'varchar', length: 32, name: 'signal_type' })
  signal_type: LifeSignalType;

  @Column({ type: 'varchar', length: 32 })
  source: LifeSignalSource;

  /** Step 13 section 62. Decides whether temporal decay may apply. */
  @Column({ type: 'varchar', length: 16, default: LifeSignalNature.EVENT })
  nature: LifeSignalNature;

  @Column({ type: 'varchar', length: 32, nullable: true })
  domain: ZunoDomain | null;

  /**
   * What the user or the source actually gave us, unaltered.
   *
   * Step 13 section 75: Life Signals carry highly sensitive information. This
   * column is never logged, never copied into an outbox payload (OutboxService
   * strips `statement` and `content` keys) and never sent to analytics.
   */
  @Column({ type: 'jsonb', name: 'raw_value' })
  raw_value: Record<string, unknown>;

  /**
   * The structured event ZUNO derived. Step 13 section 10: `normalized_event`.
   * Null until normalisation has run.
   */
  @Column({ type: 'jsonb', name: 'normalized_value', nullable: true })
  normalized_value: Record<string, unknown> | null;

  /** Step 13 section 18. 0..1. */
  @Column({ type: 'numeric', precision: 4, scale: 3, default: 0 })
  confidence: string;

  @Column({ type: 'varchar', length: 24 })
  reliability: LifeSignalReliability;

  @Column({ type: 'varchar', length: 32, name: 'confirmation_status' })
  confirmation_status: SignalConfirmationStatus;

  @Column({ type: 'varchar', length: 16 })
  materiality: LifeSignalMateriality;

  @Column({ type: 'varchar', length: 16 })
  relevance: LifeSignalRelevance;

  @Column({ type: 'varchar', length: 16, name: 'urgency_change' })
  urgency_change: UrgencyChange;

  @Column({ type: 'varchar', length: 24 })
  status: LifeSignalStatus;

  /**
   * True when ZUNO worked this out rather than being told.
   *
   * Derived from `reliability`, but stored rather than computed because it is
   * the flag every presentation layer keys off, and Step 13 section 78 makes
   * the consequence of getting it wrong concrete: "My manager seemed quiet
   * today" must not render as "your job risk has increased". A stored column
   * can be indexed and cannot be forgotten by a caller.
   */
  @Column({ type: 'boolean', name: 'is_inference', default: false })
  is_inference: boolean;

  /**
   * Set when this signal would need the user to confirm before it may affect
   * anything. Step 13 section 82.
   */
  @Column({ type: 'boolean', name: 'clarification_required', default: false })
  clarification_required: boolean;

  /**
   * Step 13 section 51. Advisory: the Life Signal Engine flags the need, the
   * Realignment Engine decides and performs (Step 13 Rule 10).
   */
  @Column({ type: 'boolean', name: 'realignment_required', default: false })
  realignment_required: boolean;

  @Column({
    type: 'jsonb',
    name: 'reason_codes',
    default: () => "'[]'::jsonb",
  })
  reason_codes: RealignmentReasonCode[];

  /**
   * Deduplication key. Step 13 sections 20 and 88: the same reported event must
   * not create two material signals or two downstream realignments. Built from
   * challenge + type + normalised event + occurrence date, so "My interview is
   * Friday" and "Remember, I have that interview on Friday" collide.
   */
  @Column({ type: 'varchar', length: 64 })
  fingerprint: string;

  /** Step 13 section 22: the signal this one replaced. */
  @Column({ type: 'uuid', name: 'supersedes_signal_id', nullable: true })
  supersedes_signal_id: string | null;

  /** When the described thing happened, as opposed to when we heard about it. */
  @Column({ type: 'timestamptz', name: 'occurred_at', nullable: true })
  occurred_at: Date | null;

  @Column({ type: 'timestamptz', name: 'detected_at' })
  detected_at: Date;

  @Column({ type: 'timestamptz', name: 'processed_at', nullable: true })
  processed_at: Date | null;

  /**
   * When this signal stops counting as current. Step 13 section 60.
   * Null for standing state facts (section 61), which never decay on their own.
   */
  @Column({ type: 'timestamptz', name: 'stale_after', nullable: true })
  stale_after: Date | null;

  /**
   * Step 13 sections 65-66: a signal interpreted against the Rulebook records
   * which version was used, and a later Rulebook must not silently reinterpret
   * it. Null when no astrology was involved, which is the normal case and also
   * what a fail-closed Rulebook lookup leaves behind.
   */
  @Column({ type: 'uuid', name: 'rulebook_version_id', nullable: true })
  rulebook_version_id: string | null;

  /** Which detector produced this. Provenance, per Build Rule 94. */
  @Column({ type: 'varchar', length: 64, name: 'detector_version' })
  detector_version: string;

  @Column({ type: 'uuid', name: 'safety_decision_id', nullable: true })
  safety_decision_id: string | null;

  @ManyToOne(() => ZunoChallenge, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge | null;

  @OneToMany(() => ZunoLifeSignalSource, (row) => row.signal)
  sources?: ZunoLifeSignalSource[];

  @OneToMany(() => ZunoLifeSignalConfirmation, (row) => row.signal)
  confirmations?: ZunoLifeSignalConfirmation[];

  @OneToMany(() => ZunoLifeSignalImpact, (row) => row.signal)
  impacts?: ZunoLifeSignalImpact[];
}
