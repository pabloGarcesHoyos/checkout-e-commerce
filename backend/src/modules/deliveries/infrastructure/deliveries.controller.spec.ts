import { HttpException } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { CreateDeliveryUseCase } from '../application/create-delivery.use-case';
import { Delivery } from '../domain/delivery';
import { ok, err } from '../../../shared/domain/result';
import { DomainError } from '../../../shared/domain/domain-error';

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

  it('throws an HttpException when delivery creation fails', async () => {
    const createDelivery = {
      execute: jest
        .fn()
        .mockResolvedValue(
          err(DomainError.of('CUSTOMER_NOT_FOUND', 'not found')),
        ),
    } as unknown as CreateDeliveryUseCase;
    const controller = new DeliveriesController(createDelivery);

    await expect(
      controller.create({
        customerId: 'missing',
        address: '123 Main St',
        city: 'Bogota',
        region: 'bogota',
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
