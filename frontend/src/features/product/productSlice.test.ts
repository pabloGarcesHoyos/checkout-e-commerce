import reducer, { loadFeaturedProduct, setProduct } from './productSlice';
import type { ProductState } from './productSlice';
import { fetchProducts } from '../../api/products';
import type { Product } from '../../types';

jest.mock('../../api/products');
const mockedFetchProducts = fetchProducts as jest.MockedFunction<typeof fetchProducts>;

const buildProduct = (): Product => ({
  id: 'product-1',
  name: 'Keyboard',
  description: 'A keyboard',
  priceCents: 9999,
  stock: 5,
  imageUrl: 'https://example.com/image.png',
});

const initialState: ProductState = { item: null, status: 'idle', error: null };

describe('productSlice', () => {
  afterEach(() => jest.clearAllMocks());

  it('sets the product via setProduct', () => {
    const state = reducer(initialState, setProduct(buildProduct()));
    expect(state.item?.id).toBe('product-1');
  });

  it('sets status to loading while fetching', () => {
    const state = reducer(initialState, { type: loadFeaturedProduct.pending.type });
    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('stores the first product on success', () => {
    const state = reducer(initialState, {
      type: loadFeaturedProduct.fulfilled.type,
      payload: buildProduct(),
    });
    expect(state.status).toBe('succeeded');
    expect(state.item?.name).toBe('Keyboard');
  });

  it('stores an error message on failure', () => {
    const state = reducer(initialState, {
      type: loadFeaturedProduct.rejected.type,
      error: { message: 'Network error' },
    });
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('falls back to a default error message when none is provided', () => {
    const state = reducer(initialState, {
      type: loadFeaturedProduct.rejected.type,
      error: {},
    });
    expect(state.error).toBe('Failed to load product');
  });

  it('loadFeaturedProduct resolves the first product from the API', async () => {
    mockedFetchProducts.mockResolvedValue([buildProduct()]);
    const dispatch = jest.fn();
    const thunk = loadFeaturedProduct();
    const result = await thunk(dispatch, () => ({}), undefined);
    expect(loadFeaturedProduct.fulfilled.match(result)).toBe(true);
  });

  it('loadFeaturedProduct resolves null when the catalog is empty', async () => {
    mockedFetchProducts.mockResolvedValue([]);
    const thunk = loadFeaturedProduct();
    const result = await thunk(jest.fn(), () => ({}), undefined);
    expect(loadFeaturedProduct.fulfilled.match(result)).toBe(true);
    if (loadFeaturedProduct.fulfilled.match(result)) {
      expect(result.payload).toBeNull();
    }
  });
});
