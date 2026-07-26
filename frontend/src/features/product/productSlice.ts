import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchProducts } from '../../api/products';
import type { Product } from '../../types';

export type LoadingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ProductState {
  item: Product | null;
  status: LoadingStatus;
  error: string | null;
}

const initialState: ProductState = {
  item: null,
  status: 'idle',
  error: null,
};

export const loadFeaturedProduct = createAsyncThunk('product/loadFeatured', async () => {
  const products = await fetchProducts();
  return products[0] ?? null;
});

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setProduct(state, action: PayloadAction<Product | null>) {
      state.item = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFeaturedProduct.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadFeaturedProduct.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.item = action.payload;
      })
      .addCase(loadFeaturedProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load product';
      });
  },
});

export const { setProduct } = productSlice.actions;
export default productSlice.reducer;
