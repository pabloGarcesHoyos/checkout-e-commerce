import { stripSensitiveCardData } from './store';
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
