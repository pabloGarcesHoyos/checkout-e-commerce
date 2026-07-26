import { Inject, Injectable } from '@nestjs/common';
import { err, ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { Product } from '../domain/product';
import { PRODUCT_REPOSITORY } from '../domain/product.repository';
import type { IProductRepository } from '../domain/product.repository';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<Result<Product, DomainError>> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      return err(
        DomainError.of('PRODUCT_NOT_FOUND', `Product ${id} not found`),
      );
    }
    return ok(product);
  }
}
