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
exports.AdminProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const products_service_1 = require("../../services/products.service");
const create_product_dto_1 = require("../../dtos/create-product.dto");
const update_product_dto_1 = require("../../dtos/update-product.dto");
const product_response_dto_1 = require("../../dtos/product-response.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../../../common/enums/user-role.enum");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
let AdminProductsController = class AdminProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    async create(createProductDto, user) {
        return this.productsService.create(createProductDto, user.id);
    }
    async findAll(isAvailable, productType, isFeatured, page, limit) {
        return this.productsService.findAll({
            is_available: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
            product_type: productType,
            is_featured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
    async findOne(uniqueId) {
        return this.productsService.findOneByUniqueId(uniqueId);
    }
    async update(uniqueId, updateProductDto, user) {
        return this.productsService.update(uniqueId, updateProductDto, user.id);
    }
    async toggleAvailability(uniqueId, isAvailable, user) {
        return this.productsService.toggleAvailability(uniqueId, isAvailable, user.id);
    }
    async remove(uniqueId, user) {
        await this.productsService.remove(uniqueId, user.id);
    }
};
exports.AdminProductsController = AdminProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new product (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Product created', type: product_response_dto_1.ProductResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto, Object]),
    __metadata("design:returntype", Promise)
], AdminProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all products with filters (Admin only)' }),
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
], AdminProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':uniqueId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product by unique ID (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: product_response_dto_1.ProductResponseDto }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':uniqueId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update product (Admin only)' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_dto_1.UpdateProductDto, Object]),
    __metadata("design:returntype", Promise)
], AdminProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':uniqueId/availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle product availability (Admin only)' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __param(1, (0, common_1.Body)('is_available')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], AdminProductsController.prototype, "toggleAvailability", null);
__decorate([
    (0, common_1.Delete)(':uniqueId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete product (soft delete, Admin only)' }),
    __param(0, (0, common_1.Param)('uniqueId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminProductsController.prototype, "remove", null);
exports.AdminProductsController = AdminProductsController = __decorate([
    (0, swagger_1.ApiTags)('admin-products'),
    (0, common_1.Controller)('admin/products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], AdminProductsController);
//# sourceMappingURL=admin-products.controller.js.map