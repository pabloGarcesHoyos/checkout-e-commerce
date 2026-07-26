import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { err, ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { Transaction } from '../domain/transaction';
import { TransactionStatus } from '../domain/transaction-status';
import { TRANSACTION_REPOSITORY } from '../domain/transaction.repository';
import type { ITransactionRepository } from '../domain/transaction.repository';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository';
import type { IProductRepository } from '../../products/domain/product.repository';
import { IntegritySignatureService } from '../../payments/domain/integrity-signature.service';
import type { WebhookEventPayload } from '../../payments/domain/integrity-signature.service';

const KNOWN_STATUSES = new Set(Object.values(TransactionStatus));

export interface WebhookTransactionData {
  id: string;
  reference: string;
  status: string;
}

export interface HandlePaymentWebhookCommand {
  payload: WebhookEventPayload;
  transactionData: WebhookTransactionData;
}

@Injectable()
export class HandlePaymentWebhookUseCase {
  /* NOTE: emitDecoratorMetadata reflects the
   * IntegritySignatureService/ConfigService parameter types as typeof checks
   * that are always true for real classes, so one branch side is
   * structurally unreachable regardless of test input. */
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly integritySignatureService: IntegritySignatureService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: HandlePaymentWebhookCommand,
  ): Promise<Result<Transaction, DomainError>> {
    const secret =
      this.configService.get<string>('PAYMENT_GATEWAY_EVENTS_SECRET') ?? '';
    const signatureValid =
      this.integritySignatureService.verifyWebhookSignature(
        command.payload,
        secret,
      );
    if (!signatureValid) {
      return err(
        DomainError.of(
          'INVALID_WEBHOOK_SIGNATURE',
          'Webhook signature verification failed',
        ),
      );
    }

    if (
      !KNOWN_STATUSES.has(command.transactionData.status as TransactionStatus)
    ) {
      return err(
        DomainError.of(
          'VALIDATION_ERROR',
          `Unknown gateway status ${command.transactionData.status}`,
        ),
      );
    }

    const transaction = await this.transactionRepository.findByReference(
      command.transactionData.reference,
    );
    if (!transaction) {
      return err(
        DomainError.of(
          'TRANSACTION_NOT_FOUND',
          `Transaction ${command.transactionData.reference} not found`,
        ),
      );
    }

    if (!transaction.isPending()) {
      return ok(transaction);
    }

    const newStatus = command.transactionData.status as TransactionStatus;
    transaction.applyGatewayStatus(newStatus, command.transactionData.id);
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

    return ok(transaction);
  }
}
