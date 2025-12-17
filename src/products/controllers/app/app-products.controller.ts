import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from '../../services/products.service';
import { Cache } from '../../../cache/decorators/cache.decorator';

@ApiTags('app-products')
@Controller('app/products')
export class AppProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Cache('products:list:app', 3600) // Cache for 1 hour
  @ApiOperation({ summary: 'Get all available products (Mobile App - Public)' })
  @ApiQuery({ name: 'is_available', required: false, type: Boolean })
  @ApiQuery({ name: 'product_type', required: false, type: String })
  @ApiQuery({ name: 'is_featured', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('is_available') isAvailable?: string,
    @Query('product_type') productType?: string,
    @Query('is_featured') isFeatured?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Only show available products to app users (same as web)
    const result = await this.productsService.findAll({
      is_available: isAvailable === 'true' ? true : true, // Default to available only
      product_type: productType,
      is_featured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    // App-specific response format (optimized for mobile)
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

  @Get(':uniqueId')
  @ApiOperation({ summary: 'Get product details by unique ID (Mobile App - Public)' })
  async findOne(@Param('uniqueId') uniqueId: string) {
    const product = await this.productsService.findOneByUniqueId(uniqueId);
    
    // App-specific response format
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
}







