import { isCheckoutFormValid, validateCheckoutForm } from './checkoutFormValidation';
import type { CheckoutFormValues } from './checkoutFormValidation';

const validValues: CheckoutFormValues = {
  cardHolderName: 'Jane Doe',
  cardNumber: '4111111111111111',
  cardExpMonth: '12',
  cardExpYear: '2099',
  cardCvv: '123',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+573001234567',
  documentNumber: 'AB123456',
  address: '123 Main St',
  city: 'Bogota',
  region: 'bogota',
};

describe('validateCheckoutForm', () => {
  it('returns no errors for fully valid input', () => {
    expect(validateCheckoutForm(validValues)).toEqual({});
    expect(isCheckoutFormValid(validValues)).toBe(true);
  });

  it('flags an invalid card number', () => {
    const errors = validateCheckoutForm({ ...validValues, cardNumber: '1234' });
    expect(errors.cardNumber).toBeDefined();
  });

  it('flags an unsupported card brand even with a valid Luhn checksum', () => {
    const errors = validateCheckoutForm({ ...validValues, cardNumber: '6011000000000004' });
    expect(errors.cardNumber).toBe('Only Visa and Mastercard are supported');
  });

  it('flags an invalid expiration date', () => {
    const errors = validateCheckoutForm({ ...validValues, cardExpYear: '2000' });
    expect(errors.cardExpMonth).toBeDefined();
  });

  it('flags an invalid CVV', () => {
    const errors = validateCheckoutForm({ ...validValues, cardCvv: '12' });
    expect(errors.cardCvv).toBeDefined();
  });

  it('flags a missing full name', () => {
    const errors = validateCheckoutForm({ ...validValues, fullName: '  ' });
    expect(errors.fullName).toBeDefined();
  });

  it('flags an invalid email', () => {
    const errors = validateCheckoutForm({ ...validValues, email: 'not-an-email' });
    expect(errors.email).toBeDefined();
  });

  it('flags an invalid phone number', () => {
    const errors = validateCheckoutForm({ ...validValues, phone: 'abc' });
    expect(errors.phone).toBeDefined();
  });

  it('flags an invalid document number', () => {
    const errors = validateCheckoutForm({ ...validValues, documentNumber: '!!' });
    expect(errors.documentNumber).toBeDefined();
  });

  it('flags missing address, city, and region', () => {
    const errors = validateCheckoutForm({ ...validValues, address: '', city: '', region: '' });
    expect(errors.address).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.region).toBeDefined();
  });

  it('reports the form as invalid when any field fails', () => {
    expect(isCheckoutFormValid({ ...validValues, email: 'bad' })).toBe(false);
  });
});
