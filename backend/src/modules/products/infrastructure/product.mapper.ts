import { Product } from '../domain/product';
import { ProductOrmEntity } from './product.orm-entity';

export class ProductMapper {
  static toDomain(entity: ProductOrmEntity): Product {
    return Product.reconstitute({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      priceCents: entity.priceCents,
      stock: entity.stock,
      imageUrl: entity.imageUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(product: Product): ProductOrmEntity {
    const entity = new ProductOrmEntity();
    entity.id = product.id;
    entity.name = product.name;
    entity.description = product.description;
    entity.priceCents = product.priceCents;
    entity.stock = product.stock;
    entity.imageUrl = product.imageUrl;
    entity.createdAt = product.createdAt;
    entity.updatedAt = product.updatedAt;
    return entity;
  }
}
