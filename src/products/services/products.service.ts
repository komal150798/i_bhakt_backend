import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private cacheService: CacheService,
  ) {}

  async create(createProductDto: CreateProductDto, userId: number): Promise<ProductResponseDto> {
    // Check if slug already exists
    const existing = await this.productRepository.findOne({
      where: { slug: createProductDto.slug, is_deleted: false },
    });

    if (existing) {
      throw new ConflictException(`Product with slug "${createProductDto.slug}" already exists`);
    }

    const product = this.productRepository.create({
      ...createProductDto,
      added_by: userId,
      modify_by: userId,
    });

    const saved = await this.productRepository.save(product);
    
    // Clear product list cache
    await this.cacheService.reset();
    
    return this.toResponseDto(saved);
  }

  async findAll(options?: {
    is_available?: boolean;
    product_type?: string;
    is_featured?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: ProductResponseDto[]; meta: any }> {
    // Try cache first
    const cacheKey = this.cacheService.productListKey(options || {});
    const cached = await this.cacheService.get<{ data: ProductResponseDto[]; meta: any }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { is_available, product_type, is_featured, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.is_deleted = :deleted', { deleted: false });

    if (is_available !== undefined) {
      queryBuilder.andWhere('product.is_available = :available', { available: is_available });
    }

    if (product_type) {
      queryBuilder.andWhere('product.product_type = :type', { type: product_type });
    }

    if (is_featured !== undefined) {
      queryBuilder.andWhere('product.is_featured = :featured', { featured: is_featured });
    }

    const [products, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('product.sort_order', 'ASC')
      .addOrderBy('product.added_date', 'DESC')
      .getManyAndCount();

    const result = {
      data: products.map((p) => this.toResponseDto(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache result for 1 hour
    await this.cacheService.set(cacheKey, result, 3600);

    return result;
  }

  async findOneByUniqueId(uniqueId: string): Promise<ProductResponseDto> {
    // Try cache first
    const cacheKey = this.cacheService.productKey(uniqueId);
    const cached = await this.cacheService.get<ProductResponseDto>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
    });

    if (!product) {
      throw new NotFoundException(`Product with unique ID ${uniqueId} not found`);
    }

    const result = this.toResponseDto(product);
    
    // Cache for 1 hour
    await this.cacheService.set(cacheKey, result, 3600);

    return result;
  }

  async update(uniqueId: string, updateProductDto: UpdateProductDto, userId: number): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
    });

    if (!product) {
      throw new NotFoundException(`Product with unique ID ${uniqueId} not found`);
    }

    // Check slug uniqueness if being updated
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existing = await this.productRepository.findOne({
        where: { slug: updateProductDto.slug, is_deleted: false },
      });

      if (existing) {
        throw new ConflictException(`Product with slug "${updateProductDto.slug}" already exists`);
      }
    }

    Object.assign(product, updateProductDto);
    product.modify_by = userId;

    const updated = await this.productRepository.save(product);
    
    // Clear cache
    await this.cacheService.del(this.cacheService.productKey(uniqueId));
    await this.cacheService.reset(); // Clear list cache

    return this.toResponseDto(updated);
  }

  async remove(uniqueId: string, userId: number): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
    });

    if (!product) {
      throw new NotFoundException(`Product with unique ID ${uniqueId} not found`);
    }

    product.is_deleted = true;
    product.modify_by = userId;
    await this.productRepository.save(product);
    
    // Clear cache
    await this.cacheService.del(this.cacheService.productKey(uniqueId));
  }

  async toggleAvailability(uniqueId: string, isAvailable: boolean, userId: number): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
    });

    if (!product) {
      throw new NotFoundException(`Product with unique ID ${uniqueId} not found`);
    }

    product.is_available = isAvailable;
    product.modify_by = userId;

    const updated = await this.productRepository.save(product);
    
    // Clear cache
    await this.cacheService.del(this.cacheService.productKey(uniqueId));
    
    return this.toResponseDto(updated);
  }

  private toResponseDto(product: Product): ProductResponseDto {
    return {
      unique_id: product.unique_id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      short_description: product.short_description,
      price: Number(product.price),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      currency: product.currency,
      product_type: product.product_type,
      image_url: product.image_url,
      image_gallery: product.image_gallery,
      sku: product.sku,
      stock_quantity: product.stock_quantity,
      is_available: product.is_available,
      is_featured: product.is_featured,
      sort_order: product.sort_order,
      metadata: product.metadata,
      pricing_tiers: product.pricing_tiers,
      added_date: product.added_date,
      modify_date: product.modify_date,
    };
  }
}
