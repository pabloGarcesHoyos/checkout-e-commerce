import { formatCents } from './currency';

describe('formatCents', () => {
  it('formats cents as a currency string', () => {
    expect(formatCents(9999)).toBe('$99.99');
  });

  it('formats zero correctly', () => {
    expect(formatCents(0)).toBe('$0.00');
  });
});
