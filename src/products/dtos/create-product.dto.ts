import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '../entities/product.entity';

class PricingTierDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  min_quantity: number;

  @ApiProperty({ example: 999.00 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'premium-kundli-report' })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiProperty({ example: 'Premium Kundli Report' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Detailed astrological birth chart analysis' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Get your complete birth chart' })
  @IsString()
  @IsOptional()
  short_description?: string;

  @ApiProperty({ example: 999.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 1499.00 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  compare_at_price?: number;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.DIGITAL })
  @IsEnum(ProductType)
  product_type: ProductType;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image_gallery?: string[];

  @ApiPropertyOptional({ example: 'SKU-12345' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: 100, default: 0 })
  @IsNumber()
  @IsOptional()
  stock_quantity?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: [{ min_quantity: 10, price: 899.00 }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  @IsOptional()
  pricing_tiers?: PricingTierDto[];

  @ApiPropertyOptional({ example: { category: 'astrology', tags: ['kundli', 'horoscope'] } })
  @IsOptional()
  metadata?: Record<string, any>;
}







