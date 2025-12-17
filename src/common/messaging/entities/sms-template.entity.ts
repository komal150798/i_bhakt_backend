import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../entities/base.entity';

@Entity('sms_templates')
@Index(['template_code'], { unique: true })
@Index(['is_active'])
export class SmsTemplate extends BaseEntity {
  @Column({ type: 'text', unique: true, name: 'template_code' })
  template_code: string; // e.g. 'OTP_LOGIN_SMS', 'PAYMENT_ALERT_SMS'

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  body: string; // with placeholders, e.g. "Hi {{name}}, OTP is {{otp}}"

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  created_by: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updated_by: number | null;
}

