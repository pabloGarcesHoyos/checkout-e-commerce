import { CreateDeliveryDto } from './create-delivery.dto';

describe('CreateDeliveryDto', () => {
  it('accepts assignment of all expected fields', () => {
    const dto = new CreateDeliveryDto();
    dto.customerId = 'customer-1';
    dto.address = '123 Main St';
    dto.city = 'Bogota';
    dto.region = 'bogota';

    expect(dto.city).toBe('Bogota');
  });
});
