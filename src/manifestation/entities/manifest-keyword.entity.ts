import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ManifestCategory } from './manifest-category.entity';
import { ManifestSubcategory } from './manifest-subcategory.entity';

@Entity('manifest_keywords')
@Index(['keyword'])
@Index(['category_id'])
@Index(['subcategory_id'])
export class ManifestKeyword {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'text' })
  keyword: string; // e.g., "love", "marriage", "relationship"

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  category_id: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'subcategory_id' })
  subcategory_id: string | null;

  @Column({ type: 'integer', default: 1 })
  weight: number; // importance score for detection

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' })
  created_at: Date;

  // Relations
  @ManyToOne(() => ManifestCategory, (category) => category.keywords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ManifestCategory | null;

  @ManyToOne(() => ManifestSubcategory, (subcategory) => subcategory.keywords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: ManifestSubcategory | null;
}
