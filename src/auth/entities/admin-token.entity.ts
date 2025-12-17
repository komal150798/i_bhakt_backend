import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AdminUser } from '../../users/entities/admin-user.entity';

/**
 * Admin Tokens Entity (adm_tokens)
 * Stores refresh tokens for admin users
 */
@Entity('adm_tokens')
@Index(['admin_id', 'is_revoked'])
@Index(['token', 'is_revoked'])
@Index(['expires_at'])
export class AdminToken extends BaseEntity {
  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'bigint', name: 'admin_id' })
  admin_id: number;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expires_at: Date;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  is_revoked: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'device_info' })
  device_info: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' })
  ip_address: string | null;

  @ManyToOne(() => AdminUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id', referencedColumnName: 'id' })
  admin: AdminUser;
}


