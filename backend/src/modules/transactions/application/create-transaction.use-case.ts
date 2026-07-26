import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { err, ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { Transaction } from '../domain/transaction';
import { TRANSACTION_REPOSITORY } from '../domain/transaction.repository';
import type { ITransactionRepository } from '../domain/transaction.repository';
import { generateTransactionReference } from '../domain/reference-generator';
import { BASE_FEE_CENTS } from '../domain/fees';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository';
import type { IProductRepository } from '../../products/domain/product.repository';
import { CUSTOMER_REPOSITORY } from '../../customers/domain/customer.repository';
import type { ICustomerRepository } from '../../customers/domain/customer.repository';
import { DELIVERY_REPOSITORY } from '../../deliveries/domain/delivery.repository';
import type { IDeliveryRepository } from '../../deliveries/domain/delivery.repository';

export interface CreateTransactionCommand {
  productId: string;
  customerId: string;
  deliveryId: string;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
  ) {}

  async execute(
    command: CreateTransactionCommand,
  ): Promise<Result<Transaction, DomainError>> {
    const product = await this.productRepository.findById(command.productId);
    if (!product) {
      return err(
        DomainError.of(
          'PRODUCT_NOT_FOUND',
          `Product ${command.productId} not found`,
        ),
      );
    }
    if (!product.hasStockAvailable()) {
      return err(
        DomainError.of(
          'INSUFFICIENT_STOCK',
          `Product ${command.productId} is out of stock`,
        ),
      );
    }

    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      return err(
        DomainError.of(
          'CUSTOMER_NOT_FOUND',
          `Customer ${command.customerId} not found`,
        ),
      );
    }

    const delivery = await this.deliveryRepository.findById(command.deliveryId);
    if (!delivery) {
      return err(
        DomainError.of(
          'DELIVERY_NOT_FOUND',
          `Delivery ${command.deliveryId} not found`,
        ),
      );
    }

    const reference = await this.uniqueReference();

    const transaction = Transaction.create({
      id: randomUUID(),
      productId: product.id,
      customerId: customer.id,
      deliveryId: delivery.id,
      reference,
      productAmountCents: product.priceCents,
      baseFeeCents: BASE_FEE_CENTS,
      deliveryFeeCents: delivery.deliveryFeeCents,
    });

    await this.transactionRepository.save(transaction);
    return ok(transaction);
  }

  private async uniqueReference(): Promise<string> {
    let reference = generateTransactionReference();
    while (await this.transactionRepository.existsByReference(reference)) {
      reference = generateTransactionReference();
    }
    return reference;
  }
}
