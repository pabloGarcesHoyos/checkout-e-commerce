import { calculateDeliveryFeeCents } from './delivery-fee-calculator';

describe('calculateDeliveryFeeCents', () => {
  it('returns the known fee for a mapped region regardless of casing', () => {
    expect(calculateDeliveryFeeCents('Bogota')).toBe(800);
    expect(calculateDeliveryFeeCents('  bogota  ')).toBe(800);
  });

  it('returns the default fee for an unmapped region', () => {
    expect(calculateDeliveryFeeCents('unknown-region')).toBe(1200);
  });
});
