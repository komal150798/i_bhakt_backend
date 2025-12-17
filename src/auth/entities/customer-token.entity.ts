import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../users/entities/customer.entity';

/**
 * Customer Tokens Entity (cst_tokens)
 * Stores refresh tokens for customer users
 */
@Entity('cst_tokens')
@Index(['customer_id', 'is_revoked'])
@Index(['token', 'is_revoked'])
@Index(['expires_at'])
export class CustomerToken extends BaseEntity {
  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'bigint', name: 'customer_id' })
  customer_id: number;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expires_at: Date;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  is_revoked: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'device_info' })
  device_info: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' })
  ip_address: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'login_method' })
  login_method: 'password' | 'otp' | 'google' | null;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'id' })
  customer: Customer;
}


