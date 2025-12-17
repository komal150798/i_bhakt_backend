import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Admin } from './admin.entity';

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  @Index()
  admin_id: number;

  @ManyToOne(() => Admin, (admin) => admin.audit_logs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ type: 'varchar', length: 100, nullable: false })
  action: string; // e.g., "update_user_plan", "delete_karma_record"

  @Column({ type: 'varchar', length: 50, nullable: false })
  resource_type: string; // e.g., "user", "karma_record", "config"

  @Column({ type: 'int', nullable: true })
  resource_id: number; // ID of the affected resource

  @Column({ type: 'text', nullable: true })
  details: string; // JSON string with additional details

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  created_at: Date;
}







