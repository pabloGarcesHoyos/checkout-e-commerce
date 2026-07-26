import { TransactionMapper } from './transaction.mapper';
import { TransactionOrmEntity } from './transaction.orm-entity';
import { TransactionStatus } from '../domain/transaction-status';

describe('TransactionMapper', () => {
  const buildOrmEntity = (): TransactionOrmEntity => {
    const entity = new TransactionOrmEntity();
    entity.id = 'tx-1';
    entity.productId = 'product-1';
    entity.customerId = 'customer-1';
    entity.deliveryId = 'delivery-1';
    entity.reference = 'TX-1';
    entity.gatewayTransactionId = 'gw-1';
    entity.status = TransactionStatus.PENDING;
    entity.productAmountCents = 9999;
    entity.baseFeeCents = 500;
    entity.deliveryFeeCents = 800;
    entity.totalCents = 11299;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    return entity;
  };

  it('maps an ORM entity to a domain transaction', () => {
    const transaction = TransactionMapper.toDomain(buildOrmEntity());
    expect(transaction.id).toBe('tx-1');
    expect(transaction.totalCents).toBe(11299);
  });

  it('maps a domain transaction back to an ORM entity', () => {
    const transaction = TransactionMapper.toDomain(buildOrmEntity());
    const entity = TransactionMapper.toOrm(transaction);
    expect(entity.reference).toBe('TX-1');
    expect(entity.status).toBe(TransactionStatus.PENDING);
  });
});
