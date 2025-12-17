import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AdminToken } from '../../auth/entities/admin-token.entity';
import { AdmRole } from '../../admin-rbac/entities/adm-role.entity';

/**
 * Admin Users Entity (adm_users)
 * For backend admin panel authentication
 */
@Entity('adm_users')
@Index(['username', 'is_deleted'], { unique: true })
@Index(['email', 'is_deleted'], { unique: true })
export class AdminUser extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string; // Hashed with bcrypt

  @Column({ type: 'varchar', length: 200, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string | null;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  last_login: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'last_login_ip' })
  last_login_ip: string | null;

  // Role relationship
  @Column({ type: 'bigint', nullable: true, name: 'role_id' })
  role_id: number | null;

  @ManyToOne(() => AdmRole, { nullable: true })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'role_id' })
  role: AdmRole | null;

  @OneToMany(() => AdminToken, (token) => token.admin)
  tokens: AdminToken[];
}


