import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('daily_alignment_tips')
@Unique(['user_id', 'tip_text'])
export class DailyAlignmentTip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => User, (user) => user.alignment_tips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: false })
  tip_text: string;

  @Column({ type: 'text', nullable: true })
  manifestation_summary: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'manifestation' })
  source: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'active' })
  status: string; // active | archived

  @Column({ type: 'datetime', nullable: true })
  last_added_to_journal_at: Date;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'daily' })
  frequency: string; // daily | weekly | specific_day

  @Column({ type: 'int', nullable: true })
  scheduled_day: number; // 0=Monday..6

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'datetime', nullable: true })
  last_generated_at: Date;

  @Column({ type: 'int', nullable: false, default: 3 })
  auto_archive_after_days: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}







