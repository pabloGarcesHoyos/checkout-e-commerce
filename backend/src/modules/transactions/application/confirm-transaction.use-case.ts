import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { err, ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { Transaction } from '../domain/transaction';
import { TransactionStatus } from '../domain/transaction-status';
import { TRANSACTION_REPOSITORY } from '../domain/transaction.repository';
import type { ITransactionRepository } from '../domain/transaction.repository';
import { DEFAULT_CURRENCY } from '../domain/fees';
import { CUSTOMER_REPOSITORY } from '../../customers/domain/customer.repository';
import type { ICustomerRepository } from '../../customers/domain/customer.repository';
import { PAYMENT_GATEWAY } from '../../payments/domain/payment-gateway.port';
import type { IPaymentGateway } from '../../payments/domain/payment-gateway.port';
import { IntegritySignatureService } from '../../payments/domain/integrity-signature.service';
import { GatewayTransactionStatus } from '../../payments/domain/gateway-transaction-status';

export interface ConfirmTransactionCommand {
  transactionId: string;
  cardToken: string;
}

const GATEWAY_TO_TRANSACTION_STATUS: Record<
  GatewayTransactionStatus,
  TransactionStatus
> = {
  [GatewayTransactionStatus.PENDING]: TransactionStatus.PENDING,
  [GatewayTransactionStatus.APPROVED]: TransactionStatus.APPROVED,
  [GatewayTransactionStatus.DECLINED]: TransactionStatus.DECLINED,
  [GatewayTransactionStatus.ERROR]: TransactionStatus.ERROR,
  [GatewayTransactionStatus.VOIDED]: TransactionStatus.VOIDED,
};

@Injectable()
export class ConfirmTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
    private readonly integritySignatureService: IntegritySignatureService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: ConfirmTransactionCommand,
  ): Promise<Result<Transaction, DomainError>> {
    const transaction = await this.transactionRepository.findById(
      command.transactionId,
    );
    if (!transaction) {
      return err(
        DomainError.of(
          'TRANSACTION_NOT_FOUND',
          `Transaction ${command.transactionId} not found`,
        ),
      );
    }
    if (!transaction.isPending()) {
      return err(
        DomainError.of(
          'INVALID_TRANSACTION_STATE',
          `Transaction ${transaction.id} is not pending confirmation`,
        ),
      );
    }

    const customer = await this.customerRepository.findById(
      transaction.customerId,
    );
    if (!customer) {
      return err(
        DomainError.of(
          'CUSTOMER_NOT_FOUND',
          `Customer ${transaction.customerId} not found`,
        ),
      );
    }

    const secret =
      this.configService.get<string>('PAYMENT_GATEWAY_INTEGRITY_SECRET') ?? '';
    const signature = this.integritySignatureService.signTransaction(
      transaction.reference,
      transaction.totalCents,
      DEFAULT_CURRENCY,
      secret,
    );

    const submission = await this.paymentGateway.submitPayment({
      reference: transaction.reference,
      amountCents: transaction.totalCents,
      currency: DEFAULT_CURRENCY,
      cardToken: command.cardToken,
      customerEmail: customer.email,
      signature,
    });

    if (submission.isErr) {
      return err(submission.error);
    }

    transaction.applyGatewayStatus(
      GATEWAY_TO_TRANSACTION_STATUS[submission.value.status],
      submission.value.gatewayTransactionId,
    );
    await this.transactionRepository.save(transaction);

    return ok(transaction);
  }
}
