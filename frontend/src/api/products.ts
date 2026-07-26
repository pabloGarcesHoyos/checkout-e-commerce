import { httpClient } from './httpClient';
import type { Product } from '../types';

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await httpClient.get<Product[]>('/products');
  return response.data;
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await httpClient.get<Product>(`/products/${id}`);
  return response.data;
};
