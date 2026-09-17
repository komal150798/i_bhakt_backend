import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { PlanReviewTrigger, PlanStatus, PlanType } from '../enums/plan.enum';
import { PlanCapacityLimits } from '../enums/plan-capacity';
import { ZunoPlanItem } from './zuno-plan-item.entity';

/**
 * An adaptive plan for one challenge over one horizon.
 * Step 20 Data Model section 39, Step 16 sections 10 and 48.
 *
 * Extends ZunoVersionedEntity: Step 20 section 8 names Plan explicitly, and
 * Step 16 section 89 describes the exact race - plan progress and a realignment
 * arriving together - that optimistic concurrency exists to survive.
 *
 * `capacity_snapshot` records the limits that were in force when the plan was
 * built. Those limits are configurable (Step 16 section 27), so without the
 * snapshot a plan generated under a tighter configuration would later look like
 * an engine that simply under-delivered. It also makes the capacity decision
 * auditable, which section 92 requires of every input used.
 */
@Entity('zuno_plans')
@Index('idx_zuno_plans_user_status', ['user_id', 'status'])
@Index('idx_zuno_plans_challenge', ['challenge_id', 'status'])
@Index('idx_zuno_plans_type', ['challenge_id', 'plan_type', 'status'])
@Index('idx_zuno_plans_window', ['user_id', 'start_date'])
@Index('idx_zuno_plans_review', ['status', 'review_at'])
export class ZunoPlan extends ZunoVersionedEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id' })
  challenge_id: string;

  /** The MKA programme this plan schedules. Step 16 section 40. */
  @Column({ type: 'uuid', name: 'mka_program_id', nullable: true })
  mka_program_id: string | null;

  @Column({ type: 'varchar', length: 16, name: 'plan_type' })
  plan_type: PlanType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  /**
   * The outcome this horizon is for. Step 16 sections 19-20: plan from
   * outcomes first, tasks second. Stored so the "why is this in my plan?"
   * answer (section 71) starts from the goal rather than from the task list.
   */
  @Column({ type: 'varchar', length: 300, name: 'primary_goal', nullable: true })
  primary_goal: string | null;

  @Column({ type: 'date', name: 'start_date' })
  start_date: string;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  end_date: string | null;

  @Column({ type: 'varchar', length: 16, default: PlanStatus.DRAFT })
  status: PlanStatus;

  /**
   * The user's IANA zone at generation time. Step 16 section 60: plan dates
   * must respect the user's local timezone, travel may change it, and it must
   * be persisted explicitly where scheduling matters.
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  timezone: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'review_trigger',
    default: PlanReviewTrigger.END_OF_HORIZON,
  })
  review_trigger: PlanReviewTrigger;

  @Column({ type: 'date', name: 'review_at', nullable: true })
  review_at: string | null;

  /** Reserved for the Realignment Engine (Step 20 section 39). */
  @Column({
    type: 'uuid',
    name: 'generated_from_realignment_id',
    nullable: true,
  })
  generated_from_realignment_id: string | null;

  @Column({ type: 'uuid', name: 'superseded_by_id', nullable: true })
  superseded_by_id: string | null;

  /** Provenance. Step 16 section 93. */
  @Column({ type: 'int', name: 'context_version', default: 0 })
  context_version: number;

  @Column({ type: 'uuid', name: 'safety_decision_id', nullable: true })
  safety_decision_id: string | null;

  @Column({ type: 'varchar', length: 64, name: 'engine_version' })
  engine_version: string;

  @Column({ type: 'varchar', length: 48, name: 'generated_reason' })
  generated_reason: string;

  @Column({
    type: 'jsonb',
    name: 'capacity_snapshot',
    default: () => "'{}'::jsonb",
  })
  capacity_snapshot: Partial<PlanCapacityLimits>;

  @Column({ type: 'timestamptz', name: 'activated_at', nullable: true })
  activated_at: Date | null;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completed_at: Date | null;

  @ManyToOne(() => ZunoUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: ZunoUser;

  @ManyToOne(() => ZunoChallenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge?: ZunoChallenge;

  @OneToMany(() => ZunoPlanItem, (item) => item.plan)
  items?: ZunoPlanItem[];
}
