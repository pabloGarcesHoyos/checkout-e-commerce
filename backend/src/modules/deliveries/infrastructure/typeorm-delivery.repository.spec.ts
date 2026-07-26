import { Repository } from 'typeorm';
import { TypeOrmDeliveryRepository } from './typeorm-delivery.repository';
import { DeliveryOrmEntity } from './delivery.orm-entity';
import { Delivery } from '../domain/delivery';

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

describe('TypeOrmDeliveryRepository', () => {
  const buildRepository = () => {
    const ormRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<DeliveryOrmEntity>>;
    return {
      repository: new TypeOrmDeliveryRepository(ormRepository),
      ormRepository,
    };
  };

  it('persists a domain delivery', async () => {
    const { repository, ormRepository } = buildRepository();
    const delivery = Delivery.reconstitute({
      id: 'delivery-1',
      customerId: 'customer-1',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
      deliveryFeeCents: 800,
      createdAt: new Date(),
    });

    await repository.save(delivery);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'delivery-1' }),
    );
  });

  it('returns a domain delivery when found', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.findOne as jest.Mock).mockResolvedValue(buildOrmEntity());

    const delivery = await repository.findById('delivery-1');

    expect(delivery?.city).toBe('Bogota');
  });

  it('returns null when not found', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.findOne as jest.Mock).mockResolvedValue(null);

    const delivery = await repository.findById('missing');

    expect(delivery).toBeNull();
  });
});
