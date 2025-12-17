import { Entity, Column, ManyToMany, JoinTable, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
import { Module } from '../../modules/entities/module.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('plans')
@Index(['plan_type', 'is_enabled', 'is_deleted'])
export class Plan extends BaseEntity {
  @Column({ type: 'enum', enum: PlanType, unique: true, name: 'plan_type' })
  plan_type: PlanType;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true, name: 'tagline' })
  tagline: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'monthly_price' })
  monthly_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'yearly_price' })
  yearly_price: number | null;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'integer', nullable: true, name: 'billing_cycle_days' })
  billing_cycle_days: number | null;

  @Column({ type: 'integer', nullable: true, name: 'trial_days' })
  trial_days: number | null;

  @Column({ type: 'integer', nullable: true, name: 'referral_count_required' })
  referral_count_required: number | null;

  @Column({ type: 'boolean', default: false, name: 'is_popular' })
  is_popular: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  is_featured: boolean;

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sort_order: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'badge_color' })
  badge_color: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'badge_icon' })
  badge_icon: string | null;

  @Column({ type: 'jsonb', nullable: true })
  features: Array<{
    name: string;
    description?: string;
    icon?: string;
  }> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'usage_limits' })
  usage_limits: Record<string, number> | null; // e.g., { "karma_entries": 100, "manifestation_entries": 50 }

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToMany(() => Module, (module) => module.plans)
  @JoinTable({
    name: 'plan_modules',
    joinColumn: { name: 'plan_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'module_id', referencedColumnName: 'id' },
  })
  modules: Module[];

  @ManyToMany(() => Product, (product) => product.plans)
  products: Product[];

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
