import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoRealignment } from './zuno-realignment.entity';
import { RealignmentChangeType, RealignmentEntityType } from '../enums';

/**
 * One line of a realignment's diff. Step 20 Data Model section 35,
 * Step 14 sections 12 and 59.
 *
 * Immutable: this is the record of what a realignment did. Step 14 section 89
 * requires being able to answer, later, "what was preserved, what was removed,
 * what was added" - a mutable row cannot answer that honestly.
 *
 * PRESERVE rows are written even though they change nothing. Step 14 section 77
 * puts "what stays the same" in front of the user, and Rule 2 makes preserving
 * what still works an obligation rather than a side effect. An empty preserve
 * bucket in a major realignment is a bug worth being able to see.
 */
@Entity('zuno_realignment_changes')
@Index('idx_zuno_realignment_changes_realignment', ['realignment_id'])
@Index('idx_zuno_realignment_changes_entity', ['entity_type', 'entity_id'])
export class ZunoRealignmentChange extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'realignment_id' })
  realignment_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 32, name: 'entity_type' })
  entity_type: RealignmentEntityType;

  /**
   * Nullable, and a bare uuid rather than an FK. The referents live in the Plan
   * and MKA modules; those are bound through REALIGNMENT_TARGET at runtime, and
   * a schema-level FK would make this table undeployable until they exist.
   */
  @Column({ type: 'uuid', name: 'entity_id', nullable: true })
  entity_id: string | null;

  @Column({ type: 'varchar', length: 32, name: 'change_type' })
  change_type: RealignmentChangeType;

  @Column({ type: 'jsonb', name: 'before_value', nullable: true })
  before_value: Record<string, unknown> | null;

  @Column({ type: 'jsonb', name: 'after_value', nullable: true })
  after_value: Record<string, unknown> | null;

  /** Why, in language that can be shown to the user (section 61). */
  @Column({ type: 'text' })
  reason: string;

  @ManyToOne(() => ZunoRealignment, (realignment) => realignment.changes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'realignment_id' })
  realignment?: ZunoRealignment;
}
