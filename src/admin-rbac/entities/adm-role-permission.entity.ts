import { Entity, Column, Index, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { AdmRole } from './adm-role.entity';
import { AdmPermission } from './adm-permission.entity';

/**
 * Admin Role Permission Entity (adm_role_permission)
 * Maps to existing PostgreSQL table - junction table for role-permission mapping
 */
@Entity('adm_role_permission')
@Index(['role_id', 'permission_id'])
export class AdmRolePermission {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'ar_id' })
  ar_id: number;

  @Column({ type: 'bigint', name: 'role_id' })
  role_id: number;

  @Column({ type: 'bigint', name: 'permission_id' })
  permission_id: number;

  @Column({ type: 'boolean', default: false, name: 'is_allowed' })
  is_allowed: boolean;

  @Column({ type: 'bigint', nullable: true, name: 'added_by' })
  added_by: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'modify_by' })
  modify_by: number | null;

  @Column({ type: 'timestamp', nullable: true, name: 'added_date', default: () => 'CURRENT_TIMESTAMP' })
  added_date: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'modify_date', onUpdate: 'CURRENT_TIMESTAMP' })
  modify_date: Date | null;

  @ManyToOne(() => AdmRole, (role) => role.role_permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'role_id' })
  role: AdmRole;

  @ManyToOne(() => AdmPermission, (permission) => permission.role_permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id', referencedColumnName: 'permission_id' })
  permission: AdmPermission;
}
