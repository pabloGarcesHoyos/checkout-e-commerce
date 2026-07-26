import { TransactionResponseDto } from './transaction-response.dto';
import { Transaction } from '../domain/transaction';

describe('TransactionResponseDto', () => {
  it('maps a domain transaction to a response DTO', () => {
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

    const dto = TransactionResponseDto.fromDomain(transaction);

    expect(dto).toEqual({
      id: 'tx-1',
      reference: 'TX-1',
      status: 'PENDING',
      productAmountCents: 9999,
      baseFeeCents: 500,
      deliveryFeeCents: 800,
      totalCents: 11299,
    });
  });
});
