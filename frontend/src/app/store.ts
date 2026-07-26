import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  createTransform,
  persistReducer,
  persistStore,
} from 'redux-persist';
import type { PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import productReducer from '../features/product/productSlice';
import checkoutReducer from '../features/checkout/checkoutSlice';
import type { CheckoutState } from '../features/checkout/checkoutSlice';
import transactionReducer from '../features/transaction/transactionSlice';

const SENSITIVE_FORM_FIELDS = ['cardNumber', 'cardExpMonth', 'cardExpYear', 'cardCvv'] as const;

export const stripSensitiveCardData = createTransform<CheckoutState, CheckoutState>(
  (inboundState) => ({
    ...inboundState,
    form: SENSITIVE_FORM_FIELDS.reduce((form, field) => ({ ...form, [field]: '' }), { ...inboundState.form }),
  }),
  (outboundState) => outboundState,
  { whitelist: ['checkout'] },
);

const rootReducer = combineReducers({
  product: productReducer,
  checkout: checkoutReducer,
  transaction: transactionReducer,
});

type CombinedState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<CombinedState> = {
  key: 'checkout-root',
  storage,
  whitelist: ['checkout'],
  transforms: [stripSensitiveCardData],
};

const persistedReducer = persistReducer<CombinedState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
