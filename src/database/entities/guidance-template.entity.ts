import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DailyGuidanceLog } from './daily-guidance-log.entity';

@Entity('guidance_templates')
export class GuidanceTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  body: string;

  @Column({ type: 'float', nullable: true })
  min_score: number;

  @Column({ type: 'float', nullable: true })
  max_score: number;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'free' })
  tier: string; // free | limited | paid | premium

  @Column({ type: 'varchar', length: 200, nullable: true })
  tags: string;

  @Column({ type: 'float', nullable: true })
  score_value: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => DailyGuidanceLog, (log) => log.template)
  guidance_logs: DailyGuidanceLog[];
}







