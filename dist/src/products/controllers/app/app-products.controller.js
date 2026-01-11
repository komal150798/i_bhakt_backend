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
exports.AppProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const products_service_1 = require("../../services/products.service");
const cache_decorator_1 = require("../../../cache/decorators/cache.decorator");
let AppProductsController = class AppProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    async findAll(isAvailable, productType, isFeatured, page, limit) {
        const result = await this.productsService.findAll({
            is_available: isAvailable === 'true' ? true : true,
            product_type: productType,
            is_featured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
        return {
            success: true,
            data: result.data.map((product) => ({
                id: product.unique_id,
                name: product.name,
                price: product.price,
                image: product.image_url,
                available: product.is_available,
            })),
            meta: result.meta,
        };
    }
    async findOne(uniqueId) {
        const product = await this.productsService.findOneByUniqueId(uniqueId);
        return {
            success: true,
            data: {
                id: product.unique_id,
                name: product.name,
                description: product.description,
                price: product.price,
                images: product.image_gallery || [product.image_url],
                available: product.is_available,
            },
        };
    }
};
exports.AppProductsController = AppProductsController;
__decorate([
    (0, common_1.Get)(),
    (0, cache_decorator_1.Cache)('products:list:app', 3600),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available products (Mobile App - Public)' }),
    (0, swagger_1.ApiQuery)({ name: 'is_available', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'product_type', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'is_featured', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('is_available')),
    __param(1, (0, common_1.Query)('product_type')),
    __param(2, (0, common_1.Query)('is_featured')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':uniqueId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product details by unique ID (Mobile App - Public)' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppProductsController.prototype, "findOne", null);
exports.AppProductsController = AppProductsController = __decorate([
    (0, swagger_1.ApiTags)('app-products'),
    (0, common_1.Controller)('app/products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], AppProductsController);
//# sourceMappingURL=app-products.controller.js.map