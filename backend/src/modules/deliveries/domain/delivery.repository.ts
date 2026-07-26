import { Delivery } from './delivery';

export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');

export interface IDeliveryRepository {
  save(delivery: Delivery): Promise<void>;
  findById(id: string): Promise<Delivery | null>;
}
