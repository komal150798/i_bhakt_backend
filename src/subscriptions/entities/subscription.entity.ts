import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
import { Order } from '../../orders/entities/order.entity';
import { UsageTracking } from './usage-tracking.entity';

@Entity('subscriptions')
@Index(['user_id', 'is_active', 'is_deleted'])
@Index(['plan_id', 'is_active'])
export class Subscription extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'bigint', name: 'plan_id' })
  plan_id: number;

  @Column({ type: 'enum', enum: PlanType, name: 'plan_type' })
  plan_type: PlanType;

  @Column({ type: 'timestamp', name: 'start_date' })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'end_date' })
  end_date: Date | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  is_active: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_renewal' })
  is_renewal: boolean;

  @Column({ type: 'bigint', nullable: true, name: 'order_id' })
  order_id: number | null;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelled_at: Date | null;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellation_reason: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Plan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'id' })
  plan: Plan;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  order: Order | null;

  @OneToMany(() => UsageTracking, (usage) => usage.subscription)
  usage_tracking: UsageTracking[];
}

