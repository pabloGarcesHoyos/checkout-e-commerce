import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createCustomer } from '../../api/customers';
import { createDelivery } from '../../api/deliveries';
import { DocumentType } from '../../types';
import type { CheckoutFormValues } from '../../utils/checkoutFormValidation';

export type CheckoutStep = 1 | 2 | 3 | 4 | 5;

export interface CheckoutFormState extends CheckoutFormValues {
  documentType: DocumentType;
}

export interface CheckoutState {
  step: CheckoutStep;
  form: CheckoutFormState;
  customerId: string | null;
  deliveryId: string | null;
  deliveryFeeCents: number | null;
  submitStatus: 'idle' | 'loading' | 'failed';
  submitError: string | null;
}

const emptyForm: CheckoutFormState = {
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

const initialState: CheckoutState = {
  step: 1,
  form: emptyForm,
  customerId: null,
  deliveryId: null,
  deliveryFeeCents: null,
  submitStatus: 'idle',
  submitError: null,
};

export const submitCustomerAndDelivery = createAsyncThunk(
  'checkout/submitCustomerAndDelivery',
  async (form: CheckoutFormState) => {
    const customer = await createCustomer({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      documentType: form.documentType,
      documentNumber: form.documentNumber,
    });
    const delivery = await createDelivery({
      customerId: customer.id,
      address: form.address,
      city: form.city,
      region: form.region,
    });
    return { customerId: customer.id, deliveryId: delivery.id, deliveryFeeCents: delivery.deliveryFeeCents };
  },
);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<CheckoutStep>) {
      state.step = action.payload;
    },
    updateForm(state, action: PayloadAction<Partial<CheckoutFormState>>) {
      state.form = { ...state.form, ...action.payload };
    },
    resetCheckout() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitCustomerAndDelivery.pending, (state) => {
        state.submitStatus = 'loading';
        state.submitError = null;
      })
      .addCase(submitCustomerAndDelivery.fulfilled, (state, action) => {
        state.submitStatus = 'idle';
        state.customerId = action.payload.customerId;
        state.deliveryId = action.payload.deliveryId;
        state.deliveryFeeCents = action.payload.deliveryFeeCents;
        state.step = 3;
      })
      .addCase(submitCustomerAndDelivery.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError = action.error.message ?? 'Could not save your information';
      });
  },
});

export const { setStep, updateForm, resetCheckout } = checkoutSlice.actions;
export default checkoutSlice.reducer;
