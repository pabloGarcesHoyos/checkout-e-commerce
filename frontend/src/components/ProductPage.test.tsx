import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '../test-utils/renderWithStore';
import { ProductPage } from './ProductPage';
import { fetchProducts } from '../api/products';
import type { Product } from '../types';

jest.mock('../api/products');
const mockedFetchProducts = fetchProducts as jest.MockedFunction<typeof fetchProducts>;

const buildProduct = (stock: number): Product => ({
  id: 'product-1',
  name: 'Wireless Keyboard',
  description: 'A great keyboard',
  priceCents: 9999,
  stock,
  imageUrl: 'https://example.com/image.png',
});

describe('ProductPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows the loaded product and price', async () => {
    mockedFetchProducts.mockResolvedValue([buildProduct(5)]);
    renderWithStore(<ProductPage />);

    expect(await screen.findByText('Wireless Keyboard')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buy now' })).toBeEnabled();
  });

  it('disables the buy button when out of stock', async () => {
    mockedFetchProducts.mockResolvedValue([buildProduct(0)]);
    renderWithStore(<ProductPage />);

    expect(await screen.findByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });

  it('advances to step 2 when buy now is clicked', async () => {
    mockedFetchProducts.mockResolvedValue([buildProduct(5)]);
    const { store } = renderWithStore(<ProductPage />);

    const button = await screen.findByRole('button', { name: 'Buy now' });
    await userEvent.click(button);

    await waitFor(() => expect(store.getState().checkout.step).toBe(2));
  });

  it('shows an error message when the product fails to load', async () => {
    mockedFetchProducts.mockRejectedValue(new Error('network error'));
    renderWithStore(<ProductPage />);

    expect(await screen.findByText(/could not load the product/i)).toBeInTheDocument();
  });
});
