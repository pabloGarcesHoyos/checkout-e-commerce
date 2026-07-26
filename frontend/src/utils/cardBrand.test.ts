import { detectCardBrand } from './cardBrand';

describe('detectCardBrand', () => {
  it('detects Visa from the 4 prefix', () => {
    expect(detectCardBrand('4111111111111111')).toBe('visa');
  });

  it('detects Mastercard from the 51-55 prefix', () => {
    expect(detectCardBrand('5500000000000004')).toBe('mastercard');
    expect(detectCardBrand('5105105105105100')).toBe('mastercard');
  });

  it('detects Mastercard from the 2221-2720 prefix', () => {
    expect(detectCardBrand('2223000000000000')).toBe('mastercard');
  });

  it('returns unknown for unsupported prefixes', () => {
    expect(detectCardBrand('6011000000000000')).toBe('unknown');
  });

  it('ignores spaces in the input', () => {
    expect(detectCardBrand('4111 1111 1111 1111')).toBe('visa');
  });
});
