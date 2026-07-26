import { HttpException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ListProductsUseCase } from '../application/list-products.use-case';
import { GetProductByIdUseCase } from '../application/get-product-by-id.use-case';
import { Product } from '../domain/product';
import { ok, err } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';

const buildProduct = (): Product =>
  Product.reconstitute({
    id: 'product-1',
    name: 'Keyboard',
    description: 'A keyboard',
    priceCents: 9999,
    stock: 5,
    imageUrl: 'https://example.com/image.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('ProductsController', () => {
  it('returns the mapped product list', async () => {
    const listProducts = {
      execute: jest.fn().mockResolvedValue(ok([buildProduct()])),
    } as unknown as ListProductsUseCase;
    const getProductById = {
      execute: jest.fn(),
    } as unknown as GetProductByIdUseCase;
    const controller = new ProductsController(listProducts, getProductById);

    const result = await controller.findAll();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('product-1');
  });

  it('throws an HttpException when listing products fails', async () => {
    const listProducts = {
      execute: jest
        .fn()
        .mockResolvedValue(err(DomainError.of('UNEXPECTED_ERROR', 'boom'))),
    } as unknown as ListProductsUseCase;
    const getProductById = {
      execute: jest.fn(),
    } as unknown as GetProductByIdUseCase;
    const controller = new ProductsController(listProducts, getProductById);

    await expect(controller.findAll()).rejects.toBeInstanceOf(HttpException);
  });

  it('returns the mapped product for findOne', async () => {
    const listProducts = {
      execute: jest.fn(),
    } as unknown as ListProductsUseCase;
    const getProductById = {
      execute: jest.fn().mockResolvedValue(ok(buildProduct())),
    } as unknown as GetProductByIdUseCase;
    const controller = new ProductsController(listProducts, getProductById);

    const result = await controller.findOne('product-1');

    expect(result.id).toBe('product-1');
  });

  it('throws an HttpException when the product is not found', async () => {
    const listProducts = {
      execute: jest.fn(),
    } as unknown as ListProductsUseCase;
    const getProductById = {
      execute: jest
        .fn()
        .mockResolvedValue(
          err(DomainError.of('PRODUCT_NOT_FOUND', 'not found')),
        ),
    } as unknown as GetProductByIdUseCase;
    const controller = new ProductsController(listProducts, getProductById);

    await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
      HttpException,
    );
  });
});
