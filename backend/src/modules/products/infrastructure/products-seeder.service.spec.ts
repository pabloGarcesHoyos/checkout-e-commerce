import { SEED_PRODUCTS } from './products-seeder.service';
import { BASE_FEE_CENTS } from '../../transactions/domain/fees';
import {
  REGION_FEE_CENTS,
  DEFAULT_FEE_CENTS,
} from '../../deliveries/domain/delivery-fee-calculator';

/**
 * The real payment gateway sandbox enforces a real minimum transaction
 * amount of 1,500 COP (150,000 cents). Seeded prices were once denominated
 * in USD-like magnitude (e.g. priceCents: 9999, "$99.99") and every seeded
 * product's total fell under 117 COP once actually submitted to the real
 * gateway sandbox - no unit test caught it because nothing in the suite
 * depended on real-world price scale (see README "Real bugs found during
 * live QA", #3). This guards against that regressing silently again.
 */
const GATEWAY_MINIMUM_TRANSACTION_CENTS = 150_000;

const CHEAPEST_POSSIBLE_DELIVERY_FEE_CENTS = Math.min(
  ...Object.values(REGION_FEE_CENTS),
  DEFAULT_FEE_CENTS,
);

describe('SEED_PRODUCTS', () => {
  it('has at least one seeded product', () => {
    expect(SEED_PRODUCTS.length).toBeGreaterThan(0);
  });

  it.each(SEED_PRODUCTS.map((p) => [p.name, p.priceCents]))(
    '%s clears the gateway minimum transaction amount even with the cheapest possible delivery fee',
    (name, priceCents) => {
      const worstCaseTotal =
        priceCents + BASE_FEE_CENTS + CHEAPEST_POSSIBLE_DELIVERY_FEE_CENTS;

      expect(worstCaseTotal).toBeGreaterThanOrEqual(
        GATEWAY_MINIMUM_TRANSACTION_CENTS,
      );
    },
  );
});
