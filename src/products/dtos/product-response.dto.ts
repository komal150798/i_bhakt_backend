import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from '../entities/product.entity';

export class ProductResponseDto {
  @ApiProperty()
  unique_id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  short_description: string | null;

  @ApiProperty()
  price: number;

  @ApiProperty({ nullable: true })
  compare_at_price: number | null;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: ProductType })
  product_type: ProductType;

  @ApiProperty({ nullable: true })
  image_url: string | null;

  @ApiProperty({ nullable: true })
  image_gallery: string[] | null;

  @ApiProperty({ nullable: true })
  sku: string | null;

  @ApiProperty()
  stock_quantity: number;

  @ApiProperty()
  is_available: boolean;

  @ApiProperty()
  is_featured: boolean;

  @ApiProperty()
  sort_order: number;

  @ApiProperty({ nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ nullable: true })
  pricing_tiers: Array<{ min_quantity: number; price: number }> | null;

  @ApiProperty()
  added_date: Date;

  @ApiProperty()
  modify_date: Date;
}







