import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('karma_weight_rules')
@Index(['category_slug', 'pattern_key'], { unique: true })
export class KarmaWeightRule extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  category_slug: string;

  @Column({ type: 'varchar', length: 100 })
  pattern_key: string; // e.g., 'anger', 'helping', 'lying', 'kindness'

  @Column({ type: 'varchar', length: 200 })
  pattern_name: string;

  @Column({ type: 'enum', enum: ['good', 'bad', 'neutral'] })
  karma_type: 'good' | 'bad' | 'neutral';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_weight: number; // e.g., -25 for anger, +20 for helping

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.0 })
  intensity_multiplier: number; // Multiplier for intensity level

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  keywords: string[] | null; // Keywords that trigger this pattern

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}

