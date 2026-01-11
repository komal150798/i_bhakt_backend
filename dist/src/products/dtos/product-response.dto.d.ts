import { ProductType } from '../entities/product.entity';
export declare class ProductResponseDto {
    unique_id: string;
    slug: string;
    name: string;
    description: string | null;
    short_description: string | null;
    price: number;
    compare_at_price: number | null;
    currency: string;
    product_type: ProductType;
    image_url: string | null;
    image_gallery: string[] | null;
    sku: string | null;
    stock_quantity: number;
    is_available: boolean;
    is_featured: boolean;
    sort_order: number;
    metadata: Record<string, any> | null;
    pricing_tiers: Array<{
        min_quantity: number;
        price: number;
    }> | null;
    added_date: Date;
    modify_date: Date;
}
