import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('karma_patterns')
@Index(['user_id', 'pattern_key', 'detected_date'])
export class KarmaPattern extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 100 })
  pattern_key: string; // e.g., 'anger', 'kindness', 'laziness'

  @Column({ type: 'varchar', length: 200 })
  pattern_name: string;

  @Column({ type: 'enum', enum: ['good', 'bad', 'neutral'] })
  pattern_type: 'good' | 'bad' | 'neutral';

  @Column({ type: 'int', default: 0 })
  frequency_count: number; // How many times this pattern was detected

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_score_impact: number; // Total karma score impact from this pattern

  @Column({ type: 'date', name: 'detected_date', default: () => 'CURRENT_DATE' })
  detected_date: Date;

  @Column({ type: 'date', name: 'first_detected_date' })
  first_detected_date: Date;

  @Column({ type: 'date', name: 'last_detected_date' })
  last_detected_date: Date;

  @Column({ type: 'jsonb', nullable: true })
  sample_actions: string[] | null; // Sample action texts that triggered this pattern

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}

