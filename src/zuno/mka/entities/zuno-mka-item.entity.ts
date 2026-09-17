import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { MkaDimension, RuleSafetyClass } from '../../common/enums';
import {
  MkaFrequency,
  MkaItemStatus,
  MkaPriority,
  MkaSourceType,
} from '../enums/mka.enum';
import { ZunoMkaProgram } from './zuno-mka-program.entity';

/** Free-form scheduling hints the Plan Engine may use. Step 20 section 37. */
export interface MkaScheduleData {
  /** ISO weekday numbers 1-7 for SPECIFIC_DAY practices. Step 15 section 73. */
  days_of_week?: number[];
  /** SME-approved wording such as "morning". Never invented. */
  preferred_time?: string | null;
  /** SME-approved duration string, e.g. "7 days". Step 15 section 31. */
  duration_text?: string | null;
}

/**
 * One Mind, Karma or Action practice inside a programme.
 * Step 20 Data Model section 37, Step 15 section 9.
 *
 * `user_id` is denormalised onto this row on purpose. Step 20 section 85 and
 * Step 21 section 106 require every read to be ownership-checked, and
 * `POST /mka/items/{itemId}/complete` addresses an item directly. Joining up to
 * the programme to discover the owner would make the cheap, obvious query the
 * unsafe one.
 *
 * PROVENANCE IS NOT OPTIONAL.
 * Step 15 Rule 1 and section 17: every astrology-derived item must trace to an
 * active approved SME Rulebook rule. `source_rule_key`, `source_remedy_key` and
 * `rulebook_version_id` carry that trace, and the migration adds a CHECK
 * constraint so a row asserting APPROVED_ASTRO_REMEDY without a rulebook
 * version cannot physically exist.
 */
@Entity('zuno_mka_items')
@Index('idx_zuno_mka_items_program', ['mka_program_id', 'display_order'])
@Index('idx_zuno_mka_items_user', ['user_id', 'status'])
@Index('idx_zuno_mka_items_dimension', ['mka_program_id', 'dimension'])
@Index('idx_zuno_mka_items_plan_eligible', ['mka_program_id', 'plan_eligible'])
export class ZunoMkaItem extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'mka_program_id' })
  mka_program_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 16 })
  dimension: MkaDimension;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  /**
   * Why this practice exists, in the user's terms. Step 15 section 9 and
   * section 82: "Why this?" must be answerable without exposing reasoning
   * traces or astrological jargon (Build Rule 49).
   */
  @Column({ type: 'text', nullable: true })
  purpose: string | null;

  @Column({ type: 'varchar', length: 40, name: 'source_type' })
  source_type: MkaSourceType;

  /** The SME's own rule id, e.g. RULE-CAREER-007. Step 15 section 17. */
  @Column({ type: 'varchar', length: 64, name: 'source_rule_key', nullable: true })
  source_rule_key: string | null;

  /** The SME's own remedy id, e.g. REM-MANTRA-001. */
  @Column({
    type: 'varchar',
    length: 64,
    name: 'source_remedy_key',
    nullable: true,
  })
  source_remedy_key: string | null;

  @Column({ type: 'uuid', name: 'source_rule_id', nullable: true })
  source_rule_id: string | null;

  @Column({ type: 'uuid', name: 'rulebook_version_id', nullable: true })
  rulebook_version_id: string | null;

  @Column({ type: 'varchar', length: 24, default: MkaFrequency.WEEKLY })
  frequency: MkaFrequency;

  @Column({ type: 'jsonb', name: 'schedule_data', default: () => "'{}'::jsonb" })
  schedule_data: MkaScheduleData;

  @Column({ type: 'int', name: 'duration_minutes', nullable: true })
  duration_minutes: number | null;

  @Column({ type: 'varchar', length: 16, default: MkaPriority.IMPORTANT })
  priority: MkaPriority;

  /**
   * Bounded validity. Step 15 sections 31 and 74: avoid indefinite remedies,
   * and never continue one past the SME's stated window.
   */
  @Column({ type: 'date', name: 'valid_from', nullable: true })
  valid_from: string | null;

  @Column({ type: 'date', name: 'valid_to', nullable: true })
  valid_to: string | null;

  /** Step 16 section 40: only plan-eligible items may become Plan items. */
  @Column({ type: 'boolean', name: 'plan_eligible', default: true })
  plan_eligible: boolean;

  /**
   * Step 15 section 65: not every completion should create Karma points.
   * Eligibility is explicit and deterministic, never inferred downstream.
   */
  @Column({ type: 'boolean', name: 'karma_eligible', default: false })
  karma_eligible: boolean;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'safety_class',
    default: RuleSafetyClass.LOW_RISK,
  })
  safety_class: RuleSafetyClass;

  /**
   * True when this practice is devotional in nature, so a user who prefers
   * practical-only guidance can be served without it (Step 15 sections 38-44).
   */
  @Column({ type: 'boolean', name: 'is_devotional', default: false })
  is_devotional: boolean;

  /** SME-approved neutral alternative keys. Step 15 section 44. */
  @Column({
    type: 'jsonb',
    name: 'alternative_keys',
    default: () => "'[]'::jsonb",
  })
  alternative_keys: string[];

  @Column({ type: 'int', name: 'display_order', default: 0 })
  display_order: number;

  @Column({ type: 'varchar', length: 32, default: MkaItemStatus.ACTIVE })
  status: MkaItemStatus;

  @ManyToOne(() => ZunoMkaProgram, (program) => program.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mka_program_id' })
  program?: ZunoMkaProgram;
}
