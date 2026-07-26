import { httpClient } from './httpClient';
import { DocumentType } from '../types';
import type { Customer } from '../types';

export interface CreateCustomerPayload {
  fullName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
}

export const createCustomer = async (payload: CreateCustomerPayload): Promise<Customer> => {
  const response = await httpClient.post<Customer>('/customers', payload);
  return response.data;
};
