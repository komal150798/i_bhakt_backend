import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoScenario } from './zuno-scenario.entity';
import { ScenarioConditionType } from '../enums/scenario.enum';

/**
 * A condition that makes a scenario more or less relevant.
 * Step 20 Data Model section 28, Step 12 sections 19-20 and 58.
 *
 * These are rows rather than an array inside `scenarios.payload` because the
 * Life Signal Engine queries them directly: Step 12 section 58 says every
 * active scenario's `signals_to_watch` "become monitored Life Signal classes",
 * which means a signal arriving needs to find the scenarios it affects without
 * scanning every JSONB document on the table. `signal_definition` carries the
 * machine-readable matcher; `description` carries the human sentence.
 *
 * Signals against (section 20) are the same structure with the opposite type.
 * Modelling them as a separate table would duplicate the index for no gain.
 */
@Entity('zuno_scenario_conditions')
@Index('idx_zuno_scenario_conditions_scenario', ['scenario_id', 'condition_type'])
@Index('idx_zuno_scenario_conditions_user', ['user_id'])
export class ZunoScenarioCondition extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'scenario_id' })
  scenario_id: string;

  /** Denormalised for ownership scoping without a join (Step 20 section 85). */
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 32, name: 'condition_type' })
  condition_type: ScenarioConditionType;

  /** Plain language, e.g. "Formal restructuring notice". */
  @Column({ type: 'text' })
  description: string;

  /**
   * Machine-readable definition for the Life Signal Engine.
   *
   * Left deliberately open (`Record<string, unknown>`) rather than typed to a
   * signal contract this phase does not own. The Life Signal Engine is being
   * built separately; committing to its matcher shape from here would create a
   * cross-module coupling that Build Rule 18 asks us to avoid, and would be a
   * guess either way.
   */
  @Column({
    type: 'jsonb',
    name: 'signal_definition',
    default: () => "'{}'::jsonb",
  })
  signal_definition: Record<string, unknown>;

  @ManyToOne(() => ZunoScenario, (scenario) => scenario.conditions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scenario_id' })
  scenario?: ZunoScenario;
}
