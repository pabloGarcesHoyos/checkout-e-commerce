import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '../domain/transaction';
import { TransactionStatus } from '../domain/transaction-status';
import { TRANSACTION_REPOSITORY } from '../domain/transaction.repository';
import type { ITransactionRepository } from '../domain/transaction.repository';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository';
import type { IProductRepository } from '../../products/domain/product.repository';

/**
 * Applies a resolved gateway status (APPROVED/DECLINED/ERROR/VOIDED) to a
 * transaction and, on approval, decrements product stock. Shared by the
 * webhook handler and the reconciliation use case so the status-transition
 * and stock-decrement rules live in exactly one place.
 */
@Injectable()
export class ApplyTransactionResolutionService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async apply(
    transaction: Transaction,
    newStatus: TransactionStatus,
    gatewayTransactionId: string,
  ): Promise<Transaction> {
    if (!transaction.isPending()) {
      return transaction;
    }

    transaction.applyGatewayStatus(newStatus, gatewayTransactionId);
    await this.transactionRepository.save(transaction);

    if (newStatus === TransactionStatus.APPROVED) {
      const product = await this.productRepository.findById(
        transaction.productId,
      );
      if (product && product.hasStockAvailable()) {
        product.decrementStock();
        await this.productRepository.save(product);
      }
    }

    return transaction;
  }
}
