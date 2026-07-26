import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '../test-utils/renderWithStore';
import type { TestRootState } from '../test-utils/renderWithStore';
import { TransactionStatusScreen } from './TransactionStatusScreen';
import { fetchTransaction } from '../api/transactions';
import { DocumentType } from '../types';
import type { Transaction } from '../types';

jest.mock('../api/transactions');
const mockedFetchTransaction = fetchTransaction as jest.MockedFunction<typeof fetchTransaction>;

const baseState: TestRootState = {
  product: { item: null, status: 'idle', error: null },
  checkout: {
    step: 4,
    form: {
      cardHolderName: '',
      cardNumber: '',
      cardExpMonth: '',
      cardExpYear: '',
      cardCvv: '',
      fullName: '',
      email: '',
      phone: '',
      documentType: DocumentType.CC,
      documentNumber: '',
      address: '',
      city: '',
      region: '',
    },
    customerId: null,
    deliveryId: null,
    deliveryFeeCents: null,
    submitStatus: 'idle',
    submitError: null,
  },
  transaction: { current: null, status: 'idle', error: null },
};

const buildTransaction = (status: Transaction['status']): Transaction => ({
  id: 'tx-1',
  reference: 'TX-1',
  status,
  productAmountCents: 9999,
  baseFeeCents: 500,
  deliveryFeeCents: 800,
  totalCents: 11299,
});

describe('TransactionStatusScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders nothing when there is no transaction', () => {
    const { container } = renderWithStore(<TransactionStatusScreen />, baseState);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the approved message and a back-to-store button', () => {
    renderWithStore(<TransactionStatusScreen />, {
      ...baseState,
      transaction: { current: buildTransaction('APPROVED'), status: 'succeeded', error: null },
    });

    expect(screen.getByText('Payment approved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to store' })).toBeInTheDocument();
  });

  it('shows the declined message', () => {
    renderWithStore(<TransactionStatusScreen />, {
      ...baseState,
      transaction: { current: buildTransaction('DECLINED'), status: 'succeeded', error: null },
    });

    expect(screen.getByText('Payment declined')).toBeInTheDocument();
  });

  it('does not show a back button while pending', () => {
    mockedFetchTransaction.mockResolvedValue(buildTransaction('PENDING'));
    renderWithStore(<TransactionStatusScreen />, {
      ...baseState,
      transaction: { current: buildTransaction('PENDING'), status: 'succeeded', error: null },
    });

    expect(screen.getByText('Processing payment…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to store' })).not.toBeInTheDocument();
  });

  it('advances to step 5 when back to store is clicked', async () => {
    const { store } = renderWithStore(<TransactionStatusScreen />, {
      ...baseState,
      transaction: { current: buildTransaction('APPROVED'), status: 'succeeded', error: null },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Back to store' }));

    expect(store.getState().checkout.step).toBe(5);
  });
});
