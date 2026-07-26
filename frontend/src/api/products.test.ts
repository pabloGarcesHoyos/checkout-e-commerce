import { httpClient } from './httpClient';
import { fetchProductById, fetchProducts } from './products';
import type { Product } from '../types';

jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = httpClient.get as jest.Mock;

const buildProduct = (): Product => ({
  id: 'product-1',
  name: 'Keyboard',
  description: 'A keyboard',
  priceCents: 9999,
  stock: 5,
  imageUrl: 'https://example.com/image.png',
});

describe('products api', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetchProducts requests the product list and returns the data', async () => {
    mockedGet.mockResolvedValue({ data: [buildProduct()] });

    const result = await fetchProducts();

    expect(mockedGet).toHaveBeenCalledWith('/products');
    expect(result).toEqual([buildProduct()]);
  });

  it('fetchProductById requests a single product by id', async () => {
    mockedGet.mockResolvedValue({ data: buildProduct() });

    const result = await fetchProductById('product-1');

    expect(mockedGet).toHaveBeenCalledWith('/products/product-1');
    expect(result).toEqual(buildProduct());
  });
});
