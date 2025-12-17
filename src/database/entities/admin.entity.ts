import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AdminAuditLog } from './admin-audit-log.entity';
import { AppConfig } from './app-config.entity';
import { PlanFeatureLimit } from './plan-feature-limit.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password_hash: string;

  @Column({ type: 'boolean', nullable: false, default: true })
  is_active: boolean;

  @Column({ type: 'boolean', nullable: false, default: false })
  is_super_admin: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => AdminAuditLog, (log) => log.admin)
  audit_logs: AdminAuditLog[];

  @OneToMany(() => AppConfig, (config) => config.updated_by)
  updated_configs: AppConfig[];

  @OneToMany(() => PlanFeatureLimit, (limit) => limit.updated_by)
  updated_limits: PlanFeatureLimit[];
}

