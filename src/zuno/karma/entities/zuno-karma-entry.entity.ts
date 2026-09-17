import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import {
  KarmaCategory,
  KarmaClassification,
  KarmaEntrySource,
  KarmaEntryStatus,
  KarmaImpactScope,
  KarmaIntent,
  KarmaVisibility,
} from '../enums/karma.enum';

/**
 * One recorded action in the user's private Karma Ledger.
 * Step 20 Data Model section 44, Step 17 sections 7 and 58.
 *
 * What this row is: "what I did, how it was read, and what the ledger did with
 * it". What it is not: a measure of the person. Step 17 Rule 2 and section 61
 * are explicit that the user's worth is never summarised by these values, and
 * nothing here is designed to be aggregated into a verdict.
 *
 * Extends ZunoVersionedEntity because Step 17 sections 14 and 55 give the user
 * the right to correct a classification, and Step 20 section 8 wants a
 * concurrent correction and a background reclassification to collide loudly
 * rather than silently overwrite each other.
 *
 * PRIVACY (Step 17 sections 3, 70, 71, Roadmap section 56):
 *   raw_text is the most sensitive column ZUNO stores after the birth profile
 *   and the challenge statement. It is never logged (Build Rule 34), never put
 *   in an outbox payload (Build Rule 113), never sent to analytics (Build Rule
 *   36) and never returned on a list response. Deleting an entry nulls it and
 *   stamps redacted_at, so erasure is a real operation rather than a flag.
 */
@Entity('zuno_karma_entries')
@Index('idx_zuno_karma_entries_user_created', ['user_id', 'created_at'])
@Index('idx_zuno_karma_entries_user_status', ['user_id', 'status'])
@Index('idx_zuno_karma_entries_user_category', ['user_id', 'category'])
@Index('idx_zuno_karma_entries_user_classification', ['user_id', 'classification'])
@Index('idx_zuno_karma_entries_user_source', ['user_id', 'source'])
@Index('idx_zuno_karma_entries_challenge', ['challenge_id'])
@Index('idx_zuno_karma_entries_plan_item', ['plan_item_id'])
@Index('idx_zuno_karma_entries_mka_item', ['mka_item_id'])
@Index('idx_zuno_karma_entries_source_event', ['user_id', 'source_event_id'])
export class ZunoKarmaEntry extends ZunoVersionedEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /**
   * The WhatNow this action relates to, when it relates to one.
   *
   * Nullable because Step 17 section 29 explicitly allows entries unrelated to
   * any active challenge ("Fed stray animals").
   *
   * No foreign key is declared to the plan/MKA tables: those modules are built
   * separately and the ledger must not fail to record an action because a
   * sibling module's table does not exist yet. Referential correctness for
   * those two is enforced in the service via the source port.
   */
  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  @Column({ type: 'uuid', name: 'plan_item_id', nullable: true })
  plan_item_id: string | null;

  @Column({ type: 'uuid', name: 'mka_item_id', nullable: true })
  mka_item_id: string | null;

  @Column({ type: 'varchar', length: 32 })
  source: KarmaEntrySource;

  /**
   * The upstream emission this entry came from. Step 17 section 91: together
   * with the user id this is the idempotency key that stops an event retry
   * creating a second entry. A unique partial index enforces it in the database
   * as well as in the service, because a retry can race.
   */
  @Column({
    type: 'varchar',
    length: 128,
    name: 'source_event_id',
    nullable: true,
  })
  source_event_id: string | null;

  /**
   * The user's own words, or the action's short label for system entries.
   *
   * Step 17 section 5 requires nuance to be preserved, so this is stored
   * verbatim and never normalised into the classification. Nulled on erasure.
   */
  @Column({ type: 'text', name: 'raw_text', nullable: true })
  raw_text: string | null;

  /** Step 17 section 8. Five-valued, never binary. */
  @Column({ type: 'varchar', length: 16 })
  classification: KarmaClassification;

  @Column({ type: 'varchar', length: 32 })
  category: KarmaCategory;

  @Column({ type: 'varchar', length: 32, nullable: true })
  intent: KarmaIntent | null;

  @Column({ type: 'varchar', length: 32, name: 'impact_scope', nullable: true })
  impact_scope: KarmaImpactScope | null;

  /**
   * Bounded, non-negative progress points.
   *
   * Step 17 sections 17-19 and Rule 4: there is no code path that writes a
   * negative value here, and a CHECK constraint in the migration makes that
   * true at the database level too. Enabling negative scoring is a governance
   * decision, not a schema-permissive accident.
   */
  @Column({ type: 'int', default: 0 })
  points: number;

  /** Step 17 section 53. 0..1, stored as numeric to survive round-tripping. */
  @Column({ type: 'numeric', precision: 4, scale: 3, nullable: true })
  confidence: string | null;

  /** Step 17 sections 14, 54: the user has seen this and accepted it. */
  @Column({ type: 'boolean', name: 'user_confirmed', default: false })
  user_confirmed: boolean;

  /**
   * Step 17 section 3 / Roadmap section 56: private by default, and in this
   * build private is the only value the column accepts.
   */
  @Column({ type: 'varchar', length: 24, default: KarmaVisibility.PRIVATE })
  visibility: KarmaVisibility;

  /** Step 17 sections 22, 58: provenance that keeps old scores explainable. */
  @Column({ type: 'varchar', length: 32, name: 'scoring_model_version' })
  scoring_model_version: string;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'classification_model_version',
  })
  classification_model_version: string;

  /**
   * Structured evidence labels and score factors.
   *
   * Step 17 section 59 wants "why it was categorized, what factors affected
   * points" answerable; Build Rule 87 forbids storing hidden chain-of-thought.
   * This holds stable tags and multipliers only - never a model's prose.
   */
  @Column({ type: 'jsonb', name: 'score_factors', default: () => "'[]'::jsonb" })
  score_factors: { factor: string; value: number }[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  evidence: string[];

  /** Step 17 section 56. */
  @Column({ type: 'varchar', length: 16, default: KarmaEntryStatus.ACTIVE })
  status: KarmaEntryStatus;

  /** When the action actually happened, which may predate the recording. */
  @Column({ type: 'timestamptz', name: 'occurred_at' })
  occurred_at: Date;

  /**
   * Set when raw_text has been erased under the retention/erasure workflow.
   * Step 17 section 71, Build Rule 143: deletion is an end-to-end operation,
   * and this column is how the ledger proves it happened.
   */
  @Column({ type: 'timestamptz', name: 'redacted_at', nullable: true })
  redacted_at: Date | null;

  @ManyToOne(() => ZunoUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;
}
