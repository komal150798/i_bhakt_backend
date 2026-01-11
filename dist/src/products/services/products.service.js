"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../entities/product.entity");
const cache_service_1 = require("../../cache/cache.service");
let ProductsService = class ProductsService {
    constructor(productRepository, cacheService) {
        this.productRepository = productRepository;
        this.cacheService = cacheService;
    }
    async create(createProductDto, userId) {
        const existing = await this.productRepository.findOne({
            where: { slug: createProductDto.slug, is_deleted: false },
        });
        if (existing) {
            throw new common_1.ConflictException(`Product with slug "${createProductDto.slug}" already exists`);
        }
        const product = this.productRepository.create({
            ...createProductDto,
            added_by: userId,
            modify_by: userId,
        });
        const saved = await this.productRepository.save(product);
        await this.cacheService.reset();
        return this.toResponseDto(saved);
    }
    async findAll(options) {
        const cacheKey = this.cacheService.productListKey(options || {});
        const cached = await this.cacheService.get(cacheKey);
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
        await this.cacheService.set(cacheKey, result, 3600);
        return result;
    }
    async findOneByUniqueId(uniqueId) {
        const cacheKey = this.cacheService.productKey(uniqueId);
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const product = await this.productRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with unique ID ${uniqueId} not found`);
        }
        const result = this.toResponseDto(product);
        await this.cacheService.set(cacheKey, result, 3600);
        return result;
    }
    async update(uniqueId, updateProductDto, userId) {
        const product = await this.productRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with unique ID ${uniqueId} not found`);
        }
        if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
            const existing = await this.productRepository.findOne({
                where: { slug: updateProductDto.slug, is_deleted: false },
            });
            if (existing) {
                throw new common_1.ConflictException(`Product with slug "${updateProductDto.slug}" already exists`);
            }
        }
        Object.assign(product, updateProductDto);
        product.modify_by = userId;
        const updated = await this.productRepository.save(product);
        await this.cacheService.del(this.cacheService.productKey(uniqueId));
        await this.cacheService.reset();
        return this.toResponseDto(updated);
    }
    async remove(uniqueId, userId) {
        const product = await this.productRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with unique ID ${uniqueId} not found`);
        }
        product.is_deleted = true;
        product.modify_by = userId;
        await this.productRepository.save(product);
        await this.cacheService.del(this.cacheService.productKey(uniqueId));
    }
    async toggleAvailability(uniqueId, isAvailable, userId) {
        const product = await this.productRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with unique ID ${uniqueId} not found`);
        }
        product.is_available = isAvailable;
        product.modify_by = userId;
        const updated = await this.productRepository.save(product);
        await this.cacheService.del(this.cacheService.productKey(uniqueId));
        return this.toResponseDto(updated);
    }
    toResponseDto(product) {
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cache_service_1.CacheService])
], ProductsService);
//# sourceMappingURL=products.service.js.map