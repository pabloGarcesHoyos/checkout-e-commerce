import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'deliveries' })
export class DeliveryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'varchar', length: 120 })
  city: string;

  @Column({ type: 'varchar', length: 120 })
  region: string;

  @Column({ name: 'delivery_fee_cents', type: 'integer' })
  deliveryFeeCents: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
