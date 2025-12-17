import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from '../../services/products.service';
import { Cache } from '../../../cache/decorators/cache.decorator';

@ApiTags('web-products')
@Controller('web/products')
export class WebProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Cache('products:list:web', 3600) // Cache for 1 hour
  @ApiOperation({ summary: 'Get all available products (Web - Public)' })
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
    // Only show available products to web users
    return this.productsService.findAll({
      is_available: isAvailable === 'true' ? true : true, // Default to available only
      product_type: productType,
      is_featured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':uniqueId')
  @ApiOperation({ summary: 'Get product details by unique ID (Web - Public)' })
  async findOne(@Param('uniqueId') uniqueId: string) {
    return this.productsService.findOneByUniqueId(uniqueId);
  }
}







