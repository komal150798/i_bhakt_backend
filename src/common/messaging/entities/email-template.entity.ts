import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../entities/base.entity';

@Entity('email_templates')
@Index(['template_code'], { unique: true })
@Index(['is_active'])
export class EmailTemplate extends BaseEntity {
  @Column({ type: 'text', unique: true, name: 'template_code' })
  template_code: string; // e.g. 'WELCOME_EMAIL', 'RESET_PASSWORD_EMAIL'

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text' })
  body: string; // HTML or text

  @Column({ type: 'boolean', default: true, name: 'is_html' })
  is_html: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  created_by: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updated_by: number | null;
}

