import { DeliveryMapper } from './delivery.mapper';
import { DeliveryOrmEntity } from './delivery.orm-entity';

describe('DeliveryMapper', () => {
  const buildOrmEntity = (): DeliveryOrmEntity => {
    const entity = new DeliveryOrmEntity();
    entity.id = 'delivery-1';
    entity.customerId = 'customer-1';
    entity.address = '123 Main St';
    entity.city = 'Bogota';
    entity.region = 'bogota';
    entity.deliveryFeeCents = 800;
    entity.createdAt = new Date();
    return entity;
  };

  it('maps an ORM entity to a domain delivery', () => {
    const delivery = DeliveryMapper.toDomain(buildOrmEntity());
    expect(delivery.id).toBe('delivery-1');
    expect(delivery.deliveryFeeCents).toBe(800);
  });

  it('maps a domain delivery back to an ORM entity', () => {
    const delivery = DeliveryMapper.toDomain(buildOrmEntity());
    const entity = DeliveryMapper.toOrm(delivery);
    expect(entity.address).toBe('123 Main St');
    expect(entity.customerId).toBe('customer-1');
  });
});
