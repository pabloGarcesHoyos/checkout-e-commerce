import { ProductResponseDto } from './product-response.dto';
import { Product } from '../domain/product';

describe('ProductResponseDto', () => {
  it('maps a domain product to a response DTO', () => {
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

    const dto = ProductResponseDto.fromDomain(product);

    expect(dto).toEqual({
      id: 'product-1',
      name: 'Keyboard',
      description: 'A keyboard',
      priceCents: 9999,
      stock: 5,
      imageUrl: 'https://example.com/image.png',
    });
  });
});
