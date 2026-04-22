import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('testimonials')
export class Testimonial extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'smallint', default: 5 })
  rating: number; // 1-5 stars

  @Column({ type: 'varchar', length: 50 })
  category: string; // manifestation, career, love, spiritual, karma

  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  is_featured: boolean;

  @Column({ type: 'integer', default: 0, name: 'display_order' })
  display_order: number;
}
