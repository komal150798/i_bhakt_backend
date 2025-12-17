import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('challenges')
@Index(['challenge_type', 'is_active'])
export class Challenge extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, name: 'challenge_type' })
  challenge_type: string; // '7_day', '30_day', '108_day'

  @Column({ type: 'int', name: 'duration_days' })
  duration_days: number; // 7, 30, or 108

  @Column({ type: 'jsonb', nullable: true, name: 'daily_tasks' })
  daily_tasks: Array<{
    day: number;
    task: string;
    description?: string;
  }> | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}



