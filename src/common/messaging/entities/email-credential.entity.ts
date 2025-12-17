import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../entities/base.entity';

@Entity('email_credentials')
@Index(['provider_name'])
@Index(['is_active'])
export class EmailCredential extends BaseEntity {
  @Column({ type: 'text', name: 'provider_name' })
  provider_name: string; // e.g. 'MAILGUN', 'SENDGRID', 'SES'

  @Column({ type: 'text', name: 'api_key' })
  api_key: string;

  @Column({ type: 'text', nullable: true })
  domain: string | null;

  @Column({ type: 'text', name: 'from_email' })
  from_email: string;

  @Column({ type: 'text', nullable: true, name: 'from_name' })
  from_name: string | null;

  @Column({ type: 'text', nullable: true, name: 'base_url' })
  base_url: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'extra_config' })
  extra_config: Record<string, any> | null;

  @Column({ type: 'boolean', default: false, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  created_by: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updated_by: number | null;
}

