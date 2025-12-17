import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../entities/base.entity';

@Entity('sms_credentials')
@Index(['provider_name'])
@Index(['is_active'])
export class SmsCredential extends BaseEntity {
  @Column({ type: 'text', name: 'provider_name' })
  provider_name: string; // e.g. 'TWILIO', 'MSG91', 'TEXTLOCAL'

  @Column({ type: 'text', name: 'api_key' })
  api_key: string;

  @Column({ type: 'text', nullable: true, name: 'api_secret' })
  api_secret: string | null;

  @Column({ type: 'text', nullable: true, name: 'sender_id' })
  sender_id: string | null;

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

