import { ProductsService } from '../../services/products.service';
import { CreateProductDto } from '../../dtos/create-product.dto';
import { UpdateProductDto } from '../../dtos/update-product.dto';
import { ProductResponseDto } from '../../dtos/product-response.dto';
export declare class AdminProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto, user: any): Promise<ProductResponseDto>;
    findAll(isAvailable?: string, productType?: string, isFeatured?: string, page?: string, limit?: string): Promise<{
        data: ProductResponseDto[];
        meta: any;
    }>;
    findOne(uniqueId: string): Promise<ProductResponseDto>;
    update(uniqueId: string, updateProductDto: UpdateProductDto, user: any): Promise<ProductResponseDto>;
    toggleAvailability(uniqueId: string, isAvailable: boolean, user: any): Promise<ProductResponseDto>;
    remove(uniqueId: string, user: any): Promise<void>;
}
