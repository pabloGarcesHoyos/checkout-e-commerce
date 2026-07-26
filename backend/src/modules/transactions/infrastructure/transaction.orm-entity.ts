import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionStatus } from '../domain/transaction-status';

@Entity({ name: 'transactions' })
export class TransactionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'delivery_id', type: 'uuid' })
  deliveryId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  reference: string;

  @Column({
    name: 'gateway_transaction_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  gatewayTransactionId: string | null;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ name: 'product_amount_cents', type: 'integer' })
  productAmountCents: number;

  @Column({ name: 'base_fee_cents', type: 'integer' })
  baseFeeCents: number;

  @Column({ name: 'delivery_fee_cents', type: 'integer' })
  deliveryFeeCents: number;

  @Column({ name: 'total_cents', type: 'integer' })
  totalCents: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
