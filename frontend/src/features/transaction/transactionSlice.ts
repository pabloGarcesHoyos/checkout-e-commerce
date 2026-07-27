import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { confirmTransaction, createTransaction, fetchTransaction } from '../../api/transactions';
import { fetchAcceptanceToken, tokenizeCard } from '../../api/paymentGateway';
import type { Transaction } from '../../types';

export type LoadingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface TransactionState {
  current: Transaction | null;
  status: LoadingStatus;
  error: string | null;
}

const initialState: TransactionState = {
  current: null,
  status: 'idle',
  error: null,
};

export interface PayWithCardPayload {
  productId: string;
  customerId: string;
  deliveryId: string;
  cardNumber: string;
  cardExpMonth: string;
  cardExpYear: string;
  cardCvv: string;
  cardHolderName: string;
}

export const payWithCard = createAsyncThunk(
  'transaction/payWithCard',
  async (payload: PayWithCardPayload) => {
    const acceptanceToken = await fetchAcceptanceToken();
    const cardToken = await tokenizeCard({
      number: payload.cardNumber,
      cvc: payload.cardCvv,
      expMonth: payload.cardExpMonth,
      expYear: payload.cardExpYear,
      cardHolder: payload.cardHolderName,
    });

    const created = await createTransaction({
      productId: payload.productId,
      customerId: payload.customerId,
      deliveryId: payload.deliveryId,
    });

    return confirmTransaction(created.id, cardToken, acceptanceToken);
  },
);

export const pollTransaction = createAsyncThunk('transaction/poll', async (transactionId: string) =>
  fetchTransaction(transactionId),
);

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    resetTransaction(state) {
      state.current = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(payWithCard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(payWithCard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.current = action.payload;
      })
      .addCase(payWithCard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Payment could not be processed';
      })
      .addCase(pollTransaction.fulfilled, (state, action) => {
        state.current = action.payload;
      });
  },
});

export const { resetTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
