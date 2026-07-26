import { Inject, Injectable } from '@nestjs/common';
import { ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { Product } from '../domain/product';
import { PRODUCT_REPOSITORY } from '../domain/product.repository';
import type { IProductRepository } from '../domain/product.repository';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(): Promise<Result<Product[], DomainError>> {
    const products = await this.productRepository.findAll();
    return ok(products);
  }
}
