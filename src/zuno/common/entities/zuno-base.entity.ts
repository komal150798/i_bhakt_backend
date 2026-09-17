import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  Column,
} from 'typeorm';

/**
 * Base class for every ZUNO entity.
 *
 * Deliberately NOT the legacy `src/common/entities/base.entity.ts`, which uses a
 * bigint auto-increment primary key. Step 20 Data Model section 5 requires a
 * globally unique identifier and section 140 forbids a sequential, guessable id
 * being the security boundary. Mixing the two schemes inside one table would
 * leave ZUNO rows addressable by an enumerable integer.
 *
 * Conventions implemented here:
 *   section 5   id / created_at / updated_at / version / status
 *   section 6   all timestamps are TIMESTAMPTZ in UTC; the user's timezone is
 *               stored separately on the profile and applied at the API edge
 *   section 7   soft delete via deleted_at
 *   section 98  snake_case column names
 */
export abstract class ZunoBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deleted_at: Date | null;
}

/**
 * Base for entities that need optimistic concurrency.
 *
 * Step 20 section 8 names Challenge, Plan, Life Signal, Realignment, Memory and
 * Rulebook activation specifically. Step 21 section 108 turns a stale write into
 * a 409 CONFLICT so a client cannot overwrite newer Realignment state.
 *
 * TypeORM's @VersionColumn increments on every save of a managed entity, which
 * is what makes the check in ZunoVersionGuard meaningful.
 */
export abstract class ZunoVersionedEntity extends ZunoBaseEntity {
  @VersionColumn({ type: 'int', name: 'version', default: 1 })
  version: number;
}

/**
 * Marker for entities that must never be updated after insert.
 *
 * Step 20 section 43 (plan_item_events), section 79 (audit_events) and
 * section 136 (no mutable historical interpretation). Services writing these
 * use insert-only repositories; there is no update path by design.
 */
export abstract class ZunoImmutableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  /**
   * Retained so that retention/erasure workflows can act on immutable history
   * without a destructive UPDATE. Step 20 section 100 requires privacy deletion
   * to be distinguishable from ordinary domain deletion.
   */
  @Column({ type: 'timestamptz', name: 'redacted_at', nullable: true })
  redacted_at: Date | null;
}
