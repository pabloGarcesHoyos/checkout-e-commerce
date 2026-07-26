import { ListProductsUseCase } from './list-products.use-case';
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

describe('ListProductsUseCase', () => {
  it('returns all products from the repository', async () => {
    const repository: IProductRepository = {
      findAll: jest
        .fn()
        .mockResolvedValue([buildProduct('1'), buildProduct('2')]),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const useCase = new ListProductsUseCase(repository);

    const result = await useCase.execute();

    expect(result.isOk).toBe(true);
    expect(result.unwrapOr([])).toHaveLength(2);
  });
});
