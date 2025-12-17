import { Entity, Column, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AdmRolePermission } from './adm-role-permission.entity';

/**
 * Admin Role Entity (adm_role)
 * Maps to existing PostgreSQL table
 */
@Entity('adm_role')
@Index(['role_name', 'is_deleted'])
export class AdmRole {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'role_id' })
  role_id: number;

  @Column({ type: 'uuid', default: () => 'gen_random_uuid()', name: 'unique_id' })
  unique_id: string;

  @Column({ type: 'varchar', length: 100, name: 'role_name' })
  role_name: string;

  @Column({ type: 'integer', nullable: true, name: 'role_level' })
  role_level: number | null;

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

  @Column({ type: 'boolean', default: true, name: 'is_master' })
  is_master: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_editable' })
  is_editable: boolean;

  @Column({ type: 'integer', default: 0, name: 'checker_maker' })
  checker_maker: number;

  @OneToMany(() => AdmRolePermission, (rolePermission) => rolePermission.role)
  role_permissions: AdmRolePermission[];
}
