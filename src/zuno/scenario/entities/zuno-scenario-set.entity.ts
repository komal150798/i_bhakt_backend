import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoScenario } from './zuno-scenario.entity';
import {
  DecisionReadiness,
  ScenarioSetStatus,
} from '../enums/scenario.enum';
import {
  ScenarioComparison,
  ScenarioPreparation,
  ScenarioProvenance,
  ScenarioSetDiffEntry,
} from './scenario.types';

/**
 * One versioned generation of scenarios for a challenge.
 * Step 12 sections 65, 87-88.
 *
 * Step 20 Data Model section 26 models `scenarios` as a flat table hanging off
 * the challenge. A set table is added above it for one specific reason the
 * engine specification insists on: section 65 requires scenario sets to be
 * versioned ("SCENARIO_SET v1 initial analysis, v2 new layoffs, v3 interview
 * received") and says "never silently overwrite important history", and
 * section 66 requires a diff between versions. Without a set row there is
 * nowhere to hang a version number, a provenance record, the shared preparation
 * that spans the whole set (section 24) or the diff (section 66).
 *
 * Every field in Step 20 section 26 is still present on ZunoScenario. This adds
 * a parent, it does not replace the shape.
 *
 * Not versioned with @VersionColumn: a set is written once and then only
 * superseded. Step 20 section 8 names the entities that need optimistic
 * concurrency and this is not one of them - a new generation produces a new
 * row rather than contending for an old one.
 */
@Entity('zuno_scenario_sets')
@Index(
  'idx_zuno_scenario_sets_version',
  ['challenge_id', 'version_number'],
  { unique: true },
)
@Index('idx_zuno_scenario_sets_user', ['user_id', 'created_at'])
@Index('idx_zuno_scenario_sets_current', ['challenge_id', 'status'])
export class ZunoScenarioSet extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'challenge_id' })
  challenge_id: string;

  /** Denormalised for ownership scoping without a join (Step 20 section 85). */
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /** Step 12 section 65. Monotonic per challenge, never reused. */
  @Column({ type: 'int', name: 'version_number' })
  version_number: number;

  @Column({
    type: 'varchar',
    length: 24,
    default: ScenarioSetStatus.CURRENT,
  })
  status: ScenarioSetStatus;

  /**
   * Step 12 section 86: why this set was generated, e.g. INITIAL_ANALYSIS,
   * LIFE_SIGNAL, USER_REASSESSMENT. Section 86 also lists what must NOT cause
   * regeneration (screen reopen, action marked done), and recording the reason
   * is what makes that auditable rather than aspirational.
   */
  @Column({ type: 'varchar', length: 48, name: 'generated_reason' })
  generated_reason: string;

  /**
   * Step 12 sections 24-25 and 60: the actions that help across several
   * futures. The specification calls this ZUNO's core differentiator, and it
   * belongs to the set rather than to any single scenario by definition.
   */
  @Column({ type: 'jsonb', name: 'shared_preparation', default: () => "'[]'::jsonb" })
  shared_preparation: ScenarioPreparation[];

  /**
   * Step 12 sections 19 and 58: what the Life Signal Engine should watch.
   * Held at set level because the watch list is the union across scenarios.
   */
  @Column({ type: 'jsonb', name: 'watch_signals', default: () => "'[]'::jsonb" })
  watch_signals: string[];

  /** Step 12 section 9: the seeds this set was consolidated from. Audit only. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  seeds: string[];

  /** Step 12 sections 45-46. Qualitative only; never a numeric table. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  comparison: ScenarioComparison[];

  /** Step 12 section 66: what Realignment needs, against the previous set. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  diff: ScenarioSetDiffEntry[];

  /** Step 12 section 37. Meaningful for DECISION sets. */
  @Column({
    type: 'varchar',
    length: 32,
    name: 'decision_readiness',
    nullable: true,
  })
  decision_readiness: DecisionReadiness | null;

  /** Step 12 sections 87-88. Reproducibility and auditability. */
  @Column({ type: 'jsonb' })
  provenance: ScenarioProvenance;

  /**
   * How many of this set's scenarios are user-facing.
   * Step 12 section 5 caps this at four; the CHECK constraint in the migration
   * enforces it at the database, not only in the service.
   */
  @Column({ type: 'int', name: 'user_facing_count', default: 0 })
  user_facing_count: number;

  @Column({ type: 'uuid', name: 'safety_decision_id', nullable: true })
  safety_decision_id: string | null;

  @Column({ type: 'uuid', name: 'ai_generation_run_id', nullable: true })
  ai_generation_run_id: string | null;

  @ManyToOne(() => ZunoChallenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge;

  @OneToMany(() => ZunoScenario, (scenario) => scenario.scenarioSet)
  scenarios?: ZunoScenario[];
}
