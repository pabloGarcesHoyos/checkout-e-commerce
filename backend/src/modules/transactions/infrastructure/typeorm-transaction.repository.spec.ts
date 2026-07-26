import { Repository } from 'typeorm';
import { TypeOrmTransactionRepository } from './typeorm-transaction.repository';
import { TransactionOrmEntity } from './transaction.orm-entity';
import { Transaction } from '../domain/transaction';
import { TransactionStatus } from '../domain/transaction-status';

const buildOrmEntity = (): TransactionOrmEntity => {
  const entity = new TransactionOrmEntity();
  entity.id = 'tx-1';
  entity.productId = 'product-1';
  entity.customerId = 'customer-1';
  entity.deliveryId = 'delivery-1';
  entity.reference = 'TX-1';
  entity.gatewayTransactionId = null;
  entity.status = TransactionStatus.PENDING;
  entity.productAmountCents = 9999;
  entity.baseFeeCents = 500;
  entity.deliveryFeeCents = 800;
  entity.totalCents = 11299;
  entity.createdAt = new Date();
  entity.updatedAt = new Date();
  return entity;
};

describe('TypeOrmTransactionRepository', () => {
  const buildRepository = () => {
    const ormRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<TransactionOrmEntity>>;
    return {
      repository: new TypeOrmTransactionRepository(ormRepository),
      ormRepository,
    };
  };

  it('persists a domain transaction', async () => {
    const { repository, ormRepository } = buildRepository();
    const transaction = Transaction.create({
      id: 'tx-1',
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      reference: 'TX-1',
      productAmountCents: 9999,
      baseFeeCents: 500,
      deliveryFeeCents: 800,
    });

    await repository.save(transaction);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tx-1' }),
    );
  });

  it('returns a domain transaction when found by id', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.findOne as jest.Mock).mockResolvedValue(buildOrmEntity());

    const transaction = await repository.findById('tx-1');

    expect(transaction?.reference).toBe('TX-1');
  });

  it('returns null when not found by id', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.findOne as jest.Mock).mockResolvedValue(null);

    expect(await repository.findById('missing')).toBeNull();
  });

  it('returns a domain transaction when found by reference', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.findOne as jest.Mock).mockResolvedValue(buildOrmEntity());

    const transaction = await repository.findByReference('TX-1');

    expect(transaction?.id).toBe('tx-1');
  });

  it('reports whether a reference already exists', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.count as jest.Mock).mockResolvedValue(1);

    expect(await repository.existsByReference('TX-1')).toBe(true);
  });

  it('reports false when a reference does not exist', async () => {
    const { repository, ormRepository } = buildRepository();
    (ormRepository.count as jest.Mock).mockResolvedValue(0);

    expect(await repository.existsByReference('TX-missing')).toBe(false);
  });
});
