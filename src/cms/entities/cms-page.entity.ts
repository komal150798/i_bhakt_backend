import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { CMSPageType } from '../../common/enums/cms-page-type.enum';

@Entity('cms_pages')
@Index(['slug', 'is_enabled', 'is_deleted'])
@Index(['page_type', 'is_enabled'])
export class CMSPage extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'enum', enum: CMSPageType, default: CMSPageType.STATIC, name: 'page_type' })
  page_type: CMSPageType;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'meta_title' })
  meta_title: string | null;

  @Column({ type: 'text', nullable: true, name: 'meta_description' })
  meta_description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'featured_image' })
  featured_image: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_published' })
  is_published: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  published_at: Date | null;

  @Column({ type: 'integer', default: 0, name: 'view_count' })
  view_count: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}







