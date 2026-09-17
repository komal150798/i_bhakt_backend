import { Column, Entity, Index } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { KarmaRevisionActor } from '../enums/karma.enum';

/**
 * Audit history for a ledger entry. Step 20 Data Model section 46,
 * Step 17 sections 89 and 101.
 *
 * Exists because Step 17 section 109 forbids immutable AI judgement: the user
 * must be able to disagree, and the disagreement itself is part of the record.
 * Step 17 section 101's golden test is the acceptance case - the AI says
 * UNCONSTRUCTIVE, the user supplies context, the active classification changes
 * and the original is preserved.
 *
 * Immutable by construction. A revision that could be edited would defeat the
 * purpose of having one.
 *
 * PRIVACY: `previous_value` and `new_value` hold the *classified attributes*
 * only - classification, category, intent, points, confidence, status. They
 * never hold raw_text. Step 17 section 70 and Build Rule 34 make a
 * longer-retained audit table the wrong place for the user's private words,
 * and a `raw_text_changed` boolean answers the audit question without copying
 * them.
 */
@Entity('zuno_karma_entry_revisions')
@Index('idx_zuno_karma_revisions_entry', ['karma_entry_id', 'created_at'])
@Index('idx_zuno_karma_revisions_user', ['user_id', 'created_at'])
export class ZunoKarmaEntryRevision extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'karma_entry_id' })
  karma_entry_id: string;

  /** Denormalised so ownership can be checked without joining. */
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'jsonb', name: 'previous_value' })
  previous_value: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'new_value' })
  new_value: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, name: 'changed_by' })
  changed_by: KarmaRevisionActor;

  /**
   * The user's own explanation, when they gave one.
   * Step 21 section 57's `classificationFeedback.comment`.
   */
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  /** True when the edit touched raw_text, without storing either version. */
  @Column({ type: 'boolean', name: 'raw_text_changed', default: false })
  raw_text_changed: boolean;
}
