import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { GuidanceTemplate } from './guidance-template.entity';

@Entity('daily_guidance_logs')
@Unique(['user_id', 'guidance_date'])
export class DailyGuidanceLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => User, (user) => user.guidance_logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: true })
  template_id: number;

  @ManyToOne(() => GuidanceTemplate, (template) => template.guidance_logs, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: GuidanceTemplate;

  @Column({ type: 'date', nullable: false })
  guidance_date: Date;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'app' })
  delivery_channel: string; // app | email | sms | push | webhook

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  delivered_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;
}







