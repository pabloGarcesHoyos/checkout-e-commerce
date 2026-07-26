import { ConfirmTransactionDto } from './confirm-transaction.dto';

describe('ConfirmTransactionDto', () => {
  it('accepts assignment of the card token', () => {
    const dto = new ConfirmTransactionDto();
    dto.cardToken = 'tok_test_1234';

    expect(dto.cardToken).toBe('tok_test_1234');
  });
});
