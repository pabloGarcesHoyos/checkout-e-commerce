import { screen, waitFor } from '@testing-library/react';
import { renderWithStore } from '../test-utils/renderWithStore';
import { RedirectToProductScreen } from './RedirectToProductScreen';
import { fetchProducts } from '../api/products';
import { DocumentType } from '../types';
import type { Product } from '../types';

jest.mock('../api/products');
const mockedFetchProducts = fetchProducts as jest.MockedFunction<typeof fetchProducts>;

const buildProduct = (): Product => ({
  id: 'product-1',
  name: 'Keyboard',
  description: 'desc',
  priceCents: 9999,
  stock: 4,
  imageUrl: 'https://example.com/image.png',
});

describe('RedirectToProductScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('refreshes the product and resets checkout state', async () => {
    mockedFetchProducts.mockResolvedValue([buildProduct()]);
    const { store } = renderWithStore(<RedirectToProductScreen />, {
      product: { item: null, status: 'idle', error: null },
      checkout: {
        step: 5,
        form: {
          cardHolderName: 'Jane',
          cardNumber: '4111111111111111',
          cardExpMonth: '12',
          cardExpYear: '2099',
          cardCvv: '123',
          fullName: 'Jane',
          email: 'jane@example.com',
          phone: '+573001234567',
          documentType: DocumentType.CC,
          documentNumber: 'AB123456',
          address: 'addr',
          city: 'city',
          region: 'region',
        },
        customerId: 'customer-1',
        deliveryId: 'delivery-1',
        deliveryFeeCents: 800,
        submitStatus: 'idle',
        submitError: null,
      },
      transaction: {
        current: {
          id: 'tx-1',
          reference: 'TX-1',
          status: 'APPROVED',
          productAmountCents: 9999,
          baseFeeCents: 500,
          deliveryFeeCents: 800,
          totalCents: 11299,
        },
        status: 'succeeded',
        error: null,
      },
    });

    screen.getByText('Redirecting…');

    await waitFor(() => expect(store.getState().checkout.step).toBe(1));
    expect(store.getState().checkout.customerId).toBeNull();
    expect(store.getState().transaction.current).toBeNull();
    expect(store.getState().product.item?.stock).toBe(4);
  });
});
