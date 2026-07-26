import reducer, { setStep, submitCustomerAndDelivery, updateForm, resetCheckout } from './checkoutSlice';
import type { CheckoutState } from './checkoutSlice';
import { createCustomer } from '../../api/customers';
import { createDelivery } from '../../api/deliveries';
import { DocumentType } from '../../types';

jest.mock('../../api/customers');
jest.mock('../../api/deliveries');
const mockedCreateCustomer = createCustomer as jest.MockedFunction<typeof createCustomer>;
const mockedCreateDelivery = createDelivery as jest.MockedFunction<typeof createDelivery>;

const emptyForm: CheckoutState['form'] = {
  cardHolderName: '',
  cardNumber: '',
  cardExpMonth: '',
  cardExpYear: '',
  cardCvv: '',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+573001234567',
  documentType: DocumentType.CC,
  documentNumber: 'AB123456',
  address: '123 Main St',
  city: 'Bogota',
  region: 'bogota',
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

describe('checkoutSlice', () => {
  afterEach(() => jest.clearAllMocks());

  it('updates the step', () => {
    const state = reducer(initialState, setStep(3));
    expect(state.step).toBe(3);
  });

  it('merges partial form updates without discarding other fields', () => {
    const state = reducer(initialState, updateForm({ cardNumber: '4111111111111111' }));
    expect(state.form.cardNumber).toBe('4111111111111111');
    expect(state.form.fullName).toBe('Jane Doe');
  });

  it('resets to the initial state', () => {
    const changed = reducer(initialState, setStep(4));
    const state = reducer(changed, resetCheckout());
    expect(state.step).toBe(1);
    expect(state.customerId).toBeNull();
  });

  it('marks submission as loading while pending', () => {
    const state = reducer(initialState, { type: submitCustomerAndDelivery.pending.type });
    expect(state.submitStatus).toBe('loading');
  });

  it('stores customer, delivery, and fee and advances to step 3 on success', () => {
    const state = reducer(initialState, {
      type: submitCustomerAndDelivery.fulfilled.type,
      payload: { customerId: 'customer-1', deliveryId: 'delivery-1', deliveryFeeCents: 800 },
    });
    expect(state.customerId).toBe('customer-1');
    expect(state.deliveryId).toBe('delivery-1');
    expect(state.deliveryFeeCents).toBe(800);
    expect(state.step).toBe(3);
  });

  it('stores an error on failure', () => {
    const state = reducer(initialState, {
      type: submitCustomerAndDelivery.rejected.type,
      error: { message: 'boom' },
    });
    expect(state.submitStatus).toBe('failed');
    expect(state.submitError).toBe('boom');
  });

  it('creates the customer then the delivery in order', async () => {
    mockedCreateCustomer.mockResolvedValue({
      id: 'customer-1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
    });
    mockedCreateDelivery.mockResolvedValue({
      id: 'delivery-1',
      customerId: 'customer-1',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
      deliveryFeeCents: 800,
    });

    const thunk = submitCustomerAndDelivery(emptyForm);
    const result = await thunk(jest.fn(), () => ({}), undefined);

    expect(mockedCreateCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Jane Doe', email: 'jane@example.com' }),
    );
    expect(mockedCreateDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer-1', city: 'Bogota' }),
    );
    expect(submitCustomerAndDelivery.fulfilled.match(result)).toBe(true);
  });
});
