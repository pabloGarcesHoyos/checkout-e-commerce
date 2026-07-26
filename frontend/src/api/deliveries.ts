import { httpClient } from './httpClient';
import type { Delivery } from '../types';

export interface CreateDeliveryPayload {
  customerId: string;
  address: string;
  city: string;
  region: string;
}

export const createDelivery = async (payload: CreateDeliveryPayload): Promise<Delivery> => {
  const response = await httpClient.post<Delivery>('/deliveries', payload);
  return response.data;
};
