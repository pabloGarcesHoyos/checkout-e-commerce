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
});
