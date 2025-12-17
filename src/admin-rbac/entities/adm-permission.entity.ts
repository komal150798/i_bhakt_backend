import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AdmRolePermission } from './adm-role-permission.entity';

/**
 * Admin Permission Entity (adm_permission)
 * Maps to existing PostgreSQL table
 */
@Entity('adm_permission')
@Index(['parent_id', 'is_deleted'])
export class AdmPermission {
  @Column({ type: 'bigint', primary: true, name: 'permission_id' })
  permission_id: number;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'menu_name' })
  menu_name: string | null;

  @Column({ type: 'boolean', default: false, name: 'has_submenu' })
  has_submenu: boolean;

  @Column({ type: 'bigint', nullable: true, name: 'parent_id' })
  parent_id: number | null;

  @Column({ type: 'boolean', default: true, name: 'is_enabled' })
  is_enabled: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  is_deleted: boolean;

  @Column({ type: 'bigint', nullable: true, name: 'added_by' })
  added_by: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'modify_by' })
  modify_by: number | null;

  @Column({ type: 'timestamp', nullable: true, name: 'added_date', default: () => 'CURRENT_TIMESTAMP' })
  added_date: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'modify_date', onUpdate: 'CURRENT_TIMESTAMP' })
  modify_date: Date | null;

  // Self-referencing relationship for parent-child
  @ManyToOne(() => AdmPermission, (permission) => permission.children, { nullable: true })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'permission_id' })
  parent: AdmPermission | null;

  @OneToMany(() => AdmPermission, (permission) => permission.parent)
  children: AdmPermission[];

  @OneToMany(() => AdmRolePermission, (rolePermission) => rolePermission.permission)
  role_permissions: AdmRolePermission[];
}
