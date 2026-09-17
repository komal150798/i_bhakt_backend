import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { RealignmentReasonCode } from '../../signals/enums';
import {
  PlanChangeMode,
  RealignmentLevel,
  RealignmentScope,
  RealignmentStatus,
  RealignmentTrigger,
} from '../enums';
import { ZunoRealignmentChange } from './zuno-realignment-change.entity';
import { ZunoRealignmentAssumption } from './zuno-realignment-assumption.entity';

/**
 * One reassessment of the user's direction. Step 20 Data Model section 34,
 * Step 14 Realignment Engine section 8.
 *
 * Versioned (Step 20 section 8) because a realignment is one of the few things
 * that can invalidate a client's whole picture, and Step 21 section 108 turns a
 * stale write into a 409 specifically so a client holding version 4 cannot
 * overwrite the version 5 a realignment just wrote.
 *
 * WHY EVALUATION AND APPLICATION ARE ONE ROW WITH TWO STATES
 *
 * Step 14 section 83 separates `POST /realignments/evaluate` from
 * `POST /realignments/{id}/apply`, because a change that needs the user's
 * agreement (section 65) must be fully decided before it is performed. Two
 * tables would let a decision exist without its outcome, or an outcome without
 * its decision; one row moving EVALUATED -> APPLIED keeps the provenance chain
 * Step 14 section 89 asks for in a single place.
 */
@Entity('zuno_realignments')
@Index('idx_zuno_realignments_user_challenge', ['user_id', 'challenge_id'])
@Index('idx_zuno_realignments_status', ['status'])
@Index('idx_zuno_realignments_trigger_signal', ['trigger_signal_id'])
@Index('idx_zuno_realignments_fingerprint', ['challenge_id', 'trigger_fingerprint'])
export class ZunoRealignment extends ZunoVersionedEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id' })
  challenge_id: string;

  @Column({ type: 'varchar', length: 32, name: 'trigger_type' })
  trigger_type: RealignmentTrigger;

  /** Step 20 section 34. Null for a user-requested reassessment. */
  @Column({ type: 'uuid', name: 'trigger_signal_id', nullable: true })
  trigger_signal_id: string | null;

  @Column({ type: 'varchar', length: 16 })
  level: RealignmentLevel;

  @Column({ type: 'varchar', length: 24 })
  scope: RealignmentScope;

  @Column({ type: 'varchar', length: 32 })
  status: RealignmentStatus;

  /**
   * The plain-language "why". Step 14 sections 60-61: the user gets "this
   * changes our focus", not "context version 4 invalidated assumption ASM-003".
   */
  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'jsonb', name: 'reason_codes', default: () => "'[]'::jsonb" })
  reason_codes: RealignmentReasonCode[];

  /**
   * Structured references to the state before and after, not copies of it.
   * Step 14 section 91: realignment records may hold sensitive life history, so
   * they point at source rows rather than duplicating conversations.
   */
  @Column({ type: 'jsonb', name: 'previous_state_ref', default: () => "'{}'::jsonb" })
  previous_state_ref: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'new_state_ref', default: () => "'{}'::jsonb" })
  new_state_ref: Record<string, unknown>;

  @Column({ type: 'int', name: 'previous_context_version', nullable: true })
  previous_context_version: number | null;

  @Column({ type: 'int', name: 'current_context_version', nullable: true })
  current_context_version: number | null;

  @Column({
    type: 'varchar',
    length: 16,
    name: 'plan_change_mode',
    default: PlanChangeMode.NONE,
  })
  plan_change_mode: PlanChangeMode;

  @Column({
    type: 'boolean',
    name: 'scenario_reassessment_required',
    default: false,
  })
  scenario_reassessment_required: boolean;

  @Column({ type: 'boolean', name: 'mka_refresh_required', default: false })
  mka_refresh_required: boolean;

  /**
   * Step 14 sections 64-66. Required for choices - dropping a path the user
   * prioritised - but never for an explicit fact they just reported.
   */
  @Column({
    type: 'boolean',
    name: 'user_confirmation_required',
    default: false,
  })
  user_confirmation_required: boolean;

  @Column({ type: 'boolean', name: 'safety_review_required', default: false })
  safety_review_required: boolean;

  /**
   * Idempotency key. Step 14 section 85: trigger + context version + plan
   * version, so the same signal evaluated twice against unchanged state yields
   * the existing realignment rather than a second contradictory one.
   */
  @Column({ type: 'varchar', length: 64, name: 'trigger_fingerprint' })
  trigger_fingerprint: string;

  /** Set when a later realignment replaced this one (section 57). */
  @Column({ type: 'uuid', name: 'superseded_by_id', nullable: true })
  superseded_by_id: string | null;

  /** Provenance of the interpretation used, if any (section 89). */
  @Column({ type: 'uuid', name: 'rulebook_version_id', nullable: true })
  rulebook_version_id: string | null;

  @Column({ type: 'varchar', length: 64, name: 'engine_version' })
  engine_version: string;

  @Column({ type: 'timestamptz', name: 'applied_at', nullable: true })
  applied_at: Date | null;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completed_at: Date | null;

  @ManyToOne(() => ZunoChallenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge;

  @OneToMany(() => ZunoRealignmentChange, (change) => change.realignment)
  changes?: ZunoRealignmentChange[];

  @OneToMany(() => ZunoRealignmentAssumption, (row) => row.realignment)
  assumptions?: ZunoRealignmentAssumption[];
}
