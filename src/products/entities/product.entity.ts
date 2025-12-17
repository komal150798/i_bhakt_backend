import { Entity, Column, ManyToMany, JoinTable, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Plan } from '../../plans/entities/plan.entity';

export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SUBSCRIPTION_ADDON = 'subscription_addon',
  SERVICE = 'service',
}

@Entity('products')
@Index(['slug', 'is_enabled', 'is_deleted'])
@Index(['product_type', 'is_enabled'])
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true, name: 'short_description' })
  short_description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'compare_at_price' })
  compare_at_price: number | null;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'enum', enum: ProductType, default: ProductType.DIGITAL, name: 'product_type' })
  product_type: ProductType;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_url' })
  image_url: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'image_gallery' })
  image_gallery: string[] | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'sku' })
  sku: string | null;

  @Column({ type: 'integer', default: 0, name: 'stock_quantity' })
  stock_quantity: number;

  @Column({ type: 'boolean', default: true, name: 'is_available' })
  is_available: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  is_featured: boolean;

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sort_order: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'pricing_tiers' })
  pricing_tiers: Array<{
    min_quantity: number;
    price: number;
  }> | null;

  @ManyToMany(() => Plan, (plan) => plan.products)
  @JoinTable({
    name: 'product_plans',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'plan_id', referencedColumnName: 'id' },
  })
  plans: Plan[];
}
