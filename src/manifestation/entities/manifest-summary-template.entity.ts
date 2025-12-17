import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ManifestCategory } from './manifest-category.entity';

@Entity('manifest_summary_templates')
@Index(['category_id'])
@Index(['is_active'])
@Index(['priority'])
export class ManifestSummaryTemplate {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  category_id: string | null;

  @Column({ type: 'text', name: 'template_text' })
  template_text: string;

  @Column({ type: 'integer', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' })
  created_at: Date;

  // Relations
  @ManyToOne(() => ManifestCategory, (category) => category.summary_templates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ManifestCategory | null;
}
