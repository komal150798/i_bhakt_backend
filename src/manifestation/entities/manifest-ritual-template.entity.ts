import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ManifestCategory } from './manifest-category.entity';
import { ManifestSubcategory } from './manifest-subcategory.entity';

@Entity('manifest_ritual_templates')
@Index(['category_id'])
@Index(['subcategory_id'])
@Index(['is_active'])
@Index(['priority'])
export class ManifestRitualTemplate {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  category_id: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'subcategory_id' })
  subcategory_id: string | null;

  @Column({ type: 'text', name: 'template_text' })
  template_text: string;
  // example format:
  // "Create a daily intention around {{user_focus}} to strengthen {{category_label}}"

  @Column({ type: 'integer', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' })
  created_at: Date;

  // Relations
  @ManyToOne(() => ManifestCategory, (category) => category.ritual_templates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ManifestCategory | null;

  @ManyToOne(() => ManifestSubcategory, (subcategory) => subcategory.ritual_templates, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: ManifestSubcategory | null;
}
