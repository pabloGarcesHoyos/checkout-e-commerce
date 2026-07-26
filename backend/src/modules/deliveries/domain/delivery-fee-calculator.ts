const DEFAULT_FEE_CENTS = 1200;

const REGION_FEE_CENTS: Record<string, number> = {
  bogota: 800,
  antioquia: 1000,
  valle: 1500,
};

export const calculateDeliveryFeeCents = (region: string): number => {
  const key = region.trim().toLowerCase();
  return REGION_FEE_CENTS[key] ?? DEFAULT_FEE_CENTS;
};
