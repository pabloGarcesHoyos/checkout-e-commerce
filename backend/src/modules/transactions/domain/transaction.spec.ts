import { Transaction } from './transaction';
import { TransactionStatus } from './transaction-status';

describe('Transaction', () => {
  it('starts as PENDING with the total computed from its parts', () => {
    const transaction = Transaction.create({
      id: 'tx-1',
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      reference: 'TX-1',
      productAmountCents: 9999,
      baseFeeCents: 500,
      deliveryFeeCents: 800,
    });

    expect(transaction.status).toBe(TransactionStatus.PENDING);
    expect(transaction.totalCents).toBe(11299);
    expect(transaction.gatewayTransactionId).toBeNull();
  });

  it('marks itself as submitted to the gateway without changing status', () => {
    const transaction = Transaction.create({
      id: 'tx-1',
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      reference: 'TX-1',
      productAmountCents: 9999,
      baseFeeCents: 500,
      deliveryFeeCents: 800,
    });

    transaction.markSubmittedToGateway('gw-1');

    expect(transaction.gatewayTransactionId).toBe('gw-1');
    expect(transaction.status).toBe(TransactionStatus.PENDING);
  });

  it('applies a gateway status update', () => {
    const transaction = Transaction.create({
      id: 'tx-1',
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      reference: 'TX-1',
      productAmountCents: 9999,
      baseFeeCents: 500,
      deliveryFeeCents: 800,
    });

    transaction.applyGatewayStatus(TransactionStatus.APPROVED, 'gw-1');

    expect(transaction.status).toBe(TransactionStatus.APPROVED);
    expect(transaction.gatewayTransactionId).toBe('gw-1');
    expect(transaction.isPending()).toBe(false);
  });
});
