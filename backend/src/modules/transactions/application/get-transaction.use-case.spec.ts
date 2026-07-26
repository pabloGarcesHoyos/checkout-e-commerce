import { GetTransactionUseCase } from './get-transaction.use-case';
import { Transaction } from '../domain/transaction';
import { ITransactionRepository } from '../domain/transaction.repository';

const buildTransaction = (): Transaction =>
  Transaction.create({
    id: 'tx-1',
    productId: 'product-1',
    customerId: 'customer-1',
    deliveryId: 'delivery-1',
    reference: 'TX-1',
    productAmountCents: 9999,
    baseFeeCents: 500,
    deliveryFeeCents: 800,
  });

describe('GetTransactionUseCase', () => {
  it('returns the transaction when found', async () => {
    const repository: ITransactionRepository = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(buildTransaction()),
      findByReference: jest.fn(),
      existsByReference: jest.fn(),
    };
    const useCase = new GetTransactionUseCase(repository);

    const result = await useCase.execute('tx-1');

    expect(result.isOk).toBe(true);
  });

  it('returns TRANSACTION_NOT_FOUND when missing', async () => {
    const repository: ITransactionRepository = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      findByReference: jest.fn(),
      existsByReference: jest.fn(),
    };
    const useCase = new GetTransactionUseCase(repository);

    const result = await useCase.execute('missing');

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('TRANSACTION_NOT_FOUND');
    }
  });
});
