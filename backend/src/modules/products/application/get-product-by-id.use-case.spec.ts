import { GetProductByIdUseCase } from './get-product-by-id.use-case';
import { Product } from '../domain/product';
import { IProductRepository } from '../domain/product.repository';

const buildProduct = (id: string): Product =>
  Product.reconstitute({
    id,
    name: 'Keyboard',
    description: 'A keyboard',
    priceCents: 9999,
    stock: 5,
    imageUrl: 'https://example.com/image.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('GetProductByIdUseCase', () => {
  it('returns the product when found', async () => {
    const repository: IProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(buildProduct('1')),
      save: jest.fn(),
    };
    const useCase = new GetProductByIdUseCase(repository);

    const result = await useCase.execute('1');

    expect(result.isOk).toBe(true);
  });

  it('returns PRODUCT_NOT_FOUND when the product does not exist', async () => {
    const repository: IProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const useCase = new GetProductByIdUseCase(repository);

    const result = await useCase.execute('missing');

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('PRODUCT_NOT_FOUND');
    }
  });
});
