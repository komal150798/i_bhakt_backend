import { ProductsService } from '../../services/products.service';
export declare class AppProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(isAvailable?: string, productType?: string, isFeatured?: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            price: number;
            image: string;
            available: boolean;
        }[];
        meta: any;
    }>;
    findOne(uniqueId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string;
            price: number;
            images: string[];
            available: boolean;
        };
    }>;
}
