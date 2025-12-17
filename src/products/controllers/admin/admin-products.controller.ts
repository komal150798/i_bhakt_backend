import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from '../../services/products.service';
import { CreateProductDto } from '../../dtos/create-product.dto';
import { UpdateProductDto } from '../../dtos/update-product.dto';
import { ProductResponseDto } from '../../dtos/product-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('admin-products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  async create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(createProductDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filters (Admin only)' })
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
    return this.productsService.findAll({
      is_available: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      product_type: productType,
      is_featured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':uniqueId')
  @ApiOperation({ summary: 'Get product by unique ID (Admin only)' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async findOne(@Param('uniqueId') uniqueId: string) {
    return this.productsService.findOneByUniqueId(uniqueId);
  }

  @Put(':uniqueId')
  @ApiOperation({ summary: 'Update product (Admin only)' })
  async update(
    @Param('uniqueId') uniqueId: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.update(uniqueId, updateProductDto, user.id);
  }

  @Patch(':uniqueId/availability')
  @ApiOperation({ summary: 'Toggle product availability (Admin only)' })
  async toggleAvailability(
    @Param('uniqueId') uniqueId: string,
    @Body('is_available') isAvailable: boolean,
    @CurrentUser() user: any,
  ) {
    return this.productsService.toggleAvailability(uniqueId, isAvailable, user.id);
  }

  @Delete(':uniqueId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product (soft delete, Admin only)' })
  async remove(@Param('uniqueId') uniqueId: string, @CurrentUser() user: any) {
    await this.productsService.remove(uniqueId, user.id);
  }
}







