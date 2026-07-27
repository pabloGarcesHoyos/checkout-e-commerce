import { Result } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';
import { GatewayTransactionStatus } from './gateway-transaction-status';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface SubmitPaymentCommand {
  reference: string;
  amountCents: number;
  currency: string;
  cardToken: string;
  acceptanceToken: string;
  customerEmail: string;
  signature: string;
}

export interface SubmitPaymentResult {
  gatewayTransactionId: string;
  status: GatewayTransactionStatus;
}

export interface IPaymentGateway {
  submitPayment(
    command: SubmitPaymentCommand,
  ): Promise<Result<SubmitPaymentResult, DomainError>>;
}
