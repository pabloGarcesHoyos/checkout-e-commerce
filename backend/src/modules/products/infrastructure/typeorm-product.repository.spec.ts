import { Repository } from 'typeorm';
import { TypeOrmProductRepository } from './typeorm-product.repository';
import { ProductOrmEntity } from './product.orm-entity';
import { Product } from '../domain/product';

const buildOrmEntity = (): ProductOrmEntity => {
  const entity = new ProductOrmEntity();
  entity.id = 'product-1';
  entity.name = 'Keyboard';
  entity.description = 'A keyboard';
  entity.priceCents = 9999;
  entity.stock = 5;
  entity.imageUrl = 'https://example.com/image.png';
  entity.createdAt = new Date();
  entity.updatedAt = new Date();
  return entity;
};

describe('TypeOrmProductRepository', () => {
  const buildRepository = () => {
    const ormRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<ProductOrmEntity>>;
    const repository = new TypeOrmProductRepository(ormRepository);
    return { repository, ormRepository };
  };

  it('maps all found entities to domain products', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.find as jest.Mock).mockResolvedValue([buildOrmEntity()]);

    const products = await repository.findAll();

    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('product-1');
  });

  it('returns a domain product when found by id', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.findOne as jest.Mock).mockResolvedValue(buildOrmEntity());

    const product = await repository.findById('product-1');

    expect(product?.id).toBe('product-1');
  });

  it('returns null when not found by id', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.findOne as jest.Mock).mockResolvedValue(null);

    const product = await repository.findById('missing');

    expect(product).toBeNull();
  });

  it('persists a domain product', async () => {
    const { repository, ormRepository } = buildRepository();
    const product = Product.reconstitute({
      id: 'product-1',
      name: 'Keyboard',
      description: 'A keyboard',
      priceCents: 9999,
      stock: 5,
      imageUrl: 'https://example.com/image.png',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await repository.save(product);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'product-1' }),
    );
  });
});
