import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('karma_habit_suggestions')
@Index(['pattern_key', 'priority'])
export class KarmaHabitSuggestion extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  pattern_key: string; // e.g., 'anger', 'laziness', 'dishonesty'

  @Column({ type: 'varchar', length: 200 })
  habit_title: string;

  @Column({ type: 'text' })
  habit_description: string;

  @Column({ type: 'int', default: 1 })
  priority: number; // 1 = highest priority

  @Column({ type: 'int', default: 30 })
  duration_days: number; // How many days this habit should be practiced

  @Column({ type: 'jsonb', nullable: true })
  daily_tasks: string[] | null; // Array of daily actionable tasks

  @Column({ type: 'text', nullable: true })
  motivational_message: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}

