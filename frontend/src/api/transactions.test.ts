import { httpClient } from './httpClient';
import { confirmTransaction, createTransaction, fetchTransaction } from './transactions';
import type { Transaction } from '../types';

jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = httpClient.get as jest.Mock;
const mockedPost = httpClient.post as jest.Mock;

const buildTransaction = (): Transaction => ({
  id: 'tx-1',
  reference: 'TX-1',
  status: 'PENDING',
  productAmountCents: 9999,
  baseFeeCents: 500,
  deliveryFeeCents: 800,
  totalCents: 11299,
});

describe('transactions api', () => {
  afterEach(() => jest.clearAllMocks());

  it('createTransaction posts the payload and returns the created transaction', async () => {
    const payload = { productId: 'product-1', customerId: 'customer-1', deliveryId: 'delivery-1' };
    mockedPost.mockResolvedValue({ data: buildTransaction() });

    const result = await createTransaction(payload);

    expect(mockedPost).toHaveBeenCalledWith('/transactions', payload);
    expect(result).toEqual(buildTransaction());
  });

  it('confirmTransaction posts the card token to the confirm endpoint', async () => {
    mockedPost.mockResolvedValue({ data: buildTransaction() });

    const result = await confirmTransaction('tx-1', 'tok_test', 'accept_test');

    expect(mockedPost).toHaveBeenCalledWith('/transactions/tx-1/confirm', {
      cardToken: 'tok_test',
      acceptanceToken: 'accept_test',
    });
    expect(result).toEqual(buildTransaction());
  });

  it('fetchTransaction requests a transaction by id', async () => {
    mockedGet.mockResolvedValue({ data: buildTransaction() });

    const result = await fetchTransaction('tx-1');

    expect(mockedGet).toHaveBeenCalledWith('/transactions/tx-1');
    expect(result).toEqual(buildTransaction());
  });
});
