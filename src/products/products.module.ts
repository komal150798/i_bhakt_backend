import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminProductsController } from './controllers/admin/admin-products.controller';
import { WebProductsController } from './controllers/web/web-products.controller';
import { AppProductsController } from './controllers/app/app-products.controller';
import { ProductsService } from './services/products.service';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [
    AdminProductsController,
    WebProductsController,
    AppProductsController,
  ],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
