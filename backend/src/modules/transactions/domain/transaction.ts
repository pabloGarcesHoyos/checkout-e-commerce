import { TransactionStatus } from './transaction-status';

export interface TransactionProps {
  id: string;
  productId: string;
  customerId: string;
  deliveryId: string;
  reference: string;
  gatewayTransactionId: string | null;
  status: TransactionStatus;
  productAmountCents: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Transaction {
  private constructor(private props: TransactionProps) {}

  static reconstitute(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  static create(
    props: Omit<
      TransactionProps,
      | 'status'
      | 'gatewayTransactionId'
      | 'totalCents'
      | 'createdAt'
      | 'updatedAt'
    >,
  ): Transaction {
    const now = new Date();
    return new Transaction({
      ...props,
      status: TransactionStatus.PENDING,
      gatewayTransactionId: null,
      totalCents:
        props.productAmountCents + props.baseFeeCents + props.deliveryFeeCents,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get productId(): string {
    return this.props.productId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get deliveryId(): string {
    return this.props.deliveryId;
  }

  get reference(): string {
    return this.props.reference;
  }

  get gatewayTransactionId(): string | null {
    return this.props.gatewayTransactionId;
  }

  get status(): TransactionStatus {
    return this.props.status;
  }

  get productAmountCents(): number {
    return this.props.productAmountCents;
  }

  get baseFeeCents(): number {
    return this.props.baseFeeCents;
  }

  get deliveryFeeCents(): number {
    return this.props.deliveryFeeCents;
  }

  get totalCents(): number {
    return this.props.totalCents;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.props.status === TransactionStatus.PENDING;
  }

  markSubmittedToGateway(gatewayTransactionId: string): void {
    this.props.gatewayTransactionId = gatewayTransactionId;
    this.props.updatedAt = new Date();
  }

  applyGatewayStatus(
    status: TransactionStatus,
    gatewayTransactionId: string,
  ): void {
    this.props.status = status;
    this.props.gatewayTransactionId = gatewayTransactionId;
    this.props.updatedAt = new Date();
  }
}
