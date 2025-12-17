import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('karma_score_summaries')
@Index(['user_id', 'period_type', 'period_start'], { unique: true })
export class KarmaScoreSummary extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'enum', enum: ['daily', 'weekly', 'monthly'] })
  period_type: 'daily' | 'weekly' | 'monthly';

  @Column({ type: 'date', name: 'period_start' })
  period_start: Date;

  @Column({ type: 'date', name: 'period_end' })
  period_end: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  karma_score: number; // 0-100 normalized score

  @Column({ type: 'int', default: 0 })
  total_good_actions: number;

  @Column({ type: 'int', default: 0 })
  total_bad_actions: number;

  @Column({ type: 'int', default: 0 })
  total_neutral_actions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_positive_points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_negative_points: number;

  @Column({ type: 'text', nullable: true })
  ai_summary: string | null; // AI-generated summary for this period

  @Column({ type: 'text', nullable: true })
  prediction: string | null; // AI prediction about future karma score

  @Column({ type: 'jsonb', nullable: true })
  top_patterns: Record<string, any> | null; // Top detected patterns

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}

