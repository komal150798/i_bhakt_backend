import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import {
  PlanItemCategory,
  PlanItemPriority,
  PlanItemRealignmentPolicy,
  PlanItemScenarioScope,
  PlanItemSource,
  PlanItemStatus,
} from '../enums/plan.enum';
import { ZunoPlan } from './zuno-plan.entity';

/**
 * One executable item in a plan.
 * Step 20 Data Model section 41, Step 16 section 11.
 *
 * `user_id` is denormalised here for the same reason it is on MKA items:
 * `POST /plan-items/{itemId}/complete` addresses the row directly, and every
 * such read must be ownership-checked (Step 20 section 85, Step 21 section 106)
 * without a join that a future refactor could drop.
 *
 * `priority` + `priority_rank`: see the SPEC_CONFLICT note on
 * `PLAN_ITEM_PRIORITY_RANK`. The label is authoritative, the rank is derived
 * and exists for the Step 21 section 51 wire contract and for ordering.
 *
 * `is_practice` is stored rather than inferred from the category, because it is
 * what the capacity rule counts on. Step 16 section 27 lets MKA micro-practices
 * sit alongside the action budget, and section 41 says a 5-minute grounding
 * practice must not compete with a critical loan deadline - a derived flag
 * would put that rule one refactor away from silently inverting.
 */
@Entity('zuno_plan_items')
@Index('idx_zuno_plan_items_plan', ['plan_id', 'display_order'])
@Index('idx_zuno_plan_items_user_status', ['user_id', 'status'])
@Index('idx_zuno_plan_items_plan_status', ['plan_id', 'status'])
@Index('idx_zuno_plan_items_scheduled', ['user_id', 'scheduled_date', 'status'])
@Index('idx_zuno_plan_items_due', ['user_id', 'due_at'])
@Index('idx_zuno_plan_items_mka', ['mka_item_id'])
@Index('idx_zuno_plan_items_parent', ['parent_item_id'])
export class ZunoPlanItem extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'plan_id' })
  plan_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  /** Sub-task grouping, e.g. a 30-day phase. Step 20 section 41. */
  @Column({ type: 'uuid', name: 'parent_item_id', nullable: true })
  parent_item_id: string | null;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Answers "why is this in my plan?" (Step 16 section 71) using facts, goals
   * and scenario relevance only - never a reasoning trace (section 72).
   */
  @Column({ type: 'text', name: 'why_this_matters', nullable: true })
  why_this_matters: string | null;

  @Column({ type: 'varchar', length: 32, default: PlanItemCategory.OTHER })
  category: PlanItemCategory;

  @Column({ type: 'varchar', length: 16, default: PlanItemPriority.IMPORTANT })
  priority: PlanItemPriority;

  @Column({ type: 'int', name: 'priority_rank', default: 2 })
  priority_rank: number;

  @Column({ type: 'boolean', name: 'is_practice', default: false })
  is_practice: boolean;

  @Column({ type: 'varchar', length: 16, default: PlanItemStatus.PENDING })
  status: PlanItemStatus;

  @Column({ type: 'date', name: 'scheduled_date', nullable: true })
  scheduled_date: string | null;

  /**
   * A real deadline only. Step 16 sections 33-34 and Rule 7: never invent a
   * hard deadline, and a real external deadline outranks astrology timing.
   */
  @Column({ type: 'timestamptz', name: 'due_at', nullable: true })
  due_at: string | Date | null;

  @Column({ type: 'varchar', length: 32, name: 'due_source', nullable: true })
  due_source: string | null;

  @Column({ type: 'int', name: 'estimated_minutes', nullable: true })
  estimated_minutes: number | null;

  @Column({ type: 'varchar', length: 40, name: 'source_type' })
  source_type: PlanItemSource;

  @Column({ type: 'uuid', name: 'source_ref_id', nullable: true })
  source_ref_id: string | null;

  /** Set when this item schedules an MKA practice. Step 16 sections 40-43. */
  @Column({ type: 'uuid', name: 'mka_item_id', nullable: true })
  mka_item_id: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'scenario_scope',
    default: PlanItemScenarioScope.SHARED_ACROSS_SCENARIOS,
  })
  scenario_scope: PlanItemScenarioScope;

  /** Populated by the Scenario Engine later; ids only, no embedded content. */
  @Column({ type: 'jsonb', name: 'scenario_refs', default: () => "'[]'::jsonb" })
  scenario_refs: string[];

  /** The Life Signal that activates a CONDITIONAL item. Step 16 section 24. */
  @Column({
    type: 'varchar',
    length: 64,
    name: 'trigger_condition',
    nullable: true,
  })
  trigger_condition: string | null;

  /**
   * Items that must be DONE before this one may start.
   * Step 16 sections 31-32. Enforced in PlanService, not merely displayed.
   */
  @Column({
    type: 'jsonb',
    name: 'depends_on_item_ids',
    default: () => "'[]'::jsonb",
  })
  depends_on_item_ids: string[];

  /** Step 15 section 65: eligibility is explicit, never inferred downstream. */
  @Column({ type: 'boolean', name: 'karma_eligible', default: false })
  karma_eligible: boolean;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'realignment_policy',
    default: PlanItemRealignmentPolicy.PRESERVE_IF_RELEVANT,
  })
  realignment_policy: PlanItemRealignmentPolicy;

  /**
   * Step 16 section 25: actions explored inside a What-If stay hypothetical
   * until the user explicitly adopts them. Rule 4 forbids them entering the
   * active plan silently, so the flag lives on the row itself.
   */
  @Column({ type: 'boolean', name: 'is_hypothetical', default: false })
  is_hypothetical: boolean;

  @Column({ type: 'int', name: 'display_order', default: 0 })
  display_order: number;

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'date', name: 'deferred_to', nullable: true })
  deferred_to: string | null;

  /** Step 16 section 79: a material blocker may become a Life Signal. */
  @Column({ type: 'text', name: 'blocked_reason', nullable: true })
  blocked_reason: string | null;

  @Column({ type: 'int', name: 'deferral_count', default: 0 })
  deferral_count: number;

  @Column({ type: 'text', name: 'user_note', nullable: true })
  user_note: string | null;

  @ManyToOne(() => ZunoPlan, (plan) => plan.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan?: ZunoPlan;
}
