import { ProductType } from '../entities/product.entity';
declare class PricingTierDto {
    min_quantity: number;
    price: number;
}
export declare class CreateProductDto {
    slug: string;
    name: string;
    description?: string;
    short_description?: string;
    price: number;
    compare_at_price?: number;
    currency?: string;
    product_type: ProductType;
    image_url?: string;
    image_gallery?: string[];
    sku?: string;
    stock_quantity?: number;
    is_available?: boolean;
    is_featured?: boolean;
    sort_order?: number;
    pricing_tiers?: PricingTierDto[];
    metadata?: Record<string, any>;
}
export {};
