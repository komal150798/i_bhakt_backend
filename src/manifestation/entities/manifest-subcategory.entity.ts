import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { ManifestCategory } from './manifest-category.entity';
import { ManifestKeyword } from './manifest-keyword.entity';
import { ManifestRitualTemplate } from './manifest-ritual-template.entity';
import { ManifestToManifestTemplate } from './manifest-to-manifest-template.entity';
import { ManifestNotToManifestTemplate } from './manifest-not-to-manifest-template.entity';
import { ManifestAlignmentTemplate } from './manifest-alignment-template.entity';

@Entity('manifest_subcategories')
@Index(['slug'])
@Index(['category_id'])
@Index(['is_active'])
export class ManifestSubcategory {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', name: 'category_id' })
  category_id: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text' })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()', name: 'updated_at' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => ManifestCategory, (category) => category.subcategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ManifestCategory;

  @OneToMany(() => ManifestKeyword, (keyword) => keyword.subcategory)
  keywords: ManifestKeyword[];

  @OneToMany(() => ManifestRitualTemplate, (template) => template.subcategory)
  ritual_templates: ManifestRitualTemplate[];

  @OneToMany(() => ManifestToManifestTemplate, (template) => template.subcategory)
  to_manifest_templates: ManifestToManifestTemplate[];

  @OneToMany(() => ManifestNotToManifestTemplate, (template) => template.subcategory)
  not_to_manifest_templates: ManifestNotToManifestTemplate[];

  @OneToMany(() => ManifestAlignmentTemplate, (template) => template.subcategory)
  alignment_templates: ManifestAlignmentTemplate[];
}
