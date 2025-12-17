import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Admin } from './admin.entity';

@Entity('plan_feature_limits')
@Unique(['plan', 'feature'])
export class PlanFeatureLimit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, nullable: false })
  @Index()
  plan: string; // awaken, karma_builder, karma_pro, dharma_master

  @Column({ type: 'varchar', length: 50, nullable: false })
  @Index()
  feature: string; // cosmic_guidance, manifestation_check, karma_record

  // Usage limits
  @Column({ type: 'int', nullable: true })
  max_per_day: number; // null means unlimited

  @Column({ type: 'int', nullable: true })
  max_per_week: number; // null means unlimited

  @Column({ type: 'int', nullable: true })
  max_per_month: number; // null means unlimited

  // Visibility flags
  @Column({ type: 'boolean', nullable: false, default: true })
  karma_ledger_visible: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  cosmic_blueprint_visible: boolean;

  // Metadata
  @Column({ type: 'int', nullable: true })
  updated_by_admin_id: number;

  @ManyToOne(() => Admin, (admin) => admin.updated_limits, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by_admin_id' })
  updated_by: Admin;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}







