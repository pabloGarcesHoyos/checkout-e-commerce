import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { err, ok, Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import {
  IPaymentGateway,
  SubmitPaymentCommand,
  SubmitPaymentResult,
} from '../domain/payment-gateway.port';
import { GatewayTransactionStatus } from '../domain/gateway-transaction-status';

interface GatewayTransactionResponse {
  data: {
    id: string;
    status: string;
  };
}

const STATUS_MAP: Record<string, GatewayTransactionStatus> = {
  PENDING: GatewayTransactionStatus.PENDING,
  APPROVED: GatewayTransactionStatus.APPROVED,
  DECLINED: GatewayTransactionStatus.DECLINED,
  ERROR: GatewayTransactionStatus.ERROR,
  VOIDED: GatewayTransactionStatus.VOIDED,
};

@Injectable()
export class SandboxPaymentGatewayAdapter implements IPaymentGateway {
  private readonly logger = new Logger(SandboxPaymentGatewayAdapter.name);

  /* NOTE: emitDecoratorMetadata reflects the injected
   * ConfigService class as a typeof check that is always true for a real
   * class, so one branch side is structurally unreachable regardless of
   * test input. */
  constructor(private readonly configService: ConfigService) {}

  async submitPayment(
    command: SubmitPaymentCommand,
  ): Promise<Result<SubmitPaymentResult, DomainError>> {
    const baseUrl = this.configService.get<string>('PAYMENT_GATEWAY_BASE_URL');
    const privateKey = this.configService.get<string>(
      'PAYMENT_GATEWAY_PRIVATE_KEY',
    );

    try {
      const response = await axios.post<GatewayTransactionResponse>(
        `${baseUrl}/transactions`,
        {
          amount_in_cents: command.amountCents,
          currency: command.currency,
          customer_email: command.customerEmail,
          reference: command.reference,
          signature: command.signature,
          acceptance_token: command.acceptanceToken,
          payment_method: {
            type: 'CARD',
            token: command.cardToken,
          },
        },
        { headers: { Authorization: `Bearer ${privateKey}` } },
      );

      const status =
        STATUS_MAP[response.data.data.status] ?? GatewayTransactionStatus.ERROR;
      return ok({ gatewayTransactionId: response.data.data.id, status });
    } catch (error) {
      this.logger.error(
        'Payment gateway submission failed',
        error instanceof Error ? error.stack : error,
      );
      return err(
        DomainError.of('GATEWAY_ERROR', 'Failed to submit payment to gateway'),
      );
    }
  }
}
