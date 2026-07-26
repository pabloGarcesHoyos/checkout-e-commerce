export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
}

export const DocumentType = {
  CC: 'CC',
  CE: 'CE',
  PASSPORT: 'PASSPORT',
  NIT: 'NIT',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
}

export interface Delivery {
  id: string;
  customerId: string;
  address: string;
  city: string;
  region: string;
  deliveryFeeCents: number;
}

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';

export interface Transaction {
  id: string;
  reference: string;
  status: TransactionStatus;
  productAmountCents: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

export type CardBrand = 'visa' | 'mastercard' | 'unknown';
