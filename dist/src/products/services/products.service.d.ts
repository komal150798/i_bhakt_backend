import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';
import { CacheService } from '../../cache/cache.service';
export declare class ProductsService {
    private productRepository;
    private cacheService;
    constructor(productRepository: Repository<Product>, cacheService: CacheService);
    create(createProductDto: CreateProductDto, userId: number): Promise<ProductResponseDto>;
    findAll(options?: {
        is_available?: boolean;
        product_type?: string;
        is_featured?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        data: ProductResponseDto[];
        meta: any;
    }>;
    findOneByUniqueId(uniqueId: string): Promise<ProductResponseDto>;
    update(uniqueId: string, updateProductDto: UpdateProductDto, userId: number): Promise<ProductResponseDto>;
    remove(uniqueId: string, userId: number): Promise<void>;
    toggleAvailability(uniqueId: string, isAvailable: boolean, userId: number): Promise<ProductResponseDto>;
    private toResponseDto;
}
