import { Column, Entity, Index } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ResponseType } from '../../common/enums';
import { ZunoResponsePayload } from './response.types';

/**
 * A structured response artifact produced by ZUNO.
 * Step 20 Data Model section 59.
 *
 * Immutable, and versioned by insertion rather than update: Step 00 section 38
 * ("never destroy historical context by blindly overwriting important
 * decisions") and section 37 ("what did we tell the user?"). When a Realignment
 * changes the guidance, a new response row is written and the old one stays.
 *
 * `rendered_text` is nullable because most responses are structure-only; it is
 * populated for conversational replies where a single prose body is the point.
 */
@Entity('zuno_responses')
@Index('idx_zuno_responses_challenge', ['challenge_id', 'created_at'])
@Index('idx_zuno_responses_user', ['user_id', 'created_at'])
export class ZunoResponse extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  @Column({ type: 'uuid', name: 'conversation_id', nullable: true })
  conversation_id: string | null;

  @Column({ type: 'varchar', length: 32, name: 'response_type' })
  response_type: ResponseType;

  @Column({ type: 'jsonb', name: 'structured_payload' })
  structured_payload: ZunoResponsePayload;

  @Column({ type: 'text', name: 'rendered_text', nullable: true })
  rendered_text: string | null;

  /** Which context version this response was built from (Step 11 section 60). */
  @Column({ type: 'int', name: 'context_version', nullable: true })
  context_version: number | null;

  /**
   * Provenance. Build Rule 94 / Step 21 Rule 15: material generated artifacts
   * retain model, prompt, engine and safety provenance. `rulebook_version_id`
   * stays null until the Rulebook engine lands in a later phase, but the column
   * exists now so historical responses are never left without attribution
   * (Step 20 section 70).
   */
  @Column({ type: 'varchar', length: 64, name: 'model_version', nullable: true })
  model_version: string | null;

  @Column({ type: 'varchar', length: 64, name: 'prompt_version', nullable: true })
  prompt_version: string | null;

  @Column({ type: 'varchar', length: 64, name: 'engine_version' })
  engine_version: string;

  @Column({ type: 'uuid', name: 'rulebook_version_id', nullable: true })
  rulebook_version_id: string | null;

  @Column({ type: 'uuid', name: 'safety_decision_id', nullable: true })
  safety_decision_id: string | null;
}
