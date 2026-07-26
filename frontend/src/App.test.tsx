import { screen } from '@testing-library/react';
import { renderWithStore } from './test-utils/renderWithStore';
import type { TestRootState } from './test-utils/renderWithStore';
import App from './App';
import { fetchProducts } from './api/products';
import { DocumentType } from './types';

jest.mock('./api/products');
const mockedFetchProducts = fetchProducts as jest.MockedFunction<typeof fetchProducts>;

const emptyForm = {
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
};

const baseState: TestRootState = {
  product: { item: null, status: 'succeeded', error: null },
  checkout: {
    step: 1,
    form: emptyForm,
    customerId: null,
    deliveryId: null,
    deliveryFeeCents: null,
    submitStatus: 'idle',
    submitError: null,
  },
  transaction: { current: null, status: 'idle', error: null },
};

describe('App', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders only the product page at step 1', () => {
    mockedFetchProducts.mockResolvedValue([]);
    renderWithStore(<App />, baseState);

    expect(screen.queryByText('Payment & delivery details')).not.toBeInTheDocument();
  });

  it('renders the checkout modal at step 2', () => {
    mockedFetchProducts.mockResolvedValue([]);
    renderWithStore(<App />, { ...baseState, checkout: { ...baseState.checkout, step: 2 } });

    expect(screen.getByText('Payment & delivery details')).toBeInTheDocument();
  });

  it('mounts the summary backdrop at step 3', () => {
    mockedFetchProducts.mockResolvedValue([]);
    const { container } = renderWithStore(<App />, {
      ...baseState,
      checkout: { ...baseState.checkout, step: 3 },
    });

    expect(container.querySelector('.z-40')).not.toBeInTheDocument();
  });

  it('mounts the transaction status screen at step 4', () => {
    mockedFetchProducts.mockResolvedValue([]);
    renderWithStore(<App />, { ...baseState, checkout: { ...baseState.checkout, step: 4 } });

    expect(screen.queryByText('Payment approved')).not.toBeInTheDocument();
  });

  it('mounts the redirect screen at step 5', () => {
    mockedFetchProducts.mockResolvedValue([]);
    renderWithStore(<App />, { ...baseState, checkout: { ...baseState.checkout, step: 5 } });

    expect(screen.getByText('Redirecting…')).toBeInTheDocument();
  });
});
