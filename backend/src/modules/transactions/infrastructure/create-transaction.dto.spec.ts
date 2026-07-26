import { CreateTransactionDto } from './create-transaction.dto';

describe('CreateTransactionDto', () => {
  it('accepts assignment of all expected fields', () => {
    const dto = new CreateTransactionDto();
    dto.productId = 'product-1';
    dto.customerId = 'customer-1';
    dto.deliveryId = 'delivery-1';

    expect(dto.productId).toBe('product-1');
  });
});
