import { Inject, Injectable } from '@nestjs/common';
import { err, ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { Transaction } from '../domain/transaction';
import { TRANSACTION_REPOSITORY } from '../domain/transaction.repository';
import type { ITransactionRepository } from '../domain/transaction.repository';
import { PAYMENT_GATEWAY } from '../../payments/domain/payment-gateway.port';
import type { IPaymentGateway } from '../../payments/domain/payment-gateway.port';
import { GatewayTransactionStatus } from '../../payments/domain/gateway-transaction-status';
import { ApplyTransactionResolutionService } from './apply-transaction-resolution.service';
import { GATEWAY_TO_TRANSACTION_STATUS } from './gateway-status.mapper';

/**
 * Fallback reconciliation for transactions stuck in PENDING because the
 * gateway's async webhook was never delivered (e.g. no webhook URL
 * registered on the gateway's side). Polls the gateway directly for the
 * transaction's real status and applies it locally if resolved, reusing the
 * exact same status-transition/stock-decrement logic the webhook uses.
 */
@Injectable()
export class ReconcileTransactionStatusUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
    private readonly applyTransactionResolution: ApplyTransactionResolutionService,
  ) {}

  async execute(
    transactionId: string,
  ): Promise<Result<Transaction, DomainError>> {
    const transaction =
      await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      return err(
        DomainError.of(
          'TRANSACTION_NOT_FOUND',
          `Transaction ${transactionId} not found`,
        ),
      );
    }

    if (!transaction.isPending() || !transaction.gatewayTransactionId) {
      return ok(transaction);
    }

    const remote = await this.paymentGateway.getTransactionStatus(
      transaction.gatewayTransactionId,
    );
    if (
      remote.isErr ||
      remote.value.status === GatewayTransactionStatus.PENDING
    ) {
      return ok(transaction);
    }

    const updated = await this.applyTransactionResolution.apply(
      transaction,
      GATEWAY_TO_TRANSACTION_STATUS[remote.value.status],
      remote.value.gatewayTransactionId,
    );

    return ok(updated);
  }
}
