import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '../test-utils/renderWithStore';
import type { TestRootState } from '../test-utils/renderWithStore';
import { SummaryBackdrop } from './SummaryBackdrop';
import { DocumentType } from '../types';
import { createTransaction, confirmTransaction } from '../api/transactions';
import { fetchAcceptanceToken, tokenizeCard } from '../api/paymentGateway';

jest.mock('../api/transactions');
jest.mock('../api/paymentGateway');

const mockedCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;
const mockedConfirmTransaction = confirmTransaction as jest.MockedFunction<typeof confirmTransaction>;
const mockedFetchAcceptanceToken = fetchAcceptanceToken as jest.MockedFunction<typeof fetchAcceptanceToken>;
const mockedTokenizeCard = tokenizeCard as jest.MockedFunction<typeof tokenizeCard>;

const preloadedState: TestRootState = {
  product: {
    status: 'succeeded',
    error: null,
    item: {
      id: 'product-1',
      name: 'Keyboard',
      description: 'desc',
      priceCents: 9999,
      stock: 5,
      imageUrl: 'https://example.com/image.png',
    },
  },
  checkout: {
    step: 3,
    form: {
      cardHolderName: 'Jane Doe',
      cardNumber: '4111111111111111',
      cardExpMonth: '12',
      cardExpYear: '2099',
      cardCvv: '123',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
    },
    customerId: 'customer-1',
    deliveryId: 'delivery-1',
    deliveryFeeCents: 800,
    submitStatus: 'idle',
    submitError: null,
  },
  transaction: { current: null, status: 'idle', error: null },
};

describe('SummaryBackdrop', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the amount breakdown and total', () => {
    renderWithStore(<SummaryBackdrop />, preloadedState);

    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('$8.00')).toBeInTheDocument();
    expect(screen.getByText('$112.99')).toBeInTheDocument();
  });

  it('returns to the form when back is clicked', async () => {
    const { store } = renderWithStore(<SummaryBackdrop />, preloadedState);

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(store.getState().checkout.step).toBe(2);
  });

  it('processes the payment and advances to step 4 on approval', async () => {
    mockedFetchAcceptanceToken.mockResolvedValue('acceptance-token');
    mockedTokenizeCard.mockResolvedValue('card-token');
    mockedCreateTransaction.mockResolvedValue({
      id: 'tx-1',
      reference: 'TX-1',
      status: 'PENDING',
      productAmountCents: 9999,
      baseFeeCents: 500,
      deliveryFeeCents: 800,
      totalCents: 11299,
    });
    mockedConfirmTransaction.mockResolvedValue({
      id: 'tx-1',
      reference: 'TX-1',
      status: 'APPROVED',
      productAmountCents: 9999,
      baseFeeCents: 500,
      deliveryFeeCents: 800,
      totalCents: 11299,
    });

    const { store } = renderWithStore(<SummaryBackdrop />, preloadedState);

    await userEvent.click(screen.getByRole('button', { name: 'Pay now' }));

    await waitFor(() => expect(store.getState().checkout.step).toBe(4));
    expect(store.getState().transaction.current?.status).toBe('APPROVED');
  });

  it('renders a payment error as a proper alert, not a bare line of text', () => {
    renderWithStore(<SummaryBackdrop />, {
      ...preloadedState,
      transaction: { current: null, status: 'failed', error: 'Request failed with status code 422' },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Request failed with status code 422');
  });

  it('does not advance to step 4 when the payment request fails', async () => {
    mockedFetchAcceptanceToken.mockResolvedValue('acceptance-token');
    mockedTokenizeCard.mockResolvedValue('card-token');
    mockedCreateTransaction.mockResolvedValue({
      id: 'tx-1',
      reference: 'TX-1',
      status: 'PENDING',
      productAmountCents: 9999,
      baseFeeCents: 500,
      deliveryFeeCents: 800,
      totalCents: 11299,
    });
    mockedConfirmTransaction.mockRejectedValue(new Error('Request failed with status code 422'));

    const { store } = renderWithStore(<SummaryBackdrop />, preloadedState);

    await userEvent.click(screen.getByRole('button', { name: 'Pay now' }));

    await waitFor(() => expect(store.getState().transaction.status).toBe('failed'));
    expect(store.getState().checkout.step).toBe(3);
    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed with status code 422');
  });
});
