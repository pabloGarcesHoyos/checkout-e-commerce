import { Product } from './product';

const buildProduct = (stock: number): Product =>
  Product.reconstitute({
    id: 'product-1',
    name: 'Keyboard',
    description: 'A keyboard',
    priceCents: 9999,
    stock,
    imageUrl: 'https://example.com/image.png',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

describe('Product', () => {
  it('reports stock availability when stock is positive', () => {
    expect(buildProduct(1).hasStockAvailable()).toBe(true);
  });

  it('reports no stock availability when stock is zero', () => {
    expect(buildProduct(0).hasStockAvailable()).toBe(false);
  });

  it('decrements stock by one', () => {
    const product = buildProduct(3);
    product.decrementStock();
    expect(product.stock).toBe(2);
  });

  it('throws when decrementing stock at zero', () => {
    const product = buildProduct(0);
    expect(() => product.decrementStock()).toThrow(
      'Cannot decrement stock below zero',
    );
  });
});
