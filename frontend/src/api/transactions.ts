import { httpClient } from './httpClient';
import type { Transaction } from '../types';

export interface CreateTransactionPayload {
  productId: string;
  customerId: string;
  deliveryId: string;
}

export const createTransaction = async (payload: CreateTransactionPayload): Promise<Transaction> => {
  const response = await httpClient.post<Transaction>('/transactions', payload);
  return response.data;
};

export const confirmTransaction = async (transactionId: string, cardToken: string): Promise<Transaction> => {
  const response = await httpClient.post<Transaction>(`/transactions/${transactionId}/confirm`, {
    cardToken,
  });
  return response.data;
};

export const fetchTransaction = async (transactionId: string): Promise<Transaction> => {
  const response = await httpClient.get<Transaction>(`/transactions/${transactionId}`);
  return response.data;
};
