import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from './infrastructure/product.orm-entity';
import { TypeOrmProductRepository } from './infrastructure/typeorm-product.repository';
import { ProductsController } from './infrastructure/products.controller';
import { ProductsSeederService } from './infrastructure/products-seeder.service';
import { ListProductsUseCase } from './application/list-products.use-case';
import { GetProductByIdUseCase } from './application/get-product-by-id.use-case';
import { PRODUCT_REPOSITORY } from './domain/product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductsController],
  providers: [
    ListProductsUseCase,
    GetProductByIdUseCase,
    ProductsSeederService,
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
