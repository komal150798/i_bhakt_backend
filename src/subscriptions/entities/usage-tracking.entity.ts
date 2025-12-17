import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Subscription } from './subscription.entity';

@Entity('usage_tracking')
@Index(['user_id', 'module_slug', 'period'])
@Index(['subscription_id', 'period'])
export class UsageTracking extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'bigint', nullable: true, name: 'subscription_id' })
  subscription_id: number | null;

  @Column({ type: 'varchar', length: 100, name: 'module_slug' })
  module_slug: string;

  @Column({ type: 'varchar', length: 50, name: 'action_type' })
  action_type: string; // e.g., 'karma_entry', 'manifestation_entry', 'kundli_generation'

  @Column({ type: 'integer', default: 0, name: 'usage_count' })
  usage_count: number;

  @Column({ type: 'integer', nullable: true, name: 'limit' })
  limit: number | null;

  @Column({ type: 'date', name: 'period' })
  period: Date; // Monthly period (YYYY-MM-01)

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Subscription, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscription_id', referencedColumnName: 'id' })
  subscription: Subscription | null;
}







