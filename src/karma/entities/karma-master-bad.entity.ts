import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('karma_master_bad')
@Index(['is_enabled', 'is_deleted'])
export class KarmaMasterBad extends BaseEntity {
  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'category_slug' })
  category_slug: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'category_name' })
  category_name: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0, name: 'weight' })
  weight: number;

  @Column({ type: 'integer', default: 0, name: 'match_count' })
  match_count: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}







