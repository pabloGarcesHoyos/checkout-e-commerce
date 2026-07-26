import { isValidCvv, isValidExpiration } from './cardValidation';

describe('isValidExpiration', () => {
  it('accepts a future month and year', () => {
    expect(isValidExpiration('12', '2099')).toBe(true);
  });

  it('rejects a month out of range', () => {
    expect(isValidExpiration('13', '2099')).toBe(false);
    expect(isValidExpiration('0', '2099')).toBe(false);
  });

  it('rejects a year in the past', () => {
    expect(isValidExpiration('01', '2000')).toBe(false);
  });

  it('rejects a malformed year', () => {
    expect(isValidExpiration('01', '99')).toBe(false);
  });

  it('rejects the current year with a past month', () => {
    const now = new Date();
    if (now.getMonth() + 1 === 1) {
      return;
    }
    const pastMonth = String(now.getMonth()).padStart(2, '0');
    expect(isValidExpiration(pastMonth, String(now.getFullYear()))).toBe(false);
  });
});

describe('isValidCvv', () => {
  it('accepts 3-digit CVV', () => {
    expect(isValidCvv('123')).toBe(true);
  });

  it('accepts 4-digit CVV', () => {
    expect(isValidCvv('1234')).toBe(true);
  });

  it('rejects non-numeric CVV', () => {
    expect(isValidCvv('12a')).toBe(false);
  });

  it('rejects CVV of the wrong length', () => {
    expect(isValidCvv('12')).toBe(false);
    expect(isValidCvv('12345')).toBe(false);
  });
});
