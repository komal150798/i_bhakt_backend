import { Entity, Column, OneToMany, Index } from 'typeorm';
import { ManifestSubcategory } from './manifest-subcategory.entity';
import { ManifestKeyword } from './manifest-keyword.entity';
import { ManifestRitualTemplate } from './manifest-ritual-template.entity';
import { ManifestToManifestTemplate } from './manifest-to-manifest-template.entity';
import { ManifestNotToManifestTemplate } from './manifest-not-to-manifest-template.entity';
import { ManifestAlignmentTemplate } from './manifest-alignment-template.entity';
import { ManifestInsightTemplate } from './manifest-insight-template.entity';
import { ManifestSummaryTemplate } from './manifest-summary-template.entity';

@Entity('manifest_categories')
@Index(['slug'])
@Index(['is_active'])
export class ManifestCategory {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'text', unique: true })
  slug: string; // e.g., "love", "career", "health"

  @Column({ type: 'text' })
  label: string; // e.g., "Love & Relationships"

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()', name: 'updated_at' })
  updated_at: Date;

  // Relations
  @OneToMany(() => ManifestSubcategory, (subcategory) => subcategory.category)
  subcategories: ManifestSubcategory[];

  @OneToMany(() => ManifestKeyword, (keyword) => keyword.category)
  keywords: ManifestKeyword[];

  @OneToMany(() => ManifestRitualTemplate, (template) => template.category)
  ritual_templates: ManifestRitualTemplate[];

  @OneToMany(() => ManifestToManifestTemplate, (template) => template.category)
  to_manifest_templates: ManifestToManifestTemplate[];

  @OneToMany(() => ManifestNotToManifestTemplate, (template) => template.category)
  not_to_manifest_templates: ManifestNotToManifestTemplate[];

  @OneToMany(() => ManifestAlignmentTemplate, (template) => template.category)
  alignment_templates: ManifestAlignmentTemplate[];

  @OneToMany(() => ManifestInsightTemplate, (template) => template.category)
  insight_templates: ManifestInsightTemplate[];

  @OneToMany(() => ManifestSummaryTemplate, (template) => template.category)
  summary_templates: ManifestSummaryTemplate[];
}
