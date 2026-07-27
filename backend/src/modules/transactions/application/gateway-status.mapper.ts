import { TransactionStatus } from '../domain/transaction-status';
import { GatewayTransactionStatus } from '../../payments/domain/gateway-transaction-status';

export const GATEWAY_TO_TRANSACTION_STATUS: Record<
  GatewayTransactionStatus,
  TransactionStatus
> = {
  [GatewayTransactionStatus.PENDING]: TransactionStatus.PENDING,
  [GatewayTransactionStatus.APPROVED]: TransactionStatus.APPROVED,
  [GatewayTransactionStatus.DECLINED]: TransactionStatus.DECLINED,
  [GatewayTransactionStatus.ERROR]: TransactionStatus.ERROR,
  [GatewayTransactionStatus.VOIDED]: TransactionStatus.VOIDED,
};
