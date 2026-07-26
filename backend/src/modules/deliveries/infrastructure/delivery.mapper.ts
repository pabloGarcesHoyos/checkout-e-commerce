import { Delivery } from '../domain/delivery';
import { DeliveryOrmEntity } from './delivery.orm-entity';

export class DeliveryMapper {
  static toDomain(entity: DeliveryOrmEntity): Delivery {
    return Delivery.reconstitute({
      id: entity.id,
      customerId: entity.customerId,
      address: entity.address,
      city: entity.city,
      region: entity.region,
      deliveryFeeCents: entity.deliveryFeeCents,
      createdAt: entity.createdAt,
    });
  }

  static toOrm(delivery: Delivery): DeliveryOrmEntity {
    const entity = new DeliveryOrmEntity();
    entity.id = delivery.id;
    entity.customerId = delivery.customerId;
    entity.address = delivery.address;
    entity.city = delivery.city;
    entity.region = delivery.region;
    entity.deliveryFeeCents = delivery.deliveryFeeCents;
    entity.createdAt = delivery.createdAt;
    return entity;
  }
}
