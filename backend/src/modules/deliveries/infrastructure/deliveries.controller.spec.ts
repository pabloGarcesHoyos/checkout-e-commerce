import { DeliveriesController } from './deliveries.controller';
import { CreateDeliveryUseCase } from '../application/create-delivery.use-case';
import { Delivery } from '../domain/delivery';
import { ok } from '../../../shared/domain/result';

describe('DeliveriesController', () => {
  it('returns the mapped created delivery', async () => {
    const delivery = Delivery.reconstitute({
      id: 'delivery-1',
      customerId: 'customer-1',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
      deliveryFeeCents: 800,
      createdAt: new Date(),
    });
    const createDelivery = {
      execute: jest.fn().mockResolvedValue(ok(delivery)),
    } as unknown as CreateDeliveryUseCase;
    const controller = new DeliveriesController(createDelivery);

    const result = await controller.create({
      customerId: 'customer-1',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
    });

    expect(result.id).toBe('delivery-1');
    expect(result.deliveryFeeCents).toBe(800);
  });
});
