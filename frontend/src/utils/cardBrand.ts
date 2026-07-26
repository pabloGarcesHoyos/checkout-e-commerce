import type { CardBrand } from '../types';

const VISA_PREFIX = /^4/;
const MASTERCARD_PREFIX = /^(5[1-5]|2[2-7])/;

export const detectCardBrand = (rawCardNumber: string): CardBrand => {
  const digits = rawCardNumber.replace(/\s+/g, '');
  if (VISA_PREFIX.test(digits)) {
    return 'visa';
  }
  if (MASTERCARD_PREFIX.test(digits)) {
    return 'mastercard';
  }
  return 'unknown';
};
