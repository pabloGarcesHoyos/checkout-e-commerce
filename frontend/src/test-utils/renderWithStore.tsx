import type { PropsWithChildren, ReactElement } from 'react';
import { render } from '@testing-library/react';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import productReducer from '../features/product/productSlice';
import checkoutReducer from '../features/checkout/checkoutSlice';
import transactionReducer from '../features/transaction/transactionSlice';

const rootReducer = combineReducers({
  product: productReducer,
  checkout: checkoutReducer,
  transaction: transactionReducer,
});

export type TestRootState = ReturnType<typeof rootReducer>;

export const buildTestStore = (preloadedState?: TestRootState) =>
  configureStore({ reducer: rootReducer, preloadedState });

export const renderWithStore = (ui: ReactElement, preloadedState?: TestRootState) => {
  const store = buildTestStore(preloadedState);
  const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
  return { store, ...render(ui, { wrapper: Wrapper }) };
};
