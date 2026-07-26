import reducer, { payWithCard, pollTransaction, resetTransaction } from './transactionSlice';
import type { TransactionState } from './transactionSlice';
import { confirmTransaction, createTransaction, fetchTransaction } from '../../api/transactions';
import { fetchAcceptanceToken, tokenizeCard } from '../../api/paymentGateway';
import type { Transaction } from '../../types';

jest.mock('../../api/transactions');
jest.mock('../../api/paymentGateway');

const mockedCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;
const mockedConfirmTransaction = confirmTransaction as jest.MockedFunction<typeof confirmTransaction>;
const mockedFetchTransaction = fetchTransaction as jest.MockedFunction<typeof fetchTransaction>;
const mockedFetchAcceptanceToken = fetchAcceptanceToken as jest.MockedFunction<typeof fetchAcceptanceToken>;
const mockedTokenizeCard = tokenizeCard as jest.MockedFunction<typeof tokenizeCard>;

const buildTransaction = (status: Transaction['status'] = 'PENDING'): Transaction => ({
  id: 'tx-1',
  reference: 'TX-1',
  status,
  productAmountCents: 9999,
  baseFeeCents: 500,
  deliveryFeeCents: 800,
  totalCents: 11299,
});

const initialState: TransactionState = { current: null, status: 'idle', error: null };

describe('transactionSlice', () => {
  afterEach(() => jest.clearAllMocks());

  it('resets to the initial state', () => {
    const changed = reducer(initialState, { type: payWithCard.fulfilled.type, payload: buildTransaction() });
    const state = reducer(changed, resetTransaction());
    expect(state.current).toBeNull();
    expect(state.status).toBe('idle');
  });

  it('marks status as loading while payment is pending', () => {
    const state = reducer(initialState, { type: payWithCard.pending.type });
    expect(state.status).toBe('loading');
  });

  it('stores the transaction on successful payment', () => {
    const state = reducer(initialState, {
      type: payWithCard.fulfilled.type,
      payload: buildTransaction('APPROVED'),
    });
    expect(state.status).toBe('succeeded');
    expect(state.current?.status).toBe('APPROVED');
  });

  it('stores an error on failed payment', () => {
    const state = reducer(initialState, {
      type: payWithCard.rejected.type,
      error: { message: 'Card declined' },
    });
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Card declined');
  });

  it('updates the current transaction when polling resolves', () => {
    const state = reducer(initialState, {
      type: pollTransaction.fulfilled.type,
      payload: buildTransaction('DECLINED'),
    });
    expect(state.current?.status).toBe('DECLINED');
  });

  it('tokenizes the card and confirms the transaction in order', async () => {
    mockedFetchAcceptanceToken.mockResolvedValue('acceptance-token');
    mockedTokenizeCard.mockResolvedValue('card-token');
    mockedCreateTransaction.mockResolvedValue(buildTransaction());
    mockedConfirmTransaction.mockResolvedValue(buildTransaction('APPROVED'));

    const thunk = payWithCard({
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      cardNumber: '4111111111111111',
      cardExpMonth: '12',
      cardExpYear: '2099',
      cardCvv: '123',
      cardHolderName: 'Jane Doe',
    });
    const result = await thunk(jest.fn(), () => ({}), undefined);

    expect(mockedTokenizeCard).toHaveBeenCalledWith(
      expect.objectContaining({ number: '4111111111111111', cardHolder: 'Jane Doe' }),
    );
    expect(mockedCreateTransaction).toHaveBeenCalledWith({
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
    });
    expect(mockedConfirmTransaction).toHaveBeenCalledWith('tx-1', 'card-token');
    expect(payWithCard.fulfilled.match(result)).toBe(true);
  });

  it('fetches a transaction by id when polling', async () => {
    mockedFetchTransaction.mockResolvedValue(buildTransaction('APPROVED'));
    const thunk = pollTransaction('tx-1');
    const result = await thunk(jest.fn(), () => ({}), undefined);
    expect(mockedFetchTransaction).toHaveBeenCalledWith('tx-1');
    expect(pollTransaction.fulfilled.match(result)).toBe(true);
  });
});
