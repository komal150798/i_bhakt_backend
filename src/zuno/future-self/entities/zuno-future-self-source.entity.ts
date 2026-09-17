import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoFutureSelfNarrative } from './zuno-future-self-narrative.entity';

/**
 * What a Future Self narrative was built from. Step 20 Data Model section 55,
 * whose stated purpose is one word: "Ensures grounding."
 *
 * Step 18 section 38 requires every narrative statement to be traceable to
 * stored facts, completed actions, user reflections or confirmed Life Signals.
 * These rows are that trace, and they are written in the same transaction as
 * the narrative so the two cannot come apart.
 *
 * Step 20 section 2580 adds the authorisation rule enforced when these are
 * written: a Future Self source must belong to the same user as the narrative.
 * A source row pointing at another user's memory would be a cross-user leak
 * wearing a provenance label.
 *
 * Immutable: a grounding record that could be edited afterwards would not
 * ground anything.
 */
@Entity('zuno_future_self_sources')
@Index('idx_zuno_fs_sources_narrative', ['future_self_narrative_id'])
@Index('idx_zuno_fs_sources_entity', ['source_entity_type', 'source_entity_id'])
export class ZunoFutureSelfSource extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'future_self_narrative_id' })
  future_self_narrative_id: string;

  /** e.g. ZunoMemory, ZunoChallenge, ZunoPlanItem, ZunoKarmaEntry. */
  @Column({ type: 'varchar', length: 64, name: 'source_entity_type' })
  source_entity_type: string;

  @Column({ type: 'uuid', name: 'source_entity_id' })
  source_entity_id: string;

  @ManyToOne(() => ZunoFutureSelfNarrative, (narrative) => narrative.sources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'future_self_narrative_id' })
  narrative?: ZunoFutureSelfNarrative;
}
