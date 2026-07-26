import type { CardBrand } from '../types';

const STYLES: Record<CardBrand, string> = {
  visa: 'bg-blue-600 text-white',
  mastercard: 'bg-orange-500 text-white',
  unknown: 'bg-gray-200 text-gray-500',
};

const LABELS: Record<CardBrand, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  unknown: '—',
};

export const CardBrandIcon = ({ brand }: { brand: CardBrand }) => (
  <span
    data-testid="card-brand-icon"
    className={`inline-flex h-6 min-w-12 items-center justify-center rounded px-2 text-xs font-bold tracking-wide ${STYLES[brand]}`}
  >
    {LABELS[brand]}
  </span>
);
