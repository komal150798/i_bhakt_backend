import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoScenarioSet } from './zuno-scenario-set.entity';
import { ZunoScenarioCondition } from './zuno-scenario-condition.entity';
import {
  ScenarioCaseClass,
  ScenarioHorizon,
  ScenarioImpact,
  ScenarioRelevance,
  ScenarioStatus,
  ScenarioType,
} from '../enums/scenario.enum';
import { ScenarioPayload } from './scenario.types';

/**
 * A plausible path around a challenge. Step 20 Data Model section 26,
 * Step 12 Scenario Engine.
 *
 * Every field Step 20 section 26 names is here: name, scenario_type,
 * description, status, probability_label, confidence. Three things about how
 * they are typed are load-bearing:
 *
 * `probability_label` is a QUALITATIVE label - PRIMARY, PLAUSIBLE, SECONDARY,
 * CONTINGENCY (Step 12 section 16). It is not a percentage. Step 12 sections 16
 * and 97, Step 20 section 27 and Step 08 section 23 all forbid a numeric event
 * probability without a validated probabilistic model, and no such model
 * exists. The migration adds a CHECK constraint refusing any digit in this
 * column, so a future code path cannot quietly write "72%" into it.
 *
 * `confidence` is confidence that this is a reasonable scenario worth modelling
 * (Step 12 section 50) - NOT the probability the event happens. It is internal
 * by default and Step 12 section 81 keeps it off the default scenario card.
 *
 * `relevance` is how much attention the scenario deserves right now
 * (Step 12 section 17), a separate dimension from `impact` (section 30) -
 * Step 19 section 43 requires that separation so a low-relevance,
 * critical-impact path can still earn contingency preparation.
 *
 * Extends ZunoVersionedEntity because scenario status and relevance are exactly
 * what a Realignment writes while a user may be adopting or rejecting the same
 * row (Step 20 section 8, Step 21 section 108).
 */
@Entity('zuno_scenarios')
@Index('idx_zuno_scenarios_set', ['scenario_set_id', 'display_order'])
@Index('idx_zuno_scenarios_challenge_status', ['challenge_id', 'status'])
@Index('idx_zuno_scenarios_user', ['user_id'])
@Index('idx_zuno_scenarios_relevance', ['challenge_id', 'relevance', 'impact'])
export class ZunoScenario extends ZunoVersionedEntity {
  @Column({ type: 'uuid', name: 'scenario_set_id' })
  scenario_set_id: string;

  @Column({ type: 'uuid', name: 'challenge_id' })
  challenge_id: string;

  /** Denormalised for ownership scoping without a join (Step 20 section 85). */
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /** Step 20 section 26 calls this `name`. Step 12 section 81: title only. */
  @Column({ type: 'varchar', length: 200 })
  name: string;

  /** Step 12 section 81: one concise meaning on the default card. */
  @Column({ type: 'text' })
  description: string;

  /** Step 12 section 4 vocabulary - the authoritative engine classification. */
  @Column({ type: 'varchar', length: 32, name: 'scenario_type' })
  scenario_type: ScenarioType;

  /** Step 20 section 27 vocabulary, derived deterministically from the above. */
  @Column({ type: 'varchar', length: 32, name: 'case_class' })
  case_class: ScenarioCaseClass;

  @Column({
    type: 'varchar',
    length: 32,
    default: ScenarioStatus.ACTIVE_CANDIDATE,
  })
  status: ScenarioStatus;

  /** Step 12 section 17. Attention, not probability. */
  @Column({ type: 'varchar', length: 16 })
  relevance: ScenarioRelevance;

  /** Step 12 section 30. A separate dimension from relevance. */
  @Column({ type: 'varchar', length: 16 })
  impact: ScenarioImpact;

  /** Step 12 section 18. */
  @Column({ type: 'varchar', length: 24, default: ScenarioHorizon.UNSPECIFIED })
  horizon: ScenarioHorizon;

  /**
   * Step 20 section 26 / Step 12 section 16. Qualitative words only.
   * Guarded by chk_zuno_scenarios_probability_label_not_numeric.
   */
  @Column({
    type: 'varchar',
    length: 32,
    name: 'probability_label',
    nullable: true,
  })
  probability_label: string | null;

  /** Step 12 section 50. Internal by default. 0..1, stored as NUMERIC(4,3). */
  @Column({ type: 'numeric', precision: 4, scale: 3, nullable: true })
  confidence: string | null;

  /**
   * Step 12 section 39 and Step 20 Rule 4.
   *
   * Scenarios generated into a set describe the factual branch space and are
   * never hypothetical; a What-If lives in its own tables entirely. The column
   * exists so that a promoted What-If (Step 12 section 68) can be admitted into
   * a set while still carrying its origin, and the migration's CHECK constraint
   * pins it: only a USER_DEFINED_WHAT_IF row may be marked hypothetical.
   */
  @Column({ type: 'boolean', default: false })
  hypothetical: boolean;

  /** Step 12 section 54: not every scenario is shown by default. */
  @Column({ type: 'boolean', name: 'user_facing', default: true })
  user_facing: boolean;

  @Column({ type: 'int', name: 'display_order', default: 0 })
  display_order: number;

  /** Step 12 sections 33-35: the option this DECISION scenario corresponds to. */
  @Column({ type: 'varchar', length: 64, name: 'option_ref', nullable: true })
  option_ref: string | null;

  /** Step 12 sections 6, 13, 26, 29, 35, 48. The structured body. */
  @Column({ type: 'jsonb' })
  payload: ScenarioPayload;

  /**
   * Step 12 section 69. Recorded so a rejected path is not re-surfaced, and so
   * the Plan Engine can see the user's stated boundary (Rule 9).
   */
  @Column({ type: 'text', name: 'user_decision_note', nullable: true })
  user_decision_note: string | null;

  /** Step 12 section 23: when this path stopped being hypothetical. */
  @Column({ type: 'timestamptz', name: 'triggered_at', nullable: true })
  triggered_at: Date | null;

  @ManyToOne(() => ZunoScenarioSet, (set) => set.scenarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scenario_set_id' })
  scenarioSet?: ZunoScenarioSet;

  @ManyToOne(() => ZunoChallenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge;

  @OneToMany(() => ZunoScenarioCondition, (condition) => condition.scenario)
  conditions?: ZunoScenarioCondition[];
}
