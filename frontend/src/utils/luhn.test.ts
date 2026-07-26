import { isValidLuhn } from './luhn';

describe('isValidLuhn', () => {
  it('accepts a known valid Visa test number', () => {
    expect(isValidLuhn('4111111111111111')).toBe(true);
  });

  it('accepts a known valid Mastercard test number', () => {
    expect(isValidLuhn('5500000000000004')).toBe(true);
  });

  it('accepts numbers with spaces', () => {
    expect(isValidLuhn('4111 1111 1111 1111')).toBe(true);
  });

  it('rejects a number that fails the checksum', () => {
    expect(isValidLuhn('4111111111111112')).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(isValidLuhn('abcd efgh ijkl mnop')).toBe(false);
  });

  it('rejects numbers that are too short', () => {
    expect(isValidLuhn('411111')).toBe(false);
  });
});
