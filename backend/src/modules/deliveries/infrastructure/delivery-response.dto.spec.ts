import { DeliveryResponseDto } from './delivery-response.dto';
import { Delivery } from '../domain/delivery';

describe('DeliveryResponseDto', () => {
  it('maps a domain delivery to a response DTO', () => {
    const delivery = Delivery.reconstitute({
      id: 'delivery-1',
      customerId: 'customer-1',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
      deliveryFeeCents: 800,
      createdAt: new Date(),
    });

    const dto = DeliveryResponseDto.fromDomain(delivery);

    expect(dto).toEqual({
      id: 'delivery-1',
      customerId: 'customer-1',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
      deliveryFeeCents: 800,
    });
  });
});
