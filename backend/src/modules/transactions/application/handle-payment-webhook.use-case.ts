import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { err, ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { Transaction } from '../domain/transaction';
import { TransactionStatus } from '../domain/transaction-status';
import { TRANSACTION_REPOSITORY } from '../domain/transaction.repository';
import type { ITransactionRepository } from '../domain/transaction.repository';
import { IntegritySignatureService } from '../../payments/domain/integrity-signature.service';
import type { WebhookEventPayload } from '../../payments/domain/integrity-signature.service';
import { ApplyTransactionResolutionService } from './apply-transaction-resolution.service';

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
    private readonly applyTransactionResolution: ApplyTransactionResolutionService,
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

    const newStatus = command.transactionData.status as TransactionStatus;
    const updated = await this.applyTransactionResolution.apply(
      transaction,
      newStatus,
      command.transactionData.id,
    );

    return ok(updated);
  }
}
