import { ProductMapper } from './product.mapper';
import { ProductOrmEntity } from './product.orm-entity';

describe('ProductMapper', () => {
  const buildOrmEntity = (): ProductOrmEntity => {
    const entity = new ProductOrmEntity();
    entity.id = 'product-1';
    entity.name = 'Keyboard';
    entity.description = 'A keyboard';
    entity.priceCents = 9999;
    entity.stock = 5;
    entity.imageUrl = 'https://example.com/image.png';
    entity.createdAt = new Date('2026-01-01');
    entity.updatedAt = new Date('2026-01-02');
    return entity;
  };

  it('maps an ORM entity to a domain product', () => {
    const product = ProductMapper.toDomain(buildOrmEntity());
    expect(product.id).toBe('product-1');
    expect(product.priceCents).toBe(9999);
    expect(product.stock).toBe(5);
  });

  it('maps a domain product back to an ORM entity', () => {
    const product = ProductMapper.toDomain(buildOrmEntity());
    const entity = ProductMapper.toOrm(product);
    expect(entity.id).toBe('product-1');
    expect(entity.name).toBe('Keyboard');
    expect(entity.priceCents).toBe(9999);
  });
});
