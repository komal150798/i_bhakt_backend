import { ProductsService } from '../../services/products.service';
export declare class WebProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(isAvailable?: string, productType?: string, isFeatured?: string, page?: string, limit?: string): Promise<{
        data: import("../../dtos/product-response.dto").ProductResponseDto[];
        meta: any;
    }>;
    findOne(uniqueId: string): Promise<import("../../dtos/product-response.dto").ProductResponseDto>;
}
