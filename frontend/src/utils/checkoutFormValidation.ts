import { isValidLuhn } from './luhn';
import { isValidExpiration, isValidCvv } from './cardValidation';
import { detectCardBrand } from './cardBrand';

export interface CheckoutFormValues {
  cardHolderName: string;
  cardNumber: string;
  cardExpMonth: string;
  cardExpYear: string;
  cardCvv: string;
  fullName: string;
  email: string;
  phone: string;
  documentNumber: string;
  address: string;
  city: string;
  region: string;
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

export const validateCheckoutForm = (values: CheckoutFormValues): CheckoutFormErrors => {
  const errors: CheckoutFormErrors = {};

  if (!values.cardHolderName.trim()) {
    errors.cardHolderName = 'Cardholder name is required';
  }

  if (!isValidLuhn(values.cardNumber)) {
    errors.cardNumber = 'Card number is invalid';
  } else if (detectCardBrand(values.cardNumber) === 'unknown') {
    errors.cardNumber = 'Only Visa and Mastercard are supported';
  }

  if (!isValidExpiration(values.cardExpMonth, values.cardExpYear)) {
    errors.cardExpMonth = 'Expiration date is invalid';
  }

  if (!isValidCvv(values.cardCvv)) {
    errors.cardCvv = 'CVV must be 3 or 4 digits';
  }

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required';
  }

  if (!EMAIL_REGEX.test(values.email)) {
    errors.email = 'Email is invalid';
  }

  if (!PHONE_REGEX.test(values.phone)) {
    errors.phone = 'Phone number is invalid';
  }

  if (!/^[a-zA-Z0-9]{5,20}$/.test(values.documentNumber)) {
    errors.documentNumber = 'Document number must be 5-20 alphanumeric characters';
  }

  if (!values.address.trim()) {
    errors.address = 'Address is required';
  }

  if (!values.city.trim()) {
    errors.city = 'City is required';
  }

  if (!values.region.trim()) {
    errors.region = 'Region is required';
  }

  return errors;
};

export const isCheckoutFormValid = (values: CheckoutFormValues): boolean =>
  Object.keys(validateCheckoutForm(values)).length === 0;
