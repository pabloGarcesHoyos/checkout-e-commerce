import { stripSensitiveCardData, webStorage } from './store';
import { DocumentType } from '../types';
import type { CheckoutState } from '../features/checkout/checkoutSlice';

const buildCheckoutState = (): CheckoutState => ({
  step: 3,
  form: {
    cardHolderName: 'Jane Doe',
    cardNumber: '4111111111111111',
    cardExpMonth: '12',
    cardExpYear: '2099',
    cardCvv: '123',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+573001234567',
    documentType: DocumentType.CC,
    documentNumber: 'AB123456',
    address: '123 Main St',
    city: 'Bogota',
    region: 'bogota',
  },
  customerId: 'customer-1',
  deliveryId: 'delivery-1',
  deliveryFeeCents: 800,
  submitStatus: 'idle',
  submitError: null,
});

describe('stripSensitiveCardData', () => {
  it('strips card number, expiration, and cvv before persisting', () => {
    const persisted = stripSensitiveCardData.in(buildCheckoutState(), 'checkout', {});

    expect(persisted.form.cardNumber).toBe('');
    expect(persisted.form.cardExpMonth).toBe('');
    expect(persisted.form.cardExpYear).toBe('');
    expect(persisted.form.cardCvv).toBe('');
  });

  it('keeps non-sensitive fields and progress intact', () => {
    const persisted = stripSensitiveCardData.in(buildCheckoutState(), 'checkout', {});

    expect(persisted.step).toBe(3);
    expect(persisted.customerId).toBe('customer-1');
    expect(persisted.form.fullName).toBe('Jane Doe');
    expect(persisted.form.cardHolderName).toBe('Jane Doe');
  });

  it('passes rehydrated state through unchanged', () => {
    const state = buildCheckoutState();
    const rehydrated = stripSensitiveCardData.out(state, 'checkout', {});

    expect(rehydrated).toEqual(state);
  });
});

describe('webStorage', () => {
  const KEY = 'webStorage-test-key';

  afterEach(() => window.localStorage.removeItem(KEY));

  it('setItem writes through to the real localStorage and getItem reads it back', async () => {
    await webStorage.setItem(KEY, 'some-value');

    expect(window.localStorage.getItem(KEY)).toBe('some-value');
    await expect(webStorage.getItem(KEY)).resolves.toBe('some-value');
  });

  it('getItem resolves null for a key that was never set', async () => {
    await expect(webStorage.getItem('never-set-key')).resolves.toBeNull();
  });

  it('removeItem deletes the key from the real localStorage', async () => {
    window.localStorage.setItem(KEY, 'to-be-removed');

    await webStorage.removeItem(KEY);

    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('every method returns a real Promise, matching the shape redux-persist requires', () => {
    expect(webStorage.getItem(KEY)).toBeInstanceOf(Promise);
    expect(webStorage.setItem(KEY, 'x')).toBeInstanceOf(Promise);
    expect(webStorage.removeItem(KEY)).toBeInstanceOf(Promise);
  });
});
