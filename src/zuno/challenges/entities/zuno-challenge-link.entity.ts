import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ChallengeLinkType } from '../../common/enums';

/**
 * Typed relationship between two challenges. Step 20 Data Model section 119,
 * Step 11 sections 34-35.
 *
 * Master Index section 6 is the motivating case: a WhatNow can produce another
 * WhatNow ("Will I lose my job?" -> job offer arrives -> "Stay or move?"), and
 * "the relationship between these challenges must be preserved". Without this
 * table the second challenge would look like it appeared from nowhere, and
 * Future Self (Step 18) could not narrate the journey.
 */
@Entity('zuno_challenge_links')
@Index(
  'idx_zuno_challenge_links_unique',
  ['source_challenge_id', 'target_challenge_id', 'relationship_type'],
  { unique: true },
)
@Index('idx_zuno_challenge_links_target', ['target_challenge_id'])
export class ZunoChallengeLink extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'source_challenge_id' })
  source_challenge_id: string;

  @Column({ type: 'uuid', name: 'target_challenge_id' })
  target_challenge_id: string;

  /** Scoping key, so a link can never be read across user boundaries. */
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 32, name: 'relationship_type' })
  relationship_type: ChallengeLinkType;

  @Column({ type: 'text', nullable: true })
  reason: string | null;
}
