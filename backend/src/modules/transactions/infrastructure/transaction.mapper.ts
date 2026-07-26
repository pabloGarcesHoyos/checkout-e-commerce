import { Transaction } from '../domain/transaction';
import { TransactionOrmEntity } from './transaction.orm-entity';

export class TransactionMapper {
  static toDomain(entity: TransactionOrmEntity): Transaction {
    return Transaction.reconstitute({
      id: entity.id,
      productId: entity.productId,
      customerId: entity.customerId,
      deliveryId: entity.deliveryId,
      reference: entity.reference,
      gatewayTransactionId: entity.gatewayTransactionId,
      status: entity.status,
      productAmountCents: entity.productAmountCents,
      baseFeeCents: entity.baseFeeCents,
      deliveryFeeCents: entity.deliveryFeeCents,
      totalCents: entity.totalCents,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(transaction: Transaction): TransactionOrmEntity {
    const entity = new TransactionOrmEntity();
    entity.id = transaction.id;
    entity.productId = transaction.productId;
    entity.customerId = transaction.customerId;
    entity.deliveryId = transaction.deliveryId;
    entity.reference = transaction.reference;
    entity.gatewayTransactionId = transaction.gatewayTransactionId;
    entity.status = transaction.status;
    entity.productAmountCents = transaction.productAmountCents;
    entity.baseFeeCents = transaction.baseFeeCents;
    entity.deliveryFeeCents = transaction.deliveryFeeCents;
    entity.totalCents = transaction.totalCents;
    entity.createdAt = transaction.createdAt;
    entity.updatedAt = transaction.updatedAt;
    return entity;
  }
}
